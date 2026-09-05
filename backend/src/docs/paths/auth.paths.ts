import type { Paths } from '../openapi.types.js';

export const authPaths = {
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Create an internal user (admin only)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserInput' } } },
      },
      responses: {
        201: { description: 'User created' },
        400: {
          description: 'Validation failed',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        401: { description: 'Not authenticated' },
        403: { description: 'Caller is not an admin' },
        409: { description: 'Email already exists' },
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Staff login',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email', example: 'admin@dealflow.com' },
                password: { type: 'string', minLength: 8, example: 'dealflow' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Tokens issued',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Tokens' } } },
        },
        401: { description: 'Invalid email or password' },
        403: { description: 'Account is deactivated' },
      },
    },
  },
  '/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Exchange a refresh token for a new access token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: { refreshToken: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'New access token' },
        401: { description: 'Invalid, expired, or user deactivated' },
      },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'The currently signed-in staff user',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Current user',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
        },
        401: { description: 'Missing, expired, or customer token' },
      },
    },
  },
  '/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Client-side logout (tokens are stateless and are not revoked)',
      responses: { 200: { description: 'Logged out' } },
    },
  },
  '/auth/customer/magic-link': {
    post: {
      tags: ['Auth'],
      summary: 'Email a customer a one-time portal link',
      description:
        'Always returns 202, including for unknown emails, so the endpoint cannot be used to enumerate customers.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', format: 'email', example: 'buyer@acme.com' },
              },
            },
          },
        },
      },
      responses: {
        202: { description: 'Accepted; link sent if the email matched a customer' },
      },
    },
  },
  '/auth/customer/verify/{token}': {
    get: {
      tags: ['Auth'],
      summary: 'Redeem a magic-link token for a customer session',
      description:
        'Single use. The stored token is cleared on success, so replaying it returns 401.',
      parameters: [{ in: 'path', name: 'token', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Customer session',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CustomerSession' } },
          },
        },
        401: { description: 'Unknown, expired, or already redeemed' },
      },
    },
  },
  '/auth/customer/login': {
    post: {
      tags: ['Auth'],
      summary: 'Customer portal password login',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email', example: 'buyer@acme.com' },
                password: { type: 'string', minLength: 8 },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Customer session',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CustomerSession' } },
          },
        },
        401: { description: 'Bad credentials or no portal password set' },
      },
    },
  },
} satisfies Paths;
