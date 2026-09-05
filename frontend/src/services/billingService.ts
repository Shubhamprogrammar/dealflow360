import * as mock from '@/lib/mock/server';

export const billingService = {
  listSubscriptions: () => mock.listSubscriptions(),
  getSubscription: (id: string) => mock.getSubscription(id),
  cancelSubscription: (id: string) => mock.cancelSubscription(id),
  listInvoices: () => mock.listInvoices(),
  getInvoice: (id: string) => mock.getInvoice(id),
  recordPayment: (id: string) => mock.recordPayment(id),
};
