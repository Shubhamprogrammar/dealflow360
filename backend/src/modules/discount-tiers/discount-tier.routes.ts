import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  createDiscountTier,
  deleteDiscountTier,
  listDiscountTiers,
  setApprovalChain,
  setCategoryLimits,
  updateDiscountTier,
} from './discount-tier.controller.js';
import {
  createDiscountTierSchema,
  discountTierIdSchema,
  listDiscountTiersSchema,
  setApprovalChainSchema,
  setCategoryLimitsSchema,
  updateDiscountTierSchema,
} from './discount-tier.validation.js';

export const discountTierRoutes = Router();

// Tiers set the thresholds that decide who must approve a discount, so editing them is
// restricted to admins rather than the sales managers those thresholds govern.
const canManage = authorize('admin');

discountTierRoutes.use(authenticate);

discountTierRoutes.post(
  '/',
  canManage,
  validate(createDiscountTierSchema),
  asyncHandler(createDiscountTier),
);
discountTierRoutes.get('/', validate(listDiscountTiersSchema), asyncHandler(listDiscountTiers));
discountTierRoutes.put(
  '/:id',
  canManage,
  validate(updateDiscountTierSchema),
  asyncHandler(updateDiscountTier),
);
discountTierRoutes.delete(
  '/:id',
  canManage,
  validate(discountTierIdSchema),
  asyncHandler(deleteDiscountTier),
);
discountTierRoutes.put(
  '/:id/category-limits',
  canManage,
  validate(setCategoryLimitsSchema),
  asyncHandler(setCategoryLimits),
);
discountTierRoutes.put(
  '/:id/approval-chain',
  canManage,
  validate(setApprovalChainSchema),
  asyncHandler(setApprovalChain),
);
