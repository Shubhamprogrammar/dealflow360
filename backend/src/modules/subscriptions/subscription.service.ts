import { Types } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import { OrderModel } from '../orders/order.model.js';
import { SubscriptionPlanModel } from '../subscription-plans/subscription-plan.model.js';
import { CustomerModel } from '../customers/customer.model.js';
import { InvoiceModel } from '../invoices/invoice.model.js';
import { SubscriptionModel } from './subscription.model.js';
import type {
  BillingHistoryEntry,
  ProrationAdjustment,
  SubscriptionDocument,
} from './subscription.model.js';
import type {
  CreateSubscriptionInput,
  ProrateSubscriptionInput,
  SubscriptionView,
} from './subscription.types.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * MS_PER_DAY);

const generateInvoiceNumber = (index: number): string =>
  `INV-${Date.now().toString(36).toUpperCase()}${index}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const view = (subscription: SubscriptionDocument & { _id: Types.ObjectId }): SubscriptionView => ({
  id: subscription._id.toString(),
  customer: subscription.customer.toString(),
  order: subscription.order?.toString(),
  product: subscription.product.toString(),
  plan: subscription.plan.toString(),
  quantity: subscription.quantity,
  recurringAmount: subscription.recurringAmount,
  status: subscription.status,
  startDate: subscription.startDate,
  nextBillingDate: subscription.nextBillingDate,
  endDate: subscription.endDate,
  billingHistory: subscription.billingHistory.map((entry) => ({
    invoiceId: entry.invoiceId.toString(),
    amount: entry.amount,
    billingDate: entry.billingDate,
    status: entry.status,
  })),
  prorationAdjustments: subscription.prorationAdjustments.map((adjustment) => ({
    reason: adjustment.reason,
    oldAmount: adjustment.oldAmount,
    newAmount: adjustment.newAmount,
    creditAmount: adjustment.creditAmount,
    effectiveDate: adjustment.effectiveDate,
  })),
  createdAt: subscription.createdAt,
  updatedAt: subscription.updatedAt,
});

const findSubscription = async (
  id: string,
): Promise<ReturnType<typeof SubscriptionModel.hydrate>> => {
  const subscription = await SubscriptionModel.findById(id).exec();
  if (!subscription) throw new ApiError(404, 'Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
  return subscription;
};

export const subscriptionService = {
  create: async (input: CreateSubscriptionInput): Promise<SubscriptionView> => {
    const order = await OrderModel.findById(input.order).exec();
    if (!order) throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');

    const subscriptionLineItems = order.lineItems.filter((item) => item.isSubscription);
    if (subscriptionLineItems.length === 0)
      throw new ApiError(422, 'Order has no subscription line item', 'NO_SUBSCRIPTION_LINE_ITEM');

    let lineItem = subscriptionLineItems[0];
    if (subscriptionLineItems.length > 1) {
      if (!input.product)
        throw new ApiError(
          422,
          'Order has multiple subscription line items -- specify product',
          'AMBIGUOUS_SUBSCRIPTION_LINE_ITEM',
        );
      const matched = subscriptionLineItems.find(
        (item) => item.product.toString() === input.product,
      );
      if (!matched)
        throw new ApiError(
          422,
          'Product is not a subscription line item on this order',
          'PRODUCT_NOT_SUBSCRIPTION_LINE_ITEM',
        );
      lineItem = matched;
    }
    // Non-null: subscriptionLineItems.length > 0 was already checked above.
    lineItem = lineItem!;

    const plan = await SubscriptionPlanModel.findById(input.plan).exec();
    if (!plan)
      throw new ApiError(404, 'Subscription plan not found', 'SUBSCRIPTION_PLAN_NOT_FOUND');

    const existing = await SubscriptionModel.findOne({
      order: order._id,
      product: lineItem.product,
      status: { $in: ['active', 'paused'] },
    }).exec();
    if (existing)
      throw new ApiError(
        409,
        'A subscription already exists for this order and product',
        'SUBSCRIPTION_ALREADY_EXISTS',
      );

    const startDate = new Date(input.startDate);
    const recurringAmount = lineItem.unitPrice * lineItem.quantity;

    const subscription = await SubscriptionModel.create({
      customer: order.customer,
      order: order._id,
      product: lineItem.product,
      plan: plan._id,
      quantity: lineItem.quantity,
      recurringAmount,
      status: 'active',
      startDate,
      nextBillingDate: addDays(startDate, plan.billingIntervalDays),
    });
    return view(subscription);
  },

  // Net financial impact is stored in a single `creditAmount` field (the
  // schema has no separate "charge" field): positive = net credit to the
  // customer, negative = net amount they now owe for the rest of the cycle.
  prorate: async (id: string, input: ProrateSubscriptionInput): Promise<SubscriptionView> => {
    const subscription = await findSubscription(id);
    if (subscription.status !== 'active')
      throw new ApiError(
        409,
        'Only active subscriptions can be prorated',
        'SUBSCRIPTION_NOT_ACTIVE',
      );
    if (input.newQuantity === subscription.quantity)
      throw new ApiError(
        422,
        'newQuantity must differ from the current quantity',
        'NO_QUANTITY_CHANGE',
      );

    const plan = await SubscriptionPlanModel.findById(subscription.plan).exec();
    if (!plan)
      throw new ApiError(404, 'Subscription plan not found', 'SUBSCRIPTION_PLAN_NOT_FOUND');

    const isUpgrade = input.newQuantity > subscription.quantity;
    const timing = isUpgrade ? plan.prorationRules.onUpgrade : plan.prorationRules.onDowngrade;

    const oldAmount = subscription.recurringAmount;
    const perUnitRate = oldAmount / subscription.quantity;
    const newAmount = perUnitRate * input.newQuantity;

    if (timing === 'immediate') {
      const daysInCycle = plan.billingIntervalDays;
      const cycleStart = subscription.nextBillingDate
        ? addDays(subscription.nextBillingDate, -daysInCycle)
        : subscription.startDate;
      const changeDate = new Date(input.changeDate);
      const rawDaysUsed = Math.floor((changeDate.getTime() - cycleStart.getTime()) / MS_PER_DAY);
      const daysUsed = Math.min(Math.max(rawDaysUsed, 0), daysInCycle);
      const daysRemaining = daysInCycle - daysUsed;

      const creditForUnused = (oldAmount / daysInCycle) * daysRemaining;
      const chargeForNew = (newAmount / daysInCycle) * daysRemaining;

      subscription.prorationAdjustments.push({
        reason: isUpgrade ? 'upgrade' : 'downgrade',
        oldAmount,
        newAmount,
        creditAmount: creditForUnused - chargeForNew,
        effectiveDate: changeDate,
      } as ProrationAdjustment);
    }

    subscription.quantity = input.newQuantity;
    subscription.recurringAmount = newAmount;
    await subscription.save();
    return view(subscription);
  },

  // Enqueued via BullMQ (see queues/workers/default.worker.ts) rather than
  // run inline in the request handler -- AGENT.md: expensive/retryable work
  // belongs in a job, not an HTTP handler.
  runBillingCycle: async (): Promise<{ invoicesCreated: number }> => {
    const now = new Date();
    const dueSubscriptions = await SubscriptionModel.find({
      status: 'active',
      nextBillingDate: { $lte: now },
    }).exec();

    let invoicesCreated = 0;
    for (const [index, subscription] of dueSubscriptions.entries()) {
      const lineTotal = subscription.recurringAmount;
      const invoice = await InvoiceModel.create({
        invoiceNumber: generateInvoiceNumber(index),
        order: subscription.order,
        customer: subscription.customer,
        invoiceType: 'recurring',
        lineItems: [
          {
            description: 'Subscription renewal',
            quantity: subscription.quantity,
            unitPrice: lineTotal / subscription.quantity,
            lineTotal,
          },
        ],
        subtotal: lineTotal,
        tax: 0,
        total: lineTotal,
        status: 'sent',
        dueDate: subscription.nextBillingDate,
      });

      subscription.billingHistory.push({
        invoiceId: invoice._id,
        amount: lineTotal,
        billingDate: now,
        status: 'sent',
      } as BillingHistoryEntry);

      const plan = await SubscriptionPlanModel.findById(subscription.plan)
        .select('billingIntervalDays')
        .exec();
      const intervalDays = plan?.billingIntervalDays ?? 30;
      subscription.nextBillingDate = addDays(subscription.nextBillingDate ?? now, intervalDays);

      await subscription.save();
      invoicesCreated += 1;
    }

    return { invoicesCreated };
  },

  list: async (filters: {
    status?: string;
    customer?: string;
    page?: number;
    limit?: number;
  }): Promise<{ subscriptions: SubscriptionView[]; total: number }> => {
    const { status, customer, page = 1, limit = 20 } = filters;
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (customer) query.customer = new Types.ObjectId(customer);

    const [subscriptions, total] = await Promise.all([
      SubscriptionModel.find(query)
        .populate('customer', 'companyName')
        .populate('plan', 'name billingCycle')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      SubscriptionModel.countDocuments(query).exec(),
    ]);

    const views = subscriptions.map((sub) => {
      const doc = sub as unknown as SubscriptionDocument & { 
        _id: Types.ObjectId; 
        customer: { _id: Types.ObjectId; companyName: string };
        plan: { _id: Types.ObjectId; name: string; billingCycle: string };
      };
      return view(doc);
    });

    return { subscriptions: views, total };
  },

  get: async (id: string): Promise<SubscriptionView> => {
    const subscription = await findSubscription(id);
    const populated = await SubscriptionModel.findById(id)
      .populate('customer', 'companyName')
      .populate('plan', 'name billingCycle')
      .lean()
      .exec();
    if (!populated) throw new ApiError(404, 'Subscription not found', 'SUBSCRIPTION_NOT_FOUND');
    return view(populated as unknown as SubscriptionDocument & { 
      _id: Types.ObjectId; 
      customer: { _id: Types.ObjectId; companyName: string };
      plan: { _id: Types.ObjectId; name: string; billingCycle: string };
    });
  },
};
