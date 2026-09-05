import * as mock from '@/lib/mock/server';

export const negotiationService = {
  addComment: (id: string, text: string) => mock.addComment(id, text),
  submitCounterDiscount: (id: string, pct: number, deliveryDate?: string) =>
    mock.submitCounterDiscount(id, pct, deliveryDate),
  confirm: (id: string) => mock.confirmQuotation(id),
};
