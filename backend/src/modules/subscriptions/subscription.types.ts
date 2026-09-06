import type { SubscriptionStatus } from '../../types/domain.types.js';

export type CreateSubscriptionInput = {
  order: string;
  plan: string;
  startDate: string;
  product?: string;
};

export type ProrateSubscriptionInput = {
  newQuantity: number;
  changeDate: string;
};

export type BillingHistoryEntryView = {
  invoiceId: string;
  amount: number;
  billingDate: Date;
  status: string;
};

export type ProrationAdjustmentView = {
  reason: string;
  oldAmount: number;
  newAmount: number;
  creditAmount: number;
  effectiveDate: Date;
};

export type SubscriptionView = {
  id: string;
  customer: string;
  order?: string;
  product: string;
  plan: string;
  quantity: number;
  recurringAmount: number;
  status: SubscriptionStatus;
  startDate: Date;
  nextBillingDate?: Date;
  endDate?: Date;
  billingHistory: BillingHistoryEntryView[];
  prorationAdjustments: ProrationAdjustmentView[];
  createdAt: Date;
  updatedAt: Date;
};
