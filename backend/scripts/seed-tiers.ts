import { connectDatabase, disconnectDatabase } from '../src/config/index.js';
import { DiscountTierModel } from '../src/modules/discount-tiers/discount-tier.model.js';
import type { CustomerTier as Tier, ProductCategory } from '../src/types/domain.types.js';

const run = async (): Promise<void> => {
  await connectDatabase();

  const tiers: { tierName: Tier; maxDiscountPercent: number }[] = [
    { tierName: 'bronze', maxDiscountPercent: 10 },
    { tierName: 'silver', maxDiscountPercent: 15 },
    { tierName: 'gold', maxDiscountPercent: 25 },
  ];

  const categoryLimits = [
    { category: 'hardware' as ProductCategory, maxDiscount: 5 },
    { category: 'services' as ProductCategory, maxDiscount: 15 },
    { category: 'subscriptions' as ProductCategory, maxDiscount: 20 },
  ];

  const approvalChain = [
    { minDiscount: 0, maxDiscount: 10, requiredApprovers: [] },
    { minDiscount: 10, maxDiscount: 20, requiredApprovers: ['sales_manager'] },
    { minDiscount: 20, maxDiscount: 100, requiredApprovers: ['sales_manager', 'finance'] },
  ];

  for (const t of tiers) {
    const existing = await DiscountTierModel.findOne({ tierName: t.tierName }).exec();
    if (!existing) {
      await DiscountTierModel.create({
        ...t,
        categorySpecificLimits: categoryLimits,
        approvalChain: approvalChain,
      });
      console.log(`Created discount tier: ${t.tierName}`);
    } else {
      console.log(`Discount tier already exists: ${t.tierName}`);
    }
  }

  await disconnectDatabase();
};

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
