import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { createInvoice, markInvoicePaid } from './invoice.controller.js';
import { createInvoiceSchema, markInvoicePaidSchema } from './invoice.validation.js';

export const invoiceRoutes = Router();

// Finance owns billing operations; Admin retains the system-wide access granted
// in roleaccess.md. Sales and customers never receive invoice endpoints.
invoiceRoutes.use(authenticate, authorize('finance', 'admin'));

invoiceRoutes.post('/', validate(createInvoiceSchema), asyncHandler(createInvoice));
invoiceRoutes.put('/:id/payment', validate(markInvoicePaidSchema), asyncHandler(markInvoicePaid));
