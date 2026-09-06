import type { Paths } from '../openapi.types.js';

const dashboardQuery = [
  {
    in: 'query',
    name: 'asOf',
    description: 'Optional ISO 8601 timestamp used as the dashboard clock.',
    schema: { type: 'string', format: 'date-time' },
  },
  {
    in: 'query',
    name: 'limit',
    description: 'Maximum number of results to return.',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 100 },
  },
] as const;

const stalledDeal = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    quoteNumber: { type: 'string' },
    customer: { type: 'string' },
    createdBy: { type: 'string' },
    status: { type: 'string' },
    grandTotal: { type: 'number' },
    lastActivityAt: { type: 'string', format: 'date-time' },
    daysStalled: { type: 'integer' },
  },
} as const;

const discountAnomaly = {
  type: 'object',
  properties: {
    quotation: { type: 'string' },
    quoteNumber: { type: 'string' },
    customer: { type: 'string' },
    status: { type: 'string' },
    lineItem: { type: 'string' },
    product: { type: 'string' },
    discountPercent: { type: 'number' },
    allowedDiscount: { type: 'number' },
    overagePoints: { type: 'number' },
  },
} as const;

const deliverySlippage = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    orderNumber: { type: 'string' },
    customer: { type: 'string' },
    fulfillmentStatus: { type: 'string' },
    totalAmount: { type: 'number' },
    promisedDeliveryDate: { type: 'string', format: 'date-time' },
    daysOverdue: { type: 'integer' },
    lastUpdatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

export const dashboardPaths = {
  '/dashboard/stalled-deals': {
    get: {
      tags: ['Dashboard'],
      summary: 'List stalled deals',
      description:
        'Returns active quotations whose updatedAt is older than staleDays. Sales reps see their own quotations; managers and admins see all quotations.',
      security: [{ bearerAuth: [] }],
      parameters: [
        ...dashboardQuery,
        {
          in: 'query',
          name: 'staleDays',
          description: 'Number of inactive days before a quotation is stalled.',
          schema: { type: 'integer', minimum: 1, maximum: 3650, default: 7 },
        },
      ],
      responses: {
        200: {
          description: 'Stalled deals',
          content: { 'application/json': { schema: { type: 'array', items: stalledDeal } } },
        },
        400: { description: 'A query parameter failed validation' },
        401: { description: 'Authentication required' },
        403: { description: 'Insufficient role' },
      },
    },
  },
  '/dashboard/discount-anomalies': {
    get: {
      tags: ['Dashboard'],
      summary: 'List discount anomalies',
      description:
        'Returns quotation line items whose discount exceeds the applicable customer-tier or product ceiling, ordered by overage.',
      security: [{ bearerAuth: [] }],
      parameters: [
        ...dashboardQuery,
        {
          in: 'query',
          name: 'minDiscountPercent',
          description: 'Only return anomalies at or above this discount percentage.',
          schema: { type: 'number', minimum: 0, maximum: 100, default: 0 },
        },
      ],
      responses: {
        200: {
          description: 'Discount anomalies',
          content: {
            'application/json': { schema: { type: 'array', items: discountAnomaly } },
          },
        },
        400: { description: 'A query parameter failed validation' },
        401: { description: 'Authentication required' },
        403: { description: 'Insufficient role' },
      },
    },
  },
  '/dashboard/delivery-slippage': {
    get: {
      tags: ['Dashboard'],
      summary: 'List delivery slippage',
      description:
        'Returns orders whose promised delivery date has passed and that have not been delivered. Sales reps see orders linked to their quotations; managers and admins see all orders.',
      security: [{ bearerAuth: [] }],
      parameters: [
        ...dashboardQuery,
        {
          in: 'query',
          name: 'minOverdueDays',
          description: 'Minimum number of days past the promised delivery date.',
          schema: { type: 'integer', minimum: 0, maximum: 3650, default: 0 },
        },
      ],
      responses: {
        200: {
          description: 'Orders with delivery slippage',
          content: {
            'application/json': { schema: { type: 'array', items: deliverySlippage } },
          },
        },
        400: { description: 'A query parameter failed validation' },
        401: { description: 'Authentication required' },
        403: { description: 'Insufficient role' },
      },
    },
  },
} satisfies Paths;
