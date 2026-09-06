import { Schema, model, type Types } from 'mongoose';
import { ROLES, type Role } from '../../types/common.types.js';
import { PRODUCT_CATEGORIES, type ProductCategory } from '../../types/domain.types.js';

export type CategoryLimit = {
  _id: Types.ObjectId;
  category: ProductCategory;
  maxDiscount: number;
};

export type ApprovalChainRule = {
  _id: Types.ObjectId;
  minDiscount: number;
  maxDiscount: number;
  requiredApprovers: Role[];
};

export type DiscountTierDocument = {
  tierName: string;
  maxDiscountPercent: number;
  categorySpecificLimits: CategoryLimit[];
  approvalChain: ApprovalChainRule[];
  createdAt: Date;
  updatedAt: Date;
};

const categoryLimitSchema = new Schema<CategoryLimit>(
  {
    category: { type: String, enum: PRODUCT_CATEGORIES, required: true },
    maxDiscount: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: true },
);

const approvalChainSchema = new Schema<ApprovalChainRule>(
  {
    minDiscount: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, required: true, min: 0 },
    requiredApprovers: { type: [String], enum: ROLES, required: true },
  },
  { _id: true },
);

const schema = new Schema<DiscountTierDocument>(
  {
    tierName: { type: String, required: true, unique: true, trim: true, index: true },
    maxDiscountPercent: { type: Number, required: true, min: 0, max: 100 },
    categorySpecificLimits: { type: [categoryLimitSchema], default: [] },
    approvalChain: { type: [approvalChainSchema], default: [] },
  },
  { timestamps: true },
);

export const DiscountTierModel = model<DiscountTierDocument>('DiscountTier', schema);
