import type { FilterQuery } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import { buildPagination, toSkip, type Pagination } from '../../utils/pagination.js';
import { ProductModel } from '../products/product.model.js';
import { PriceListModel, type PriceListDocument } from './pricelist.model.js';
import type { CreatePriceListInput, ListPriceListsQuery } from './pricelist.types.js';

export const pricelistService = {
  create: async (input: CreatePriceListInput): Promise<PriceListDocument> => {
    const validFrom = input.validFrom ? new Date(input.validFrom) : undefined;
    const validTo = input.validTo ? new Date(input.validTo) : undefined;
    if (validFrom && validTo && validFrom >= validTo)
      throw new ApiError(422, 'validFrom must be before validTo', 'INVALID_DATE_RANGE');

    const ids = input.productPrices.map((entry) => entry.product);
    if (new Set(ids).size !== ids.length)
      throw new ApiError(422, 'Duplicate products in price list', 'DUPLICATE_PRODUCT');

    const found = await ProductModel.countDocuments({ _id: { $in: ids } }).exec();
    if (found !== ids.length)
      throw new ApiError(422, 'One or more products do not exist', 'UNKNOWN_PRODUCT');

    return PriceListModel.create({ ...input, validFrom, validTo });
  },

  list: async (
    query: ListPriceListsQuery,
  ): Promise<{ priceLists: PriceListDocument[]; pagination: Pagination }> => {
    const filter: FilterQuery<PriceListDocument> = {};
    if (query.customerTier) filter.customerTier = query.customerTier;
    const [priceLists, total] = await Promise.all([
      PriceListModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(toSkip(query))
        .limit(query.limit)
        .populate('productPrices.product', 'name category basePrice')
        .exec(),
      PriceListModel.countDocuments(filter).exec(),
    ]);
    return { priceLists, pagination: buildPagination(query, total) };
  },

  // Returns the price list currently in effect for a tier; undated lists are always valid.
  getActiveByTier: async (customerTier: string): Promise<PriceListDocument> => {
    const now = new Date();
    const priceList = await PriceListModel.findOne({
      customerTier,
      $and: [
        { $or: [{ validFrom: { $lte: now } }, { validFrom: { $exists: false } }] },
        { $or: [{ validTo: { $gte: now } }, { validTo: { $exists: false } }] },
      ],
    })
      .sort({ validFrom: -1, createdAt: -1 })
      .populate('productPrices.product', 'name category basePrice')
      .exec();
    if (!priceList)
      throw new ApiError(404, 'No active price list for this tier', 'PRICE_LIST_NOT_FOUND');
    return priceList;
  },
};
