import { z } from 'zod';
import { QUOTATION_STATUSES } from '../../types/domain.types.js';

const headers = z.record(z.unknown());
const empty = { body: z.object({}), params: z.object({}), query: z.object({}), headers };
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const period = {
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
};

const notInverted = (value: { from?: Date; to?: Date }): boolean =>
  !value.from || !value.to || value.from <= value.to;

export const salesReportSchema = z.object({
  ...empty,
  query: z
    .object({
      ...period,
      rep: objectId.optional(),
      status: z.enum(QUOTATION_STATUSES).optional(),
    })
    .refine(notInverted, 'from must not be after to'),
});

export const productReportSchema = z.object({
  ...empty,
  query: z
    .object({
      ...period,
      limit: z.coerce.number().int().positive().max(100).default(20),
    })
    .refine(notInverted, 'from must not be after to'),
});

export const approvalReportSchema = z.object({
  ...empty,
  query: z.object(period).refine(notInverted, 'from must not be after to'),
});

export const exportReportSchema = z.object({
  ...empty,
  query: z
    .object({
      ...period,
      format: z.literal('csv'),
      rep: objectId.optional(),
      status: z.enum(QUOTATION_STATUSES).optional(),
    })
    .refine(notInverted, 'from must not be after to'),
});
