import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  calculateFulfillment,
  confirmFulfillment,
  createOrder,
  manualSplit,
} from './order.controller.js';
import { createOrderSchema, manualSplitSchema, orderIdSchema } from './order.validation.js';

export const orderRoutes = Router();

// roleaccess.md: Fulfillment access is "Limited" for Sales Rep (their own
// permission is worded "Trigger fulfillment") and full ("Override fulfillment
// splits") for Finance/Ops. Manager and Admin have no fulfillment access at
// all per the summary table. Rep can preview/accept the suggested split but
// not hand-override it.
const canTrigger = authorize('sales_rep', 'finance');
const canOverride = authorize('finance');
const canCreateOrder = authorize('sales_rep', 'finance', 'admin');

orderRoutes.use(authenticate);

orderRoutes.post('/', canCreateOrder, validate(createOrderSchema), asyncHandler(createOrder));

orderRoutes.post(
  '/:id/calculate-fulfillment',
  canTrigger,
  validate(orderIdSchema),
  asyncHandler(calculateFulfillment),
);
orderRoutes.post(
  '/:id/confirm-fulfillment',
  canTrigger,
  validate(orderIdSchema),
  asyncHandler(confirmFulfillment),
);
orderRoutes.post(
  '/:id/manual-split',
  canOverride,
  validate(manualSplitSchema),
  asyncHandler(manualSplit),
);
