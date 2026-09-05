import type { FilterQuery } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import { buildPagination, toSkip, type Pagination } from '../../utils/pagination.js';
import { DiscountTierModel, type DiscountTierDocument } from './discount-tier.model.js';
import type {
  ApprovalChainRuleInput,
  CategoryLimitInput,
  CreateDiscountTierInput,
  ListDiscountTiersQuery,
  UpdateDiscountTierInput,
} from './discount-tier.types.js';

const notFound = (): ApiError =>
  new ApiError(404, 'Discount tier not found', 'DISCOUNT_TIER_NOT_FOUND');

const isDuplicateKey = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;

const assertCategoryLimits = (limits: CategoryLimitInput[]): void => {
  const categories = limits.map((limit) => limit.category);
  if (new Set(categories).size !== categories.length)
    throw new ApiError(422, 'Duplicate category in limits', 'DUPLICATE_CATEGORY_LIMIT');
};

// Approval lookup picks the first rule whose range contains the score, so overlapping ranges
// would make the resulting chain depend on array order.
const assertApprovalChain = (chain: ApprovalChainRuleInput[]): void => {
  for (const rule of chain) {
    if (rule.minDiscount > rule.maxDiscount)
      throw new ApiError(
        422,
        'Approval rule minDiscount must not exceed maxDiscount',
        'INVALID_APPROVAL_RANGE',
      );
  }
  const sorted = [...chain].sort((a, b) => a.minDiscount - b.minDiscount);
  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1] as ApprovalChainRuleInput;
    const current = sorted[i] as ApprovalChainRuleInput;
    if (current.minDiscount <= previous.maxDiscount)
      throw new ApiError(422, 'Approval chain ranges overlap', 'OVERLAPPING_APPROVAL_RANGE');
  }
};

const findOrThrow = async (id: string): Promise<DiscountTierDocument & { save: () => unknown }> => {
  const tier = await DiscountTierModel.findById(id).exec();
  if (!tier) throw notFound();
  return tier;
};

export const discountTierService = {
  create: async (input: CreateDiscountTierInput): Promise<DiscountTierDocument> => {
    assertCategoryLimits(input.categorySpecificLimits ?? []);
    assertApprovalChain(input.approvalChain ?? []);
    try {
      return await DiscountTierModel.create(input);
    } catch (error) {
      if (isDuplicateKey(error))
        throw new ApiError(409, 'Discount tier already exists for this tier name', 'TIER_EXISTS');
      throw error;
    }
  },

  list: async (
    query: ListDiscountTiersQuery,
  ): Promise<{ discountTiers: DiscountTierDocument[]; pagination: Pagination }> => {
    const filter: FilterQuery<DiscountTierDocument> = {};
    if (query.tierName) filter.tierName = query.tierName;
    const [discountTiers, total] = await Promise.all([
      DiscountTierModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(toSkip(query))
        .limit(query.limit)
        .exec(),
      DiscountTierModel.countDocuments(filter).exec(),
    ]);
    return { discountTiers, pagination: buildPagination(query, total) };
  },

  update: async (id: string, input: UpdateDiscountTierInput): Promise<DiscountTierDocument> => {
    const tier = await findOrThrow(id);
    if (input.categorySpecificLimits) assertCategoryLimits(input.categorySpecificLimits);
    if (input.approvalChain) assertApprovalChain(input.approvalChain);
    Object.assign(tier, input);
    try {
      await tier.save();
    } catch (error) {
      if (isDuplicateKey(error))
        throw new ApiError(409, 'Discount tier already exists for this tier name', 'TIER_EXISTS');
      throw error;
    }
    return tier;
  },

  // Tiers are looked up by name at scoring time rather than referenced by id, so a hard delete
  // leaves no dangling references.
  remove: async (id: string): Promise<void> => {
    const deleted = await DiscountTierModel.findByIdAndDelete(id).exec();
    if (!deleted) throw notFound();
  },

  setCategoryLimits: async (
    id: string,
    limits: CategoryLimitInput[],
  ): Promise<DiscountTierDocument> => {
    assertCategoryLimits(limits);
    const tier = await findOrThrow(id);
    tier.categorySpecificLimits = limits as never;
    await tier.save();
    return tier;
  },

  setApprovalChain: async (
    id: string,
    chain: ApprovalChainRuleInput[],
  ): Promise<DiscountTierDocument> => {
    assertApprovalChain(chain);
    const tier = await findOrThrow(id);
    tier.approvalChain = chain as never;
    await tier.save();
    return tier;
  },
};
