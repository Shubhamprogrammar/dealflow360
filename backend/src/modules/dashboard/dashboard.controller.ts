import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { dashboardService } from './dashboard.service.js';
import type {
  DeliverySlippageQuery,
  DiscountAnomaliesQuery,
  EscalateDealInput,
  NudgeRepInput,
  StalledDealsQuery,
} from './dashboard.types.js';

export const getStalledDeals = async (req: Request, res: Response): Promise<void> => {
  const deals = await dashboardService.stalledDeals(
    req.query as unknown as StalledDealsQuery,
    req.user!,
  );
  sendSuccess(res, 200, 'Stalled deals fetched successfully', deals);
};

export const getDiscountAnomalies = async (req: Request, res: Response): Promise<void> => {
  const anomalies = await dashboardService.discountAnomalies(
    req.query as unknown as DiscountAnomaliesQuery,
    req.user!,
  );
  sendSuccess(res, 200, 'Discount anomalies fetched successfully', anomalies);
};

export const getDeliverySlippage = async (req: Request, res: Response): Promise<void> => {
  const orders = await dashboardService.deliverySlippage(
    req.query as unknown as DeliverySlippageQuery,
    req.user!,
  );
  sendSuccess(res, 200, 'Delivery slippage fetched successfully', orders);
};

export const nudgeRep = async (req: Request, res: Response): Promise<void> => {
  await dashboardService.nudgeRep(req.body as NudgeRepInput);
  sendSuccess(res, 200, 'Rep nudged successfully', null);
};

export const escalateDeal = async (req: Request, res: Response): Promise<void> => {
  await dashboardService.escalate(req.body as EscalateDealInput);
  sendSuccess(res, 200, 'Deal escalated successfully', null);
};
