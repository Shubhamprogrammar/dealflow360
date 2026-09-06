import { api } from '@/lib/api/apiClient';

export const reportService = {
  sales: async (): Promise<any> => {
    const res = await api.get<any>('/reports/sales');
    return res.data;
  },
  products: async (): Promise<any> => {
    const res = await api.get<any>('/reports/products');
    return res.data;
  },
  approvals: async (): Promise<any> => {
    const res = await api.get<any>('/reports/approvals');
    return res.data;
  },
  exportCsv: async (): Promise<Blob> => {
    const res = await api.getRaw('/reports/export?format=csv');
    return res.blob();
  },
};
