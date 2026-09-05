import type { Paths } from '../openapi.types.js';

export const healthPaths = {
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Liveness probe',
      responses: { 200: { description: 'Process is running' } },
    },
  },
  '/ready': {
    get: {
      tags: ['Health'],
      summary: 'Readiness probe reporting MongoDB and Redis connectivity',
      responses: {
        200: { description: 'All dependencies connected' },
        503: { description: 'A dependency is down' },
      },
    },
  },
} satisfies Paths;
