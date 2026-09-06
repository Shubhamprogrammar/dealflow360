import { api } from '@/lib/api/apiClient';
import { mapProduct, mapCategory } from '@/lib/mapper/mappers';
import type { Product } from '@/types';

export const catalogService = {
  list: async (): Promise<Product[]> => {
    const res = await api.get<any>('/products?page=1&limit=100');
    return (res.data || []).map(mapProduct);
  },
  get: async (id: string): Promise<Product> => {
    const res = await api.get<any>(`/products/${id}`);
    return mapProduct(res.data);
  },
  save: async (p: Product): Promise<Product> => {
    const body = {
      name: p.name,
      category: p.category.toLowerCase(),
      basePrice: p.price,
      costPrice: p.price * 0.5, // Dummy cost price for MVP
      unit: p.unit,
      taxRate: p.tax,
      isSubscription: p.isSubscription,
      isActive: p.status === 'Active',
      variants: p.variants.map((v) => ({
        attributeName: v.attribute,
        attributeValue: v.values[0] ?? '', // Backend takes a single value per variant row in types, but frontend allows multiple?
        priceAdjustment: v.extraPrice,
      })),
    };

    if (p.id.startsWith('p-') || !p.id) {
      // Create new
      const res = await api.post<any>('/products', body);
      return mapProduct(res.data);
    } else {
      // Update
      const res = await api.put<any>(`/products/${p.id}`, body);
      return mapProduct(res.data);
    }
  },
};
