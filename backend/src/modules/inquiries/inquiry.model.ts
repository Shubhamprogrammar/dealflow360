import { Schema, model, type Types } from 'mongoose';
import { INQUIRY_STATUSES, type InquiryStatus } from '../../types/domain.types.js';

export type InquiryItem = {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  variantId?: Types.ObjectId;
  quantity: number;
  // Base price (plus any variant adjustment) captured when the customer sent
  // the inquiry. Display-only -- the quotation recomputes pricing from the
  // live product when the rep converts, so this is never trusted for money.
  unitPriceSnapshot: number;
  note?: string;
};

export type InquiryDocument = {
  customer: Types.ObjectId;
  items: InquiryItem[];
  note?: string;
  status: InquiryStatus;
  convertedQuotation?: Types.ObjectId;
  reviewedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const itemSchema = new Schema<InquiryItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: Schema.Types.ObjectId,
    quantity: { type: Number, required: true, min: 1 },
    unitPriceSnapshot: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
  },
  { _id: true },
);

const schema = new Schema<InquiryDocument>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    items: { type: [itemSchema], default: [] },
    note: { type: String, trim: true },
    status: { type: String, enum: INQUIRY_STATUSES, default: 'new', index: true },
    convertedQuotation: { type: Schema.Types.ObjectId, ref: 'Quotation' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

schema.index({ status: 1, createdAt: -1 });
schema.index({ customer: 1, createdAt: -1 });

export const InquiryModel = model<InquiryDocument>('Inquiry', schema);
