import { z } from 'zod';
import { ROLES } from '../../types/common.types.js';
import { CUSTOMER_TIERS, PRODUCT_CATEGORIES } from '../../types/domain.types.js';

const headers = z.record(z.unknown());
const empty = { body: z.object({}), params: z.object({}), query: z.object({}), headers };
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// Quotation risk scoring looks tiers up by the customer's lowercase tier, so "Gold" and "gold"
// have to resolve to the same document.
const tierName = z.string().trim().toLowerCase().pipe(z.enum(CUSTOMER_TIERS));

const categoryLimit = z.object({
  category: z.enum(PRODUCT_CATEGORIES),
  maxDiscount: z.number().min(0).max(100),
});

const approvalRule = z.object({
  minDiscount: z.number().min(0).max(100),
  maxDiscount: z.number().min(0).max(100),
  requiredApprovers: z.array(z.enum(ROLES)).min(1),
});

const discountTierBody = {
  tierName,
  maxDiscountPercent: z.number().min(0).max(100),
  categorySpecificLimits: z.array(categoryLimit).optional(),
  approvalChain: z.array(approvalRule).optional(),
};

export const createDiscountTierSchema = z.object({
  ...empty,
  body: z.object(discountTierBody),
});

export const listDiscountTiersSchema = z.object({
  ...empty,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    tierName: tierName.optional(),
  }),
});

export const discountTierIdSchema = z.object({ ...empty, params: z.object({ id: objectId }) });

export const updateDiscountTierSchema = z.object({
  ...empty,
  params: z.object({ id: objectId }),
  body: z
    .object(discountTierBody)
    .partial()
    .refine((v) => Object.keys(v).length > 0, 'At least one field is required'),
});

export const setCategoryLimitsSchema = z.object({
  ...empty,
  params: z.object({ id: objectId }),
  body: z.object({ categorySpecificLimits: z.array(categoryLimit) }),
});

export const setApprovalChainSchema = z.object({
  ...empty,
  params: z.object({ id: objectId }),
  body: z.object({ approvalChain: z.array(approvalRule) }),
});
