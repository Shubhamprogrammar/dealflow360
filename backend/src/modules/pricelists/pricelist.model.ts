import { Schema, model, type Types } from 'mongoose';
import { CUSTOMER_TIERS, type CustomerTier } from '../../types/domain.types.js';

export type PriceListEntry = {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  customPrice: number;
};

export type PriceListDocument = {
  name: string;
  customerTier: CustomerTier;
  currency: string;
  productPrices: PriceListEntry[];
  validFrom?: Date;
  validTo?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const entrySchema = new Schema<PriceListEntry>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    customPrice: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const schema = new Schema<PriceListDocument>(
  {
    name: { type: String, required: true, trim: true },
    customerTier: { type: String, enum: CUSTOMER_TIERS, required: true, index: true },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    productPrices: { type: [entrySchema], default: [] },
    validFrom: Date,
    validTo: Date,
  },
  { timestamps: true },
);

schema.index({ customerTier: 1, validFrom: 1, validTo: 1 });

export const PriceListModel = model<PriceListDocument>('PriceList', schema);
