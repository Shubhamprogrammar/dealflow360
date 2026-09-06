export type Role = 'Rep' | 'SalesManager' | 'FinanceOps' | 'Admin' | 'Customer';

export type Tier = 'Bronze' | 'Silver' | 'Gold';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Customer {
  id: string;
  name: string;
  tier: Tier;
  contactEmail?: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'Hardware' | 'Services' | 'Subscription';
  price: number;
  unit: string;
  tax: number;
  isSubscription: boolean;
  recurring?: 'Monthly' | 'Quarterly' | 'Yearly';
  variants: { attribute: string; values: string[]; extraPrice: number }[];
  status: 'Active' | 'Archived';
}

export interface CategoryCeiling {
  category: Product['category'];
  maxDiscountPct: number;
}

export interface TierCeiling {
  tier: Tier;
  maxDiscountPct: number;
}

export type QuotationStatus =
  | 'Draft'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected'
  | 'Returned'
  | 'UnderNegotiation'
  | 'Confirmed';

export interface QuoteLine {
  id: string;
  productId: string;
  productName: string;
  category: Product['category'];
  qty: number;
  unitPrice: number;
  discountPct: number;
}

export type ApprovalRole = 'SalesManager' | 'FinanceOps';
export type ApprovalDecision = 'pending' | 'approved' | 'rejected' | 'returned';

export interface ApprovalStep {
  role: ApprovalRole;
  decision: ApprovalDecision;
  reason?: string;
  by?: string;
  at?: string;
}

export interface AuditEntry {
  user: string;
  action: string;
  date: string;
  note?: string;
}

export interface LineComment {
  lineId: string;
  author: 'Customer' | 'Rep';
  text: string;
}

export interface Quotation {
  id: string;
  customerId: string;
  customerName: string;
  repName: string;
  tier: Tier;
  status: QuotationStatus;
  lines: QuoteLine[];
  blendedRiskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  approvalSteps: ApprovalStep[];
  auditTrail: AuditEntry[];
  comments: LineComment[];
  counterDiscountPct?: number;
  requestedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
  // Fields from backend
  quoteNumber?: string;
  grandTotal?: number;
  subtotal?: number;
  totalDiscount?: number;
  tax?: number;
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface StockRow {
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  inStock: number;
  reserved: number;
}

export interface SplitLine {
  warehouseId: string;
  warehouseName: string;
  qty: number;
  estShipments: number;
  estCost: number;
}

export interface FulfillmentOrder {
  id: string; // order id
  customerName: string;
  status: 'SplitPending' | 'Backorder' | 'Fulfilled';
  warehouses: string[];
  suggestedSplit: SplitLine[];
  accepted: boolean;
}

export interface SubscriptionPlanLine {
  plan: string;
  cycle: 'Monthly' | 'Quarterly' | 'Yearly';
  amount: number;
  nextBillDate: string;
}

export interface Subscription {
  id: string;
  customerName: string;
  plan: string;
  cycle: 'Monthly' | 'Quarterly' | 'Yearly';
  nextBillDate: string | null;
  status: 'Active' | 'Paused' | 'Cancelled';
  oneTimeLines: { name: string; qty: number; amount: number }[];
  recurringLines: SubscriptionPlanLine[];
}

export interface Invoice {
  id: string;
  customerName: string;
  amount: number;
  status: 'Unpaid' | 'Paid';
  dueDate: string;
  stage: 'OrderConfirmed' | 'Shipped' | 'Invoiced' | 'Paid';
  recurring?: boolean;
}

export interface HealthAlert {
  id: string;
  dealName: string;
  issue: string;
  flaggedDate: string;
  action: string;
  severity: 'Info' | 'Warning' | 'Critical';
  quotationId?: string;
}

export interface DiscountConfig {
  tierCeilings: TierCeiling[];
  categoryCeilings: CategoryCeiling[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

// ---------------------------------------------------------------------------
// Customer inquiry → rep quotation flow
// ---------------------------------------------------------------------------
export type InquiryStatus = 'New' | 'InReview' | 'Converted' | 'Dismissed';

export interface InquiryItem {
  id: string;
  productId: string;
  productName: string;
  category: Product['category'];
  variantId?: string;
  quantity: number;
  unitPrice: number;
  note?: string;
}

export interface Inquiry {
  id: string;
  customerId: string;
  customerName: string;
  tier: Tier;
  items: InquiryItem[];
  note?: string;
  status: InquiryStatus;
  convertedQuotationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  category: Product['category'];
  unit: string;
  basePrice: number;
  isSubscription: boolean;
  variants: { id: string; attribute: string; value: string; extraPrice: number }[];
}

export interface CatalogGroup {
  category: Product['category'];
  products: CatalogProduct[];
}

export interface Catalog {
  customerTier: Tier;
  groups: CatalogGroup[];
}
