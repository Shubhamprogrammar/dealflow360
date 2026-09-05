import type { QuotationStatus } from '../../types/domain.types.js';

export type PortalLineItemView = {
  id: string;
  product: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
  isSubscription: boolean;
};

export type PortalCustomerCommentView = {
  lineItemIndex: number;
  comment: string;
  timestamp: Date;
};

export type PortalQuotationView = {
  id: string;
  quoteNumber: string;
  lineItems: PortalLineItemView[];
  subtotal: number;
  totalDiscount: number;
  tax: number;
  grandTotal: number;
  status: QuotationStatus;
  customerNegotiation: {
    customerComments: PortalCustomerCommentView[];
    counterDiscountProposal?: number;
    repResponse?: string;
    lastModifiedBy?: string;
  };
  validUntil?: Date;
};

export type RequestChangesInput = {
  comments?: Array<{ lineItemIndex: number; comment: string }>;
  counterDiscountProposal?: number;
};
