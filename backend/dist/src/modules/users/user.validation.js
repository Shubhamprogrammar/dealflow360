import { z } from 'zod';
const headers = z.record(z.unknown());
export const createUserSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(['admin', 'user', 'manager', 'staff']).optional(),
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
