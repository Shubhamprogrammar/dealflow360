import type { Paths } from '../openapi.types.js';

export const auditLogPaths = {
  '/audit-logs': {
    get: {
      tags: ['Audit Logs'],
      summary: 'List audit logs, paginated (admin, finance)',
      description:
        'Newest first. Entries are written by middleware on every successful create, update and delete of a quotation, approval, order, invoice, product or customer.',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
        {
          in: 'query',
          name: 'entityType',
          schema: {
            type: 'string',
            enum: ['quotation', 'approval', 'order', 'invoice', 'product', 'customer'],
          },
        },
        {
          in: 'query',
          name: 'entityId',
          description: '24-hex id of the affected record',
          schema: { type: 'string' },
        },
        {
          in: 'query',
          name: 'action',
          schema: {
            type: 'string',
            enum: ['created', 'updated', 'deleted', 'approved', 'rejected', 'sent'],
          },
        },
        {
          in: 'query',
          name: 'performedBy',
          description: '24-hex user id',
          schema: { type: 'string' },
        },
        {
          in: 'query',
          name: 'from',
          description: 'Inclusive lower bound on timestamp, ISO 8601.',
          schema: { type: 'string', format: 'date-time' },
        },
        {
          in: 'query',
          name: 'to',
          description: 'Inclusive upper bound on timestamp, ISO 8601.',
          schema: { type: 'string', format: 'date-time' },
        },
      ],
      responses: {
        200: {
          description: 'Paginated audit logs with the acting user populated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
        400: { description: 'from is after to, or a parameter failed validation' },
        403: { description: 'Caller is not an admin or finance user' },
      },
    },
  },
} satisfies Paths;
