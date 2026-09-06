import type { Paths } from '../openapi.types.js';

export const pricelistPaths = {
  '/pricelists': {
    post: {
      tags: ['Price Lists'],
      summary: 'Create a price list (admin, sales_manager)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/PriceList' } } },
      },
      responses: {
        201: { description: 'Price list created' },
        400: { description: 'Bad tier, currency not 3 characters, or non-ISO date' },
        403: { description: 'Insufficient role' },
        422: {
          description: 'Unknown product id, duplicate product, or validFrom not before validTo',
        },
      },
    },
    get: {
      tags: ['Price Lists'],
      summary: 'List price lists, paginated, with products populated',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
        {
          in: 'query',
          name: 'customerTier',
          schema: { type: 'string', enum: ['bronze', 'silver', 'gold'] },
        },
      ],
      responses: {
        200: {
          description: 'Paginated price lists',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'array', items: { $ref: '#/components/schemas/PriceList' } },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/pricelists/tier/{tierName}': {
    get: {
      tags: ['Price Lists'],
      summary: 'The price list currently in effect for a tier',
      description:
        'Filters on the validFrom/validTo window and treats undated lists as always valid. Expired lists are not returned.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'tierName',
          required: true,
          schema: { type: 'string', enum: ['bronze', 'silver', 'gold'] },
        },
      ],
      responses: {
        200: { description: 'Active price list' },
        400: { description: 'Unknown tier name' },
        404: { description: 'No active list for that tier' },
      },
    },
  },
} satisfies Paths;
