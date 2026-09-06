import type { ProductCategory, QuotationStatus } from '../../types/domain.types.js';

export type CreateQuotationInput = {
  customer: string;
  validUntil?: string;
};

export type UpdateQuotationInput = {
  validUntil?: string;
};

export type ListQuotationsQuery = {
  status?: QuotationStatus;
  customer?: string;
  page: number;
  limit: number;
};

export type AddLineItemInput = {
  product: string;
  variantId?: string;
  quantity: number;
  discountPercent?: number;
};

export type UpdateLineItemInput = {
  quantity?: number;
  discountPercent?: number;
};

export type RespondNegotiationInput = {
  lineItems?: Array<{ itemId: string; discountPercent: number }>;
  repResponse: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type QuotationLineItemView = {
  id: string;
  product: string;
  productName: string;
  productCategory: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
  margin: number;
  isSubscription: boolean;
  subscriptionPlan?: string;
};

export type UpsellSuggestionView = {
  product: {
    id: string;
    name: string;
    category: ProductCategory;
    basePrice: number;
  };
  coOccurrenceScore: number;
  isPromoted: boolean;
  margin: number;
};

export type QuotationApprovalStepView = {
  role: string;
  status: string;
  reason?: string;
  by?: string;
  byName?: string;
  at?: Date;
};

export type QuotationView = {
  id: string;
  quoteNumber: string;
  customer: string;
  customerName: string;
  customerTier: string;
  createdBy: string;
  createdByName: string;
  sourceInquiry?: string;
  // Only populated by the approvals queue -- the approval chain lives in a
  // separate Approval document, not embedded on the quotation itself.
  approvalSteps?: QuotationApprovalStepView[];
  lineItems: QuotationLineItemView[];
  subtotal: number;
  totalDiscount: number;
  tax: number;
  grandTotal: number;
  blendedRiskScore: {
    score: number;
    level: string;
    violations: unknown[];
  };
  status: QuotationStatus;
  approvalRequired: boolean;
  currentApprovalStep: number;
  validUntil?: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};
