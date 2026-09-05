import { DiscountTierModel } from '../discount-tiers/discount-tier.model.js';
import { CustomerModel } from '../customers/customer.model.js';
import { OrderModel } from '../orders/order.model.js';
import { ProductModel } from '../products/product.model.js';
import { QuotationModel } from '../quotations/quotation.model.js';
import type { ProductDocument } from '../products/product.model.js';
import type { QuotationDocument } from '../quotations/quotation.model.js';
import type { OrderDocument } from '../orders/order.model.js';
import type {
  DashboardRequester,
  DeliverySlippageQuery,
  DeliverySlippageView,
  DiscountAnomaliesQuery,
  DiscountAnomalyView,
  StalledDealsQuery,
  StalledDealView,
} from './dashboard.types.js';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const ACTIVE_DEAL_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'sent_to_customer',
  'under_negotiation',
] as const;

const scopeFor = (requester: DashboardRequester): Record<string, unknown> =>
  requester.role === 'sales_rep' ? { createdBy: requester.id } : {};

const daysBetween = (from: Date, to: Date): number =>
  Math.max(0, Math.floor((to.getTime() - from.getTime()) / DAY_IN_MILLISECONDS));

const discountLimit = (
  product: ProductDocument | undefined,
  customerTier: string | undefined,
  tiers: Map<string, ReturnType<typeof DiscountTierModel.hydrate>>,
): number => {
  const tier = customerTier ? tiers.get(customerTier) : undefined;
  const tierLimit =
    tier?.categorySpecificLimits.find((limit) => limit.category === product?.category)
      ?.maxDiscount ?? tier?.maxDiscountPercent;

  if (tierLimit !== undefined && product?.maxDiscountByCategory !== undefined)
    return Math.min(tierLimit, product.maxDiscountByCategory);
  return tierLimit ?? product?.maxDiscountByCategory ?? 0;
};

const stalledDealView = (
  quotation: QuotationDocument & { _id: { toString(): string } },
  asOf: Date,
): StalledDealView => ({
  id: quotation._id.toString(),
  quoteNumber: quotation.quoteNumber,
  customer: quotation.customer.toString(),
  createdBy: quotation.createdBy.toString(),
  status: quotation.status,
  grandTotal: quotation.grandTotal,
  lastActivityAt: quotation.updatedAt,
  daysStalled: daysBetween(quotation.updatedAt, asOf),
});

const deliverySlippageView = (
  order: OrderDocument & { _id: { toString(): string } },
  asOf: Date,
): DeliverySlippageView => ({
  id: order._id.toString(),
  orderNumber: order.orderNumber,
  customer: order.customer.toString(),
  fulfillmentStatus: order.fulfillmentStatus,
  totalAmount: order.totalAmount,
  promisedDeliveryDate: order.promisedDeliveryDate!,
  daysOverdue: daysBetween(order.promisedDeliveryDate!, asOf),
  lastUpdatedAt: order.updatedAt,
});

export const dashboardService = {
  stalledDeals: async (
    query: StalledDealsQuery,
    requester: DashboardRequester,
  ): Promise<StalledDealView[]> => {
    const asOf = query.asOf ?? new Date();
    const cutoff = new Date(asOf.getTime() - query.staleDays * DAY_IN_MILLISECONDS);
    const quotations = await QuotationModel.find({
      ...scopeFor(requester),
      status: { $in: ACTIVE_DEAL_STATUSES },
      updatedAt: { $lt: cutoff },
    })
      .sort({ updatedAt: 1 })
      .limit(query.limit)
      .exec();

    return quotations.map((quotation) => stalledDealView(quotation, asOf));
  },

  discountAnomalies: async (
    query: DiscountAnomaliesQuery,
    requester: DashboardRequester,
  ): Promise<DiscountAnomalyView[]> => {
    const quotations = await QuotationModel.find({
      ...scopeFor(requester),
      status: { $nin: ['rejected', 'expired'] },
    })
      .sort({ updatedAt: -1 })
      .exec();

    const productIds = [
      ...new Set(
        quotations.flatMap((quotation) => quotation.lineItems.map((item) => item.product)),
      ),
    ];
    const customerIds = [...new Set(quotations.map((quotation) => quotation.customer))];
    const [products, customers, tiers] = await Promise.all([
      ProductModel.find({ _id: { $in: productIds } })
        .select('category maxDiscountByCategory')
        .exec(),
      CustomerModel.find({ _id: { $in: customerIds } })
        .select('customerTier')
        .exec(),
      DiscountTierModel.find().exec(),
    ]);

    const productById = new Map(products.map((product) => [product._id.toString(), product]));
    const customerTierById = new Map(
      customers.map((customer) => [customer._id.toString(), customer.customerTier]),
    );
    const tierByName = new Map(tiers.map((tier) => [tier.tierName, tier]));
    const anomalies: DiscountAnomalyView[] = [];

    for (const quotation of quotations) {
      const customerTier = customerTierById.get(quotation.customer.toString());
      for (const item of quotation.lineItems) {
        const product = productById.get(item.product.toString());
        const allowedDiscount = discountLimit(product, customerTier, tierByName);
        if (
          item.discountPercent < query.minDiscountPercent ||
          item.discountPercent <= allowedDiscount
        )
          continue;

        anomalies.push({
          quotation: quotation._id.toString(),
          quoteNumber: quotation.quoteNumber,
          customer: quotation.customer.toString(),
          status: quotation.status,
          lineItem: item._id.toString(),
          product: item.product.toString(),
          discountPercent: item.discountPercent,
          allowedDiscount,
          overagePoints: item.discountPercent - allowedDiscount,
        });
      }
    }

    return anomalies.sort((a, b) => b.overagePoints - a.overagePoints).slice(0, query.limit);
  },

  deliverySlippage: async (
    query: DeliverySlippageQuery,
    requester: DashboardRequester,
  ): Promise<DeliverySlippageView[]> => {
    const asOf = query.asOf ?? new Date();
    const promisedBefore = new Date(asOf.getTime() - query.minOverdueDays * DAY_IN_MILLISECONDS);
    const orderScope: Record<string, unknown> = {};

    // Orders do not have createdBy. B9-created orders carry their quotation,
    // so resolve the rep's quotation ids to preserve the dashboard's own-deals scope.
    if (requester.role === 'sales_rep') {
      const quotations = await QuotationModel.find({ createdBy: requester.id })
        .select('_id')
        .exec();
      orderScope.quotation = { $in: quotations.map((quotation) => quotation._id) };
    }

    const orders = await OrderModel.find({
      ...orderScope,
      promisedDeliveryDate: { $lt: promisedBefore },
      fulfillmentStatus: { $ne: 'delivered' },
    })
      .sort({ promisedDeliveryDate: 1 })
      .limit(query.limit)
      .exec();

    return orders.map((order) => deliverySlippageView(order, asOf));
  },
};
