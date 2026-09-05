import { z } from 'zod';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '../../types/domain.types.js';

const headers = z.record(z.unknown());
const empty = { body: z.object({}), params: z.object({}), query: z.object({}), headers };
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const listAuditLogsSchema = z.object({
  ...empty,
  query: z
    .object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      entityType: z.enum(AUDIT_ENTITY_TYPES).optional(),
      entityId: objectId.optional(),
      action: z.enum(AUDIT_ACTIONS).optional(),
      performedBy: objectId.optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .refine((v) => !v.from || !v.to || v.from <= v.to, 'from must not be after to'),
});
