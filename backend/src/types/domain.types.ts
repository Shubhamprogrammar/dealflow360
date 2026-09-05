export const CUSTOMER_TIERS = ['bronze', 'silver', 'gold'] as const;
export type CustomerTier = (typeof CUSTOMER_TIERS)[number];

export const PRODUCT_CATEGORIES = ['hardware', 'services', 'subscriptions'] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const BILLING_CYCLES = ['monthly', 'quarterly', 'yearly'] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const PRORATION_TIMINGS = ['immediate', 'next_cycle'] as const;
export type ProrationTiming = (typeof PRORATION_TIMINGS)[number];

export const REFUND_TYPES = ['none', 'prorated', 'full'] as const;
export type RefundType = (typeof REFUND_TYPES)[number];

export const CANCELLATION_EFFECTIVE_DATES = ['immediate', 'end_of_period'] as const;
export type CancellationEffectiveDate = (typeof CANCELLATION_EFFECTIVE_DATES)[number];

export const RISK_LEVELS = ['low', 'medium', 'high'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const QUOTATION_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'sent_to_customer',
  'under_negotiation',
  'confirmed',
  'expired',
] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const APPROVAL_STEP_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'revision_requested',
] as const;
export type ApprovalStepStatus = (typeof APPROVAL_STEP_STATUSES)[number];

export const APPROVAL_FINAL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ApprovalFinalStatus = (typeof APPROVAL_FINAL_STATUSES)[number];

export const FULFILLMENT_STATUSES = [
  'pending',
  'in_progress',
  'partially_shipped',
  'shipped',
  'delivered',
  'backordered',
] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const BACKORDER_STATUSES = ['pending', 'fulfilled', 'cancelled'] as const;
export type BackorderStatus = (typeof BACKORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['pending', 'partial', 'paid'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const INVOICE_TYPES = ['one_time', 'recurring', 'credit_note'] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const SUBSCRIPTION_STATUSES = ['active', 'paused', 'cancelled', 'expired'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const AUDIT_ENTITY_TYPES = [
  'quotation',
  'approval',
  'order',
  'invoice',
  'product',
  'customer',
] as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export const AUDIT_ACTIONS = [
  'created',
  'updated',
  'deleted',
  'approved',
  'rejected',
  'sent',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const NEGOTIATION_ACTORS = ['rep', 'customer'] as const;
export type NegotiationActor = (typeof NEGOTIATION_ACTORS)[number];
