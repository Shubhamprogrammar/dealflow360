import { api } from '@/lib/api/apiClient';
import { mapStalledDeal, mapDiscountAnomaly, mapDeliverySlippage } from '@/lib/mapper/mappers';
import type { HealthAlert } from '@/types';

export const dealHealthService = {
  listAlerts: async (): Promise<HealthAlert[]> => {
    try {
      const [stalledRes, anomaliesRes, slippageRes] = await Promise.all([
        api.get<any[]>('/dashboard/stalled-deals'),
        api.get<any[]>('/dashboard/discount-anomalies'),
        api.get<any[]>('/dashboard/delivery-slippage'),
      ]);

      const stalled = (stalledRes.data ?? []).map(mapStalledDeal);
      const anomalies = (anomaliesRes.data ?? []).map(mapDiscountAnomaly);
      const slippage = (slippageRes.data ?? []).map(mapDeliverySlippage);

      return [...stalled, ...anomalies, ...slippage];
    } catch (e) {
      console.error('Failed to load deal health alerts', e);
      return [];
    }
  },
};
