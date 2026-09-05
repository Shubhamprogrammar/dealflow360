import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { dismissInquiry, getInquiry, listInquiries } from './inquiry.controller.js';
import { inquiryIdSchema, listInquiriesSchema } from './inquiry.validation.js';

export const inquiryRoutes = Router();

// Customer inquiries are triage for the sales team -- Rep and Sales Manager
// work them; Admin can see them too. Finance has no part in pre-quote intake.
const canWork = authorize('sales_rep', 'sales_manager', 'admin');

inquiryRoutes.use(authenticate);

inquiryRoutes.get('/', canWork, validate(listInquiriesSchema), asyncHandler(listInquiries));
inquiryRoutes.get('/:id', canWork, validate(inquiryIdSchema), asyncHandler(getInquiry));
inquiryRoutes.post('/:id/dismiss', canWork, validate(inquiryIdSchema), asyncHandler(dismissInquiry));
