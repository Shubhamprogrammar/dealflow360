import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { approvalReport, exportReport, productReport, salesReport } from './report.controller.js';
import {
  approvalReportSchema,
  exportReportSchema,
  productReportSchema,
  salesReportSchema,
} from './report.validation.js';

export const reportRoutes = Router();

// Reports aggregate across every rep's pipeline, so they stay with management and finance.
const canView = authorize('admin', 'sales_manager', 'finance');

reportRoutes.use(authenticate, canView);

reportRoutes.get('/sales', validate(salesReportSchema), asyncHandler(salesReport));
reportRoutes.get('/products', validate(productReportSchema), asyncHandler(productReport));
reportRoutes.get('/approvals', validate(approvalReportSchema), asyncHandler(approvalReport));
reportRoutes.get('/export', validate(exportReportSchema), asyncHandler(exportReport));
