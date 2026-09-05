import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticateCustomer } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { confirmQuotation, getPortalQuotation, requestChanges } from './portal.controller.js';
import { portalQuotationIdSchema, requestChangesSchema } from './portal.validation.js';

export const portalRoutes = Router();

portalRoutes.use(authenticateCustomer);

portalRoutes.get(
  '/quotations/:id',
  validate(portalQuotationIdSchema),
  asyncHandler(getPortalQuotation),
);
portalRoutes.post(
  '/quotations/:id/request-changes',
  validate(requestChangesSchema),
  asyncHandler(requestChanges),
);
portalRoutes.post(
  '/quotations/:id/confirm',
  validate(portalQuotationIdSchema),
  asyncHandler(confirmQuotation),
);
