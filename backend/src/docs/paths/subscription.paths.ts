import type { Paths } from '../openapi.types.js';

const id = { in: 'path', name: 'id', required: true, schema: { type: 'string' } } as const;

const createSubscription = {
  type: 'object',
  required: ['order', 'plan', 'startDate'],
  properties: {
    order: { type: 'string', description: '24-hex order id' },
    plan: { type: 'string', description: '24-hex subscription plan id' },
    startDate: { type: 'string', format: 'date-time' },
    product: {
      type: 'string',
      description:
        '24-hex product id. Required only when the order has more than one subscription line item.',
    },
  },
} as const;

const prorateSubscription = {
  type: 'object',
  required: ['newQuantity', 'changeDate'],
  properties: {
    newQuantity: { type: 'integer', minimum: 1, example: 2 },
    changeDate: { type: 'string', format: 'date-time' },
  },
} as const;

export const subscriptionPaths = {
  '/subscriptions': {
    post: {
      tags: ['Subscriptions'],
      summary: 'Create a subscription from an order’s subscription line item',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: createSubscription } },
      },
      responses: {
        201: { description: 'Subscription created' },
        403: { description: 'Finance role required' },
        404: { description: 'Order or subscription plan not found' },
        409: { description: 'A subscription already exists for this order and product' },
        422: { description: 'Order has no (unambiguous) subscription line item' },
      },
    },
  },
  '/subscriptions/{id}/prorate': {
    post: {
      tags: ['Subscriptions'],
      summary: 'Prorate a subscription for a mid-cycle quantity change',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: prorateSubscription } },
      },
      responses: {
        200: { description: 'Subscription prorated' },
        403: { description: 'Finance role required' },
        404: { description: 'Subscription or subscription plan not found' },
        409: { description: 'Subscription is not active' },
        422: { description: 'newQuantity matches the current quantity' },
      },
    },
  },
  '/subscriptions/generate-invoices': {
    post: {
      tags: ['Subscriptions'],
      summary: 'Enqueue the recurring billing run for all due subscriptions',
      description:
        'Enqueues a BullMQ job rather than running the billing sweep inline; the actual invoice ' +
        'generation happens asynchronously in the background worker.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Invoice generation job enqueued' },
        403: { description: 'Finance role required' },
      },
    },
  },
} satisfies Paths;
