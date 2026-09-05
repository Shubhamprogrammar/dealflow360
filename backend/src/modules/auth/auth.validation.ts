import { z } from 'zod';
import { ROLES } from '../../types/common.types.js';
const headers = z.record(z.unknown());
const empty = { body: z.object({}), params: z.object({}), query: z.object({}), headers };

export const registerSchema = z.object({
  ...empty,
  body: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(ROLES),
    team: z.string().min(1).max(100).optional(),
  }),
});

export const loginSchema = z.object({
  ...empty,
  body: z.object({ email: z.string().email(), password: z.string().min(8) }),
});

export const refreshSchema = z.object({
  ...empty,
  body: z.object({ refreshToken: z.string().min(1) }),
});

export const magicLinkSchema = z.object({
  ...empty,
  body: z.object({ email: z.string().email() }),
});

export const magicLinkTokenSchema = z.object({
  ...empty,
  params: z.object({ token: z.string().min(1) }),
});

export const customerLoginSchema = loginSchema;
