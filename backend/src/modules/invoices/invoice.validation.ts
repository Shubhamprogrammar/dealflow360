import { z } from 'zod';

const headers = z.record(z.unknown());
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createInvoiceSchema = z.object({
  body: z.object({ order: objectId }),
  params: z.object({}),
  query: z.object({}),
  headers,
});

export const markInvoicePaidSchema = z.object({
  body: z.object({ paidDate: z.string().datetime().optional() }),
  params: z.object({ id: objectId }),
  query: z.object({}),
  headers,
});
