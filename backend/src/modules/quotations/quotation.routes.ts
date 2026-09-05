import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  addLineItem,
  createQuotation,
  deleteQuotation,
  getQuotation,
  listQuotations,
  removeLineItem,
  updateLineItem,
  updateQuotation,
} from './quotation.controller.js';
import {
  addLineItemSchema,
  createQuotationSchema,
  lineItemIdSchema,
  listQuotationsSchema,
  quotationIdSchema,
  updateLineItemSchema,
  updateQuotationSchema,
} from './quotation.validation.js';

export const quotationRoutes = Router();

quotationRoutes.post(
  '/',
  authenticate,
  validate(createQuotationSchema),
  asyncHandler(createQuotation),
);
quotationRoutes.get(
  '/',
  authenticate,
  validate(listQuotationsSchema),
  asyncHandler(listQuotations),
);
quotationRoutes.get('/:id', authenticate, validate(quotationIdSchema), asyncHandler(getQuotation));
quotationRoutes.put(
  '/:id',
  authenticate,
  validate(updateQuotationSchema),
  asyncHandler(updateQuotation),
);
quotationRoutes.delete(
  '/:id',
  authenticate,
  validate(quotationIdSchema),
  asyncHandler(deleteQuotation),
);
quotationRoutes.post(
  '/:id/line-items',
  authenticate,
  validate(addLineItemSchema),
  asyncHandler(addLineItem),
);
quotationRoutes.put(
  '/:id/line-items/:itemId',
  authenticate,
  validate(updateLineItemSchema),
  asyncHandler(updateLineItem),
);
quotationRoutes.delete(
  '/:id/line-items/:itemId',
  authenticate,
  validate(lineItemIdSchema),
  asyncHandler(removeLineItem),
);
