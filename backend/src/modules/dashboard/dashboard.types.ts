import type { QuotationStatus } from '../../types/domain.types.js';
import type { Role } from '../../types/common.types.js';

export type DashboardRequester = { id: string; role: Role };

export type DashboardQuery = {
  asOf?: Date;
  limit: number;
};

export type StalledDealsQuery = DashboardQuery & {
  staleDays: number;
};

export type DiscountAnomaliesQuery = DashboardQuery & {
  minDiscountPercent: number;
};

export type DeliverySlippageQuery = DashboardQuery & {
  minOverdueDays: number;
};

export type StalledDealView = {
  id: string;
  quoteNumber: string;
  customer: string;
  createdBy: string;
  status: QuotationStatus;
  grandTotal: number;
  lastActivityAt: Date;
  daysStalled: number;
};

export type DiscountAnomalyView = {
  quotation: string;
  quoteNumber: string;
  customer: string;
  status: QuotationStatus;
  lineItem: string;
  product: string;
  discountPercent: number;
  allowedDiscount: number;
  overagePoints: number;
};

export type DeliverySlippageView = {
  id: string;
  orderNumber: string;
  customer: string;
  fulfillmentStatus: string;
  totalAmount: number;
  promisedDeliveryDate: Date;
  daysOverdue: number;
  lastUpdatedAt: Date;
};
