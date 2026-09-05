import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGO_URI: z.string().default('mongodb://localhost:27017/dealflow'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(32).default('development-access-secret-change-me-32'),
  JWT_REFRESH_SECRET: z.string().min(32).default('development-refresh-secret-change-me'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_CUSTOMER_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SWAGGER_ENABLED: z.coerce.boolean().default(true),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().positive().default(100),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('DealFlow360 <no-reply@dealflow360.local>'),
  PORTAL_BASE_URL: z.string().url().default('http://localhost:3000/portal'),
  MAGIC_LINK_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
});

export const env = envSchema.parse(process.env);
