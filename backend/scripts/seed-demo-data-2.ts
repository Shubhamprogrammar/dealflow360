import { connectDatabase, disconnectDatabase } from '../src/config/index.js';
import { CustomerModel } from '../src/modules/customers/customer.model.js';
import { ProductModel } from '../src/modules/products/product.model.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { QuotationModel } from '../src/modules/quotations/quotation.model.js';
import { quotationService } from '../src/modules/quotations/quotation.service.js';
import { approvalService } from '../src/modules/approvals/approval.service.js';
import type { Role } from '../src/types/common.types.js';

// Adds two more quotations that deliberately stop mid-flow, so the
// "Pending Approval" and "Approved" Kanban columns aren't empty -- the first
// demo batch only ever left quotations at draft, rejected, confirmed, or
// under_negotiation. Safe to re-run: bails out if this specific batch
// already exists.
//
//   npx tsx scripts/seed-demo-data-2.ts

type Requester = { id: string; role: Role };

const run = async (): Promise<void> => {
  await connectDatabase();

  const novaRetail = await CustomerModel.findOne({ companyName: 'Nova Retail' }).exec();
  if (!novaRetail) {
    console.log('Customer "Nova Retail" not found -- seed the base customers/products first. Skipping.');
    await disconnectDatabase();
    return;
  }

  const alreadyRan = await QuotationModel.findOne({
    customer: novaRetail._id,
    status: 'pending_approval',
  }).exec();
  if (alreadyRan) {
    console.log('This batch already exists (Nova Retail has a pending_approval quotation) -- skipping.');
    await disconnectDatabase();
    return;
  }

  const [rep, manager] = await Promise.all([
    UserModel.findOne({ role: 'sales_rep' }).exec(),
    UserModel.findOne({ role: 'sales_manager' }).exec(),
  ]);
  if (!rep || !manager) {
    console.log('Missing staff users -- run `npm run seed:staff` (or seed-catalog) first. Skipping.');
    await disconnectDatabase();
    return;
  }
  const repReq: Requester = { id: rep._id.toString(), role: 'sales_rep' };
  const managerReq: Requester = { id: manager._id.toString(), role: 'sales_manager' };

  const betaIndustries = await CustomerModel.findOne({ companyName: 'Beta Industries' }).exec();
  if (!betaIndustries) throw new Error('Customer "Beta Industries" not found.');

  const [dockingStation, mouse] = await Promise.all([
    ProductModel.findOne({ name: 'Docking Station' }).exec(),
    ProductModel.findOne({ name: 'Wireless Mouse' }).exec(),
  ]);
  if (!dockingStation || !mouse) throw new Error('Seed products not found -- seed the base catalog first.');

  // ---- Q7: Nova Retail -- submitted, left sitting in the manager's queue. ----
  console.log('\n--- Q7: Nova Retail (submitted, awaiting manager approval) ---');
  {
    const q = await quotationService.create({ customer: novaRetail._id.toString() }, repReq);
    await quotationService.addLineItem(q.id, { product: dockingStation._id.toString(), quantity: 3, discountPercent: 20 }, repReq); // hardware limit 5% -> 15pt overage
    const { quotation: submitted } = await approvalService.submitForApproval(q.id, repReq);
    console.log(`  status=${submitted.status} risk=${submitted.blendedRiskScore.level} score=${submitted.blendedRiskScore.score} (left pending)`);
  }

  // ---- Q8: Beta Industries -- manager already approved, not yet sent to the
  // customer or confirmed. ----
  console.log('\n--- Q8: Beta Industries (manager-approved, not yet confirmed) ---');
  {
    const q = await quotationService.create({ customer: betaIndustries._id.toString() }, repReq);
    await quotationService.addLineItem(q.id, { product: mouse._id.toString(), quantity: 5, discountPercent: 20 }, repReq); // hardware limit 5% -> 15pt overage
    const { quotation: submitted, approval } = await approvalService.submitForApproval(q.id, repReq);
    console.log(`  submitted -> status=${submitted.status} risk=${submitted.blendedRiskScore.level} score=${submitted.blendedRiskScore.score}`);
    if (!approval) throw new Error('Expected Q8 to require approval');
    await approvalService.approve(approval.id, managerReq, { reason: 'Within policy, approved.' });
    console.log('  approved by manager (left unconfirmed)');
  }

  console.log('\nSecond demo data batch complete.');
  await disconnectDatabase();
};

run().catch(async (error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
