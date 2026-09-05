import * as mock from '@/lib/mock/server';
import type { Product } from '@/types';

export const catalogService = {
  list: () => mock.listProducts(),
  get: (id: string) => mock.getProduct(id),
  save: (p: Product) => mock.saveProduct(p),
};
