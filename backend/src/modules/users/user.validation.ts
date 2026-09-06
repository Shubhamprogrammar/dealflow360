import { z } from 'zod';
import { ROLES } from '../../types/common.types.js';
const headers = z.record(z.unknown());
export const createUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(ROLES),
    team: z.string().min(1).max(100).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
  headers,
});
export const userIdSchema = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
  headers,
});
