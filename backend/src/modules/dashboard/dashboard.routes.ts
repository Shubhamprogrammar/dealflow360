import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  getDeliverySlippage,
  getDiscountAnomalies,
  getStalledDeals,
} from './dashboard.controller.js';
import {
  deliverySlippageSchema,
  discountAnomaliesSchema,
  stalledDealsSchema,
} from './dashboard.validation.js';

export const dashboardRoutes = Router();

// Reps get their own deal health, while managers and admins get the team view.
// Finance has financial/fulfillment access but no deal-health permission.
dashboardRoutes.use(authenticate, authorize('sales_rep', 'sales_manager', 'admin'));

dashboardRoutes.get('/stalled-deals', validate(stalledDealsSchema), asyncHandler(getStalledDeals));
dashboardRoutes.get(
  '/discount-anomalies',
  validate(discountAnomaliesSchema),
  asyncHandler(getDiscountAnomalies),
);
dashboardRoutes.get(
  '/delivery-slippage',
  validate(deliverySlippageSchema),
  asyncHandler(getDeliverySlippage),
);
