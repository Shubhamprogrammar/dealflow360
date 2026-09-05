import { z } from 'zod';
import {
  BILLING_CYCLES,
  CANCELLATION_EFFECTIVE_DATES,
  PRORATION_TIMINGS,
  REFUND_TYPES,
} from '../../types/domain.types.js';

const headers = z.record(z.unknown());
const empty = { body: z.object({}), params: z.object({}), query: z.object({}), headers };
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const prorationRules = z.object({
  onUpgrade: z.enum(PRORATION_TIMINGS),
  onDowngrade: z.enum(PRORATION_TIMINGS),
});

const cancellationPolicy = z.object({
  refundType: z.enum(REFUND_TYPES),
  effectiveDate: z.enum(CANCELLATION_EFFECTIVE_DATES),
});

const subscriptionPlanBody = {
  name: z.string().min(1).max(200),
  billingCycle: z.enum(BILLING_CYCLES),
  billingIntervalDays: z.number().int().positive(),
  prorationRules: prorationRules.optional(),
  cancellationPolicy: cancellationPolicy.optional(),
};

export const createSubscriptionPlanSchema = z.object({
  ...empty,
  body: z.object(subscriptionPlanBody),
});

export const listSubscriptionPlansSchema = z.object({
  ...empty,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    billingCycle: z.enum(BILLING_CYCLES).optional(),
  }),
});

export const updateSubscriptionPlanSchema = z.object({
  ...empty,
  params: z.object({ id: objectId }),
  body: z
    .object(subscriptionPlanBody)
    .partial()
    .refine((v) => Object.keys(v).length > 0, 'At least one field is required'),
});

export const setProrationSchema = z.object({
  ...empty,
  params: z.object({ id: objectId }),
  body: prorationRules,
});

export const setCancellationSchema = z.object({
  ...empty,
  params: z.object({ id: objectId }),
  body: cancellationPolicy,
});
