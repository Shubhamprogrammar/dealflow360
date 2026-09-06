import { api } from '@/lib/api/apiClient';
import { mapInvoice, mapSubscription } from '@/lib/mapper/mappers';
import type { Invoice, Subscription } from '@/types';

export const billingService = {
  listSubscriptions: async (): Promise<Subscription[]> => {
    const res = await api.get<any>('/subscriptions');
    const data = res.data?.subscriptions ?? res.data ?? [];
    return data.map(mapSubscription);
  },
  getSubscription: async (id: string): Promise<Subscription> => {
    const res = await api.get<any>(`/subscriptions/${id}`);
    return mapSubscription(res.data);
  },
  cancelSubscription: async (id: string): Promise<Subscription> => {
    const res = await api.put<any>(`/subscriptions/${id}/cancel`);
    return mapSubscription(res.data);
  },
  listInvoices: async (): Promise<Invoice[]> => {
    const res = await api.get<any>('/invoices');
    const data = res.data?.invoices ?? res.data ?? [];
    return data.map(mapInvoice);
  },
  getInvoice: async (id: string): Promise<Invoice> => {
    const res = await api.get<any>(`/invoices/${id}`);
    return mapInvoice(res.data);
  },
  recordPayment: async (id: string): Promise<Invoice> => {
    const res = await api.put<any>(`/invoices/${id}/payment`, { amount: 999999, method: 'bank_transfer' });
    return mapInvoice(res.data);
  },
};
