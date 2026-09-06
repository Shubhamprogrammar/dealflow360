import type { ProductCategory } from '../../types/domain.types.js';
import type { PaginationQuery } from '../../utils/pagination.js';

export type VariantInput = {
  attributeName: string;
  attributeValue: string;
  priceAdjustment?: number;
};

export type CreateProductInput = {
  name: string;
  category: ProductCategory;
  basePrice: number;
  costPrice: number;
  unit?: string;
  taxRate?: number;
  description?: string;
  maxDiscountByCategory?: number;
  isSubscription?: boolean;
  variants?: VariantInput[];
};

export type UpdateProductInput = Partial<Omit<CreateProductInput, 'variants'>> & {
  isActive?: boolean;
};

export type ListProductsQuery = PaginationQuery & {
  category?: ProductCategory;
  isActive?: boolean;
  search?: string;
};
