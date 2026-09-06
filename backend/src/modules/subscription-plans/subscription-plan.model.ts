import { Schema, model } from 'mongoose';
import {
  BILLING_CYCLES,
  CANCELLATION_EFFECTIVE_DATES,
  PRORATION_TIMINGS,
  REFUND_TYPES,
  type BillingCycle,
  type CancellationEffectiveDate,
  type ProrationTiming,
  type RefundType,
} from '../../types/domain.types.js';

export type SubscriptionPlanDocument = {
  name: string;
  billingCycle: BillingCycle;
  billingIntervalDays: number;
  prorationRules: { onUpgrade: ProrationTiming; onDowngrade: ProrationTiming };
  cancellationPolicy: { refundType: RefundType; effectiveDate: CancellationEffectiveDate };
  createdAt: Date;
  updatedAt: Date;
};

const schema = new Schema<SubscriptionPlanDocument>(
  {
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
  },
  { timestamps: true },
);

export const SubscriptionPlanModel = model<SubscriptionPlanDocument>('SubscriptionPlan', schema);
