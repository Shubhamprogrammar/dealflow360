import { createDefaultWorker } from './default.worker.js';
export const createWorkers = () => [createDefaultWorker()];
export const closeWorkers = async (workers) => {
    await Promise.all(workers.map((worker) => worker.close()));
};
