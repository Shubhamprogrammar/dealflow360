import type { FulfillmentStatus } from '../../types/domain.types.js';

export type CreateOrderInput = {
  quotation: string;
  promisedDeliveryDate?: string;
};

export type WarehouseSplitItemView = {
  product: string;
  quantity: number;
};

export type WarehouseSplitView = {
  warehouse: string;
  warehouseName?: string;
  items: WarehouseSplitItemView[];
  shippingCost: number;
  status: FulfillmentStatus;
  trackingNumber?: string;
};

export type BackorderView = {
  product: string;
  quantityBackordered: number;
  status: string;
};

export type FulfillmentPreview = {
  warehouseSplit: WarehouseSplitView[];
  backorders: BackorderView[];
};

export type ListOrdersQuery = {
  page: number;
  limit: number;
  fulfillmentStatus?: FulfillmentStatus;
  customer?: string;
};

export type OrderView = {
  id: string;
  orderNumber: string;
  quotation?: string;
  customer: string;
  customerName?: string;
  lineItems: Array<{
    id: string;
    product: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    isSubscription: boolean;
  }>;
  fulfillmentStatus: FulfillmentStatus;
  warehouseSplit: WarehouseSplitView[];
  backorders: BackorderView[];
  totalAmount: number;
  paymentStatus: string;
  promisedDeliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type ManualSplitInput = {
  warehouseSplit: Array<{
    warehouse: string;
    items: Array<{ product: string; quantity: number }>;
  }>;
};
