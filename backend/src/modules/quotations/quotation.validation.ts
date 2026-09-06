import { z } from 'zod';
import { QUOTATION_STATUSES } from '../../types/domain.types.js';

const headers = z.record(z.unknown());
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createQuotationSchema = z.object({
  body: z.object({
    customer: objectId,
    validUntil: z.string().datetime().optional(),
  }),
  params: z.object({}),
  query: z.object({}),
  headers,
});

export const listQuotationsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    status: z.enum(QUOTATION_STATUSES).optional(),
    customer: objectId.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  headers,
});

export const quotationIdSchema = z.object({
  body: z.object({}),
  params: z.object({ id: objectId }),
  query: z.object({}),
  headers,
});

export const fromInquirySchema = z.object({
  body: z.object({}),
  params: z.object({ inquiryId: objectId }),
  query: z.object({}),
  headers,
});

export const updateQuotationSchema = z.object({
  body: z.object({
    validUntil: z.string().datetime().optional(),
  }),
  params: z.object({ id: objectId }),
  query: z.object({}),
  headers,
});

export const addLineItemSchema = z.object({
  body: z.object({
    product: objectId,
    variantId: objectId.optional(),
    quantity: z.coerce.number().int().min(1),
    discountPercent: z.coerce.number().min(0).max(100).optional(),
  }),
  params: z.object({ id: objectId }),
  query: z.object({}),
  headers,
});

export const updateLineItemSchema = z.object({
  body: z.object({
    quantity: z.coerce.number().int().min(1).optional(),
    discountPercent: z.coerce.number().min(0).max(100).optional(),
  }),
  params: z.object({ id: objectId, itemId: objectId }),
  query: z.object({}),
  headers,
});

export const lineItemIdSchema = z.object({
  body: z.object({}),
  params: z.object({ id: objectId, itemId: objectId }),
  query: z.object({}),
  headers,
});

export const respondNegotiationSchema = z.object({
  body: z.object({
    lineItems: z
      .array(
        z.object({
          itemId: objectId,
          discountPercent: z.coerce.number().min(0).max(100),
        }),
      )
      .optional(),
    repResponse: z.string().trim().min(1).max(2000),
  }),
  params: z.object({ id: objectId }),
  query: z.object({}),
  headers,
});
