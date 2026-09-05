import { Redis } from 'ioredis';
import { env } from './env.js';

export const redis = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: null });
export const connectRedis = async (): Promise<void> => {
  await redis.ping();
};
export const disconnectRedis = async (): Promise<void> => {
  await redis.quit();
};
export const isRedisReady = (): boolean => redis.status === 'ready';
