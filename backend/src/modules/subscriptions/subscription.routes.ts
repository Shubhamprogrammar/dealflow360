import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createSubscription,
  generateInvoices,
  getSubscription,
  listSubscriptions,
  prorateSubscription,
} from './subscription.controller.js';
import {
  createSubscriptionSchema,
  getSubscriptionSchema,
  listSubscriptionsSchema,
  prorateSubscriptionSchema,
} from './subscription.validation.js';

export const subscriptionRoutes = Router();

// roleaccess.md: Billing/subscriptions are Finance/Ops-only -- ✅ only for
// Finance/Ops in the summary table, ❌ for every other role.
const canBill = authorize('finance');

subscriptionRoutes.use(authenticate, canBill);

subscriptionRoutes.get('/', validate(listSubscriptionsSchema), asyncHandler(listSubscriptions));
subscriptionRoutes.get('/:id', validate(getSubscriptionSchema), asyncHandler(getSubscription));
subscriptionRoutes.post('/', validate(createSubscriptionSchema), asyncHandler(createSubscription));
subscriptionRoutes.post(
  '/:id/prorate',
  validate(prorateSubscriptionSchema),
  asyncHandler(prorateSubscription),
);
subscriptionRoutes.post('/generate-invoices', asyncHandler(generateInvoices));
