import { Worker } from 'bullmq';
import { logger, redis } from '../../config/index.js';
import { QUEUE_NAMES } from '../queue.constants.js';

export const createDefaultWorker = (): Worker => {
  const worker = new Worker(
    QUEUE_NAMES.DEFAULT,
    async (job) => {
      logger.info({ jobId: job.id, name: job.name }, 'Processing background job');
    },
    { connection: redis },
  );
  worker.on('failed', (job, error) =>
    logger.error({ jobId: job?.id, err: error }, 'Background job failed'),
  );
  return worker;
};
