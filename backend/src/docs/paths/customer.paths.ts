import type { Paths } from '../openapi.types.js';

const idParam = { in: 'path', name: 'id', required: true, schema: { type: 'string' } } as const;

export const customerPaths = {
  '/customers': {
    post: {
      tags: ['Customers'],
      summary: 'Create a customer (admin, sales_manager, sales_rep)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerInput' } } },
      },
      responses: {
        201: { description: 'Customer created' },
        400: {
          description: 'Validation failed',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: { description: 'Insufficient role' },
        409: { description: 'A customer already uses this contact email' },
        422: { description: 'assignedRep is unknown, deactivated, or not a sales_rep' },
      },
    },
    get: {
      tags: ['Customers'],
      summary: 'List customers, paginated',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
        {
          in: 'query',
          name: 'customerTier',
          schema: { type: 'string', enum: ['bronze', 'silver', 'gold'] },
        },
        {
          in: 'query',
          name: 'assignedRep',
          description: '24-hex user id',
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'Paginated customers with the assigned rep populated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'array', items: { $ref: '#/components/schemas/Customer' } },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/customers/{id}': {
    get: {
      tags: ['Customers'],
      summary: 'Fetch one customer',
      description: 'Portal credentials and magic-link fields are never returned.',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: {
        200: {
          description: 'Customer',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Customer' } } },
        },
        400: { description: 'Id is not 24 hex characters' },
        404: { description: 'Not found' },
      },
    },
    put: {
      tags: ['Customers'],
      summary: 'Partially update a customer (admin, sales_manager, sales_rep)',
      description: 'Send only changed fields; at least one is required.',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerInput' } } },
      },
      responses: {
        200: { description: 'Updated customer' },
        400: { description: 'Empty body' },
        403: { description: 'Insufficient role' },
        404: { description: 'Not found' },
        409: { description: 'Another customer already uses this contact email' },
        422: { description: 'assignedRep is unknown, deactivated, or not a sales_rep' },
      },
    },
  },
  '/customers/{id}/assign-rep': {
    put: {
      tags: ['Customers'],
      summary: 'Assign a sales rep to a customer (admin, sales_manager)',
      description: 'The target user must be an active sales_rep.',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['assignedRep'],
              properties: {
                assignedRep: { type: 'string', description: '24-hex user id of a sales_rep' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated customer' },
        400: { description: 'Validation failed' },
        403: { description: 'Insufficient role' },
        404: { description: 'Customer not found' },
        422: { description: 'assignedRep is unknown, deactivated, or not a sales_rep' },
      },
    },
  },
} satisfies Paths;
