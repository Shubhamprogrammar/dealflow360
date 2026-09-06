import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { listAuditLogs } from './audit-log.controller.js';
import { listAuditLogsSchema } from './audit-log.validation.js';

export const auditLogRoutes = Router();

// The audit trail is a compliance record covering every user's actions, so it stays with
// admins and finance rather than the teams whose work it records.
auditLogRoutes.use(authenticate, authorize('admin', 'finance'));

auditLogRoutes.get('/', validate(listAuditLogsSchema), asyncHandler(listAuditLogs));
