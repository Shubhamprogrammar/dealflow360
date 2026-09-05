import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  createSubscriptionPlan,
  listSubscriptionPlans,
  setCancellation,
  setProration,
  updateSubscriptionPlan,
} from './subscription-plan.controller.js';
import {
  createSubscriptionPlanSchema,
  listSubscriptionPlansSchema,
  setCancellationSchema,
  setProrationSchema,
  updateSubscriptionPlanSchema,
} from './subscription-plan.validation.js';

export const subscriptionPlanRoutes = Router();
const canManage = authorize('admin', 'sales_manager');

subscriptionPlanRoutes.use(authenticate);

subscriptionPlanRoutes.post(
  '/',
  canManage,
  validate(createSubscriptionPlanSchema),
  asyncHandler(createSubscriptionPlan),
);
subscriptionPlanRoutes.get(
  '/',
  validate(listSubscriptionPlansSchema),
  asyncHandler(listSubscriptionPlans),
);
subscriptionPlanRoutes.put(
  '/:id',
  canManage,
  validate(updateSubscriptionPlanSchema),
  asyncHandler(updateSubscriptionPlan),
);
subscriptionPlanRoutes.put(
  '/:id/proration',
  canManage,
  validate(setProrationSchema),
  asyncHandler(setProration),
);
subscriptionPlanRoutes.put(
  '/:id/cancellation',
  canManage,
  validate(setCancellationSchema),
  asyncHandler(setCancellation),
);
