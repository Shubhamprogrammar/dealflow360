import { Redis } from 'ioredis';
import { env } from './env.js';
export const redis = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: null });
export const connectRedis = async () => {
    await redis.ping();
};
export const disconnectRedis = async () => {
    await redis.quit();
};
export const isRedisReady = () => redis.status === 'ready';
