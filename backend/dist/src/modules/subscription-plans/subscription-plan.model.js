import { Schema, model } from 'mongoose';
import { BILLING_CYCLES, CANCELLATION_EFFECTIVE_DATES, PRORATION_TIMINGS, REFUND_TYPES, } from '../../types/domain.types.js';
const schema = new Schema({
    name: { type: String, required: true, trim: true, index: true },
    billingCycle: { type: String, enum: BILLING_CYCLES, required: true, index: true },
    billingIntervalDays: { type: Number, required: true, min: 1 },
    prorationRules: {
        onUpgrade: { type: String, enum: PRORATION_TIMINGS, default: 'immediate' },
        onDowngrade: { type: String, enum: PRORATION_TIMINGS, default: 'next_cycle' },
    },
    cancellationPolicy: {
        refundType: { type: String, enum: REFUND_TYPES, default: 'prorated' },
        effectiveDate: {
            type: String,
            enum: CANCELLATION_EFFECTIVE_DATES,
            default: 'end_of_period',
        },
    },
}, { timestamps: true });
export const SubscriptionPlanModel = model('SubscriptionPlan', schema);
