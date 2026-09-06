import { z } from 'zod';
const headers = z.record(z.unknown());
const empty = { body: z.object({}), params: z.object({}), query: z.object({}), headers };

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

export const customerRegisterSchema = z.object({
  ...empty,
  body: z.object({
    companyName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
  }),
});
