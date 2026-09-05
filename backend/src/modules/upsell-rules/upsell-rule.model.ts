import { Schema, model, type Types } from 'mongoose';

export type SuggestedProduct = {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  coOccurrenceScore: number;
  isPromoted: boolean;
  minMarginThreshold: number;
};

export type UpsellRuleDocument = {
  primaryProduct: Types.ObjectId;
  suggestedProducts: SuggestedProduct[];
  createdAt: Date;
  updatedAt: Date;
};

const suggestedProductSchema = new Schema<SuggestedProduct>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    coOccurrenceScore: { type: Number, default: 0, min: 0 },
    isPromoted: { type: Boolean, default: false },
    minMarginThreshold: { type: Number, default: 0 },
  },
  { _id: true },
);

const schema = new Schema<UpsellRuleDocument>(
  {
    primaryProduct: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
      index: true,
    },
    suggestedProducts: { type: [suggestedProductSchema], default: [] },
  },
  { timestamps: true },
);

export const UpsellRuleModel = model<UpsellRuleDocument>('UpsellRule', schema);
