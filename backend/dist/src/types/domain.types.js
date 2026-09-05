export const CUSTOMER_TIERS = ['bronze', 'silver', 'gold'];
export const PRODUCT_CATEGORIES = ['hardware', 'services', 'subscriptions'];
export const BILLING_CYCLES = ['monthly', 'quarterly', 'yearly'];
export const PRORATION_TIMINGS = ['immediate', 'next_cycle'];
export const REFUND_TYPES = ['none', 'prorated', 'full'];
export const CANCELLATION_EFFECTIVE_DATES = ['immediate', 'end_of_period'];
export const RISK_LEVELS = ['low', 'medium', 'high'];
export const QUOTATION_STATUSES = [
    'draft',
    'pending_approval',
    'approved',
    'rejected',
    'sent_to_customer',
    'under_negotiation',
    'confirmed',
    'expired',
];
export const APPROVAL_STEP_STATUSES = [
    'pending',
    'approved',
    'rejected',
    'revision_requested',
];
export const APPROVAL_FINAL_STATUSES = ['pending', 'approved', 'rejected'];
export const FULFILLMENT_STATUSES = [
    'pending',
    'in_progress',
    'partially_shipped',
    'shipped',
    'delivered',
    'backordered',
];
export const BACKORDER_STATUSES = ['pending', 'fulfilled', 'cancelled'];
export const PAYMENT_STATUSES = ['pending', 'partial', 'paid'];
export const INVOICE_TYPES = ['one_time', 'recurring', 'credit_note'];
export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
export const SUBSCRIPTION_STATUSES = ['active', 'paused', 'cancelled', 'expired'];
export const AUDIT_ENTITY_TYPES = [
    'quotation',
    'approval',
    'order',
    'invoice',
    'product',
    'customer',
];
export const AUDIT_ACTIONS = [
    'created',
    'updated',
    'deleted',
    'approved',
    'rejected',
    'sent',
];
export const NEGOTIATION_ACTORS = ['rep', 'customer'];
