import type { AuditAction, AuditEntityType } from '../../types/domain.types.js';
import type { PaginationQuery } from '../../utils/pagination.js';

export type ListAuditLogsQuery = PaginationQuery & {
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  performedBy?: string;
  from?: Date;
  to?: Date;
};
