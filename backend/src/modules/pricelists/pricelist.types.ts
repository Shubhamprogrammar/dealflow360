import type { CustomerTier } from '../../types/domain.types.js';
import type { PaginationQuery } from '../../utils/pagination.js';

export type PriceEntryInput = { product: string; customPrice: number };

export type CreatePriceListInput = {
  name: string;
  customerTier: CustomerTier;
  currency?: string;
  productPrices: PriceEntryInput[];
  validFrom?: string;
  validTo?: string;
};

export type ListPriceListsQuery = PaginationQuery & { customerTier?: CustomerTier };
