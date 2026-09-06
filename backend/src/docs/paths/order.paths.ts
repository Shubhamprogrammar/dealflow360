import type { Paths } from '../openapi.types.js';

const id = { in: 'path', name: 'id', required: true, schema: { type: 'string' } } as const;
const manualSplit = {
  type: 'object',
  required: ['warehouseSplit'],
  properties: {
    warehouseSplit: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['warehouse', 'items'],
        properties: {
          warehouse: { type: 'string', description: '24-hex warehouse id' },
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['product', 'quantity'],
              properties: {
                product: { type: 'string', description: '24-hex product id' },
                quantity: { type: 'integer', minimum: 1 },
              },
            },
          },
        },
      },
    },
  },
} as const;

const createOrder = {
  type: 'object',
  required: ['quotation'],
  properties: {
    quotation: { type: 'string', description: '24-hex confirmed quotation id' },
    promisedDeliveryDate: { type: 'string', format: 'date-time' },
  },
} as const;

export const orderPaths = {
  '/orders': {
    post: {
      tags: ['Orders'],
      summary: 'Convert a customer-confirmed quotation to an order',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: createOrder } },
      },
      responses: {
        201: { description: 'Order created' },
        400: { description: 'Validation failed' },
        403: { description: 'Insufficient role' },
        404: { description: 'Quotation not found' },
        409: { description: 'Quotation is not confirmed or already has an order' },
        422: { description: 'Quotation is empty' },
      },
    },
  },
  '/orders/{id}/calculate-fulfillment': {
    post: {
      tags: ['Orders'],
      summary: 'Preview the automatic warehouse fulfillment split',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      responses: {
        200: { description: 'Fulfillment preview' },
        403: { description: 'Insufficient role' },
        404: { description: 'Order not found' },
      },
    },
  },
  '/orders/{id}/confirm-fulfillment': {
    post: {
      tags: ['Orders'],
      summary: 'Confirm the automatic warehouse fulfillment split',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      responses: {
        200: { description: 'Fulfillment confirmed' },
        403: { description: 'Insufficient role' },
        404: { description: 'Order not found' },
        409: { description: 'Fulfillment already confirmed' },
      },
    },
  },
  '/orders/{id}/manual-split': {
    post: {
      tags: ['Orders'],
      summary: 'Apply a manual warehouse fulfillment split',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      requestBody: { required: true, content: { 'application/json': { schema: manualSplit } } },
      responses: {
        200: { description: 'Manual split applied' },
        400: { description: 'Validation failed' },
        403: { description: 'Finance role required' },
        404: { description: 'Order or warehouse not found' },
        409: { description: 'Insufficient stock or fulfillment already confirmed' },
        422: { description: 'Invalid allocation' },
      },
    },
  },
} satisfies Paths;
