import type { FilterQuery } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import { buildPagination, toSkip, type Pagination } from '../../utils/pagination.js';
import { SubscriptionPlanModel, type SubscriptionPlanDocument } from './subscription-plan.model.js';
import type {
  CancellationPolicyInput,
  CreateSubscriptionPlanInput,
  ListSubscriptionPlansQuery,
  ProrationRulesInput,
  UpdateSubscriptionPlanInput,
} from './subscription-plan.types.js';

const notFound = (): ApiError =>
  new ApiError(404, 'Subscription plan not found', 'SUBSCRIPTION_PLAN_NOT_FOUND');

const findOrThrow = async (
  id: string,
): Promise<SubscriptionPlanDocument & { save: () => unknown }> => {
  const plan = await SubscriptionPlanModel.findById(id).exec();
  if (!plan) throw notFound();
  return plan;
};

export const subscriptionPlanService = {
  create: async (input: CreateSubscriptionPlanInput): Promise<SubscriptionPlanDocument> =>
    SubscriptionPlanModel.create(input),

  list: async (
    query: ListSubscriptionPlansQuery,
  ): Promise<{ subscriptionPlans: SubscriptionPlanDocument[]; pagination: Pagination }> => {
    const filter: FilterQuery<SubscriptionPlanDocument> = {};
    if (query.billingCycle) filter.billingCycle = query.billingCycle;
    const [subscriptionPlans, total] = await Promise.all([
      SubscriptionPlanModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(toSkip(query))
        .limit(query.limit)
        .exec(),
      SubscriptionPlanModel.countDocuments(filter).exec(),
    ]);
    return { subscriptionPlans, pagination: buildPagination(query, total) };
  },

  update: async (
    id: string,
    input: UpdateSubscriptionPlanInput,
  ): Promise<SubscriptionPlanDocument> => {
    const plan = await findOrThrow(id);
    Object.assign(plan, input);
    await plan.save();
    return plan;
  },

  setProration: async (
    id: string,
    rules: ProrationRulesInput,
  ): Promise<SubscriptionPlanDocument> => {
    const plan = await findOrThrow(id);
    plan.prorationRules = rules;
    await plan.save();
    return plan;
  },

  setCancellation: async (
    id: string,
    policy: CancellationPolicyInput,
  ): Promise<SubscriptionPlanDocument> => {
    const plan = await findOrThrow(id);
    plan.cancellationPolicy = policy;
    await plan.save();
    return plan;
  },
};
