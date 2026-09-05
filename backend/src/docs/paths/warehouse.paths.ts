import type { Paths } from '../openapi.types.js';

const idParam = { in: 'path', name: 'id', required: true, schema: { type: 'string' } } as const;
const productIdParam = {
  in: 'path',
  name: 'productId',
  required: true,
  schema: { type: 'string' },
} as const;

export const warehousePaths = {
  '/warehouses': {
    post: {
      tags: ['Warehouses'],
      summary: 'Create a warehouse (admin, sales_manager)',
      description: 'Stock is managed through the stock endpoints, not at creation time.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/WarehouseInput' } },
        },
      },
      responses: {
        201: { description: 'Warehouse created' },
        400: {
          description: 'Validation failed',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: { description: 'Insufficient role' },
      },
    },
    get: {
      tags: ['Warehouses'],
      summary: 'List warehouses, paginated',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
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
          description: 'Paginated warehouses',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'array', items: { $ref: '#/components/schemas/Warehouse' } },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/warehouses/transfer': {
    post: {
      tags: ['Warehouses'],
      summary: 'Transfer stock between warehouses (admin, sales_manager)',
      description:
        'The source is debited by a single conditional update that cannot oversell, and a failed credit returns the stock, so no transaction is required.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['fromWarehouse', 'toWarehouse', 'product', 'quantity'],
              properties: {
                fromWarehouse: { type: 'string', description: '24-hex warehouse id' },
                toWarehouse: { type: 'string', description: '24-hex warehouse id' },
                product: { type: 'string', description: '24-hex product id' },
                quantity: { type: 'integer', minimum: 1, example: 5 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Stock transferred' },
        400: { description: 'Validation failed, or source and destination are the same' },
        403: { description: 'Insufficient role' },
        404: { description: 'Source or destination warehouse not found' },
        422: { description: 'Unknown product, or the source holds less than the requested amount' },
      },
    },
  },
  '/warehouses/{id}': {
    put: {
      tags: ['Warehouses'],
      summary: 'Partially update a warehouse (admin, sales_manager)',
      description: 'Send only changed fields; at least one is required.',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/WarehouseInput' },
                { type: 'object', properties: { isActive: { type: 'boolean' } } },
              ],
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated warehouse' },
        400: { description: 'Empty body' },
        403: { description: 'Insufficient role' },
        404: { description: 'Not found' },
      },
    },
  },
  '/warehouses/{id}/stock': {
    post: {
      tags: ['Warehouses'],
      summary: 'Add or replace a stock level (admin, sales_manager)',
      description:
        'Upsert on the product: quantity is absolute, not additive. Returns 201 when the product had no stock line yet, 200 when an existing line was replaced.',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/StockLevel' } } },
      },
      responses: {
        200: { description: 'Existing stock level replaced' },
        201: { description: 'Stock level added' },
        403: { description: 'Insufficient role' },
        404: { description: 'Warehouse not found' },
        422: { description: 'Product does not exist' },
      },
    },
  },
  '/warehouses/{id}/stock/{productId}': {
    get: {
      tags: ['Warehouses'],
      summary: 'Get the stock level for one product',
      security: [{ bearerAuth: [] }],
      parameters: [idParam, productIdParam],
      responses: {
        200: {
          description: 'Stock level',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/StockLevel' } } },
        },
        404: { description: 'Warehouse, or a stock line for that product, not found' },
      },
    },
    put: {
      tags: ['Warehouses'],
      summary: 'Adjust a stock level (admin, sales_manager)',
      description:
        'Supply exactly one of quantity (absolute) or adjustment (signed delta). reorderPoint may accompany either.',
      security: [{ bearerAuth: [] }],
      parameters: [idParam, productIdParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              example: { adjustment: -3, reorderPoint: 2 },
              properties: {
                quantity: { type: 'integer', minimum: 0, example: 10 },
                adjustment: { type: 'integer', example: -3 },
                reorderPoint: { type: 'integer', minimum: 0, example: 2 },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Adjusted stock level',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/StockLevel' } } },
        },
        400: { description: 'Neither or both of quantity and adjustment were supplied' },
        403: { description: 'Insufficient role' },
        404: { description: 'Warehouse, or a stock line for that product, not found' },
        422: { description: 'The adjustment would drive the quantity negative' },
      },
    },
  },
} satisfies Paths;
