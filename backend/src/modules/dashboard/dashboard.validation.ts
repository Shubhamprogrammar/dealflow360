import { z } from 'zod';

const headers = z.record(z.unknown());

const baseQuery = {
  asOf: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(100),
};

const emptyBodyAndParams = { body: z.object({}), params: z.object({}), headers };

export const stalledDealsSchema = z.object({
  ...emptyBodyAndParams,
  query: z.object({
    ...baseQuery,
    staleDays: z.coerce.number().int().min(1).max(3650).default(7),
  }),
});

export const discountAnomaliesSchema = z.object({
  ...emptyBodyAndParams,
  query: z.object({
    ...baseQuery,
    minDiscountPercent: z.coerce.number().min(0).max(100).default(0),
  }),
});

export const deliverySlippageSchema = z.object({
  ...emptyBodyAndParams,
  query: z.object({
    ...baseQuery,
    minOverdueDays: z.coerce.number().int().min(0).max(3650).default(0),
  }),
});
