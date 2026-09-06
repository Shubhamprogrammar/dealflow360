import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { subscriptionPlanService } from './subscription-plan.service.js';
import type { ListSubscriptionPlansQuery } from './subscription-plan.types.js';

export const createSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(
    res,
    201,
    'Subscription plan created successfully',
    await subscriptionPlanService.create(req.body),
  );
};

export const listSubscriptionPlans = async (req: Request, res: Response): Promise<void> => {
  const { subscriptionPlans, pagination } = await subscriptionPlanService.list(
    req.query as unknown as ListSubscriptionPlansQuery,
  );
  sendSuccess(res, 200, 'Subscription plans fetched successfully', subscriptionPlans, pagination);
};

export const updateSubscriptionPlan = async (req: Request, res: Response): Promise<void> => {
  const plan = await subscriptionPlanService.update(req.params.id as string, req.body);
  sendSuccess(res, 200, 'Subscription plan updated successfully', plan);
};

export const setProration = async (req: Request, res: Response): Promise<void> => {
  const plan = await subscriptionPlanService.setProration(req.params.id as string, req.body);
  sendSuccess(res, 200, 'Proration rules updated successfully', plan);
};

export const setCancellation = async (req: Request, res: Response): Promise<void> => {
  const plan = await subscriptionPlanService.setCancellation(req.params.id as string, req.body);
  sendSuccess(res, 200, 'Cancellation policy updated successfully', plan);
};
