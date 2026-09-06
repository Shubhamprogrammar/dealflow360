import { api } from '@/lib/api/apiClient';
import { mapCustomer } from '@/lib/mapper/mappers';
import type { Customer } from '@/types';

export const customerService = {
  list: async (): Promise<Customer[]> => {
    const res = await api.get<any>('/customers?page=1&limit=100');
    return (res.data || []).map(mapCustomer);
  },
  get: async (id: string): Promise<Customer> => {
    const res = await api.get<any>(`/customers/${id}`);
    return mapCustomer(res.data);
  },
};
