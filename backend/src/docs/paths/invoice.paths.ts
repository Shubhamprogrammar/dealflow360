import type { Paths } from '../openapi.types.js';

const id = { in: 'path', name: 'id', required: true, schema: { type: 'string' } } as const;

const createInvoice = {
  type: 'object',
  required: ['order'],
  properties: {
    order: { type: 'string', description: '24-hex order id' },
  },
} as const;

const markPaid = {
  type: 'object',
  properties: {
    paidDate: { type: 'string', format: 'date-time' },
  },
} as const;

export const invoicePaths = {
  '/invoices': {
    post: {
      tags: ['Invoices'],
      summary: 'Generate an invoice for an order’s one-time items',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: createInvoice } },
      },
      responses: {
        201: { description: 'One-time invoice created and sent' },
        400: { description: 'Validation failed' },
        403: { description: 'Finance or admin role required' },
        404: { description: 'Order or product not found' },
        409: { description: 'A one-time invoice already exists for the order' },
        422: { description: 'Order has no one-time items' },
      },
    },
  },
  '/invoices/{id}/payment': {
    put: {
      tags: ['Invoices'],
      summary: 'Mark an invoice as paid',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      requestBody: {
        required: false,
        content: { 'application/json': { schema: markPaid } },
      },
      responses: {
        200: { description: 'Invoice marked as paid' },
        400: { description: 'Validation failed' },
        403: { description: 'Finance or admin role required' },
        404: { description: 'Invoice not found' },
        409: { description: 'Invoice is already paid or not payable' },
      },
    },
  },
} satisfies Paths;
