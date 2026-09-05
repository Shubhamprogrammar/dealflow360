import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { createPriceList, getPriceListByTier, listPriceLists } from './pricelist.controller.js';
import {
  createPriceListSchema,
  listPriceListsSchema,
  priceListTierSchema,
} from './pricelist.validation.js';

export const pricelistRoutes = Router();

pricelistRoutes.use(authenticate);

pricelistRoutes.post(
  '/',
  authorize('admin', 'sales_manager'),
  validate(createPriceListSchema),
  asyncHandler(createPriceList),
);
pricelistRoutes.get('/', validate(listPriceListsSchema), asyncHandler(listPriceLists));
pricelistRoutes.get(
  '/tier/:tierName',
  validate(priceListTierSchema),
  asyncHandler(getPriceListByTier),
);
