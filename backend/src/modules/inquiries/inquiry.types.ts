import type { InquiryStatus } from '../../types/domain.types.js';

export type CreateInquiryItemInput = {
  product: string;
  variantId?: string;
  quantity: number;
  note?: string;
};

export type CreateInquiryInput = {
  items: CreateInquiryItemInput[];
  note?: string;
};

export type ListInquiriesQuery = {
  status?: InquiryStatus;
  page: number;
  limit: number;
};

export type InquiryItemView = {
  id: string;
  product: string;
  productName: string;
  productCategory: string;
  variantId?: string;
  quantity: number;
  unitPriceSnapshot: number;
  note?: string;
};

export type InquiryView = {
  id: string;
  customer: string;
  customerName: string;
  customerTier: string;
  items: InquiryItemView[];
  note?: string;
  status: InquiryStatus;
  convertedQuotation?: string;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
};
