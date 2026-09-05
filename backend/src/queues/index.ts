import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';
import { QUEUE_NAMES } from './queue.constants.js';
export const defaultQueue = new Queue(QUEUE_NAMES.DEFAULT, { connection: redis });
export const closeQueues = async (): Promise<void> => {
  await defaultQueue.close();
};
