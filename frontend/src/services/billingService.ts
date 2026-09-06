import { api } from '@/lib/api/apiClient';
import { mapInvoice, mapSubscription } from '@/lib/mapper/mappers';
import type { Invoice, Subscription } from '@/types';

// Store invoices and subscriptions locally since there are no list endpoints on backend
const _mockInvoices: Invoice[] = [];
const _mockSubscriptions: Subscription[] = [];

export const billingService = {
  _addLocalInvoice: (inv: Invoice) => _mockInvoices.push(inv),
  _addLocalSubscription: (sub: Subscription) => _mockSubscriptions.push(sub),

  listSubscriptions: async (): Promise<Subscription[]> => {
    return _mockSubscriptions;
  },
  getSubscription: async (id: string): Promise<Subscription> => {
    return _mockSubscriptions.find(s => s.id === id) || {} as Subscription;
  },
  cancelSubscription: async (id: string): Promise<Subscription> => {
    // API missing for cancellation, mocking locally
    const sub = _mockSubscriptions.find(s => s.id === id);
    if (sub) sub.status = 'Cancelled';
    return sub!;
  },
  listInvoices: async (): Promise<Invoice[]> => {
    return _mockInvoices;
  },
  getInvoice: async (id: string): Promise<Invoice> => {
    return _mockInvoices.find(i => i.id === id) || {} as Invoice;
  },
  recordPayment: async (id: string): Promise<Invoice> => {
    const res = await api.put<any>(`/invoices/${id}/payment`, { amount: 999999, method: 'bank_transfer' });
    const inv = mapInvoice(res.data);
    const index = _mockInvoices.findIndex(i => i.id === id);
    if (index !== -1) _mockInvoices[index] = inv;
    return inv;
  },
};
