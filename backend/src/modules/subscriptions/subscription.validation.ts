import { z } from 'zod';

const headers = z.record(z.unknown());
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const subscriptionIdSchema = z.object({
  body: z.object({}),
  params: z.object({ id: objectId }),
  query: z.object({}),
  headers,
});

export const createSubscriptionSchema = z.object({
  body: z.object({
    order: objectId,
    plan: objectId,
    startDate: z.string().datetime(),
    product: objectId.optional(),
  }),
  params: z.object({}),
  query: z.object({}),
  headers,
});

export const prorateSubscriptionSchema = z.object({
  body: z.object({
    newQuantity: z.coerce.number().int().min(1),
    changeDate: z.string().datetime(),
  }),
  params: z.object({ id: objectId }),
  query: z.object({}),
  headers,
});
