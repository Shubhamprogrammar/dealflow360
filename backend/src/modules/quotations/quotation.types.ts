import type { QuotationStatus } from '../../types/domain.types.js';

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

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type QuotationLineItemView = {
  id: string;
  product: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
  margin: number;
  isSubscription: boolean;
  subscriptionPlan?: string;
};

export type QuotationView = {
  id: string;
  quoteNumber: string;
  customer: string;
  createdBy: string;
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
