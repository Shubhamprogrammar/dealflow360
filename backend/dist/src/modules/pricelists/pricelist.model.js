import { Schema, model } from 'mongoose';
import { CUSTOMER_TIERS } from '../../types/domain.types.js';
const entrySchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    customPrice: { type: Number, required: true, min: 0 },
}, { _id: true });
const schema = new Schema({
    name: { type: String, required: true, trim: true },
    customerTier: { type: String, enum: CUSTOMER_TIERS, required: true, index: true },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    productPrices: { type: [entrySchema], default: [] },
    validFrom: Date,
    validTo: Date,
}, { timestamps: true });
schema.index({ customerTier: 1, validFrom: 1, validTo: 1 });
export const PriceListModel = model('PriceList', schema);
