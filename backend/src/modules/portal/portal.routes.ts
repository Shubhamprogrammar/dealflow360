import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticateCustomer } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  confirmQuotation,
  getPortalCatalog,
  getPortalInquiries,
  getPortalQuotation,
  getPortalQuotations,
  requestChanges,
  submitPortalInquiry,
} from './portal.controller.js';
import {
  portalQuotationIdSchema,
  requestChangesSchema,
  submitInquirySchema,
} from './portal.validation.js';

export const portalRoutes = Router();

portalRoutes.use(authenticateCustomer);

portalRoutes.get('/catalog', asyncHandler(getPortalCatalog));
portalRoutes.post('/inquiries', validate(submitInquirySchema), asyncHandler(submitPortalInquiry));
portalRoutes.get('/inquiries', asyncHandler(getPortalInquiries));

portalRoutes.get('/quotations', asyncHandler(getPortalQuotations));

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
