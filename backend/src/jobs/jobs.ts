import { defaultQueue } from '../queues/index.js';
export const enqueueJob = async (name: string, data: Record<string, unknown>): Promise<void> => {
  await defaultQueue.add(name, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 100,
  });
};
