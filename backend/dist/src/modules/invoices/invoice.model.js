import { Schema, model } from 'mongoose';
import { INVOICE_STATUSES, INVOICE_TYPES, } from '../../types/domain.types.js';
const lineItemSchema = new Schema({
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
}, { _id: true });
const schema = new Schema({
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
}, { timestamps: true });
schema.index({ customer: 1, status: 1 });
schema.index({ status: 1, dueDate: 1 });
export const InvoiceModel = model('Invoice', schema);
