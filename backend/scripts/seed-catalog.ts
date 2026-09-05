/**
 * Seed data for the Customer Inquiry -> Rep Quotation flow (B8a).
 *
 *   npm run seed:catalog
 *
 * Idempotent -- safe to run repeatedly. Creates:
 *   - an active product catalog across all three categories (some with variants)
 *   - a portal customer you can log in as (email + password below)
 *   - discount tiers (so submit-for-approval / risk scoring work downstream)
 *   - a sales rep + sales manager (so the pipeline "New Inquiry" column is reachable)
 */
import argon2 from 'argon2';
import { connectDatabase, disconnectDatabase } from '../src/config/index.js';
import { ProductModel } from '../src/modules/products/product.model.js';
import { CustomerModel } from '../src/modules/customers/customer.model.js';
import { DiscountTierModel } from '../src/modules/discount-tiers/discount-tier.model.js';
import { UserModel } from '../src/modules/users/user.model.js';

const PORTAL_CUSTOMER = {
  companyName: 'Northwind Traders',
  contactEmail: 'buyer@northwind.test',
  contactName: 'Nancy Buyer',
  customerTier: 'silver' as const,
};

const STAFF_PASSWORD = 'dealflow';
const REP_EMAIL = 'rep@dealflow.com';
const MANAGER_EMAIL = 'manager@dealflow.com';
const STAFF = [
  { firstName: 'Sally', lastName: 'Sales', email: REP_EMAIL, role: 'sales_rep', team: 'North America' },
  { firstName: 'Manny', lastName: 'Manager', email: MANAGER_EMAIL, role: 'sales_manager', team: 'North America' },
];

const PRODUCTS = [
  // ---- Hardware ----
  {
    name: 'UltraDesk Pro Laptop',
    category: 'hardware',
    basePrice: 1800,
    costPrice: 1200,
    unit: 'unit',
    taxRate: 0.1,
    isSubscription: false,
    isActive: true,
    variants: [
      { attributeName: 'RAM', attributeValue: '16GB', priceAdjustment: 0 },
      { attributeName: 'RAM', attributeValue: '32GB', priceAdjustment: 250 },
      { attributeName: 'RAM', attributeValue: '64GB', priceAdjustment: 600 },
    ],
  },
  {
    name: 'TitanServer 2U Rack Unit',
    category: 'hardware',
    basePrice: 5200,
    costPrice: 3600,
    unit: 'unit',
    taxRate: 0.1,
    isSubscription: false,
    isActive: true,
    variants: [
      { attributeName: 'Storage', attributeValue: '4TB SSD', priceAdjustment: 0 },
      { attributeName: 'Storage', attributeValue: '8TB SSD', priceAdjustment: 900 },
    ],
  },
  {
    name: 'MeshLink Wi-Fi 6 Access Point',
    category: 'hardware',
    basePrice: 320,
    costPrice: 190,
    unit: 'unit',
    taxRate: 0.1,
    isSubscription: false,
    isActive: true,
    variants: [],
  },
  // ---- Services ----
  {
    name: 'Onboarding & Environment Setup',
    category: 'services',
    basePrice: 2500,
    costPrice: 900,
    unit: 'engagement',
    taxRate: 0.08,
    isSubscription: false,
    isActive: true,
    variants: [],
  },
  {
    name: 'Custom Integration Sprint',
    category: 'services',
    basePrice: 6000,
    costPrice: 2400,
    unit: 'sprint',
    taxRate: 0.08,
    isSubscription: false,
    isActive: true,
    variants: [
      { attributeName: 'Duration', attributeValue: '2 weeks', priceAdjustment: 0 },
      { attributeName: 'Duration', attributeValue: '4 weeks', priceAdjustment: 5000 },
    ],
  },
  {
    name: 'Priority Support Retainer',
    category: 'services',
    basePrice: 1500,
    costPrice: 500,
    unit: 'month',
    taxRate: 0.08,
    isSubscription: false,
    isActive: true,
    variants: [],
  },
  // ---- Subscriptions ----
  {
    name: 'DealFlow Analytics — Standard',
    category: 'subscriptions',
    basePrice: 90,
    costPrice: 20,
    unit: 'seat/month',
    taxRate: 0.1,
    isSubscription: true,
    isActive: true,
    variants: [],
  },
  {
    name: 'DealFlow Analytics — Enterprise',
    category: 'subscriptions',
    basePrice: 240,
    costPrice: 55,
    unit: 'seat/month',
    taxRate: 0.1,
    isSubscription: true,
    isActive: true,
    variants: [],
  },
  {
    name: 'CloudBackup 1TB',
    category: 'subscriptions',
    basePrice: 45,
    costPrice: 12,
    unit: 'month',
    taxRate: 0.1,
    isSubscription: true,
    isActive: true,
    variants: [],
  },
  // Inactive on purpose: will NOT appear in the portal catalog. Reactivate it
  // from the Products admin screen if you want to test that path.
  {
    name: 'Legacy POS Terminal (discontinued)',
    category: 'hardware',
    basePrice: 700,
    costPrice: 500,
    unit: 'unit',
    taxRate: 0.1,
    isSubscription: false,
    isActive: false,
    variants: [],
  },
];

const TIERS = [
  { tierName: 'bronze', maxDiscountPercent: 10 },
  { tierName: 'silver', maxDiscountPercent: 15 },
  { tierName: 'gold', maxDiscountPercent: 25 },
];
const CATEGORY_LIMITS = [
  { category: 'hardware', maxDiscount: 5 },
  { category: 'services', maxDiscount: 15 },
  { category: 'subscriptions', maxDiscount: 20 },
];
const APPROVAL_CHAIN = [
  { minDiscount: 0, maxDiscount: 10, requiredApprovers: [] },
  { minDiscount: 10, maxDiscount: 20, requiredApprovers: ['sales_manager'] },
  { minDiscount: 20, maxDiscount: 100, requiredApprovers: ['sales_manager', 'finance'] },
];

const run = async (): Promise<void> => {
  await connectDatabase();

  // Products
  for (const p of PRODUCTS) {
    const existing = await ProductModel.findOne({ name: p.name }).exec();
    if (existing) {
      console.log(`Product exists: ${p.name}`);
      continue;
    }
    await ProductModel.create(p);
    console.log(`Created product: ${p.name}${p.isActive ? '' : ' (inactive)'}`);
  }

  // Discount tiers
  for (const t of TIERS) {
    if (await DiscountTierModel.findOne({ tierName: t.tierName }).exec()) {
      console.log(`Discount tier exists: ${t.tierName}`);
      continue;
    }
    await DiscountTierModel.create({
      ...t,
      categorySpecificLimits: CATEGORY_LIMITS,
      approvalChain: APPROVAL_CHAIN,
    });
    console.log(`Created discount tier: ${t.tierName}`);
  }

  // Staff
  const staffHash = await argon2.hash(STAFF_PASSWORD);
  for (const u of STAFF) {
    if (await UserModel.findOne({ email: u.email }).exec()) {
      console.log(`Staff exists: ${u.email}`);
      continue;
    }
    await UserModel.create({ ...u, passwordHash: staffHash });
    console.log(`Created staff (${u.role}): ${u.email}`);
  }

  // Portal customer
  const existingCustomer = await CustomerModel.findOne({
    contactEmail: PORTAL_CUSTOMER.contactEmail,
  }).exec();
  if (existingCustomer) {
    console.log(`Portal customer exists: ${PORTAL_CUSTOMER.contactEmail}`);
  } else {
    await CustomerModel.create({
      companyName: PORTAL_CUSTOMER.companyName,
      contactEmail: PORTAL_CUSTOMER.contactEmail,
      contactName: PORTAL_CUSTOMER.contactName,
      customerTier: PORTAL_CUSTOMER.customerTier,
      paymentTerms: 'Net 30',
    });
    console.log(`Created portal customer: ${PORTAL_CUSTOMER.contactEmail}`);
  }

  console.log('\n--- Test credentials ---');
  console.log(`Portal (magic link):    ${PORTAL_CUSTOMER.contactEmail}  (request a link from /login → Customer tab)`);
  console.log(`Sales Rep (Staff tab):  ${REP_EMAIL} / ${STAFF_PASSWORD}`);
  console.log(`Sales Manager:          ${MANAGER_EMAIL} / ${STAFF_PASSWORD}`);

  await disconnectDatabase();
};

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
