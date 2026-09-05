import type { FilterQuery } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import { buildPagination, toSkip, type Pagination } from '../../utils/pagination.js';
import { ProductModel } from '../products/product.model.js';
import { WarehouseModel, type StockLevel, type WarehouseDocument } from './warehouse.model.js';
import type {
  AdjustStockInput,
  CreateWarehouseInput,
  ListWarehousesQuery,
  SetStockInput,
  TransferStockInput,
  UpdateWarehouseInput,
} from './warehouse.types.js';

const notFound = (): ApiError => new ApiError(404, 'Warehouse not found', 'WAREHOUSE_NOT_FOUND');

const stockNotFound = (): ApiError =>
  new ApiError(404, 'Stock level not found for this product', 'STOCK_LEVEL_NOT_FOUND');

const findOrThrow = async (id: string): Promise<WarehouseDocument & { save: () => unknown }> => {
  const warehouse = await WarehouseModel.findById(id).exec();
  if (!warehouse) throw notFound();
  return warehouse;
};

const assertProductExists = async (product: string): Promise<void> => {
  const exists = await ProductModel.exists({ _id: product }).exec();
  if (!exists) throw new ApiError(422, 'Product does not exist', 'UNKNOWN_PRODUCT');
};

const findStock = (warehouse: WarehouseDocument, productId: string): StockLevel | undefined =>
  warehouse.stockLevels.find((level) => level.product.toString() === productId);

export const warehouseService = {
  create: async (input: CreateWarehouseInput): Promise<WarehouseDocument> =>
    WarehouseModel.create(input),

  list: async (
    query: ListWarehousesQuery,
  ): Promise<{ warehouses: WarehouseDocument[]; pagination: Pagination }> => {
    const filter: FilterQuery<WarehouseDocument> = {};
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.search) filter.name = { $regex: query.search, $options: 'i' };
    const [warehouses, total] = await Promise.all([
      WarehouseModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(toSkip(query))
        .limit(query.limit)
        .exec(),
      WarehouseModel.countDocuments(filter).exec(),
    ]);
    return { warehouses, pagination: buildPagination(query, total) };
  },

  update: async (id: string, input: UpdateWarehouseInput): Promise<WarehouseDocument> => {
    const warehouse = await findOrThrow(id);
    Object.assign(warehouse, input);
    await warehouse.save();
    return warehouse;
  },

  // Upserts the stock line for a product; `created` lets the controller answer 201 vs 200.
  setStock: async (
    id: string,
    input: SetStockInput,
  ): Promise<{ warehouse: WarehouseDocument; created: boolean }> => {
    await assertProductExists(input.product);
    const warehouse = await findOrThrow(id);
    const existing = findStock(warehouse, input.product);
    if (existing) {
      existing.quantity = input.quantity;
      if (input.reorderPoint !== undefined) existing.reorderPoint = input.reorderPoint;
    } else {
      warehouse.stockLevels.push(input as never);
    }
    await warehouse.save();
    return { warehouse, created: !existing };
  },

  getStock: async (id: string, productId: string): Promise<StockLevel> => {
    const warehouse = await findOrThrow(id);
    const stock = findStock(warehouse, productId);
    if (!stock) throw stockNotFound();
    return stock;
  },

  adjustStock: async (
    id: string,
    productId: string,
    input: AdjustStockInput,
  ): Promise<StockLevel> => {
    const warehouse = await findOrThrow(id);
    const stock = findStock(warehouse, productId);
    if (!stock) throw stockNotFound();

    const next = input.quantity ?? stock.quantity + (input.adjustment ?? 0);
    if (next < 0)
      throw new ApiError(422, 'Adjustment would drive stock negative', 'INSUFFICIENT_STOCK');

    stock.quantity = next;
    if (input.reorderPoint !== undefined) stock.reorderPoint = input.reorderPoint;
    await warehouse.save();
    return stock;
  },

  /**
   * Moves stock between warehouses without a transaction, since MongoDB multi-document
   * transactions need a replica set. The source decrement is a single conditional update that
   * cannot oversell, and a failed destination credit is compensated by returning the stock.
   */
  transfer: async (input: TransferStockInput): Promise<void> => {
    const { fromWarehouse, toWarehouse, product, quantity } = input;
    await assertProductExists(product);

    const destination = await WarehouseModel.exists({ _id: toWarehouse }).exec();
    if (!destination) throw notFound();

    const debited = await WarehouseModel.updateOne(
      {
        _id: fromWarehouse,
        stockLevels: { $elemMatch: { product, quantity: { $gte: quantity } } },
      },
      { $inc: { 'stockLevels.$.quantity': -quantity } },
    ).exec();

    if (debited.matchedCount === 0) {
      const source = await WarehouseModel.exists({ _id: fromWarehouse }).exec();
      if (!source) throw notFound();
      throw new ApiError(422, 'Source warehouse has insufficient stock', 'INSUFFICIENT_STOCK');
    }

    try {
      const credited = await WarehouseModel.updateOne(
        { _id: toWarehouse, 'stockLevels.product': product },
        { $inc: { 'stockLevels.$.quantity': quantity } },
      ).exec();
      if (credited.matchedCount === 0) {
        await WarehouseModel.updateOne(
          { _id: toWarehouse },
          { $push: { stockLevels: { product, quantity } } },
        ).exec();
      }
    } catch (error) {
      await WarehouseModel.updateOne(
        { _id: fromWarehouse, 'stockLevels.product': product },
        { $inc: { 'stockLevels.$.quantity': quantity } },
      ).exec();
      throw error;
    }
  },
};
