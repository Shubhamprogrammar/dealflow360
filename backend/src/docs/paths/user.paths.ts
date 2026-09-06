import type { Paths } from '../openapi.types.js';

export const userPaths = {
  '/users': {
    post: {
      tags: ['Users'],
      summary: 'Create an internal user (admin only)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UserInput' } } },
      },
      responses: {
        201: { description: 'User created' },
        403: { description: 'Caller is not an admin' },
        409: { description: 'Email already exists' },
      },
    },
  },
  '/users/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Fetch one user',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        200: {
          description: 'User',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
        },
        404: { description: 'Not found' },
      },
    },
  },
} satisfies Paths;
