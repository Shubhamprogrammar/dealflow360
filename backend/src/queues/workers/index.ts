import type { Worker } from 'bullmq';
import { createDefaultWorker } from './default.worker.js';
export const createWorkers = (): Worker[] => [createDefaultWorker()];
export const closeWorkers = async (workers: Worker[]): Promise<void> => {
  await Promise.all(workers.map((worker) => worker.close()));
};
