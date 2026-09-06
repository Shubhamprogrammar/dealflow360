import type {
  BillingCycle,
  CancellationEffectiveDate,
  ProrationTiming,
  RefundType,
} from '../../types/domain.types.js';
import type { PaginationQuery } from '../../utils/pagination.js';

export type ProrationRulesInput = {
  onUpgrade: ProrationTiming;
  onDowngrade: ProrationTiming;
};

export type CancellationPolicyInput = {
  refundType: RefundType;
  effectiveDate: CancellationEffectiveDate;
};

export type CreateSubscriptionPlanInput = {
  name: string;
  billingCycle: BillingCycle;
  billingIntervalDays: number;
  prorationRules?: ProrationRulesInput;
  cancellationPolicy?: CancellationPolicyInput;
};

export type UpdateSubscriptionPlanInput = Partial<CreateSubscriptionPlanInput>;

export type ListSubscriptionPlansQuery = PaginationQuery & {
  billingCycle?: BillingCycle;
};
