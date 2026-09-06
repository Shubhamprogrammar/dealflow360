import type {
  Role,
  QuotationStatus,
  Product,
  Quotation,
  QuoteLine,
  ApprovalStep,
  AuditEntry,
  HealthAlert,
  Customer,
  Tier,
  FulfillmentOrder,
  SplitLine,
  StockRow,
  Invoice,
  Subscription,
  DiscountConfig,
  TierCeiling,
  CategoryCeiling,
} from '@/types';

// ---------------------------------------------------------------------------
// Role mapping  (backend → frontend)
// ---------------------------------------------------------------------------
const ROLE_MAP: Record<string, Role> = {
  sales_rep: 'Rep',
  sales_manager: 'SalesManager',
  finance: 'FinanceOps',
  admin: 'Admin',
};

const ROLE_REVERSE: Record<string, string> = {
  Rep: 'sales_rep',
  SalesManager: 'sales_manager',
  FinanceOps: 'finance',
  Admin: 'admin',
};

export function mapRole(backendRole: string): Role {
  return ROLE_MAP[backendRole] ?? 'Rep';
}

export function reverseRole(frontendRole: Role): string {
  return ROLE_REVERSE[frontendRole] ?? 'sales_rep';
}

// ---------------------------------------------------------------------------
// Quotation status mapping
// ---------------------------------------------------------------------------
const STATUS_MAP: Record<string, QuotationStatus> = {
  draft: 'Draft',
  pending_approval: 'PendingApproval',
  approved: 'Approved',
  rejected: 'Rejected',
  sent_to_customer: 'UnderNegotiation',
  under_negotiation: 'UnderNegotiation',
  confirmed: 'Confirmed',
  expired: 'Draft', // fallback
};

export function mapQuotationStatus(s: string): QuotationStatus {
  return STATUS_MAP[s] ?? 'Draft';
}

// ---------------------------------------------------------------------------
// Risk level mapping
// ---------------------------------------------------------------------------
export function mapRiskLevel(level: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  const l = level?.toLowerCase();
  if (l === 'high') return 'HIGH';
  if (l === 'medium') return 'MEDIUM';
  return 'LOW';
}

// ---------------------------------------------------------------------------
// Tier mapping
// ---------------------------------------------------------------------------
const TIER_MAP: Record<string, Tier> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

export function mapTier(t: string): Tier {
  return TIER_MAP[t?.toLowerCase()] ?? 'Bronze';
}

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------
const CATEGORY_MAP: Record<string, Product['category']> = {
  hardware: 'Hardware',
  services: 'Services',
  subscriptions: 'Subscription',
};

export function mapCategory(c: string): Product['category'] {
  return CATEGORY_MAP[c?.toLowerCase()] ?? 'Hardware';
}

// ---------------------------------------------------------------------------
// Product mapping
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProduct(p: any): Product {
  return {
    id: p._id ?? p.id,
    name: p.name,
    category: mapCategory(p.category),
    price: p.basePrice ?? p.price ?? 0,
    unit: p.unit ?? 'Each',
    tax: p.taxRate ?? p.tax ?? 0,
    isSubscription: p.isSubscription ?? false,
    recurring: p.billingCycle ? (p.billingCycle.charAt(0).toUpperCase() + p.billingCycle.slice(1)) : undefined,
    variants: (p.variants ?? []).map((v: { attributeName?: string; attribute?: string; attributeValue?: string; values?: string[]; priceAdjustment?: number; extraPrice?: number }) => ({
      attribute: v.attributeName ?? v.attribute ?? '',
      values: v.attributeValue ? [v.attributeValue] : v.values ?? [],
      extraPrice: v.priceAdjustment ?? v.extraPrice ?? 0,
    })),
    status: p.isActive === false ? 'Archived' : 'Active',
  };
}

// ---------------------------------------------------------------------------
// Quotation mapping
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapQuotationLine(l: any): QuoteLine {
  return {
    id: l._id ?? l.id,
    productId: l.product ?? l.productId ?? '',
    productName: l.productName ?? l.product?.name ?? 'Unknown',
    category: mapCategory(l.category ?? l.productCategory ?? ''),
    qty: l.quantity ?? l.qty ?? 0,
    unitPrice: l.unitPrice ?? 0,
    discountPct: l.discountPercent ?? l.discountPct ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapQuotation(q: any): Quotation {
  const lineItems = (q.lineItems ?? q.lines ?? []).map(mapQuotationLine);
  const risk = q.blendedRiskScore;
  const riskLevel = typeof risk === 'object' ? mapRiskLevel(risk?.level ?? 'low') : mapRiskLevel(risk ?? 'low');

  return {
    id: q._id ?? q.id,
    customerId: q.customer ?? q.customerId ?? '',
    customerName: q.customerName ?? q.customer?.companyName ?? 'Unknown',
    tier: mapTier(q.customerTier ?? q.tier ?? 'bronze'),
    status: mapQuotationStatus(q.status ?? 'draft'),
    lines: lineItems,
    blendedRiskScore: riskLevel,
    approvalSteps: (q.approvalSteps ?? []).map(mapApprovalStep),
    auditTrail: (q.auditTrail ?? []).map(mapAuditEntry),
    comments: q.comments ?? q.negotiationHistory ?? [],
    counterDiscountPct: q.counterDiscountPct,
    requestedDeliveryDate: q.requestedDeliveryDate,
    createdAt: q.createdAt ?? '',
    updatedAt: q.updatedAt ?? '',
    quoteNumber: q.quoteNumber ?? q.id,
    grandTotal: q.grandTotal ?? 0,
    subtotal: q.subtotal ?? 0,
    totalDiscount: q.totalDiscount ?? 0,
    tax: q.tax ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApprovalStep(s: any): ApprovalStep {
  const roleMap: Record<string, 'SalesManager' | 'FinanceOps'> = {
    sales_manager: 'SalesManager',
    finance: 'FinanceOps',
  };
  return {
    role: roleMap[s.role] ?? s.role ?? 'SalesManager',
    decision: s.status ?? s.decision ?? 'pending',
    reason: s.reason,
    by: s.by ?? s.decidedBy,
    at: s.at ?? s.decidedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAuditEntry(a: any): AuditEntry {
  return {
    user: a.performedBy ?? a.user ?? 'System',
    action: a.action ?? '',
    date: a.createdAt ?? a.date ?? '',
    note: a.note ?? a.changes ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Customer mapping
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCustomer(c: any): Customer {
  return {
    id: c._id ?? c.id,
    name: c.companyName ?? c.name ?? '',
    tier: mapTier(c.customerTier ?? c.tier ?? 'bronze'),
    contactEmail: c.contactEmail,
  };
}

// ---------------------------------------------------------------------------
// Deal Health / HealthAlert mapping
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapStalledDeal(d: any): HealthAlert {
  return {
    id: d._id ?? d.id ?? `stalled-${Math.random().toString(36).slice(2)}`,
    dealName: d.customerName ?? d.customer ?? 'Unknown',
    issue: `Idle ${d.daysSinceUpdate ?? d.daysStalled ?? '?'} days`,
    flaggedDate: d.lastUpdated ?? d.updatedAt ?? '',
    action: 'Nudge sent',
    severity: (d.daysSinceUpdate ?? d.daysStalled ?? 0) >= 14 ? 'Critical' : 'Warning',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDiscountAnomaly(a: any): HealthAlert {
  return {
    id: a._id ?? a.id ?? `anomaly-${Math.random().toString(36).slice(2)}`,
    dealName: a.customerName ?? a.customer ?? 'Unknown',
    issue: `Discount ${a.discountPercent ?? a.discountGiven ?? '?'}% vs ${a.categoryLimit ?? a.allowed ?? '?'}% limit (+${a.overagePoints ?? 0}pt)`,
    flaggedDate: a.createdAt ?? '',
    action: 'Escalated to manager',
    severity: (a.overagePoints ?? 0) >= 10 ? 'Critical' : 'Warning',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDeliverySlippage(d: any): HealthAlert {
  return {
    id: d._id ?? d.id ?? `slip-${Math.random().toString(36).slice(2)}`,
    dealName: d.customerName ?? d.customer ?? 'Unknown',
    issue: `Delivery ${d.daysLate ?? '?'} days late`,
    flaggedDate: d.promisedDeliveryDate ?? '',
    action: 'Review needed',
    severity: (d.daysLate ?? 0) >= 7 ? 'Critical' : 'Warning',
  };
}

// ---------------------------------------------------------------------------
// Fulfillment mapping
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapFulfillmentOrder(o: any): FulfillmentOrder {
  const splits = (o.fulfillmentSplit ?? o.suggestedSplit ?? []).map(mapSplitLine);
  const warehouseNames = splits.map((s: SplitLine) => s.warehouseName);
  return {
    id: o._id ?? o.id,
    customerName: o.customerName ?? o.customer?.companyName ?? 'Unknown',
    status: o.fulfillmentStatus === 'backordered' ? 'Backorder' :
            o.fulfillmentStatus === 'delivered' || o.fulfillmentStatus === 'shipped' ? 'Fulfilled' : 'SplitPending',
    warehouses: [...new Set(warehouseNames)] as string[],
    suggestedSplit: splits,
    accepted: o.fulfillmentStatus === 'delivered' || o.fulfillmentStatus === 'shipped',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSplitLine(s: any): SplitLine {
  return {
    warehouseId: s.warehouse ?? s.warehouseId ?? '',
    warehouseName: s.warehouseName ?? s.warehouse?.name ?? 'Unknown',
    qty: s.quantity ?? s.qty ?? 0,
    estShipments: s.shipments ?? 1,
    estCost: s.shippingCost ?? s.estCost ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapStockRow(warehouse: any, stock: any): StockRow {
  return {
    warehouseId: warehouse._id ?? warehouse.id,
    warehouseName: warehouse.name,
    productId: stock.product ?? stock.productId ?? '',
    productName: stock.productName ?? 'Unknown',
    inStock: stock.quantity ?? stock.inStock ?? 0,
    reserved: stock.reserved ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Invoice mapping
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapInvoice(i: any): Invoice {
  return {
    id: i._id ?? i.id,
    customerName: i.customerName ?? i.customer?.companyName ?? 'Unknown',
    amount: i.total ?? i.amount ?? 0,
    status: i.paymentStatus === 'paid' ? 'Paid' : 'Unpaid',
    dueDate: i.dueDate ?? '',
    stage: i.paymentStatus === 'paid' ? 'Paid' : 'Invoiced',
    recurring: i.invoiceType === 'recurring',
  };
}

// ---------------------------------------------------------------------------
// Subscription mapping
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSubscription(s: any): Subscription {
  return {
    id: s._id ?? s.id,
    customerName: s.customerName ?? 'Unknown',
    plan: s.planName ?? s.plan?.name ?? 'Unknown',
    cycle: (s.billingCycle ?? 'monthly').charAt(0).toUpperCase() + (s.billingCycle ?? 'monthly').slice(1) as Subscription['cycle'],
    nextBillDate: s.nextBillingDate ?? null,
    status: s.status === 'active' ? 'Active' : s.status === 'paused' ? 'Paused' : 'Cancelled',
    oneTimeLines: [],
    recurringLines: [{
      plan: s.planName ?? 'Unknown',
      cycle: (s.billingCycle ?? 'monthly').charAt(0).toUpperCase() + (s.billingCycle ?? 'monthly').slice(1) as Subscription['cycle'],
      amount: s.recurringAmount ?? 0,
      nextBillDate: s.nextBillingDate ?? '',
    }],
  };
}

// ---------------------------------------------------------------------------
// Discount Config mapping
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDiscountConfig(tiers: any[]): DiscountConfig {
  const tierCeilings: TierCeiling[] = tiers.map(t => ({
    tier: mapTier(t.tierName ?? ''),
    maxDiscountPct: t.maxDiscountPercent ?? 0,
  }));

  const categoryCeilings: CategoryCeiling[] = [];
  for (const t of tiers) {
    for (const cl of t.categorySpecificLimits ?? []) {
      const existing = categoryCeilings.find(c => c.category === mapCategory(cl.category ?? ''));
      if (!existing) {
        categoryCeilings.push({
          category: mapCategory(cl.category ?? ''),
          maxDiscountPct: cl.maxDiscountPercent ?? 0,
        });
      }
    }
  }

  return { tierCeilings, categoryCeilings };
}
