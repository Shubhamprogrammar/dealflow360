import type { FulfillmentStatus } from '../../types/domain.types.js';

export type WarehouseSplitItemView = {
  product: string;
  quantity: number;
};

export type WarehouseSplitView = {
  warehouse: string;
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

export type OrderView = {
  id: string;
  orderNumber: string;
  quotation?: string;
  customer: string;
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
  createdAt: Date;
  updatedAt: Date;
};

export type ManualSplitInput = {
  warehouseSplit: Array<{
    warehouse: string;
    items: Array<{ product: string; quantity: number }>;
  }>;
};
