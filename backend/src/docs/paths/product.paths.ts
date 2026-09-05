import type { Paths } from '../openapi.types.js';

const idParam = { in: 'path', name: 'id', required: true, schema: { type: 'string' } } as const;

export const productPaths = {
  '/products': {
    post: {
      tags: ['Products'],
      summary: 'Create a product (admin, sales_manager)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } },
      },
      responses: {
        201: { description: 'Product created' },
        400: { description: 'Validation failed' },
        403: { description: 'Insufficient role' },
        422: { description: 'costPrice exceeds basePrice' },
      },
    },
    get: {
      tags: ['Products'],
      summary: 'List products, paginated',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
        {
          in: 'query',
          name: 'category',
          schema: { type: 'string', enum: ['hardware', 'services', 'subscriptions'] },
        },
        { in: 'query', name: 'isActive', schema: { type: 'string', enum: ['true', 'false'] } },
        {
          in: 'query',
          name: 'search',
          description: 'Case-insensitive name match',
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: {
          description: 'Paginated products',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/products/{id}': {
    get: {
      tags: ['Products'],
      summary: 'Fetch one product, including deactivated ones',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: {
        200: { description: 'Product' },
        400: { description: 'Id is not 24 hex characters' },
        404: { description: 'Not found' },
      },
    },
    put: {
      tags: ['Products'],
      summary: 'Partially update a product (admin, sales_manager)',
      description:
        'Send only changed fields; at least one is required. The pricing check runs against the merged product.',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/Product' },
                { type: 'object', properties: { isActive: { type: 'boolean' } } },
              ],
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated product' },
        400: { description: 'Empty body' },
        422: { description: 'Result would leave costPrice above basePrice' },
      },
    },
    delete: {
      tags: ['Products'],
      summary: 'Deactivate a product (soft delete)',
      description:
        'Sets isActive to false. Quotations and orders reference products, so records are never destroyed.',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: {
        200: { description: 'Product with isActive false' },
        404: { description: 'Not found' },
      },
    },
  },
  '/products/{id}/variants': {
    post: {
      tags: ['Products'],
      summary: 'Add a variant (admin, sales_manager)',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Variant' } } },
      },
      responses: {
        201: { description: 'Product including the new variant' },
        409: { description: 'Same attribute name and value already exists' },
      },
    },
  },
  '/products/{id}/variants/{variantId}': {
    put: {
      tags: ['Products'],
      summary: 'Update one variant (admin, sales_manager)',
      security: [{ bearerAuth: [] }],
      parameters: [
        idParam,
        { in: 'path', name: 'variantId', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Variant' } } },
      },
      responses: {
        200: { description: 'Updated product' },
        404: { description: 'Product or variant not found' },
      },
    },
  },
} satisfies Paths;
