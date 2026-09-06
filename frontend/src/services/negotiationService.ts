import { api } from '@/lib/api/apiClient';
import { mapPortalQuotation } from '@/lib/mapper/mappers';
import type { Quotation } from '@/types';

export const negotiationService = {
  listPortalQuotations: async (): Promise<Quotation[]> => {
    const res = await api.get<any>('/portal/quotations');
    return res.data.map(mapPortalQuotation);
  },
  getQuotation: async (id: string): Promise<Quotation> => {
    const res = await api.get<any>(`/portal/quotations/${id}`);
    return mapPortalQuotation(res.data);
  },
  // The backend has no "general comment" concept -- every comment is tied to
  // a lineItemIndex, so a free-text comment attaches to the first line.
  addComment: async (id: string, text: string): Promise<Quotation> => {
    const res = await api.post<any>(`/portal/quotations/${id}/request-changes`, {
      comments: [{ lineItemIndex: 0, comment: text }],
    });
    return mapPortalQuotation(res.data);
  },
  // deliveryDate has no backing field on the backend (customerNegotiation has
  // no delivery-date concept) -- accepted here only so the caller's signature
  // doesn't need to change; it's silently dropped, same as before this fix.
  submitCounterDiscount: async (id: string, pct: number, _deliveryDate?: string): Promise<Quotation> => {
    const res = await api.post<any>(`/portal/quotations/${id}/request-changes`, {
      counterDiscountProposal: pct,
    });
    return mapPortalQuotation(res.data);
  },
  confirm: async (id: string): Promise<Quotation> => {
    const res = await api.post<any>(`/portal/quotations/${id}/confirm`);
    return mapPortalQuotation(res.data);
  },
};
