import { Schema, model } from 'mongoose';
import { SUBSCRIPTION_STATUSES } from '../../types/domain.types.js';
const billingHistorySchema = new Schema({
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    amount: { type: Number, required: true, min: 0 },
    billingDate: { type: Date, required: true },
    status: { type: String, required: true, trim: true },
}, { _id: true });
const prorationSchema = new Schema({
    reason: { type: String, required: true, trim: true },
    oldAmount: { type: Number, required: true, min: 0 },
    newAmount: { type: Number, required: true, min: 0 },
    creditAmount: { type: Number, required: true },
    effectiveDate: { type: Date, required: true },
}, { _id: true });
const schema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    plan: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    quantity: { type: Number, required: true, min: 1 },
    recurringAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: SUBSCRIPTION_STATUSES, default: 'active', index: true },
    startDate: { type: Date, required: true },
    nextBillingDate: { type: Date, index: true },
    endDate: Date,
    billingHistory: { type: [billingHistorySchema], default: [] },
    prorationAdjustments: { type: [prorationSchema], default: [] },
}, { timestamps: true });
schema.index({ status: 1, nextBillingDate: 1 });
export const SubscriptionModel = model('Subscription', schema);
