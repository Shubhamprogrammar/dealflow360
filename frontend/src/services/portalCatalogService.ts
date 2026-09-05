import { api } from '@/lib/api/apiClient';
import { mapCatalog, mapInquiry } from '@/lib/mapper/mappers';
import type { Catalog, Inquiry } from '@/types';

type Raw = Record<string, unknown>;

export type InquiryDraftItem = {
  product: string;
  variantId?: string;
  quantity: number;
  note?: string;
};

export const portalCatalogService = {
  listCatalog: async (): Promise<Catalog> => {
    const res = await api.get<Raw>('/portal/catalog');
    return mapCatalog(res.data);
  },
  submitInquiry: async (items: InquiryDraftItem[], note?: string): Promise<Inquiry> => {
    const res = await api.post<Raw>('/portal/inquiries', { items, note });
    return mapInquiry(res.data);
  },
  listMyInquiries: async (): Promise<Inquiry[]> => {
    const res = await api.get<Raw[]>('/portal/inquiries');
    return (res.data ?? []).map(mapInquiry);
  },
};
