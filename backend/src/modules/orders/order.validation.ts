import { z } from 'zod';

const headers = z.record(z.unknown());
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

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
