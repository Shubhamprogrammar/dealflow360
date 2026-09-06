import { api } from '@/lib/api/apiClient';
import { mapInquiry, mapQuotation } from '@/lib/mapper/mappers';
import type { Inquiry, Quotation } from '@/types';

type Raw = Record<string, unknown>;

export const inquiryService = {
  // Staff pipeline: the "New Inquiry" column pulls open inquiries.
  list: async (): Promise<Inquiry[]> => {
    const res = await api.get<Raw[]>('/inquiries?status=new&page=1&limit=100');
    return (res.data ?? []).map(mapInquiry);
  },
  get: async (id: string): Promise<Inquiry> => {
    const res = await api.get<Raw>(`/inquiries/${id}`);
    return mapInquiry(res.data);
  },
  dismiss: async (id: string): Promise<Inquiry> => {
    const res = await api.post<Raw>(`/inquiries/${id}/dismiss`);
    return mapInquiry(res.data);
  },
  // Rep clicks an inquiry card → draft quotation, pre-filled with its line
  // items. The rep then applies discounts / upsell / submits as usual.
  convert: async (id: string): Promise<Quotation> => {
    const res = await api.post<Raw>(`/quotations/from-inquiry/${id}`);
    return mapQuotation(res.data);
  },
};
