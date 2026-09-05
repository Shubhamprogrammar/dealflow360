import { z } from 'zod';
const headers = z.record(z.unknown());
export const loginSchema = z.object({
    body: z.object({ email: z.string().email(), password: z.string().min(8) }),
    params: z.object({}),
    query: z.object({}),
    headers,
});
export const refreshSchema = z.object({
    body: z.object({ refreshToken: z.string().min(1) }),
    params: z.object({}),
    query: z.object({}),
    headers,
});
