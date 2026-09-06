import type { Request, Response } from 'express';
import type { ListOrdersQuery } from './order.types.js';
import { sendSuccess } from '../../utils/api-response.js';
import { orderService } from './order.service.js';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.createFromQuotation(req.body);
  sendSuccess(res, 201, 'Order created successfully', order);
};

export const listOrders = async (req: Request, res: Response): Promise<void> => {
  const { items, pagination } = await orderService.list(req.query as unknown as ListOrdersQuery);
  sendSuccess(res, 200, 'Orders fetched successfully', items, pagination);
};

export const calculateFulfillment = async (req: Request, res: Response): Promise<void> => {
  const preview = await orderService.calculateFulfillment(req.params.id as string);
  sendSuccess(res, 200, 'Fulfillment split calculated successfully', preview);
};

export const confirmFulfillment = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.confirmFulfillment(req.params.id as string);
  sendSuccess(res, 200, 'Fulfillment confirmed successfully', order);
};

export const manualSplit = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.manualSplit(req.params.id as string, req.body);
  sendSuccess(res, 200, 'Manual fulfillment split applied successfully', order);
};
