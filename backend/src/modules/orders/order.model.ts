import { Schema, model, type Types } from 'mongoose';
import {
  BACKORDER_STATUSES,
  FULFILLMENT_STATUSES,
  PAYMENT_STATUSES,
  type BackorderStatus,
  type FulfillmentStatus,
  type PaymentStatus,
} from '../../types/domain.types.js';

export type OrderLineItem = {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  isSubscription: boolean;
};

export type WarehouseSplitItem = { _id: Types.ObjectId; product: Types.ObjectId; quantity: number };

export type WarehouseSplit = {
  _id: Types.ObjectId;
  warehouse: Types.ObjectId;
  items: WarehouseSplitItem[];
  shippingCost: number;
  status: FulfillmentStatus;
  trackingNumber?: string;
};

export type Backorder = {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  quantityBackordered: number;
  expectedRestockDate?: Date;
  status: BackorderStatus;
};

export type OrderDocument = {
  orderNumber: string;
  quotation?: Types.ObjectId;
  customer: Types.ObjectId;
  lineItems: OrderLineItem[];
  fulfillmentStatus: FulfillmentStatus;
  warehouseSplit: WarehouseSplit[];
  backorders: Backorder[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  promisedDeliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const lineItemSchema = new Schema<OrderLineItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    isSubscription: { type: Boolean, default: false },
  },
  { _id: true },
);

const splitItemSchema = new Schema<WarehouseSplitItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: true },
);

const warehouseSplitSchema = new Schema<WarehouseSplit>(
  {
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    items: { type: [splitItemSchema], default: [] },
    shippingCost: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: FULFILLMENT_STATUSES, default: 'pending' },
    trackingNumber: { type: String, trim: true },
  },
  { _id: true },
);

const backorderSchema = new Schema<Backorder>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantityBackordered: { type: Number, required: true, min: 1 },
    expectedRestockDate: Date,
    status: { type: String, enum: BACKORDER_STATUSES, default: 'pending' },
  },
  { _id: true },
);

const schema = new Schema<OrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true, index: true },
    quotation: { type: Schema.Types.ObjectId, ref: 'Quotation', index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    lineItems: { type: [lineItemSchema], default: [] },
    fulfillmentStatus: {
      type: String,
      enum: FULFILLMENT_STATUSES,
      default: 'pending',
      index: true,
    },
    warehouseSplit: { type: [warehouseSplitSchema], default: [] },
    backorders: { type: [backorderSchema], default: [] },
    totalAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },
    promisedDeliveryDate: Date,
  },
  { timestamps: true },
);

schema.index({ customer: 1, fulfillmentStatus: 1 });
schema.index({ fulfillmentStatus: 1, promisedDeliveryDate: 1 });

export const OrderModel = model<OrderDocument>('Order', schema);
