import { api } from '@/lib/api/apiClient';
import { mapProduct, reverseCategory } from '@/lib/mapper/mappers';
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
      category: reverseCategory(p.category),
      basePrice: p.price,
      costPrice: p.price * 0.5, // Dummy cost price for MVP
      unit: p.unit,
      // Backend requires a fraction (0-1), not a percentage.
      taxRate: p.tax / 100,
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
      // Update. Note: the backend's update schema has no `variants` field --
      // variants can only be added/edited through the dedicated endpoints
      // below, once the product already exists.
      const res = await api.put<any>(`/products/${p.id}`, body);
      return mapProduct(res.data);
    }
  },
  addVariant: async (
    productId: string,
    variant: { attribute: string; value: string; extraPrice: number },
  ): Promise<Product> => {
    const res = await api.post<any>(`/products/${productId}/variants`, {
      attributeName: variant.attribute,
      attributeValue: variant.value,
      priceAdjustment: variant.extraPrice,
    });
    return mapProduct(res.data);
  },
};
