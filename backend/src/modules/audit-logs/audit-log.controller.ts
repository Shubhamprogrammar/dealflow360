import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { auditLogService } from './audit-log.service.js';
import type { ListAuditLogsQuery } from './audit-log.types.js';

export const listAuditLogs = async (req: Request, res: Response): Promise<void> => {
  const { auditLogs, pagination } = await auditLogService.list(
    req.query as unknown as ListAuditLogsQuery,
  );
  sendSuccess(res, 200, 'Audit logs fetched successfully', auditLogs, pagination);
};
