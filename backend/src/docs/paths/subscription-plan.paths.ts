import type { Paths } from '../openapi.types.js';

const idParam = { in: 'path', name: 'id', required: true, schema: { type: 'string' } } as const;

export const subscriptionPlanPaths = {
  '/subscription-plans': {
    post: {
      tags: ['Subscription Plans'],
      summary: 'Create a subscription plan (admin, sales_manager)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/SubscriptionPlan' } },
        },
      },
      responses: {
        201: { description: 'Subscription plan created' },
        400: {
          description: 'Validation failed',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: { description: 'Insufficient role' },
      },
    },
    get: {
      tags: ['Subscription Plans'],
      summary: 'List subscription plans, paginated',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
        {
          in: 'query',
          name: 'billingCycle',
          schema: { type: 'string', enum: ['monthly', 'quarterly', 'yearly'] },
        },
      ],
      responses: {
        200: {
          description: 'Paginated subscription plans',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/SubscriptionPlan' },
                  },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/subscription-plans/{id}': {
    put: {
      tags: ['Subscription Plans'],
      summary: 'Partially update a subscription plan (admin, sales_manager)',
      description: 'Send only changed fields; at least one is required.',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/SubscriptionPlan' } },
        },
      },
      responses: {
        200: { description: 'Updated subscription plan' },
        400: { description: 'Empty body' },
        403: { description: 'Insufficient role' },
        404: { description: 'Not found' },
      },
    },
  },
  '/subscription-plans/{id}/proration': {
    put: {
      tags: ['Subscription Plans'],
      summary: 'Replace the proration rules (admin, sales_manager)',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/ProrationRules' } },
        },
      },
      responses: {
        200: { description: 'Updated subscription plan' },
        400: { description: 'Validation failed' },
        403: { description: 'Insufficient role' },
        404: { description: 'Not found' },
      },
    },
  },
  '/subscription-plans/{id}/cancellation': {
    put: {
      tags: ['Subscription Plans'],
      summary: 'Replace the cancellation policy (admin, sales_manager)',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/CancellationPolicy' } },
        },
      },
      responses: {
        200: { description: 'Updated subscription plan' },
        400: { description: 'Validation failed' },
        403: { description: 'Insufficient role' },
        404: { description: 'Not found' },
      },
    },
  },
} satisfies Paths;
