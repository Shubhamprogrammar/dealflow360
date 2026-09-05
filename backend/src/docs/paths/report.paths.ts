import type { Paths, Parameter } from '../openapi.types.js';

const period: Parameter[] = [
  {
    in: 'query',
    name: 'from',
    description: 'Inclusive lower bound on createdAt, ISO 8601.',
    schema: { type: 'string', format: 'date-time' },
  },
  {
    in: 'query',
    name: 'to',
    description: 'Inclusive upper bound on createdAt, ISO 8601.',
    schema: { type: 'string', format: 'date-time' },
  },
];

export const reportPaths = {
  '/reports/sales': {
    get: {
      tags: ['Reports'],
      summary: 'Sales summary (admin, sales_manager, finance)',
      description:
        'Quotation totals and a per-status breakdown for the period. Order totals are narrowed by the period only, since orders carry no rep or quotation status.',
      security: [{ bearerAuth: [] }],
      parameters: [
        ...period,
        { in: 'query', name: 'rep', description: '24-hex user id', schema: { type: 'string' } },
        {
          in: 'query',
          name: 'status',
          schema: {
            type: 'string',
            enum: [
              'draft',
              'pending_approval',
              'approved',
              'rejected',
              'sent_to_customer',
              'under_negotiation',
              'confirmed',
              'expired',
            ],
          },
        },
      ],
      responses: {
        200: {
          description: 'Sales summary',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  quotations: {
                    type: 'object',
                    properties: {
                      count: { type: 'integer' },
                      totalValue: { type: 'number' },
                      averageValue: { type: 'number' },
                    },
                  },
                  orders: {
                    type: 'object',
                    properties: {
                      count: { type: 'integer' },
                      totalValue: { type: 'number' },
                    },
                  },
                  byStatus: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        status: { type: 'string' },
                        count: { type: 'integer' },
                        totalValue: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: 'from is after to, or a parameter failed validation' },
        403: { description: 'Insufficient role' },
      },
    },
  },
  '/reports/products': {
    get: {
      tags: ['Reports'],
      summary: 'Product performance (admin, sales_manager, finance)',
      description:
        'Units and revenue per product, measured on orders rather than quotations, so unconverted quotes are excluded. Sorted by revenue descending.',
      security: [{ bearerAuth: [] }],
      parameters: [
        ...period,
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
      ],
      responses: {
        200: {
          description: 'Product performance rows',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    product: { type: 'string' },
                    name: { type: 'string' },
                    category: { type: 'string' },
                    unitsSold: { type: 'integer' },
                    revenue: { type: 'number' },
                    orderCount: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
        400: { description: 'from is after to, or a parameter failed validation' },
        403: { description: 'Insufficient role' },
      },
    },
  },
  '/reports/approvals': {
    get: {
      tags: ['Reports'],
      summary: 'Approval metrics (admin, sales_manager, finance)',
      security: [{ bearerAuth: [] }],
      parameters: period,
      responses: {
        200: {
          description: 'Approval counts by final status',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  pending: { type: 'integer' },
                  approved: { type: 'integer' },
                  rejected: { type: 'integer' },
                },
              },
            },
          },
        },
        400: { description: 'from is after to, or a parameter failed validation' },
        403: { description: 'Insufficient role' },
      },
    },
  },
  '/reports/export': {
    get: {
      tags: ['Reports'],
      summary: 'Export the sales report as CSV (admin, sales_manager, finance)',
      description:
        'Returns one row per quotation matching the same filters as /reports/sales, as a text/csv attachment rather than the usual JSON envelope.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'format',
          required: true,
          description: 'Only csv is supported.',
          schema: { type: 'string', enum: ['csv'] },
        },
        ...period,
        { in: 'query', name: 'rep', description: '24-hex user id', schema: { type: 'string' } },
        {
          in: 'query',
          name: 'status',
          schema: {
            type: 'string',
            enum: [
              'draft',
              'pending_approval',
              'approved',
              'rejected',
              'sent_to_customer',
              'under_negotiation',
              'confirmed',
              'expired',
            ],
          },
        },
      ],
      responses: {
        200: { description: 'CSV attachment named sales-report.csv' },
        400: { description: 'format is missing or not csv, or from is after to' },
        403: { description: 'Insufficient role' },
      },
    },
  },
} satisfies Paths;
