import type { Paths } from '../openapi.types.js';

const id = { in: 'path', name: 'id', required: true, schema: { type: 'string' } } as const;

const requestChanges = {
  type: 'object',
  properties: {
    comments: {
      type: 'array',
      items: {
        type: 'object',
        required: ['lineItemIndex', 'comment'],
        properties: {
          lineItemIndex: { type: 'integer', minimum: 0 },
          comment: { type: 'string', minLength: 1, maxLength: 1000 },
        },
      },
    },
    counterDiscountProposal: { type: 'number', minimum: 0, maximum: 100 },
  },
} as const;

export const portalPaths = {
  '/portal/quotations/{id}': {
    get: {
      tags: ['Portal'],
      summary: "Customer: view one of the customer's own quotations",
      description:
        'Requires a customer bearer token (from the magic-link flow), not a ' +
        'staff token. Only visible once the quotation has cleared internal approval. The ' +
        'response omits margin, risk score, and approval fields entirely.',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      responses: {
        200: { description: 'Quotation (customer-safe view)' },
        401: { description: 'Not authenticated as a customer' },
        404: { description: 'Not found, not owned by this customer, or not yet visible' },
      },
    },
  },
  '/portal/quotations/{id}/request-changes': {
    post: {
      tags: ['Portal'],
      summary: 'Customer: add comments or propose a counter-discount',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: requestChanges } },
      },
      responses: {
        200: { description: 'Change request submitted, quotation moved to under_negotiation' },
        400: { description: 'Validation failed' },
        404: { description: 'Not found, not owned by this customer, or not yet visible' },
        409: { description: 'Quotation is not open for negotiation' },
        422: { description: 'lineItemIndex out of range' },
      },
    },
  },
  '/portal/quotations/{id}/confirm': {
    post: {
      tags: ['Portal'],
      summary: 'Customer: confirm the quotation as-is',
      description: 'Marks the quotation confirmed. Does not create an order.',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      responses: {
        200: { description: 'Quotation confirmed' },
        404: { description: 'Not found, not owned by this customer, or not yet visible' },
        409: { description: 'Quotation cannot be confirmed in its current state' },
      },
    },
  },
} satisfies Paths;
