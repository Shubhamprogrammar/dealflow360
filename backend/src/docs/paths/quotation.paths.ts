import type { Paths } from '../openapi.types.js';

const id = { in: 'path', name: 'id', required: true, schema: { type: 'string' } } as const;
const itemId = { in: 'path', name: 'itemId', required: true, schema: { type: 'string' } } as const;
const error = { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } as const;

const quotationInput = {
  type: 'object',
  required: ['customer'],
  properties: {
    customer: { type: 'string', description: '24-hex customer id' },
    validUntil: { type: 'string', format: 'date-time' },
  },
} as const;

const lineItemInput = {
  type: 'object',
  required: ['product', 'quantity'],
  properties: {
    product: { type: 'string', description: '24-hex product id' },
    variantId: { type: 'string', description: '24-hex product variant id' },
    quantity: { type: 'integer', minimum: 1 },
    discountPercent: { type: 'number', minimum: 0, maximum: 100 },
  },
} as const;

export const quotationPaths = {
  '/quotations': {
    post: {
      tags: ['Quotations'],
      summary: 'Create a draft quotation',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: quotationInput } } },
      responses: {
        201: { description: 'Quotation created' },
        400: { description: 'Validation failed', content: error },
        403: { description: 'Insufficient role' },
        404: { description: 'Customer not found' },
      },
    },
    get: {
      tags: ['Quotations'],
      summary: 'List quotations visible to the current staff user',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'status', schema: { type: 'string' } },
        { in: 'query', name: 'customer', schema: { type: 'string' } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
      ],
      responses: {
        200: { description: 'Paginated quotations' },
        401: { description: 'Not authenticated' },
      },
    },
  },
  '/quotations/{id}': {
    get: {
      tags: ['Quotations'],
      summary: 'Fetch one quotation',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      responses: {
        200: { description: 'Quotation' },
        403: { description: 'Not permitted' },
        404: { description: 'Not found' },
      },
    },
    put: {
      tags: ['Quotations'],
      summary: 'Update a draft quotation',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { validUntil: { type: 'string', format: 'date-time' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Quotation updated' },
        400: { description: 'Validation failed', content: error },
        403: { description: 'Not permitted' },
        409: { description: 'Quotation is not a draft' },
      },
    },
    delete: {
      tags: ['Quotations'],
      summary: 'Delete a draft quotation',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      responses: {
        204: { description: 'Quotation deleted' },
        403: { description: 'Not permitted' },
        404: { description: 'Not found' },
        409: { description: 'Quotation is not a draft' },
      },
    },
  },
  '/quotations/{id}/line-items': {
    post: {
      tags: ['Quotations'],
      summary: 'Add a line item to a draft quotation',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      requestBody: { required: true, content: { 'application/json': { schema: lineItemInput } } },
      responses: {
        201: { description: 'Line item added' },
        400: { description: 'Validation failed', content: error },
        404: { description: 'Product or variant not found' },
        409: { description: 'Quotation is not a draft' },
      },
    },
  },
  '/quotations/{id}/line-items/{itemId}': {
    put: {
      tags: ['Quotations'],
      summary: 'Update a quotation line item',
      security: [{ bearerAuth: [] }],
      parameters: [id, itemId],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                quantity: { type: 'integer', minimum: 1 },
                discountPercent: { type: 'number', minimum: 0, maximum: 100 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Line item updated' },
        400: { description: 'Validation failed', content: error },
        404: { description: 'Line item not found' },
        409: { description: 'Quotation is not a draft' },
      },
    },
    delete: {
      tags: ['Quotations'],
      summary: 'Remove a quotation line item',
      security: [{ bearerAuth: [] }],
      parameters: [id, itemId],
      responses: {
        200: { description: 'Line item removed' },
        404: { description: 'Line item not found' },
        409: { description: 'Quotation is not a draft' },
      },
    },
  },
  '/quotations/{id}/calculate-risk': {
    post: {
      tags: ['Quotations'],
      summary: 'Calculate discount risk for a draft quotation',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      responses: {
        200: { description: 'Risk score calculated' },
        404: { description: 'Quotation or discount tier not found' },
        409: { description: 'Quotation is not a draft' },
      },
    },
  },
  '/quotations/{id}/submit-approval': {
    post: {
      tags: ['Quotations'],
      summary: 'Submit a quotation for approval',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      responses: {
        200: { description: 'Quotation submitted or auto-approved' },
        404: { description: 'Quotation or approval policy not found' },
        409: { description: 'Quotation is not a draft' },
      },
    },
  },
  '/quotations/{id}/upsell-suggestions': {
    get: {
      tags: ['Quotations'],
      summary: 'Get upsell suggestions for a quotation',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      responses: {
        200: { description: 'Upsell suggestions' },
        403: { description: 'Not permitted' },
        404: { description: 'Quotation not found' },
      },
    },
  },
} satisfies Paths;
