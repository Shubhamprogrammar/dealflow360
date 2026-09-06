import { z } from 'zod';
import { PRODUCT_CATEGORIES } from '../../types/domain.types.js';

const headers = z.record(z.unknown());
const empty = { body: z.object({}), params: z.object({}), query: z.object({}), headers };
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const variantBody = z.object({
  attributeName: z.string().min(1).max(100),
  attributeValue: z.string().min(1).max(100),
  priceAdjustment: z.number().optional(),
});

const productBody = {
  name: z.string().min(1).max(200),
  category: z.enum(PRODUCT_CATEGORIES),
  basePrice: z.number().nonnegative(),
  costPrice: z.number().nonnegative(),
  unit: z.string().min(1).max(50).optional(),
  taxRate: z.number().min(0).max(1).optional(),
  description: z.string().max(2000).optional(),
  maxDiscountByCategory: z.number().min(0).max(100).optional(),
  isSubscription: z.boolean().optional(),
};

export const createProductSchema = z.object({
  ...empty,
  body: z.object({ ...productBody, variants: z.array(variantBody).optional() }),
});

export const listProductsSchema = z.object({
  ...empty,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    category: z.enum(PRODUCT_CATEGORIES).optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    search: z.string().min(1).max(200).optional(),
  }),
});

export const productIdSchema = z.object({ ...empty, params: z.object({ id: objectId }) });

export const updateProductSchema = z.object({
  ...empty,
  params: z.object({ id: objectId }),
  body: z
    .object({ ...productBody, isActive: z.boolean() })
    .partial()
    .refine((v) => Object.keys(v).length > 0, 'At least one field is required'),
});

export const addVariantSchema = z.object({
  ...empty,
  params: z.object({ id: objectId }),
  body: variantBody,
});

export const updateVariantSchema = z.object({
  ...empty,
  params: z.object({ id: objectId, variantId: objectId }),
  body: variantBody
    .partial()
    .refine((v) => Object.keys(v).length > 0, 'At least one field is required'),
});
