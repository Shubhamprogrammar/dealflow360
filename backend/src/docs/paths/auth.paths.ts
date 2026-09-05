import type { Paths } from '../openapi.types.js';

export const authPaths = {
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
  '/auth/customer/request-link': {
    post: {
      tags: ['Auth'],
      summary: 'Email a customer a one-time portal sign-in link',
      description:
        'The only customer auth method. Always returns 202 with the same message, including for ' +
        'unknown emails, so the endpoint cannot be used to enumerate customers.',
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
  '/auth/customer/verify': {
    get: {
      tags: ['Auth'],
      summary: 'Redeem a magic-link token for a customer session',
      description:
        'Single use. The token is marked used on success, so replaying it returns 401.',
      parameters: [{ in: 'query', name: 'token', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'Customer session',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CustomerSession' } },
          },
        },
        401: { description: 'Unknown, expired, or already redeemed link' },
      },
    },
  },
} satisfies Paths;
