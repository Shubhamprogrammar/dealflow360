import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  addLineItem,
  calculateRisk,
  createQuotation,
  deleteQuotation,
  getQuotation,
  getUpsellSuggestions,
  listQuotations,
  removeLineItem,
  respondNegotiation,
  submitApproval,
  updateLineItem,
  updateQuotation,
} from './quotation.controller.js';
import {
  addLineItemSchema,
  createQuotationSchema,
  lineItemIdSchema,
  listQuotationsSchema,
  quotationIdSchema,
  respondNegotiationSchema,
  updateLineItemSchema,
  updateQuotationSchema,
} from './quotation.validation.js';

export const quotationRoutes = Router();

// roleaccess.md: only Sales Rep and Sales Manager can create/edit quotations.
// Finance/Admin are read-only here (scoped further in the service — see
// quotation.service.ts).
const canBuild = authorize('sales_rep', 'sales_manager');

quotationRoutes.use(authenticate);

quotationRoutes.post('/', canBuild, validate(createQuotationSchema), asyncHandler(createQuotation));
quotationRoutes.get('/', validate(listQuotationsSchema), asyncHandler(listQuotations));
quotationRoutes.get('/:id', validate(quotationIdSchema), asyncHandler(getQuotation));
quotationRoutes.put(
  '/:id',
  canBuild,
  validate(updateQuotationSchema),
  asyncHandler(updateQuotation),
);
quotationRoutes.delete(
  '/:id',
  canBuild,
  validate(quotationIdSchema),
  asyncHandler(deleteQuotation),
);
quotationRoutes.post(
  '/:id/line-items',
  canBuild,
  validate(addLineItemSchema),
  asyncHandler(addLineItem),
);
quotationRoutes.put(
  '/:id/line-items/:itemId',
  canBuild,
  validate(updateLineItemSchema),
  asyncHandler(updateLineItem),
);
quotationRoutes.delete(
  '/:id/line-items/:itemId',
  canBuild,
  validate(lineItemIdSchema),
  asyncHandler(removeLineItem),
);
quotationRoutes.post(
  '/:id/calculate-risk',
  canBuild,
  validate(quotationIdSchema),
  asyncHandler(calculateRisk),
);
quotationRoutes.post(
  '/:id/submit-approval',
  canBuild,
  validate(quotationIdSchema),
  asyncHandler(submitApproval),
);
quotationRoutes.get(
  '/:id/upsell-suggestions',
  validate(quotationIdSchema),
  asyncHandler(getUpsellSuggestions),
);
quotationRoutes.post(
  '/:id/respond-negotiation',
  canBuild,
  validate(respondNegotiationSchema),
  asyncHandler(respondNegotiation),
);
