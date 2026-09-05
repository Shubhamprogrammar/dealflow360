import { Schema, model, type Types } from 'mongoose';
import { PRODUCT_CATEGORIES, type ProductCategory } from '../../types/domain.types.js';

export type ProductVariant = {
  _id: Types.ObjectId;
  attributeName: string;
  attributeValue: string;
  priceAdjustment: number;
};

export type ProductDocument = {
  name: string;
  category: ProductCategory;
  basePrice: number;
  costPrice: number;
  unit?: string;
  taxRate: number;
  description?: string;
  isActive: boolean;
  variants: ProductVariant[];
  maxDiscountByCategory?: number;
  isSubscription: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const variantSchema = new Schema<ProductVariant>(
  {
    attributeName: { type: String, required: true, trim: true },
    attributeValue: { type: String, required: true, trim: true },
    priceAdjustment: { type: Number, default: 0 },
  },
  { _id: true },
);

const schema = new Schema<ProductDocument>(
  {
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
  },
  { timestamps: true },
);

schema.index({ category: 1, isActive: 1 });

export const ProductModel = model<ProductDocument>('Product', schema);
