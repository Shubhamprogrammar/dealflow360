import type {
  Product,
  Quotation,
  QuoteLine,
  Warehouse,
  StockRow,
  FulfillmentOrder,
  Subscription,
  Invoice,
  HealthAlert,
  DiscountConfig,
  ApprovalDecision,
  Tier,
} from '@/types';

/**
 * In-memory mock backend. Mirrors the eventual /api/v1 contract so services/*
 * can be swapped for real fetch calls without changing any screen code.
 * State resets on page reload -- that's fine for a hackathon demo.
 */

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const CATEGORY_CEILINGS: Record<Product['category'], number> = {
  Hardware: 15,
  Services: 10,
  Subscription: 5,
};

const TIER_CEILINGS: Record<Tier, number> = {
  Bronze: 5,
  Silver: 10,
  Gold: 15,
};

let discountConfig: DiscountConfig = {
  tierCeilings: (Object.keys(TIER_CEILINGS) as Tier[]).map((tier) => ({
    tier,
    maxDiscountPct: TIER_CEILINGS[tier],
  })),
  categoryCeilings: (Object.keys(CATEGORY_CEILINGS) as Product['category'][]).map((category) => ({
    category,
    maxDiscountPct: CATEGORY_CEILINGS[category],
  })),
};

let products: Product[] = [
  {
    id: 'p1',
    name: 'Laptop Pro 14',
    category: 'Hardware',
    price: 1200,
    unit: 'Each',
    tax: 15,
    isSubscription: false,
    status: 'Active',
    variants: [
      { attribute: 'RAM', values: ['8GB', '16GB'], extraPrice: 150 },
      { attribute: 'Color', values: ['Black', 'Silver'], extraPrice: 0 },
    ],
  },
  {
    id: 'p2',
    name: 'Onsite Setup Service',
    category: 'Services',
    price: 450,
    unit: 'Each',
    tax: 10,
    isSubscription: false,
    status: 'Active',
    variants: [],
  },
  {
    id: 'p3',
    name: 'Extended Warranty',
    category: 'Services',
    price: 180,
    unit: 'Each',
    tax: 5,
    isSubscription: false,
    status: 'Active',
    variants: [],
  },
  {
    id: 'p4',
    name: 'Docking Station',
    category: 'Hardware',
    price: 180,
    unit: 'Each',
    tax: 15,
    isSubscription: false,
    status: 'Active',
    variants: [{ attribute: 'Color', values: ['Black', 'White'], extraPrice: 0 }],
  },
  {
    id: 'p5',
    name: 'Wireless Mouse',
    category: 'Hardware',
    price: 25,
    unit: 'Each',
    tax: 15,
    isSubscription: false,
    status: 'Active',
    variants: [],
  },
  {
    id: 'p6',
    name: 'Care Plan 2yr',
    category: 'Subscription',
    price: 46,
    unit: 'Monthly',
    tax: 0,
    isSubscription: true,
    recurring: 'Monthly',
    status: 'Active',
    variants: [],
  },
  {
    id: 'p7',
    name: 'Support SLA',
    category: 'Subscription',
    price: 300,
    unit: 'Quarterly',
    tax: 0,
    isSubscription: true,
    recurring: 'Quarterly',
    status: 'Active',
    variants: [],
  },
];

const warehouses: Warehouse[] = [
  { id: 'w1', name: 'Main Warehouse' },
  { id: 'w2', name: 'East Depot' },
];

const stock: StockRow[] = [
  { warehouseId: 'w1', warehouseName: 'Main Warehouse', productId: 'p1', productName: 'Laptop Pro 14', inStock: 40, reserved: 18 },
  { warehouseId: 'w2', warehouseName: 'East Depot', productId: 'p1', productName: 'Laptop Pro 14', inStock: 10, reserved: 6 },
  { warehouseId: 'w1', warehouseName: 'Main Warehouse', productId: 'p4', productName: 'Docking Station', inStock: 65, reserved: 12 },
];

function line(productId: string, qty: number, discountPct: number): QuoteLine {
  const p = products.find((x) => x.id === productId)!;
  return {
    id: `${productId}-${Math.random().toString(36).slice(2, 7)}`,
    productId,
    productName: p.name,
    category: p.category,
    qty,
    unitPrice: p.price,
    discountPct,
  };
}

function blendedRisk(lines: QuoteLine[]): 'LOW' | 'MEDIUM' | 'HIGH' {
  let totalOver = 0;
  let worstOver = 0;
  for (const l of lines) {
    const ceiling = CATEGORY_CEILINGS[l.category];
    const over = l.discountPct - ceiling;
    if (over > 0) {
      totalOver += over;
      worstOver = Math.max(worstOver, over);
    }
  }
  if (worstOver === 0) return 'LOW';
  if (worstOver >= 10 || totalOver >= 15) return 'HIGH';
  return 'MEDIUM';
}

function approvalStepsFor(risk: 'LOW' | 'MEDIUM' | 'HIGH'): Quotation['approvalSteps'] {
  if (risk === 'LOW') return [];
  if (risk === 'MEDIUM') return [{ role: 'SalesManager', decision: 'pending' }];
  return [
    { role: 'SalesManager', decision: 'pending' },
    { role: 'FinanceOps', decision: 'pending' },
  ];
}

let quotations: Quotation[] = [
  {
    id: 'Q-1042',
    customerId: 'c1',
    customerName: 'Acme Corp',
    repName: 'J. Rao',
    tier: 'Gold',
    status: 'PendingApproval',
    lines: [line('p1', 2, 12), line('p2', 1, 18), line('p3', 1, 10)],
    blendedRiskScore: 'HIGH',
    approvalSteps: [
      { role: 'SalesManager', decision: 'returned', reason: 'Requested justification', by: 'M. Shah', at: '2025-08-21' },
      { role: 'SalesManager', decision: 'pending' },
    ],
    auditTrail: [
      { user: 'J. Rao', action: 'Submitted', date: '2025-08-20', note: 'Initial 12% discount' },
      { user: 'M. Shah', action: 'Returned', date: '2025-08-21', note: 'Requested justification' },
      { user: 'J. Rao', action: 'Resubmitted', date: '2025-08-22', note: 'Added margin note' },
    ],
    comments: [],
    createdAt: '2025-08-20',
    updatedAt: '2025-08-22',
  },
  {
    id: 'Q-1030',
    customerId: 'c2',
    customerName: 'Beta Industries',
    repName: 'S. Patel',
    tier: 'Silver',
    status: 'PendingApproval',
    lines: [line('p1', 5, 8)],
    blendedRiskScore: 'MEDIUM',
    approvalSteps: approvalStepsFor('MEDIUM'),
    auditTrail: [{ user: 'S. Patel', action: 'Submitted', date: '2025-08-24' }],
    comments: [],
    createdAt: '2025-08-24',
    updatedAt: '2025-08-24',
  },
  {
    id: 'Q-1055',
    customerId: 'c3',
    customerName: 'Nova Retail',
    repName: 'R. Iyer',
    tier: 'Bronze',
    status: 'Approved',
    lines: [line('p4', 3, 5)],
    blendedRiskScore: 'LOW',
    approvalSteps: [],
    auditTrail: [{ user: 'R. Iyer', action: 'Auto-approved', date: '2025-08-23' }],
    comments: [],
    createdAt: '2025-08-23',
    updatedAt: '2025-08-23',
  },
  {
    id: 'Q-1020',
    customerId: 'c4',
    customerName: 'Delta LLC',
    repName: 'J. Rao',
    tier: 'Bronze',
    status: 'Draft',
    lines: [line('p1', 1, 0)],
    blendedRiskScore: 'LOW',
    approvalSteps: [],
    auditTrail: [],
    comments: [],
    createdAt: '2025-08-25',
    updatedAt: '2025-08-25',
  },
  {
    id: 'Q-1061',
    customerId: 'c5',
    customerName: 'Zenith Co',
    repName: 'J. Rao',
    tier: 'Gold',
    status: 'UnderNegotiation',
    lines: [line('p1', 2, 10), line('p2', 1, 12), line('p3', 1, 10)],
    blendedRiskScore: 'MEDIUM',
    approvalSteps: [],
    auditTrail: [{ user: 'System', action: 'Sent to customer', date: '2025-08-19' }],
    comments: [
      { lineId: 'seed', author: 'Customer', text: 'Can this be 15% off instead of 10%?' },
      { lineId: 'seed', author: 'Customer', text: 'Can we push this to next month?' },
    ],
    createdAt: '2025-08-18',
    updatedAt: '2025-08-26',
  },
  {
    id: 'Q-1070',
    customerId: 'c6',
    customerName: 'Orion Ltd',
    repName: 'S. Patel',
    tier: 'Gold',
    status: 'Confirmed',
    lines: [line('p1', 3, 12)],
    blendedRiskScore: 'LOW',
    approvalSteps: [],
    auditTrail: [{ user: 'Customer', action: 'Confirmed', date: '2025-08-27' }],
    comments: [],
    createdAt: '2025-08-15',
    updatedAt: '2025-08-27',
  },
];

const fulfillment: FulfillmentOrder[] = [
  {
    id: 'Q-1042',
    customerName: 'Acme Corp',
    status: 'SplitPending',
    warehouses: ['Main Warehouse', 'East Depot'],
    suggestedSplit: [
      { warehouseId: 'w1', warehouseName: 'Main Warehouse', qty: 18, estShipments: 1, estCost: 42 },
      { warehouseId: 'w2', warehouseName: 'East Depot', qty: 6, estShipments: 1, estCost: 29 },
    ],
    accepted: false,
  },
  {
    id: 'Q-1030',
    customerName: 'Zenith Co',
    status: 'Backorder',
    warehouses: ['East Depot'],
    suggestedSplit: [{ warehouseId: 'w2', warehouseName: 'East Depot', qty: 4, estShipments: 1, estCost: 20 }],
    accepted: false,
  },
];

const subscriptions: Subscription[] = [
  {
    id: 'sub1',
    customerName: 'Acme Corp',
    plan: 'Care Plan 2yr',
    cycle: 'Monthly',
    nextBillDate: '2025-09-15',
    status: 'Active',
    oneTimeLines: [
      { name: 'Laptop Pro 14', qty: 2, amount: 2280 },
      { name: 'Onsite Setup', qty: 1, amount: 450 },
    ],
    recurringLines: [
      { plan: 'Care Plan 2yr', cycle: 'Monthly', amount: 46, nextBillDate: '2025-09-15' },
      { plan: 'Support SLA', cycle: 'Quarterly', amount: 300, nextBillDate: '2025-11-01' },
    ],
  },
  {
    id: 'sub2',
    customerName: 'Beta Industries',
    plan: 'Support SLA',
    cycle: 'Quarterly',
    nextBillDate: '2025-11-01',
    status: 'Active',
    oneTimeLines: [],
    recurringLines: [{ plan: 'Support SLA', cycle: 'Quarterly', amount: 300, nextBillDate: '2025-11-01' }],
  },
  {
    id: 'sub3',
    customerName: 'Delta LLC',
    plan: 'Care Plan 1yr',
    cycle: 'Monthly',
    nextBillDate: null,
    status: 'Paused',
    oneTimeLines: [],
    recurringLines: [],
  },
];

const invoices: Invoice[] = [
  { id: 'INV-1042', customerName: 'Acme Corp', amount: 2730, status: 'Unpaid', dueDate: '2025-09-10', stage: 'Invoiced' },
  { id: 'INV-1043', customerName: 'Acme Corp', amount: 46, status: 'Paid', dueDate: '2025-09-15', stage: 'Paid', recurring: true },
  { id: 'INV-1038', customerName: 'Nova Retail', amount: 9750, status: 'Paid', dueDate: '2025-08-30', stage: 'Paid' },
];

const healthAlerts: HealthAlert[] = [
  { id: 'h1', dealName: 'Zenith Co', issue: 'Idle 9 days', flaggedDate: '2025-08-24', action: 'Nudge sent', severity: 'Warning' },
  { id: 'h2', dealName: 'Delta LLC', issue: 'Discount 22% vs avg 8%', flaggedDate: '2025-08-25', action: 'Escalated to manager', severity: 'Critical' },
];

// ---- Auth ----

export async function mockLogin(email: string): Promise<{ id: string; name: string; email: string; role: import('@/types').Role }> {
  await delay(300);
  const map: Record<string, import('@/types').Role> = {
    'rep@dealflow360.demo': 'Rep',
    'manager@dealflow360.demo': 'SalesManager',
    'finance@dealflow360.demo': 'FinanceOps',
    'admin@dealflow360.demo': 'Admin',
  };
  const role = map[email.toLowerCase()] ?? 'Rep';
  const names: Record<import('@/types').Role, string> = {
    Rep: 'John Doe',
    SalesManager: 'M. Shah',
    FinanceOps: 'R. Iyer',
    Admin: 'Admin User',
    Customer: 'Customer',
  };
  return { id: 'u-' + role, name: names[role], email, role };
}

// ---- Catalog ----

export async function listProducts(): Promise<Product[]> {
  await delay();
  return products;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  await delay();
  return products.find((p) => p.id === id);
}

export async function saveProduct(p: Product): Promise<Product> {
  await delay();
  const idx = products.findIndex((x) => x.id === p.id);
  if (idx >= 0) products[idx] = p;
  else products = [...products, p];
  return p;
}

export async function getDiscountConfig(): Promise<DiscountConfig> {
  await delay();
  return discountConfig;
}

export async function saveDiscountConfig(cfg: DiscountConfig): Promise<DiscountConfig> {
  await delay();
  discountConfig = cfg;
  return cfg;
}

// ---- Quotations ----

export async function listQuotations(): Promise<Quotation[]> {
  await delay();
  return quotations;
}

export async function getQuotation(id: string): Promise<Quotation | undefined> {
  await delay();
  return quotations.find((q) => q.id === id);
}

export async function createQuotation(customerName: string, tier: Tier): Promise<Quotation> {
  await delay();
  const q: Quotation = {
    id: `Q-${1000 + quotations.length + Math.floor(Math.random() * 900)}`,
    customerId: 'c-' + customerName.toLowerCase().replace(/\s+/g, ''),
    customerName,
    repName: 'You',
    tier,
    status: 'Draft',
    lines: [],
    blendedRiskScore: 'LOW',
    approvalSteps: [],
    auditTrail: [{ user: 'You', action: 'Created draft', date: new Date().toISOString().slice(0, 10) }],
    comments: [],
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  quotations = [q, ...quotations];
  return q;
}

export async function updateQuotationLines(id: string, lines: QuoteLine[]): Promise<Quotation> {
  await delay();
  const q = quotations.find((x) => x.id === id);
  if (!q) throw new Error('Quotation not found');
  q.lines = lines;
  q.blendedRiskScore = blendedRisk(lines);
  q.updatedAt = new Date().toISOString().slice(0, 10);
  return q;
}

export async function submitQuotation(id: string): Promise<Quotation> {
  await delay();
  const q = quotations.find((x) => x.id === id);
  if (!q) throw new Error('Quotation not found');
  const risk = blendedRisk(q.lines);
  q.blendedRiskScore = risk;
  if (risk === 'LOW') {
    q.status = 'Approved';
    q.approvalSteps = [];
    q.auditTrail.push({ user: 'System', action: 'Auto-approved', date: new Date().toISOString().slice(0, 10), note: 'Within all category ceilings' });
  } else {
    q.status = 'PendingApproval';
    q.approvalSteps = approvalStepsFor(risk);
    q.auditTrail.push({ user: 'You', action: 'Submitted', date: new Date().toISOString().slice(0, 10) });
  }
  return q;
}

export function lineOverage(l: QuoteLine) {
  const ceiling = CATEGORY_CEILINGS[l.category];
  return { ceiling, over: Math.max(0, l.discountPct - ceiling) };
}

export async function decideApproval(
  id: string,
  role: import('@/types').ApprovalRole,
  decision: ApprovalDecision,
  reason: string,
  by: string,
): Promise<Quotation> {
  await delay();
  const q = quotations.find((x) => x.id === id);
  if (!q) throw new Error('Quotation not found');
  const step = q.approvalSteps.find((s) => s.role === role && s.decision === 'pending');
  if (step) {
    step.decision = decision;
    step.reason = reason;
    step.by = by;
    step.at = new Date().toISOString().slice(0, 10);
  }
  q.auditTrail.push({ user: by, action: decision === 'approved' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Returned', date: new Date().toISOString().slice(0, 10), note: reason });

  if (decision === 'rejected') {
    q.status = 'Rejected';
  } else if (decision === 'returned') {
    q.status = 'Returned';
  } else if (decision === 'approved') {
    const stillPending = q.approvalSteps.some((s) => s.decision === 'pending');
    q.status = stillPending ? 'PendingApproval' : 'Approved';
  }
  q.updatedAt = new Date().toISOString().slice(0, 10);
  return q;
}

// ---- Fulfillment ----

export async function listFulfillment(): Promise<FulfillmentOrder[]> {
  await delay();
  return fulfillment;
}

export async function getFulfillment(id: string): Promise<FulfillmentOrder | undefined> {
  await delay();
  return fulfillment.find((f) => f.id === id);
}

export async function listStock(): Promise<StockRow[]> {
  await delay();
  return stock;
}

export async function acceptSplit(id: string): Promise<FulfillmentOrder> {
  await delay();
  const f = fulfillment.find((x) => x.id === id);
  if (!f) throw new Error('Order not found');
  f.accepted = true;
  f.status = 'Fulfilled';
  return f;
}

export async function overrideSplit(id: string, split: FulfillmentOrder['suggestedSplit']): Promise<FulfillmentOrder> {
  await delay();
  const f = fulfillment.find((x) => x.id === id);
  if (!f) throw new Error('Order not found');
  f.suggestedSplit = split;
  f.accepted = true;
  f.status = 'Fulfilled';
  return f;
}

// ---- Subscriptions / Billing ----

export async function listSubscriptions(): Promise<Subscription[]> {
  await delay();
  return subscriptions;
}

export async function getSubscription(id: string): Promise<Subscription | undefined> {
  await delay();
  return subscriptions.find((s) => s.id === id);
}

export async function cancelSubscription(id: string): Promise<Subscription> {
  await delay();
  const s = subscriptions.find((x) => x.id === id);
  if (!s) throw new Error('Subscription not found');
  s.status = 'Cancelled';
  s.nextBillDate = null;
  return s;
}

// ---- Invoices ----

export async function listInvoices(): Promise<Invoice[]> {
  await delay();
  return invoices;
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  await delay();
  return invoices.find((i) => i.id === id);
}

export async function recordPayment(id: string): Promise<Invoice> {
  await delay();
  const inv = invoices.find((i) => i.id === id);
  if (!inv) throw new Error('Invoice not found');
  inv.status = 'Paid';
  inv.stage = 'Paid';
  return inv;
}

// ---- Deal Health ----

export async function listHealthAlerts(): Promise<HealthAlert[]> {
  await delay();
  return healthAlerts;
}

// ---- Negotiation (portal) ----

export async function addComment(id: string, text: string): Promise<Quotation> {
  await delay();
  const q = quotations.find((x) => x.id === id);
  if (!q) throw new Error('Quotation not found');
  q.comments.push({ lineId: 'general', author: 'Customer', text });
  q.status = 'UnderNegotiation';
  return q;
}

export async function submitCounterDiscount(id: string, pct: number, deliveryDate?: string): Promise<Quotation> {
  await delay();
  const q = quotations.find((x) => x.id === id);
  if (!q) throw new Error('Quotation not found');
  q.counterDiscountPct = pct;
  q.requestedDeliveryDate = deliveryDate;
  q.status = 'UnderNegotiation';
  return q;
}

export async function confirmQuotation(id: string): Promise<Quotation> {
  await delay();
  const q = quotations.find((x) => x.id === id);
  if (!q) throw new Error('Quotation not found');
  const lines = q.counterDiscountPct != null ? q.lines.map((l) => ({ ...l, discountPct: q.counterDiscountPct! })) : q.lines;
  const risk = blendedRisk(lines);
  q.lines = lines;
  q.blendedRiskScore = risk;
  if (risk === 'LOW') {
    q.status = 'Confirmed';
    q.auditTrail.push({ user: 'Customer', action: 'Confirmed', date: new Date().toISOString().slice(0, 10) });
  } else {
    q.status = 'PendingApproval';
    q.approvalSteps = approvalStepsFor(risk);
    q.auditTrail.push({ user: 'Customer', action: 'Confirmed (re-entered approval)', date: new Date().toISOString().slice(0, 10), note: 'Counter-discount exceeded threshold' });
  }
  return q;
}

export { warehouses };
