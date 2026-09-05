import { z } from 'zod';
import { CUSTOMER_TIERS } from '../../types/domain.types.js';

const headers = z.record(z.unknown());
const empty = { body: z.object({}), params: z.object({}), query: z.object({}), headers };
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createPriceListSchema = z.object({
  ...empty,
  body: z.object({
    name: z.string().min(1).max(200),
    customerTier: z.enum(CUSTOMER_TIERS),
    currency: z.string().length(3).optional(),
    productPrices: z
      .array(z.object({ product: objectId, customPrice: z.number().nonnegative() }))
      .min(1),
    validFrom: z.string().datetime().optional(),
    validTo: z.string().datetime().optional(),
  }),
});

export const listPriceListsSchema = z.object({
  ...empty,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    customerTier: z.enum(CUSTOMER_TIERS).optional(),
  }),
});

export const priceListTierSchema = z.object({
  ...empty,
  params: z.object({ tierName: z.enum(CUSTOMER_TIERS) }),
});
