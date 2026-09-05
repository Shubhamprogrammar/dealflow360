import type { PaginationQuery } from '../../utils/pagination.js';

export type CreateWarehouseInput = {
  name: string;
  location?: string;
  shippingCostWeight?: number;
};

export type UpdateWarehouseInput = Partial<CreateWarehouseInput> & {
  isActive?: boolean;
};

export type ListWarehousesQuery = PaginationQuery & {
  isActive?: boolean;
  search?: string;
};

export type SetStockInput = {
  product: string;
  quantity: number;
  reorderPoint?: number;
};

/** Exactly one of `quantity` (absolute) or `adjustment` (signed delta) is supplied. */
export type AdjustStockInput = {
  quantity?: number;
  adjustment?: number;
  reorderPoint?: number;
};

export type TransferStockInput = {
  fromWarehouse: string;
  toWarehouse: string;
  product: string;
  quantity: number;
};
