import type { Paths } from '../openapi.types.js';

const id = { in: 'path', name: 'id', required: true, schema: { type: 'string' } } as const;
const reason = {
  type: 'object',
  properties: { reason: { type: 'string', maxLength: 1000 } },
} as const;
const requiredReason = {
  type: 'object',
  required: ['reason'],
  properties: { reason: { type: 'string', minLength: 1, maxLength: 1000 } },
} as const;

export const approvalPaths = {
  '/approvals/queue': {
    get: {
      tags: ['Approvals'],
      summary: 'List approvals assigned to the current approver',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
      ],
      responses: {
        200: { description: 'Paginated approval queue' },
        401: { description: 'Not authenticated' },
      },
    },
  },
  '/approvals/{id}/approve': {
    post: {
      tags: ['Approvals'],
      summary: 'Approve the current approval step',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      requestBody: { required: true, content: { 'application/json': { schema: reason } } },
      responses: {
        200: { description: 'Approval advanced or completed' },
        403: { description: 'Not the current approver' },
        404: { description: 'Approval not found' },
        409: { description: 'Approval is already resolved' },
      },
    },
  },
  '/approvals/{id}/reject': {
    post: {
      tags: ['Approvals'],
      summary: 'Reject an approval request',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      requestBody: { required: true, content: { 'application/json': { schema: requiredReason } } },
      responses: {
        200: { description: 'Approval rejected' },
        403: { description: 'Not the current approver' },
        404: { description: 'Approval not found' },
        409: { description: 'Approval is already resolved' },
      },
    },
  },
  '/approvals/{id}/request-revision': {
    post: {
      tags: ['Approvals'],
      summary: 'Request quotation revision',
      security: [{ bearerAuth: [] }],
      parameters: [id],
      requestBody: { required: true, content: { 'application/json': { schema: requiredReason } } },
      responses: {
        200: { description: 'Revision requested' },
        403: { description: 'Not the current approver' },
        404: { description: 'Approval not found' },
        409: { description: 'Approval is already resolved' },
      },
    },
  },
} satisfies Paths;
