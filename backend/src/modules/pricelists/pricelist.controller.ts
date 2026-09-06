import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { pricelistService } from './pricelist.service.js';
import type { ListPriceListsQuery } from './pricelist.types.js';

export const createPriceList = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, 201, 'Price list created successfully', await pricelistService.create(req.body));
};

export const listPriceLists = async (req: Request, res: Response): Promise<void> => {
  const { priceLists, pagination } = await pricelistService.list(
    req.query as unknown as ListPriceListsQuery,
  );
  sendSuccess(res, 200, 'Price lists fetched successfully', priceLists, pagination);
};

export const getPriceListByTier = async (req: Request, res: Response): Promise<void> => {
  const priceList = await pricelistService.getActiveByTier(req.params.tierName as string);
  sendSuccess(res, 200, 'Price list fetched successfully', priceList);
};
