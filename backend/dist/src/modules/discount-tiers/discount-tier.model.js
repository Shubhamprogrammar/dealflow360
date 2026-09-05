import { Schema, model } from 'mongoose';
import { ROLES } from '../../types/common.types.js';
import { PRODUCT_CATEGORIES } from '../../types/domain.types.js';
const categoryLimitSchema = new Schema({
    category: { type: String, enum: PRODUCT_CATEGORIES, required: true },
    maxDiscount: { type: Number, required: true, min: 0, max: 100 },
}, { _id: true });
const approvalChainSchema = new Schema({
    minDiscount: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, required: true, min: 0 },
    requiredApprovers: { type: [String], enum: ROLES, required: true },
}, { _id: true });
const schema = new Schema({
    tierName: { type: String, required: true, unique: true, trim: true, index: true },
    maxDiscountPercent: { type: Number, required: true, min: 0, max: 100 },
    categorySpecificLimits: { type: [categoryLimitSchema], default: [] },
    approvalChain: { type: [approvalChainSchema], default: [] },
}, { timestamps: true });
export const DiscountTierModel = model('DiscountTier', schema);
