import { z } from 'zod';

const headers = z.record(z.unknown());
const empty = { body: z.object({}), params: z.object({}), query: z.object({}), headers };
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const warehouseBody = {
  name: z.string().min(1).max(200),
  location: z.string().min(1).max(200).optional(),
  shippingCostWeight: z.number().nonnegative().optional(),
};

export const createWarehouseSchema = z.object({
  ...empty,
  body: z.object(warehouseBody),
});

export const listWarehousesSchema = z.object({
  ...empty,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    isActive: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    search: z.string().min(1).max(200).optional(),
  }),
});

export const warehouseIdSchema = z.object({ ...empty, params: z.object({ id: objectId }) });

export const updateWarehouseSchema = z.object({
  ...empty,
  params: z.object({ id: objectId }),
  body: z
    .object({ ...warehouseBody, isActive: z.boolean() })
    .partial()
    .refine((v) => Object.keys(v).length > 0, 'At least one field is required'),
});

export const setStockSchema = z.object({
  ...empty,
  params: z.object({ id: objectId }),
  body: z.object({
    product: objectId,
    quantity: z.number().int().nonnegative(),
    reorderPoint: z.number().int().nonnegative().optional(),
  }),
});

export const stockLevelSchema = z.object({
  ...empty,
  params: z.object({ id: objectId, productId: objectId }),
});

export const adjustStockSchema = z.object({
  ...empty,
  params: z.object({ id: objectId, productId: objectId }),
  body: z
    .object({
      quantity: z.number().int().nonnegative().optional(),
      adjustment: z.number().int().optional(),
      reorderPoint: z.number().int().nonnegative().optional(),
    })
    .refine(
      (v) => (v.quantity === undefined) !== (v.adjustment === undefined),
      'Provide exactly one of quantity or adjustment',
    ),
});

export const transferStockSchema = z.object({
  ...empty,
  body: z
    .object({
      fromWarehouse: objectId,
      toWarehouse: objectId,
      product: objectId,
      quantity: z.number().int().positive(),
    })
    .refine((v) => v.fromWarehouse !== v.toWarehouse, 'Source and destination must differ'),
});
