import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { enqueueJob } from '../../jobs/jobs.js';
import { JOB_NAMES } from '../../queues/queue.constants.js';
import { subscriptionService } from './subscription.service.js';

export const createSubscription = async (req: Request, res: Response): Promise<void> => {
  const subscription = await subscriptionService.create(req.body);
  sendSuccess(res, 201, 'Subscription created successfully', subscription);
};

export const prorateSubscription = async (req: Request, res: Response): Promise<void> => {
  const subscription = await subscriptionService.prorate(req.params.id as string, req.body);
  sendSuccess(res, 200, 'Subscription prorated successfully', subscription);
};

export const generateInvoices = async (_req: Request, res: Response): Promise<void> => {
  await enqueueJob(JOB_NAMES.GENERATE_SUBSCRIPTION_INVOICES, {});
  sendSuccess(res, 200, 'Invoice generation job enqueued', null);
};
