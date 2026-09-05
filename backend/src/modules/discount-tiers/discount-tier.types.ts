import type { Role } from '../../types/common.types.js';
import type { CustomerTier, ProductCategory } from '../../types/domain.types.js';
import type { PaginationQuery } from '../../utils/pagination.js';

export type CategoryLimitInput = {
  category: ProductCategory;
  maxDiscount: number;
};

export type ApprovalChainRuleInput = {
  minDiscount: number;
  maxDiscount: number;
  requiredApprovers: Role[];
};

export type CreateDiscountTierInput = {
  tierName: CustomerTier;
  maxDiscountPercent: number;
  categorySpecificLimits?: CategoryLimitInput[];
  approvalChain?: ApprovalChainRuleInput[];
};

export type UpdateDiscountTierInput = Partial<CreateDiscountTierInput>;

export type ListDiscountTiersQuery = PaginationQuery & {
  tierName?: CustomerTier;
};
