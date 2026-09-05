import pino from 'pino';
import { env } from './env.js';
export const logger = pino({
    level: env.NODE_ENV === 'development' ? 'debug' : 'info',
    redact: ['req.headers.authorization', 'password', 'accessToken', 'refreshToken'],
    ...(env.NODE_ENV === 'development' ? { transport: { target: 'pino-pretty' } } : {}),
});
