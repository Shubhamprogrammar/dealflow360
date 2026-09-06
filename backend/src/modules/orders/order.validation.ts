import { z } from 'zod';
import { FULFILLMENT_STATUSES } from '../../types/domain.types.js';

const headers = z.record(z.unknown());
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const listOrdersSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    fulfillmentStatus: z.enum(FULFILLMENT_STATUSES).optional(),
    customer: objectId.optional(),
  }),
  headers,
});

export const createOrderSchema = z.object({
  body: z.object({
    quotation: objectId,
    promisedDeliveryDate: z.string().datetime().optional(),
  }),
  params: z.object({}),
  query: z.object({}),
  headers,
});

export const orderIdSchema = z.object({
  body: z.object({}),
  params: z.object({ id: objectId }),
  query: z.object({}),
  headers,
});

export const manualSplitSchema = z.object({
  body: z.object({
    warehouseSplit: z
      .array(
        z.object({
          warehouse: objectId,
          items: z
            .array(
              z.object({
                product: objectId,
                quantity: z.coerce.number().int().min(1),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
  }),
  params: z.object({ id: objectId }),
  query: z.object({}),
  headers,
});
