import type { Paths } from '../openapi.types.js';

const idParam = { in: 'path', name: 'id', required: true, schema: { type: 'string' } } as const;

export const discountTierPaths = {
  '/discount-tiers': {
    post: {
      tags: ['Discount Tiers'],
      summary: 'Create a discount tier (admin)',
      description:
        'tierName is stored lowercase so quotation risk scoring can look the tier up by the customer tier.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/DiscountTier' } } },
      },
      responses: {
        201: { description: 'Discount tier created' },
        400: {
          description: 'Validation failed',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: { description: 'Caller is not an admin' },
        409: { description: 'A tier already exists for this tier name' },
        422: {
          description: 'Duplicate category limit, or approval ranges that invert or overlap',
        },
      },
    },
    get: {
      tags: ['Discount Tiers'],
      summary: 'List discount tiers, paginated',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
        {
          in: 'query',
          name: 'tierName',
          schema: { type: 'string', enum: ['bronze', 'silver', 'gold'] },
        },
      ],
      responses: {
        200: {
          description: 'Paginated discount tiers',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'array', items: { $ref: '#/components/schemas/DiscountTier' } },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/discount-tiers/{id}': {
    put: {
      tags: ['Discount Tiers'],
      summary: 'Partially update a discount tier (admin)',
      description: 'Send only changed fields; at least one is required.',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/DiscountTier' } } },
      },
      responses: {
        200: { description: 'Updated discount tier' },
        400: { description: 'Empty body' },
        403: { description: 'Caller is not an admin' },
        404: { description: 'Not found' },
        409: { description: 'Another tier already uses this tier name' },
        422: { description: 'Duplicate category limit, or approval ranges that invert or overlap' },
      },
    },
    delete: {
      tags: ['Discount Tiers'],
      summary: 'Delete a discount tier (admin)',
      description:
        'Hard delete. Tiers are resolved by name at scoring time rather than referenced by id, so no records are left dangling.',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: {
        204: { description: 'Deleted' },
        403: { description: 'Caller is not an admin' },
        404: { description: 'Not found' },
      },
    },
  },
  '/discount-tiers/{id}/category-limits': {
    put: {
      tags: ['Discount Tiers'],
      summary: 'Replace the category-specific discount limits (admin)',
      description:
        'A category limit may deliberately exceed the tier maxDiscountPercent, so the two are not cross-checked.',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['categorySpecificLimits'],
              properties: {
                categorySpecificLimits: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CategoryLimit' },
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated discount tier' },
        403: { description: 'Caller is not an admin' },
        404: { description: 'Not found' },
        422: { description: 'The same category appears more than once' },
      },
    },
  },
  '/discount-tiers/{id}/approval-chain': {
    put: {
      tags: ['Discount Tiers'],
      summary: 'Replace the approval chain rules (admin)',
      description:
        'Ranges are inclusive and must not overlap, so the rule matched for a risk score does not depend on array order.',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['approvalChain'],
              properties: {
                approvalChain: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ApprovalChainRule' },
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Updated discount tier' },
        403: { description: 'Caller is not an admin' },
        404: { description: 'Not found' },
        422: { description: 'A rule inverts its range, or two rules overlap' },
      },
    },
  },
} satisfies Paths;
