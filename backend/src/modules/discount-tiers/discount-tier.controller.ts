import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { discountTierService } from './discount-tier.service.js';
import type { ListDiscountTiersQuery } from './discount-tier.types.js';

export const createDiscountTier = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(
    res,
    201,
    'Discount tier created successfully',
    await discountTierService.create(req.body),
  );
};

export const listDiscountTiers = async (req: Request, res: Response): Promise<void> => {
  const { discountTiers, pagination } = await discountTierService.list(
    req.query as unknown as ListDiscountTiersQuery,
  );
  sendSuccess(res, 200, 'Discount tiers fetched successfully', discountTiers, pagination);
};

export const updateDiscountTier = async (req: Request, res: Response): Promise<void> => {
  const tier = await discountTierService.update(req.params.id as string, req.body);
  sendSuccess(res, 200, 'Discount tier updated successfully', tier);
};

export const deleteDiscountTier = async (req: Request, res: Response): Promise<void> => {
  await discountTierService.remove(req.params.id as string);
  res.status(204).send();
};

export const setCategoryLimits = async (req: Request, res: Response): Promise<void> => {
  const tier = await discountTierService.setCategoryLimits(
    req.params.id as string,
    req.body.categorySpecificLimits,
  );
  sendSuccess(res, 200, 'Category limits updated successfully', tier);
};

export const setApprovalChain = async (req: Request, res: Response): Promise<void> => {
  const tier = await discountTierService.setApprovalChain(
    req.params.id as string,
    req.body.approvalChain,
  );
  sendSuccess(res, 200, 'Approval chain updated successfully', tier);
};
