import * as mock from '@/lib/mock/server';
import type { DiscountConfig } from '@/types';

export const settingsService = {
  getDiscountConfig: () => mock.getDiscountConfig(),
  saveDiscountConfig: (cfg: DiscountConfig) => mock.saveDiscountConfig(cfg),
};
