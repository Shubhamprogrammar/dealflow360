import argon2 from 'argon2';
import { connectDatabase, disconnectDatabase } from '../src/config/index.js';
import { CustomerModel } from '../src/modules/customers/customer.model.js';
import { ProductModel } from '../src/modules/products/product.model.js';
import { QuotationModel } from '../src/modules/quotations/quotation.model.js';
import { OrderModel } from '../src/modules/orders/order.model.js';
import { SubscriptionModel } from '../src/modules/subscriptions/subscription.model.js';
import { SubscriptionPlanModel } from '../src/modules/subscription-plans/subscription-plan.model.js';
import { PriceListModel } from '../src/modules/pricelists/pricelist.model.js';
import { DiscountTierModel } from '../src/modules/discount-tiers/discount-tier.model.js';
import { WarehouseModel } from '../src/modules/warehouses/warehouse.model.js';
import { InvoiceModel } from '../src/modules/invoices/invoice.model.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { InquiryModel } from '../src/modules/inquiries/inquiry.model.js';
import { ApprovalModel } from '../src/modules/approvals/approval.model.js';
import type { Role } from '../src/types/common.types.js';
import type { CustomerTier } from '../src/types/domain.types.js';
import type { ProductCategory } from '../src/types/domain.types.js';
import type { BillingCycle } from '../src/types/domain.types.js';
import type { QuotationStatus } from '../src/types/domain.types.js';
import type { InvoiceType } from '../src/types/domain.types.js';
import type { InvoiceStatus } from '../src/types/domain.types.js';
import type { SubscriptionStatus } from '../src/types/domain.types.js';
import type { FulfillmentStatus } from '../src/types/domain.types.js';
import type { PaymentStatus } from '../src/types/domain.types.js';
import type { InquiryStatus } from '../src/types/domain.types.js';

const SEED_COUNT = 300;
const PASSWORD_HASH = argon2.hash('password123');

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Lisa', 'Daniel', 'Nancy',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
  'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Sharon',
  'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
  'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna', 'Stephen', 'Brenda',
  'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Helen',
  'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Raymond', 'Christine', 'Gregory', 'Debra',
  'Frank', 'Rachel', 'Alexander', 'Carolyn', 'Patrick', 'Janet', 'Jack', 'Catherine',
  'Dennis', 'Maria', 'Jerry', 'Heather', 'Tyler', 'Diane',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
  'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
  'Long', 'Ross', 'Foster', 'Jimenez',
];

const COMPANY_SUFFIXES = [
  'Corp', 'Inc', 'LLC', 'Ltd', 'Group', 'Holdings', 'Solutions', 'Technologies',
  'Systems', 'Industries', 'Enterprises', 'Partners', 'Global', 'International',
  'Services', 'Associates', 'Ventures', 'Capital', 'Trading', 'Manufacturing',
];

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
  'Fort Worth', 'Columbus', 'Charlotte', 'Indianapolis', 'San Francisco',
  'Seattle', 'Denver', 'Washington', 'Nashville', 'Oklahoma City', 'El Paso',
  'Boston', 'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore',
  'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Mesa',
  'Kansas City', 'Atlanta', 'Omaha', 'Colorado Springs', 'Raleigh',
  'Long Beach', 'Virginia Beach', 'Miami', 'Oakland', 'Minneapolis', 'Tulsa',
  'Tampa', 'Arlington', 'New Orleans', 'Wichita',
];

const STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const PRODUCT_NAMES_HARDWARE = [
  'UltraDesk Pro Laptop', 'TitanServer 2U Rack Unit', 'MeshLink Wi-Fi 6 Access Point',
  'ProView 27" 4K Monitor', 'ErgoMax Standing Desk', 'SecureVault External SSD 2TB',
  'ThunderBolt Docking Station', 'HyperScan Document Scanner', 'ClearComm Headset Pro',
  'PowerEdge Blade Server', 'NetStack Managed Switch', 'DataVault NAS 8-Bay',
  'CloudKey IoT Gateway', 'EdgeNode Mini PC', 'FlexRail Server Rack 42U',
  'BrightScreen Curved 34"', 'SnapTap Wireless Keyboard', 'PrecisionClick Mouse',
  'SoundBar USB-C Speaker', 'MicroGuard Screen Protector',
];

const PRODUCT_NAMES_SERVICES = [
  'Onboarding & Environment Setup', 'Custom Integration Sprint',
  'Priority Support Retainer', 'Data Migration Service', 'Security Audit Package',
  'Performance Optimization', 'Cloud Architecture Review', 'DevOps Pipeline Setup',
  'Training Workshop (2 days)', 'Legacy System Modernization', 'API Integration Package',
  'Disaster Recovery Planning', 'Compliance Assessment', 'Penetration Testing',
  'UI/UX Redesign Sprint', 'Mobile App Development', 'Database Tuning Service',
  'Network Infrastructure Audit', 'ITIL Process Consulting', 'Staff Augmentation',
];

const PRODUCT_NAMES_SUBSCRIPTIONS = [
  'DealFlow Analytics — Standard', 'DealFlow Analytics — Enterprise',
  'CloudBackup 1TB', 'CloudBackup 5TB', 'SecureVPN Enterprise',
  'MonitorStack — 10 Hosts', 'MonitorStack — 50 Hosts', 'LogCentral — Standard',
  'LogCentral — Premium', 'ThreatShield Antivirus', 'PatchManager Pro',
  'IdentityAccess SSO', 'ComplianceTracker Cloud', 'AssetManager Enterprise',
  'ServiceDesk Plus', 'CodeRepo Enterprise', 'WikiSpace Team',
  'ProjectFlow Professional', 'TimeTrack Cloud', 'HR-Pulse Standard',
];

const PAYMENT_TERMS = [
  'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Net 90',
  'Due on Receipt', 'COD', 'Net 10', '2/10 Net 30', 'Net 7',
];

const WAREHOUSE_NAMES = [
  'Central Distribution Hub', 'East Coast Fulfillment Center', 'West Coast Logistics Depot',
  'North Regional Warehouse', 'South Regional Warehouse', 'Metro City Express Depot',
  'International Gateway Warehouse', 'Suburban Storage Facility', 'Industrial Park Warehouse',
  'Airport Cargo Terminal', 'Port Authority Warehouse', 'Downtown Express Hub',
  'Rural Outreach Center', 'Tech Campus Warehouse', 'Highway Corridor Depot',
  'Mountain View Storage', 'Lakeside Distribution Center', 'Coastal Shipping Hub',
  'Valley Logistics Park', 'Prairie Distribution Center',
];

const LOCATIONS = [
  '123 Industrial Blvd, New York, NY 10001', '456 Commerce Dr, Los Angeles, CA 90001',
  '789 Logistics Way, Chicago, IL 60601', '321 Supply Chain Rd, Houston, TX 77001',
  '654 Warehouse Lane, Phoenix, AZ 85001', '987 Distribution Ave, Philadelphia, PA 19101',
  '147 Fulfillment St, San Antonio, TX 78201', '258 Shipping Ct, San Diego, CA 92101',
  '369 Storage Blvd, Dallas, TX 75201', '741 Depot Road, San Jose, CA 95101',
  '852 Freight Way, Austin, TX 73301', '963 Cargo Lane, Jacksonville, FL 32099',
  '159 Transit Rd, Fort Worth, TX 76101', '357 Hub Street, Columbus, OH 43215',
  '468 Warehouse Dr, Charlotte, NC 28201', '579 Distribution Way, Indianapolis, IN 46201',
  '681 Logistics Park, San Francisco, CA 94101', '792 Supply Depot, Seattle, WA 98101',
  '813 Storage Ave, Denver, CO 80201', '924 Freight Blvd, Washington, DC 20001',
];

let quoteCounter = 0;
let orderCounter = 0;
let invoiceCounter = 0;

function generateQuoteNumber(): string {
  quoteCounter++;
  return `QT-${String(quoteCounter).padStart(6, '0')}`;
}

function generateOrderNumber(): string {
  orderCounter++;
  return `ORD-${String(orderCounter).padStart(6, '0')}`;
}

function generateInvoiceNumber(): string {
  invoiceCounter++;
  return `INV-${String(invoiceCounter).padStart(6, '0')}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function generateEmail(firstName: string, lastName: string, company: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'work.io', 'corp.net'];
  const separators = ['.', '_', ''];
  const sep = randomItem(separators);
  const suffix = randomInt(1, 999);
  return `${firstName.toLowerCase()}${sep}${lastName.toLowerCase()}${suffix}@${randomItem(domains)}`;
}

function generateCompany(index: number): string {
  const adjective = randomItem(['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Prime', 'Apex', 'Nova', 'Atlas', 'Zenith']);
  const noun = randomItem(['Tech', 'Core', 'Peak', 'Star', 'Vibe', 'Pulse', 'Wave', 'Edge', 'Link', 'Flow']);
  return `${adjective} ${noun} ${randomItem(COMPANY_SUFFIXES)} ${index}`;
}

function futureDate(daysFromNow: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d;
}

function pastDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

const run = async (): Promise<void> => {
  console.log(`\n=== Seeding ${SEED_COUNT} records for each create API ===\n`);
  await connectDatabase();

  // ────────────────────────────────────────────────────────────
  // 1. DISCOUNT TIERS (no dependencies)
  // ────────────────────────────────────────────────────────────
  console.log('--- Seeding Discount Tiers ---');
  const existingTiers = await DiscountTierModel.countDocuments();
  if (existingTiers >= 3) {
    console.log(`  ${existingTiers} discount tiers already exist -- skipping`);
  } else {
    const tierData = [
      { tierName: 'bronze', maxDiscountPercent: 10 },
      { tierName: 'silver', maxDiscountPercent: 15 },
      { tierName: 'gold', maxDiscountPercent: 25 },
    ];
    for (const t of tierData) {
      await DiscountTierModel.findOneAndUpdate(
        { tierName: t.tierName },
        {
          ...t,
          categorySpecificLimits: [
            { category: 'hardware', maxDiscount: 5 },
            { category: 'services', maxDiscount: 15 },
            { category: 'subscriptions', maxDiscount: 20 },
          ],
          approvalChain: [
            { minDiscount: 0, maxDiscount: 10, requiredApprovers: [] },
            { minDiscount: 10, maxDiscount: 20, requiredApprovers: ['sales_manager' as Role] },
            { minDiscount: 20, maxDiscount: 100, requiredApprovers: ['sales_manager' as Role, 'finance' as Role] },
          ],
        },
        { upsert: true },
      );
    }
    console.log(`  Created/updated 3 discount tiers`);
  }

  // ────────────────────────────────────────────────────────────
  // 2. SUBSCRIPTION PLANS (no dependencies)
  // ────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Subscription Plans ---');
  const existingPlans = await SubscriptionPlanModel.countDocuments();
  if (existingPlans >= SEED_COUNT) {
    console.log(`  ${existingPlans} subscription plans already exist -- skipping`);
  } else {
    const plans = [];
    const cycles: BillingCycle[] = ['monthly', 'quarterly', 'yearly'];
    const cycleDays: Record<BillingCycle, number> = { monthly: 30, quarterly: 90, yearly: 365 };
    const prorationTimings = ['immediate', 'next_cycle'] as const;
    const refundTypes = ['none', 'prorated', 'full'] as const;
    const effectiveDates = ['immediate', 'end_of_period'] as const;

    for (let i = 0; i < SEED_COUNT; i++) {
      const cycle = randomItem([...cycles]);
      plans.push({
        name: `Plan ${randomItem(['Basic', 'Standard', 'Premium', 'Enterprise', 'Starter', 'Pro', 'Ultimate', 'Team', 'Growth', 'Scale'])} ${i + 1}`,
        billingCycle: cycle,
        billingIntervalDays: cycleDays[cycle],
        prorationRules: {
          onUpgrade: randomItem([...prorationTimings]),
          onDowngrade: randomItem([...prorationTimings]),
        },
        cancellationPolicy: {
          refundType: randomItem([...refundTypes]),
          effectiveDate: randomItem([...effectiveDates]),
        },
      });
    }
    await SubscriptionPlanModel.insertMany(plans);
    console.log(`  Created ${SEED_COUNT} subscription plans`);
  }
  const allPlans = await SubscriptionPlanModel.find().lean();

  // ────────────────────────────────────────────────────────────
  // 3. USERS (no dependencies)
  // ────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Users ---');
  const existingUsers = await UserModel.countDocuments();
  if (existingUsers >= SEED_COUNT) {
    console.log(`  ${existingUsers} users already exist -- skipping`);
  } else {
    const roles: Role[] = ['admin', 'sales_rep', 'sales_manager', 'finance'];
    const teams = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa'];
    const users = [];
    const emailSet = new Set<string>();

    for (let i = 0; i < SEED_COUNT; i++) {
      const fn = randomItem(FIRST_NAMES);
      const ln = randomItem(LAST_NAMES);
      let email = generateEmail(fn, ln, 'work');
      while (emailSet.has(email)) {
        email = generateEmail(fn, ln, 'work');
      }
      emailSet.add(email);
      users.push({
        firstName: fn,
        lastName: ln,
        email,
        passwordHash: await PASSWORD_HASH,
        role: randomItem(roles),
        team: randomItem(teams),
        isActive: Math.random() > 0.1,
      });
    }
    await UserModel.insertMany(users);
    console.log(`  Created ${SEED_COUNT} users`);
  }
  const allUsers = await UserModel.find().lean();
  const salesReps = allUsers.filter((u) => u.role === 'sales_rep');

  // ────────────────────────────────────────────────────────────
  // 4. WAREHOUSES (no dependencies)
  // ────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Warehouses ---');
  const existingWarehouses = await WarehouseModel.countDocuments();
  if (existingWarehouses >= SEED_COUNT) {
    console.log(`  ${existingWarehouses} warehouses already exist -- skipping`);
  } else {
    const warehouses = [];
    for (let i = 0; i < SEED_COUNT; i++) {
      warehouses.push({
        name: `${randomItem(WAREHOUSE_NAMES)} #${i + 1}`,
        location: randomItem(LOCATIONS),
        shippingCostWeight: randomFloat(0.5, 10, 1),
        isActive: Math.random() > 0.1,
      });
    }
    await WarehouseModel.insertMany(warehouses);
    console.log(`  Created ${SEED_COUNT} warehouses`);
  }
  const allWarehouses = await WarehouseModel.find().lean();

  // ────────────────────────────────────────────────────────────
  // 5. PRODUCTS (no dependencies)
  // ────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Products ---');
  const existingProducts = await ProductModel.countDocuments();
  if (existingProducts >= SEED_COUNT) {
    console.log(`  ${existingProducts} products already exist -- skipping`);
  } else {
    const categories: ProductCategory[] = ['hardware', 'services', 'subscriptions'];
    const categoryNames: Record<ProductCategory, string[]> = {
      hardware: PRODUCT_NAMES_HARDWARE,
      services: PRODUCT_NAMES_SERVICES,
      subscriptions: PRODUCT_NAMES_SUBSCRIPTIONS,
    };
    const products = [];
    for (let i = 0; i < SEED_COUNT; i++) {
      const cat = randomItem(categories);
      const baseName = randomItem(categoryNames[cat]);
      const basePrice = randomFloat(10, 10000);
      const costPrice = basePrice * randomFloat(0.3, 0.8);
      const product: Record<string, unknown> = {
        name: `${baseName} — Model ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1}`,
        category: cat,
        basePrice,
        costPrice: parseFloat(costPrice.toFixed(2)),
        unit: cat === 'hardware' ? 'unit' : cat === 'services' ? 'engagement' : 'seat/month',
        taxRate: cat === 'hardware' ? 0.1 : 0.08,
        isSubscription: cat === 'subscriptions',
        isActive: Math.random() > 0.15,
      };
      if (cat === 'hardware' && Math.random() > 0.5) {
        product.variants = [
          { attributeName: 'Color', attributeValue: randomItem(['Black', 'Silver', 'White']), priceAdjustment: 0 },
          { attributeName: 'Color', attributeValue: randomItem(['Red', 'Blue', 'Green']), priceAdjustment: randomFloat(10, 100) },
        ];
      }
      products.push(product);
    }
    await ProductModel.insertMany(products);
    console.log(`  Created ${SEED_COUNT} products`);
  }
  const allProducts = await ProductModel.find().lean();

  // ────────────────────────────────────────────────────────────
  // 6. CUSTOMERS (no dependencies)
  // ────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Customers ---');
  const existingCustomers = await CustomerModel.countDocuments();
  if (existingCustomers >= SEED_COUNT) {
    console.log(`  ${existingCustomers} customers already exist -- skipping`);
  } else {
    const tiers: CustomerTier[] = ['bronze', 'silver', 'gold'];
    const customers = [];
    for (let i = 0; i < SEED_COUNT; i++) {
      const fn = randomItem(FIRST_NAMES);
      const ln = randomItem(LAST_NAMES);
      const company = generateCompany(i);
      customers.push({
        companyName: company,
        contactEmail: generateEmail(fn, ln, 'work'),
        contactName: `${fn} ${ln}`,
        customerTier: randomItem(tiers),
        creditScore: randomInt(300, 850),
        paymentTerms: randomItem(PAYMENT_TERMS),
        assignedRep: salesReps.length > 0 ? randomItem(salesReps)._id : undefined,
      });
    }
    await CustomerModel.insertMany(customers);
    console.log(`  Created ${SEED_COUNT} customers`);
  }
  const allCustomers = await CustomerModel.find().lean();

  // ────────────────────────────────────────────────────────────
  // 7. INQUIRIES (needs customers + products)
  // ────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Inquiries ---');
  const existingInquiries = await InquiryModel.countDocuments();
  if (existingInquiries >= SEED_COUNT) {
    console.log(`  ${existingInquiries} inquiries already exist -- skipping`);
  } else {
    const statuses: InquiryStatus[] = ['new', 'in_review', 'converted', 'dismissed'];
    const inquiries = [];
    for (let i = 0; i < SEED_COUNT; i++) {
      const customer = randomItem(allCustomers);
      const product = randomItem(allProducts);
      const qty = randomInt(1, 50);
      inquiries.push({
        customer: customer._id,
        items: [
          {
            product: product._id,
            quantity: qty,
            unitPriceSnapshot: product.basePrice,
            note: Math.random() > 0.5 ? randomItem(['Urgent', 'Bulk order', 'Need ASAP', 'Price check', 'Trial request']) : undefined,
          },
        ],
        note: Math.random() > 0.5 ? randomItem(['Please provide a quote', 'Looking for bulk pricing', 'Need delivery timeline', 'Comparing vendors', 'Budget inquiry']) : undefined,
        status: randomItem(statuses),
      });
    }
    await InquiryModel.insertMany(inquiries);
    console.log(`  Created ${SEED_COUNT} inquiries`);
  }

  // ────────────────────────────────────────────────────────────
  // 8. QUOTATIONS (needs customers + products + users)
  // ────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Quotations ---');
  const existingQuotations = await QuotationModel.countDocuments();
  if (existingQuotations >= SEED_COUNT) {
    console.log(`  ${existingQuotations} quotations already exist -- skipping`);
  } else {
    const statuses: QuotationStatus[] = [
      'draft', 'pending_approval', 'approved', 'rejected',
      'sent_to_customer', 'under_negotiation', 'confirmed', 'expired',
    ];
    const quotations = [];
    for (let i = 0; i < SEED_COUNT; i++) {
      const customer = randomItem(allCustomers);
      const product = randomItem(allProducts);
      const rep = randomItem(salesReps.length > 0 ? salesReps : allUsers);
      const qty = randomInt(1, 100);
      const discount = randomFloat(0, 25);
      const unitPrice = product.basePrice;
      const lineTotal = parseFloat((qty * unitPrice * (1 - discount / 100)).toFixed(2));
      const subtotal = lineTotal;
      const tax = parseFloat((subtotal * (product.taxRate || 0.1)).toFixed(2));

      quotations.push({
        quoteNumber: generateQuoteNumber(),
        customer: customer._id,
        createdBy: rep._id,
        lineItems: [
          {
            product: product._id,
            quantity: qty,
            unitPrice,
            discountPercent: discount,
            lineTotal,
            isSubscription: product.isSubscription,
          },
        ],
        subtotal,
        totalDiscount: parseFloat((qty * unitPrice * (discount / 100)).toFixed(2)),
        tax,
        grandTotal: parseFloat((subtotal + tax).toFixed(2)),
        blendedRiskScore: {
          score: randomFloat(0, 100),
          level: randomItem(['low', 'medium', 'high'] as const),
          violations: [],
        },
        status: randomItem(statuses),
        approvalRequired: Math.random() > 0.5,
        validUntil: futureDate(randomInt(7, 90)),
        version: randomInt(1, 3),
      });
    }
    await QuotationModel.insertMany(quotations);
    console.log(`  Created ${SEED_COUNT} quotations`);
  }
  const allQuotations = await QuotationModel.find().lean();

  // ────────────────────────────────────────────────────────────
  // 9. APPROVALS (needs quotations + users)
  // ────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Approvals ---');
  const existingApprovals = await ApprovalModel.countDocuments();
  if (existingApprovals >= SEED_COUNT) {
    console.log(`  ${existingApprovals} approvals already exist -- skipping`);
  } else {
    const stepStatuses = ['pending', 'approved', 'rejected', 'revision_requested'];
    const approverRoles: Role[] = ['sales_manager', 'finance', 'admin'];
    const approvals = [];
    for (let i = 0; i < SEED_COUNT; i++) {
      const quotation = randomItem(allQuotations);
      const numSteps = randomInt(1, 3);
      const approvalChain = [];
      for (let s = 0; s < numSteps; s++) {
        const approverRole = randomItem(approverRoles);
        const approver = allUsers.find((u) => u.role === approverRole) || randomItem(allUsers);
        approvalChain.push({
          step: s,
          approverRole,
          approver: approver._id,
          status: randomItem(stepStatuses),
          reason: Math.random() > 0.5 ? randomItem(['Approved', 'Rejected', 'Needs revision', 'Within budget', 'Over budget']) : undefined,
        });
      }
      approvals.push({
        quotation: quotation._id,
        approvalChain,
        currentStep: 0,
        finalStatus: randomItem(['pending', 'approved', 'rejected'] as const),
      });
    }
    await ApprovalModel.insertMany(approvals);
    console.log(`  Created ${SEED_COUNT} approvals`);
  }

  // ────────────────────────────────────────────────────────────
  // 10. PRICE LISTS (needs products)
  // ────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Price Lists ---');
  const existingPricelists = await PriceListModel.countDocuments();
  if (existingPricelists >= SEED_COUNT) {
    console.log(`  ${existingPricelists} price lists already exist -- skipping`);
  } else {
    const tiers: CustomerTier[] = ['bronze', 'silver', 'gold'];
    const currencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];
    const pricelists = [];
    for (let i = 0; i < SEED_COUNT; i++) {
      const numProducts = randomInt(1, 10);
      const selectedProducts = [];
      const usedIds = new Set<string>();
      for (let p = 0; p < numProducts; p++) {
        let prod = randomItem(allProducts);
        let attempts = 0;
        while (usedIds.has(prod._id.toString()) && attempts < 20) {
          prod = randomItem(allProducts);
          attempts++;
        }
        usedIds.add(prod._id.toString());
        selectedProducts.push({
          product: prod._id,
          customPrice: parseFloat((prod.basePrice * randomFloat(0.7, 1.3)).toFixed(2)),
        });
      }
      pricelists.push({
        name: `Price List ${i + 1} — ${randomItem(tiers)} Tier`,
        customerTier: randomItem(tiers),
        currency: randomItem(currencies),
        productPrices: selectedProducts,
        validFrom: pastDate(randomInt(0, 30)),
        validTo: futureDate(randomInt(30, 365)),
      });
    }
    await PriceListModel.insertMany(pricelists);
    console.log(`  Created ${SEED_COUNT} price lists`);
  }

  // ────────────────────────────────────────────────────────────
  // 11. ORDERS (needs quotations + customers + products)
  // ────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Orders ---');
  const existingOrders = await OrderModel.countDocuments();
  if (existingOrders >= SEED_COUNT) {
    console.log(`  ${existingOrders} orders already exist -- skipping`);
  } else {
    const fulfillmentStatuses: FulfillmentStatus[] = [
      'pending', 'in_progress', 'partially_shipped', 'shipped', 'delivered', 'backordered',
    ];
    const paymentStatuses: PaymentStatus[] = ['pending', 'partial', 'paid'];
    const orders = [];
    for (let i = 0; i < SEED_COUNT; i++) {
      const quotation = randomItem(allQuotations);
      const customer = allCustomers.find((c) => c._id.toString() === quotation.customer.toString()) || randomItem(allCustomers);
      const product = randomItem(allProducts);
      const qty = randomInt(1, 100);
      const unitPrice = product.basePrice;
      const lineTotal = parseFloat((qty * unitPrice).toFixed(2));

      orders.push({
        orderNumber: generateOrderNumber(),
        quotation: quotation._id,
        customer: customer._id,
        lineItems: [
          {
            product: product._id,
            quantity: qty,
            unitPrice,
            lineTotal,
            isSubscription: product.isSubscription,
          },
        ],
        fulfillmentStatus: randomItem(fulfillmentStatuses),
        totalAmount: lineTotal,
        paymentStatus: randomItem(paymentStatuses),
        promisedDeliveryDate: futureDate(randomInt(7, 60)),
      });
    }
    await OrderModel.insertMany(orders);
    console.log(`  Created ${SEED_COUNT} orders`);
  }
  const allOrders = await OrderModel.find().lean();

  // ────────────────────────────────────────────────────────────
  // 12. INVOICES (needs orders + customers)
  // ────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Invoices ---');
  const existingInvoices = await InvoiceModel.countDocuments();
  if (existingInvoices >= SEED_COUNT) {
    console.log(`  ${existingInvoices} invoices already exist -- skipping`);
  } else {
    const invoiceTypes: InvoiceType[] = ['one_time', 'recurring', 'credit_note'];
    const invoiceStatuses: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    const invoices = [];
    for (let i = 0; i < SEED_COUNT; i++) {
      const order = randomItem(allOrders);
      const customer = allCustomers.find((c) => c._id.toString() === order.customer.toString()) || randomItem(allCustomers);
      const product = randomItem(allProducts);
      const qty = randomInt(1, 50);
      const unitPrice = product.basePrice;
      const lineTotal = parseFloat((qty * unitPrice).toFixed(2));
      const taxRate = product.taxRate || 0.1;
      const subtotal = lineTotal;
      const tax = parseFloat((subtotal * taxRate).toFixed(2));

      invoices.push({
        invoiceNumber: generateInvoiceNumber(),
        order: order._id,
        customer: customer._id,
        invoiceType: randomItem(invoiceTypes),
        lineItems: [
          {
            description: product.name,
            quantity: qty,
            unitPrice,
            lineTotal,
          },
        ],
        subtotal,
        tax,
        total: parseFloat((subtotal + tax).toFixed(2)),
        status: randomItem(invoiceStatuses),
        dueDate: futureDate(randomInt(15, 90)),
      });
    }
    await InvoiceModel.insertMany(invoices);
    console.log(`  Created ${SEED_COUNT} invoices`);
  }

  // ────────────────────────────────────────────────────────────
  // 13. SUBSCRIPTIONS (needs orders + customers + products + plans)
  // ────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Subscriptions ---');
  const existingSubscriptions = await SubscriptionModel.countDocuments();
  if (existingSubscriptions >= SEED_COUNT) {
    console.log(`  ${existingSubscriptions} subscriptions already exist -- skipping`);
  } else {
    const subStatuses: SubscriptionStatus[] = ['active', 'paused', 'cancelled', 'expired'];
    const subscriptions = [];
    for (let i = 0; i < SEED_COUNT; i++) {
      const order = randomItem(allOrders);
      const customer = allCustomers.find((c) => c._id.toString() === order.customer.toString()) || randomItem(allCustomers);
      const product = allProducts.find((p) => p.isSubscription) || randomItem(allProducts);
      const plan = randomItem(allPlans);
      const qty = randomInt(1, 20);
      const recurringAmount = parseFloat((product.basePrice * qty).toFixed(2));
      const startDate = pastDate(randomInt(0, 180));
      const nextBillingDate = futureDate(randomInt(1, 30));

      subscriptions.push({
        customer: customer._id,
        order: order._id,
        product: product._id,
        plan: plan._id,
        quantity: qty,
        recurringAmount,
        status: randomItem(subStatuses),
        startDate,
        nextBillingDate,
        endDate: Math.random() > 0.7 ? futureDate(randomInt(30, 365)) : undefined,
      });
    }
    await SubscriptionModel.insertMany(subscriptions);
    console.log(`  Created ${SEED_COUNT} subscriptions`);
  }

  // ────────────────────────────────────────────────────────────
  // 14. PORTAL INQUIRIES (uses InquiryModel with portal customer)
  // ────────────────────────────────────────────────────────────
  console.log('\n--- Seeding Portal Inquiries (Inquiries with portal data) ---');
  const portalInquiriesCount = await InquiryModel.countDocuments({ note: { $regex: /^Portal:/ } });
  if (portalInquiriesCount >= SEED_COUNT) {
    console.log(`  ${portalInquiriesCount} portal inquiries already exist -- skipping`);
  } else {
    const portalInquiries = [];
    for (let i = 0; i < SEED_COUNT; i++) {
      const customer = randomItem(allCustomers);
      const numItems = randomInt(1, 5);
      const items = [];
      const usedProductIds = new Set<string>();
      for (let p = 0; p < numItems; p++) {
        let prod = randomItem(allProducts);
        let attempts = 0;
        while (usedProductIds.has(prod._id.toString()) && attempts < 20) {
          prod = randomItem(allProducts);
          attempts++;
        }
        usedProductIds.add(prod._id.toString());
        items.push({
          product: prod._id,
          quantity: randomInt(1, 30),
          unitPriceSnapshot: prod.basePrice,
        });
      }
      portalInquiries.push({
        customer: customer._id,
        items,
        note: `Portal: ${randomItem(['Need pricing', 'Bulk order request', 'Product availability check', 'Request for quote', 'Trial inquiry'])}`,
        status: randomItem(['new', 'in_review'] as InquiryStatus[]),
      });
    }
    await InquiryModel.insertMany(portalInquiries);
    console.log(`  Created ${SEED_COUNT} portal inquiries`);
  }

  // ────────────────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────────────────
  console.log('\n=== Seed Summary ===');
  const counts = {
    discountTiers: await DiscountTierModel.countDocuments(),
    subscriptionPlans: await SubscriptionPlanModel.countDocuments(),
    users: await UserModel.countDocuments(),
    warehouses: await WarehouseModel.countDocuments(),
    products: await ProductModel.countDocuments(),
    customers: await CustomerModel.countDocuments(),
    inquiries: await InquiryModel.countDocuments(),
    quotations: await QuotationModel.countDocuments(),
    approvals: await ApprovalModel.countDocuments(),
    priceLists: await PriceListModel.countDocuments(),
    orders: await OrderModel.countDocuments(),
    invoices: await InvoiceModel.countDocuments(),
    subscriptions: await SubscriptionModel.countDocuments(),
  };
  for (const [model, count] of Object.entries(counts)) {
    console.log(`  ${model}: ${count}`);
  }

  console.log('\nSeed complete!');
  await disconnectDatabase();
};

run().catch(async (error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
