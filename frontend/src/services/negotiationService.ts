import { api } from '@/lib/api/apiClient';
import { mapQuotation } from '@/lib/mapper/mappers';
import type { Quotation } from '@/types';

export const negotiationService = {
  listPortalQuotations: async (): Promise<Quotation[]> => {
    const res = await api.get<any>('/portal/quotations');
    return res.data.map(mapQuotation);
  },
  getQuotation: async (id: string): Promise<Quotation> => {
    const res = await api.get<any>(`/portal/quotations/${id}`);
    return mapQuotation(res.data);
  },
  addComment: async (id: string, text: string): Promise<Quotation> => {
    const res = await api.post<any>(`/portal/quotations/${id}/request-changes`, {
      lineItems: [], // No specific line discounts requested, just a comment
      repResponse: text,
    });
    return mapQuotation(res.data);
  },
  submitCounterDiscount: async (id: string, pct: number, deliveryDate?: string): Promise<Quotation> => {
    // The backend signature for request-changes is:
    // { lineItems?: Array<{ itemId: string; discountPercent: number }>; repResponse: string; }
    // Since counterPct is usually a general discount, we'll map it to the first line or send a general comment
    const quotation = await api.get<any>(`/portal/quotations/${id}`);
    const firstLineId = quotation.data.lineItems?.[0]?._id;
    
    const body: any = { repResponse: `Requested overall discount of ${pct}%.` };
    if (firstLineId) {
      body.lineItems = [{ itemId: firstLineId, discountPercent: pct }];
    }
    
    const res = await api.post<any>(`/portal/quotations/${id}/request-changes`, body);
    return mapQuotation(res.data);
  },
  confirm: async (id: string): Promise<Quotation> => {
    const res = await api.post<any>(`/portal/quotations/${id}/confirm`);
    return mapQuotation(res.data);
  },
};
