import { api } from '@/lib/api/apiClient';
import { mapDiscountConfig, reverseRole } from '@/lib/mapper/mappers';
import type { DiscountConfig } from '@/types';

export const settingsService = {
  getDiscountConfig: async (): Promise<DiscountConfig> => {
    const res = await api.get<any[]>('/discount-tiers');
    return mapDiscountConfig(res.data);
  },
  saveDiscountConfig: async (cfg: DiscountConfig): Promise<void> => {
    // Backend requires updating each tier individually
    const tiers = await api.get<any[]>('/discount-tiers');
    const existingTiers = tiers.data;

    for (const tc of cfg.tierCeilings) {
      const tierId = existingTiers.find((t: any) => t.tierName.toLowerCase() === tc.tier.toLowerCase())?._id;
      if (tierId) {
        await api.put(`/discount-tiers/${tierId}/category-limits`, {
          limits: cfg.categoryCeilings.map(cc => ({
            category: cc.category.toLowerCase(),
            maxDiscountPercent: cc.maxDiscountPct,
          })),
        });
        
        // Also update the approval chain for that tier based on standard rules
        await api.put(`/discount-tiers/${tierId}/approval-chain`, {
          chain: [
            { thresholdPercent: 10, role: reverseRole('SalesManager') },
            { thresholdPercent: 20, role: reverseRole('FinanceOps') },
          ]
        });
      }
    }
  },
};
