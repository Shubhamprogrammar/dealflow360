import { defaultQueue } from '../queues/index.js';
export const enqueueJob = async (name, data) => {
    await defaultQueue.add(name, data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 100,
    });
};
