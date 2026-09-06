import { z } from 'zod';

const headers = z.record(z.unknown());
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const approveSchema = z.object({
  body: z.object({
    reason: z.string().trim().min(1).max(1000).optional(),
  }),
  params: z.object({ id: objectId }),
  query: z.object({}),
  headers,
});

export const rejectSchema = z.object({
  body: z.object({
    reason: z.string().trim().min(1).max(1000),
  }),
  params: z.object({ id: objectId }),
  query: z.object({}),
  headers,
});

export const requestRevisionSchema = z.object({
  body: z.object({
    reason: z.string().trim().min(1).max(1000),
  }),
  params: z.object({ id: objectId }),
  query: z.object({}),
  headers,
});

export const listQueueSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  headers,
});
