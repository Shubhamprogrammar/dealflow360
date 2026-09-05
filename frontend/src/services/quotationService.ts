import * as mock from '@/lib/mock/server';
import type { QuoteLine, Tier } from '@/types';

// Thin wrapper: swap the mock.* calls for apiClient calls once the real
// /quotations endpoints exist, without touching any screen code.
export const quotationService = {
  list: () => mock.listQuotations(),
  get: (id: string) => mock.getQuotation(id),
  create: (customerName: string, tier: Tier) => mock.createQuotation(customerName, tier),
  updateLines: (id: string, lines: QuoteLine[]) => mock.updateQuotationLines(id, lines),
  submit: (id: string) => mock.submitQuotation(id),
  lineOverage: mock.lineOverage,
};
