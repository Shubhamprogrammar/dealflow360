import { z } from 'zod';

const headers = z.record(z.unknown());
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const portalQuotationIdSchema = z.object({
  body: z.object({}),
  params: z.object({ id: objectId }),
  query: z.object({}),
  headers,
});

export const requestChangesSchema = z.object({
  body: z
    .object({
      comments: z
        .array(
          z.object({
            lineItemIndex: z.coerce.number().int().min(0),
            comment: z.string().trim().min(1).max(1000),
          }),
        )
        .optional(),
      counterDiscountProposal: z.coerce.number().min(0).max(100).optional(),
    })
    .refine(
      (body) =>
        (body.comments && body.comments.length > 0) || body.counterDiscountProposal !== undefined,
      { message: 'Provide at least one comment or a counterDiscountProposal' },
    ),
  params: z.object({ id: objectId }),
  query: z.object({}),
  headers,
});
