import type {
  Role,
  QuotationStatus,
  Product,
  Quotation,
  QuoteLine,
  ApprovalStep,
  ApprovalDecision,
  AuditEntry,
  LineComment,
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
  Inquiry,
  InquiryItem,
  InquiryStatus,
  Catalog,
  CatalogProduct,
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

const CATEGORY_REVERSE: Record<Product['category'], string> = {
  Hardware: 'hardware',
  Services: 'services',
  Subscription: 'subscriptions',
};

// mapCategory maps backend 'subscriptions' -> frontend 'Subscription' (singular),
// so a naive .toLowerCase() on the way back produces 'subscription', which fails
// the backend's PRODUCT_CATEGORIES enum check. Reverse through this table instead.
export function reverseCategory(c: Product['category']): string {
  return CATEGORY_REVERSE[c] ?? 'hardware';
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
    // Backend stores taxRate as a fraction (0.1 = 10%); the UI shows/edits
    // a plain percentage, so convert on the way in and back out on save.
    tax: p.taxRate !== undefined ? Math.round(p.taxRate * 100 * 100) / 100 : p.tax ?? 0,
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
    repName: q.createdByName ?? 'Unknown Rep',
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

// The customer portal's quotation shape is genuinely different from the
// staff-facing one -- comments live nested under customerNegotiation keyed
// by line *index* (not id), and there's no customer/rep/risk data at all
// (roleaccess.md: customers have no access to margins, risk, or approvals).
// Reusing mapQuotation silently dropped comments and counter-discount.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPortalQuotation(q: any): Quotation {
  const rawLineItems = q.lineItems ?? [];
  const lineItems = rawLineItems.map(mapQuotationLine);
  const negotiation = q.customerNegotiation ?? {};

  const comments: LineComment[] = (negotiation.customerComments ?? []).map(
    (c: any) => ({
      lineId: lineItems[c.lineItemIndex]?.id ?? String(c.lineItemIndex),
      author: 'Customer',
      text: c.comment,
    }),
  );
  if (negotiation.repResponse) {
    comments.push({ lineId: 'general', author: 'Rep', text: negotiation.repResponse });
  }

  return {
    id: q._id ?? q.id,
    customerId: '',
    customerName: '',
    repName: '',
    tier: 'Bronze',
    status: mapQuotationStatus(q.status ?? 'draft'),
    lines: lineItems,
    blendedRiskScore: 'LOW',
    approvalSteps: [],
    auditTrail: [],
    comments,
    counterDiscountPct: negotiation.counterDiscountProposal,
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
  const decisionMap: Record<string, ApprovalDecision> = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    revision_requested: 'returned',
  };
  const rawDecision = s.status ?? s.decision ?? 'pending';
  return {
    role: roleMap[s.role] ?? s.role ?? 'SalesManager',
    decision: decisionMap[rawDecision] ?? 'pending',
    reason: s.reason,
    by: s.byName ?? s.by ?? s.decidedBy,
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
// Inquiry mapping  (customer inquiry → rep quotation flow)
// ---------------------------------------------------------------------------
const INQUIRY_STATUS_MAP: Record<string, InquiryStatus> = {
  new: 'New',
  in_review: 'InReview',
  converted: 'Converted',
  dismissed: 'Dismissed',
};

export function mapInquiryStatus(s: string): InquiryStatus {
  return INQUIRY_STATUS_MAP[s] ?? 'New';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapInquiryItem(i: any): InquiryItem {
  return {
    id: i.id ?? i._id ?? '',
    productId: i.product ?? i.productId ?? '',
    productName: i.productName ?? 'Unknown',
    category: mapCategory(i.productCategory ?? i.category ?? ''),
    variantId: i.variantId,
    quantity: i.quantity ?? i.qty ?? 0,
    unitPrice: i.unitPriceSnapshot ?? i.unitPrice ?? 0,
    note: i.note,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapInquiry(q: any): Inquiry {
  return {
    id: q.id ?? q._id ?? '',
    customerId: q.customer ?? q.customerId ?? '',
    customerName: q.customerName ?? 'Unknown',
    tier: mapTier(q.customerTier ?? q.tier ?? 'bronze'),
    items: (q.items ?? []).map(mapInquiryItem),
    note: q.note,
    status: mapInquiryStatus(q.status ?? 'new'),
    convertedQuotationId: q.convertedQuotation ?? q.convertedQuotationId,
    createdAt: q.createdAt ?? '',
    updatedAt: q.updatedAt ?? '',
  };
}

// ---------------------------------------------------------------------------
// Portal catalog mapping
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCatalogProduct(p: any): CatalogProduct {
  return {
    id: p.id ?? p._id ?? '',
    name: p.name,
    category: mapCategory(p.category ?? ''),
    unit: p.unit ?? 'Each',
    basePrice: p.basePrice ?? 0,
    isSubscription: p.isSubscription ?? false,
    variants: (p.variants ?? []).map(
      (v: {
        id?: string;
        _id?: string;
        attributeName?: string;
        attribute?: string;
        attributeValue?: string;
        value?: string;
        priceAdjustment?: number;
        extraPrice?: number;
      }) => ({
        id: v.id ?? v._id ?? '',
        attribute: v.attributeName ?? v.attribute ?? '',
        value: v.attributeValue ?? v.value ?? '',
        extraPrice: v.priceAdjustment ?? v.extraPrice ?? 0,
      }),
    ),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCatalog(c: any): Catalog {
  return {
    customerTier: mapTier(c.customerTier ?? 'bronze'),
    groups: (c.groups ?? []).map((g: { category?: string; products?: unknown[] }) => ({
      category: mapCategory(g.category ?? ''),
      products: (g.products ?? []).map(mapCatalogProduct),
    })),
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
    id: d.id ?? d._id ?? `stalled-${Math.random().toString(36).slice(2)}`,
    dealName: d.customerName ?? 'Unknown',
    issue: `Idle ${d.daysStalled ?? '?'} days`,
    flaggedDate: d.lastActivityAt ?? '',
    action: 'Nudge sent',
    severity: (d.daysStalled ?? 0) >= 14 ? 'Critical' : 'Warning',
    quotationId: d.id ?? d._id,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDiscountAnomaly(a: any): HealthAlert {
  return {
    id: a.lineItem ?? a._id ?? `anomaly-${Math.random().toString(36).slice(2)}`,
    dealName: a.customerName ?? 'Unknown',
    issue: `Discount ${a.discountPercent ?? '?'}% vs ${a.allowedDiscount ?? '?'}% limit (+${a.overagePoints ?? 0}pt)`,
    flaggedDate: a.flaggedAt ?? '',
    action: 'Escalated to manager',
    severity: (a.overagePoints ?? 0) >= 10 ? 'Critical' : 'Warning',
    quotationId: a.quotation,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDeliverySlippage(d: any): HealthAlert {
  return {
    id: d.id ?? d._id ?? `slip-${Math.random().toString(36).slice(2)}`,
    dealName: d.customerName ?? 'Unknown',
    issue: `Delivery ${d.daysOverdue ?? '?'} days late`,
    flaggedDate: d.promisedDeliveryDate ?? '',
    action: 'Review needed',
    severity: (d.daysOverdue ?? 0) >= 7 ? 'Critical' : 'Warning',
    quotationId: d.quotation,
  };
}

// ---------------------------------------------------------------------------
// Fulfillment mapping
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapFulfillmentOrder(o: any): FulfillmentOrder {
  const splits = (o.warehouseSplit ?? []).map(mapSplitLine);
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
  // A warehouse split groups multiple per-product items; there's no
  // top-level quantity on the split itself, so sum the items.
  const items = s.items ?? [];
  const qty = items.length > 0
    ? items.reduce((sum: number, item: any) => sum + (item.quantity ?? 0), 0)
    : s.quantity ?? s.qty ?? 0;
  return {
    warehouseId: s.warehouse ?? s.warehouseId ?? '',
    warehouseName: s.warehouseName ?? s.warehouse?.name ?? 'Unknown',
    qty,
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
  const customer = s.customer ?? {};
  const plan = s.plan ?? {};
  const billingCycle = plan.billingCycle ?? s.billingCycle ?? 'monthly';

  return {
    id: s._id ?? s.id,
    customerName: customer.companyName ?? s.customerName ?? 'Unknown',
    plan: plan.name ?? s.planName ?? 'Unknown',
    cycle: billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1) as Subscription['cycle'],
    nextBillDate: s.nextBillingDate ?? null,
    status: s.status === 'active' ? 'Active' : s.status === 'paused' ? 'Paused' : 'Cancelled',
    oneTimeLines: [],
    recurringLines: [{
      plan: plan.name ?? s.planName ?? 'Unknown',
      cycle: billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1) as Subscription['cycle'],
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
          maxDiscountPct: cl.maxDiscount ?? 0,
        });
      }
    }
  }

  return { tierCeilings, categoryCeilings };
}
