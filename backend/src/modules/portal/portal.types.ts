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

export type PortalCatalogVariant = {
  id: string;
  attributeName: string;
  attributeValue: string;
  priceAdjustment: number;
};

export type PortalCatalogProduct = {
  id: string;
  name: string;
  category: string;
  unit: string;
  basePrice: number;
  isSubscription: boolean;
  variants: PortalCatalogVariant[];
};

export type PortalCatalogGroup = {
  category: string;
  products: PortalCatalogProduct[];
};

export type PortalCatalogView = {
  customerTier: string;
  groups: PortalCatalogGroup[];
};

export type SubmitInquiryItemInput = {
  product: string;
  variantId?: string;
  quantity: number;
  note?: string;
};

export type SubmitInquiryInput = {
  items: SubmitInquiryItemInput[];
  note?: string;
};
