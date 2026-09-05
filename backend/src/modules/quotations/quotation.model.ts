import { Schema, model, type Types } from 'mongoose';
import {
  NEGOTIATION_ACTORS,
  PRODUCT_CATEGORIES,
  QUOTATION_STATUSES,
  RISK_LEVELS,
  type NegotiationActor,
  type ProductCategory,
  type QuotationStatus,
  type RiskLevel,
} from '../../types/domain.types.js';

export type QuotationLineItem = {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  variantId?: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
  margin: number;
  isSubscription: boolean;
  subscriptionPlan?: Types.ObjectId;
};

export type RiskViolation = {
  _id: Types.ObjectId;
  lineItem: Types.ObjectId;
  category: ProductCategory;
  discountGiven: number;
  discountAllowed: number;
  overagePoints: number;
};

export type CustomerComment = {
  _id: Types.ObjectId;
  lineItemIndex: number;
  comment: string;
  timestamp: Date;
};

export type QuotationDocument = {
  quoteNumber: string;
  customer: Types.ObjectId;
  createdBy: Types.ObjectId;
  lineItems: QuotationLineItem[];
  subtotal: number;
  totalDiscount: number;
  tax: number;
  grandTotal: number;
  blendedRiskScore: { score: number; level: RiskLevel; violations: RiskViolation[] };
  status: QuotationStatus;
  approvalRequired: boolean;
  currentApprovalStep: number;
  customerNegotiation: {
    customerComments: CustomerComment[];
    counterDiscountProposal?: number;
    repResponse?: string;
    lastModifiedBy?: NegotiationActor;
  };
  validUntil?: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

const lineItemSchema = new Schema<QuotationLineItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: Schema.Types.ObjectId,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    lineTotal: { type: Number, default: 0, min: 0 },
    margin: { type: Number, default: 0 },
    isSubscription: { type: Boolean, default: false },
    subscriptionPlan: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
  },
  { _id: true },
);

const violationSchema = new Schema<RiskViolation>(
  {
    lineItem: { type: Schema.Types.ObjectId, required: true },
    category: { type: String, enum: PRODUCT_CATEGORIES, required: true },
    discountGiven: { type: Number, required: true },
    discountAllowed: { type: Number, required: true },
    overagePoints: { type: Number, required: true },
  },
  { _id: true },
);

const customerCommentSchema = new Schema<CustomerComment>(
  {
    lineItemIndex: { type: Number, required: true, min: 0 },
    comment: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true },
);

const schema = new Schema<QuotationDocument>(
  {
    quoteNumber: { type: String, required: true, unique: true, trim: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lineItems: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    totalDiscount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, default: 0, min: 0 },
    blendedRiskScore: {
      score: { type: Number, default: 0 },
      level: { type: String, enum: RISK_LEVELS, default: 'low', index: true },
      violations: { type: [violationSchema], default: [] },
    },
    status: { type: String, enum: QUOTATION_STATUSES, default: 'draft', index: true },
    approvalRequired: { type: Boolean, default: false },
    currentApprovalStep: { type: Number, default: 0, min: 0 },
    customerNegotiation: {
      customerComments: { type: [customerCommentSchema], default: [] },
      counterDiscountProposal: { type: Number, min: 0, max: 100 },
      repResponse: { type: String, trim: true },
      lastModifiedBy: { type: String, enum: NEGOTIATION_ACTORS },
    },
    validUntil: Date,
    version: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true },
);

schema.index({ status: 1, updatedAt: -1 });
schema.index({ customer: 1, status: 1 });
schema.index({ createdBy: 1, createdAt: -1 });

export const QuotationModel = model<QuotationDocument>('Quotation', schema);
