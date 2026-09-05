import { z } from 'zod';
import { INQUIRY_STATUSES } from '../../types/domain.types.js';

const headers = z.record(z.unknown());
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const inquiryItemInput = z.object({
  product: objectId,
  variantId: objectId.optional(),
  quantity: z.coerce.number().int().min(1),
  note: z.string().trim().min(1).max(1000).optional(),
});

export const createInquirySchema = z.object({
  body: z.object({
    items: z.array(inquiryItemInput).min(1, 'Select at least one product'),
    note: z.string().trim().min(1).max(2000).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
  headers,
});

export const listInquiriesSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    status: z.enum(INQUIRY_STATUSES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  headers,
});

export const inquiryIdSchema = z.object({
  body: z.object({}),
  params: z.object({ id: objectId }),
  query: z.object({}),
  headers,
});
