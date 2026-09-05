import { Schema, model } from 'mongoose';
import { PRODUCT_CATEGORIES } from '../../types/domain.types.js';
const variantSchema = new Schema({
    attributeName: { type: String, required: true, trim: true },
    attributeValue: { type: String, required: true, trim: true },
    priceAdjustment: { type: Number, default: 0 },
}, { _id: true });
const schema = new Schema({
    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, enum: PRODUCT_CATEGORIES, required: true, index: true },
    basePrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    unit: { type: String, trim: true },
    taxRate: { type: Number, default: 0.1, min: 0 },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    variants: { type: [variantSchema], default: [] },
    maxDiscountByCategory: { type: Number, min: 0, max: 100 },
    isSubscription: { type: Boolean, default: false, index: true },
}, { timestamps: true });
schema.index({ category: 1, isActive: 1 });
export const ProductModel = model('Product', schema);
