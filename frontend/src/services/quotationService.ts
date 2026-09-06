import { api } from '@/lib/api/apiClient';
import { mapQuotation, mapQuotationLine } from '@/lib/mapper/mappers';
import type { Quotation, QuoteLine } from '@/types';

export const quotationService = {
  list: async (): Promise<Quotation[]> => {
    const res = await api.get<any[]>('/quotations?page=1&limit=100');
    return res.data.map(mapQuotation);
  },
  get: async (id: string): Promise<Quotation> => {
    const res = await api.get<any>(`/quotations/${id}`);
    return mapQuotation(res.data);
  },
  create: async (customerId: string): Promise<Quotation> => {
    const res = await api.post<any>('/quotations', { customer: customerId });
    return mapQuotation(res.data);
  },
  addLine: async (id: string, productId: string, qty: number, discountPct: number): Promise<Quotation> => {
    const res = await api.post<any>(`/quotations/${id}/line-items`, {
      product: productId,
      quantity: qty,
      discountPercent: discountPct,
    });
    return mapQuotation(res.data);
  },
  updateLine: async (id: string, itemId: string, qty?: number, discountPct?: number): Promise<Quotation> => {
    const res = await api.put<any>(`/quotations/${id}/line-items/${itemId}`, {
      quantity: qty,
      discountPercent: discountPct,
    });
    return mapQuotation(res.data);
  },
  removeLine: async (id: string, itemId: string): Promise<Quotation> => {
    const res = await api.delete<any>(`/quotations/${id}/line-items/${itemId}`);
    return mapQuotation(res.data);
  },
  // Update multiple lines at once (used by UI before saving draft)
  updateLines: async (id: string, localLines: QuoteLine[]): Promise<Quotation> => {
    // 1. Fetch current quotation from backend
    const res = await api.get<any>(`/quotations/${id}`);
    const remoteQuotation = mapQuotation(res.data);
    const remoteLines = remoteQuotation.lines;

    // 2. Diff and execute sequentially to avoid race conditions
    for (const remoteLine of remoteLines) {
      const localMatch = localLines.find(l => l.id === remoteLine.id);
      if (!localMatch) {
        // Line was removed locally
        await api.delete<any>(`/quotations/${id}/line-items/${remoteLine.id}`);
      } else if (localMatch.qty !== remoteLine.qty || localMatch.discountPct !== remoteLine.discountPct) {
        // Line was updated locally
        await api.put<any>(`/quotations/${id}/line-items/${remoteLine.id}`, {
          quantity: localMatch.qty,
          discountPercent: localMatch.discountPct,
        });
      }
    }

    for (const localLine of localLines) {
      const isNew = !remoteLines.some(l => l.id === localLine.id);
      if (isNew) {
        // Line was added locally
        await api.post<any>(`/quotations/${id}/line-items`, {
          product: localLine.productId,
          quantity: localLine.qty,
          discountPercent: localLine.discountPct,
        });
      }
    }

    // 3. Fetch and return final state
    const finalRes = await api.get<any>(`/quotations/${id}`);
    return mapQuotation(finalRes.data);
  },
  submit: async (id: string): Promise<Quotation> => {
    const res = await api.post<any>(`/quotations/${id}/submit-approval`);
    return mapQuotation(res.data);
  },
  lineOverage: (line: QuoteLine) => {
    // For the UI to show optimistic overage before calculate-risk is called.
    const limits: Record<string, number> = { Hardware: 15, Services: 10, Subscription: 20 };
    const ceiling = limits[line.category] ?? 10;
    return { ceiling, over: Math.max(0, line.discountPct - ceiling) };
  },
};
