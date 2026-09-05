import { defaultQueue } from '../queues/index.js';
import { JOB_NAMES } from '../queues/queue.constants.js';
import type { MailMessage } from '../config/mailer.js';
export const enqueueJob = async (name: string, data: Record<string, unknown>): Promise<void> => {
  await defaultQueue.add(name, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 100,
  });
};

export const enqueueEmail = async (message: MailMessage): Promise<void> => {
  await enqueueJob(JOB_NAMES.SEND_EMAIL, { ...message });
};
