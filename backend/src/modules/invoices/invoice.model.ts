import { Schema, model, type Types } from 'mongoose';
import {
  INVOICE_STATUSES,
  INVOICE_TYPES,
  type InvoiceStatus,
  type InvoiceType,
} from '../../types/domain.types.js';

export type InvoiceLineItem = {
  _id: Types.ObjectId;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoiceDocument = {
  invoiceNumber: string;
  order?: Types.ObjectId;
  customer: Types.ObjectId;
  invoiceType: InvoiceType;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  dueDate?: Date;
  paidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const lineItemSchema = new Schema<InvoiceLineItem>(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const schema = new Schema<InvoiceDocument>(
  {
    invoiceNumber: { type: String, required: true, unique: true, trim: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    invoiceType: { type: String, enum: INVOICE_TYPES, required: true, index: true },
    lineItems: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: INVOICE_STATUSES, default: 'draft', index: true },
    dueDate: Date,
    paidDate: Date,
  },
  { timestamps: true },
);

schema.index({ customer: 1, status: 1 });
schema.index({ status: 1, dueDate: 1 });

export const InvoiceModel = model<InvoiceDocument>('Invoice', schema);
