import { z } from 'zod';
import { CUSTOMER_TIERS } from '../../types/domain.types.js';

const headers = z.record(z.unknown());
const empty = { body: z.object({}), params: z.object({}), query: z.object({}), headers };
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const customerBody = {
  companyName: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  contactName: z.string().min(1).max(200).optional(),
  customerTier: z.enum(CUSTOMER_TIERS).optional(),
  creditScore: z.number().min(0).max(1000).optional(),
  paymentTerms: z.string().min(1).max(100).optional(),
  assignedRep: objectId.optional(),
};

export const createCustomerSchema = z.object({
  ...empty,
  body: z.object(customerBody),
});

export const listCustomersSchema = z.object({
  ...empty,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    customerTier: z.enum(CUSTOMER_TIERS).optional(),
    assignedRep: objectId.optional(),
  }),
});

export const customerIdSchema = z.object({ ...empty, params: z.object({ id: objectId }) });

export const updateCustomerSchema = z.object({
  ...empty,
  params: z.object({ id: objectId }),
  body: z
    .object(customerBody)
    .partial()
    .refine((v) => Object.keys(v).length > 0, 'At least one field is required'),
});

export const assignRepSchema = z.object({
  ...empty,
  params: z.object({ id: objectId }),
  body: z.object({ assignedRep: objectId }),
});
