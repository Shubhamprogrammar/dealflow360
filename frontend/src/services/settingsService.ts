import { api } from '@/lib/api/apiClient';
import { mapDiscountConfig, reverseCategory, reverseRole } from '@/lib/mapper/mappers';
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
        await api.put(`/discount-tiers/${tierId}`, {
          maxDiscountPercent: tc.maxDiscountPct,
        });

        await api.put(`/discount-tiers/${tierId}/category-limits`, {
          categorySpecificLimits: cfg.categoryCeilings.map(cc => ({
            category: reverseCategory(cc.category),
            maxDiscount: cc.maxDiscountPct,
          })),
        });

        // Also update the approval chain for that tier based on standard rules:
        // over 10% needs a sales manager, over 20% needs finance too (matches
        // the "Approval Routing by Blended Risk" table shown on this page).
        // The backend rejects bands whose boundaries touch (next.minDiscount
        // <= previous.maxDiscount counts as "overlap"), so the first band's
        // ceiling is nudged just under 20 rather than sharing that boundary.
        await api.put(`/discount-tiers/${tierId}/approval-chain`, {
          approvalChain: [
            { minDiscount: 10, maxDiscount: 19.99, requiredApprovers: [reverseRole('SalesManager')] },
            { minDiscount: 20, maxDiscount: 100, requiredApprovers: [reverseRole('SalesManager'), reverseRole('FinanceOps')] },
          ],
        });
      }
    }
  },
};
