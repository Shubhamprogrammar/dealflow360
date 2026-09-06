import type { FilterQuery } from 'mongoose';
import { buildPagination, toSkip, type Pagination } from '../../utils/pagination.js';
import { AuditLogModel, type AuditLogDocument } from './audit-log.model.js';
import type { ListAuditLogsQuery } from './audit-log.types.js';

export const auditLogService = {
  list: async (
    query: ListAuditLogsQuery,
  ): Promise<{ auditLogs: AuditLogDocument[]; pagination: Pagination }> => {
    const filter: FilterQuery<AuditLogDocument> = {};
    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId) filter.entityId = query.entityId;
    if (query.action) filter.action = query.action;
    if (query.performedBy) filter.performedBy = query.performedBy;
    if (query.from || query.to) {
      filter.timestamp = {
        ...(query.from ? { $gte: query.from } : {}),
        ...(query.to ? { $lte: query.to } : {}),
      };
    }

    const [auditLogs, total] = await Promise.all([
      AuditLogModel.find(filter)
        .sort({ timestamp: -1 })
        .skip(toSkip(query))
        .limit(query.limit)
        .populate('performedBy', 'firstName lastName email role')
        .exec(),
      AuditLogModel.countDocuments(filter).exec(),
    ]);
    return { auditLogs, pagination: buildPagination(query, total) };
  },
};
