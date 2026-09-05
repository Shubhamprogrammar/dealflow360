import { Schema, model } from 'mongoose';
const suggestedProductSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    coOccurrenceScore: { type: Number, default: 0, min: 0 },
    isPromoted: { type: Boolean, default: false },
    minMarginThreshold: { type: Number, default: 0 },
}, { _id: true });
const schema = new Schema({
    primaryProduct: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        unique: true,
        index: true,
    },
    suggestedProducts: { type: [suggestedProductSchema], default: [] },
}, { timestamps: true });
export const UpsellRuleModel = model('UpsellRule', schema);
