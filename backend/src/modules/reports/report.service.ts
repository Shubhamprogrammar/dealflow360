import { Types, type FilterQuery } from 'mongoose';
import { ApprovalModel, type ApprovalDocument } from '../approvals/approval.model.js';
import { OrderModel, type OrderDocument } from '../orders/order.model.js';
import { QuotationModel, type QuotationDocument } from '../quotations/quotation.model.js';
import type {
  ApprovalReport,
  ProductPerformanceRow,
  ProductReportQuery,
  ReportPeriodQuery,
  SalesExportRow,
  SalesReport,
  SalesReportQuery,
} from './report.types.js';

type DateRange = { $gte?: Date; $lte?: Date };

const createdWithin = ({ from, to }: ReportPeriodQuery): DateRange | undefined => {
  if (!from && !to) return undefined;
  const range: DateRange = {};
  if (from) range.$gte = from;
  if (to) range.$lte = to;
  return range;
};

const quotationFilter = (query: SalesReportQuery): FilterQuery<QuotationDocument> => {
  const filter: FilterQuery<QuotationDocument> = {};
  const createdAt = createdWithin(query);
  if (createdAt) filter.createdAt = createdAt;
  // Aggregation pipelines skip Mongoose's schema casting, so the id has to be cast by hand.
  if (query.rep) filter.createdBy = new Types.ObjectId(query.rep);
  if (query.status) filter.status = query.status;
  return filter;
};

const period = ({ from, to }: ReportPeriodQuery): { from: Date | null; to: Date | null } => ({
  from: from ?? null,
  to: to ?? null,
});

type Totals = { count: number; totalValue: number };

const emptyTotals: Totals = { count: 0, totalValue: 0 };

export const reportService = {
  sales: async (query: SalesReportQuery): Promise<SalesReport> => {
    const filter = quotationFilter(query);

    // Orders carry no status/rep of their own, so only the period narrows them.
    const orderFilter: FilterQuery<OrderDocument> = {};
    const orderCreatedAt = createdWithin(query);
    if (orderCreatedAt) orderFilter.createdAt = orderCreatedAt;

    const [quotationTotals, byStatus, orderTotals] = await Promise.all([
      QuotationModel.aggregate<Totals>([
        { $match: filter },
        { $group: { _id: null, count: { $sum: 1 }, totalValue: { $sum: '$grandTotal' } } },
        { $project: { _id: 0, count: 1, totalValue: 1 } },
      ]).exec(),
      QuotationModel.aggregate<{ status: string; count: number; totalValue: number }>([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$grandTotal' } } },
        { $project: { _id: 0, status: '$_id', count: 1, totalValue: 1 } },
        { $sort: { status: 1 } },
      ]).exec(),
      OrderModel.aggregate<Totals>([
        { $match: orderFilter },
        { $group: { _id: null, count: { $sum: 1 }, totalValue: { $sum: '$totalAmount' } } },
        { $project: { _id: 0, count: 1, totalValue: 1 } },
      ]).exec(),
    ]);

    const quotations = quotationTotals[0] ?? emptyTotals;
    const orders = orderTotals[0] ?? emptyTotals;

    return {
      period: period(query),
      quotations: {
        ...quotations,
        averageValue: quotations.count === 0 ? 0 : quotations.totalValue / quotations.count,
      },
      orders,
      byStatus,
    };
  },

  // Performance is measured on orders rather than quotations, so unconverted quotes are excluded.
  products: async (query: ProductReportQuery): Promise<ProductPerformanceRow[]> => {
    const filter: FilterQuery<OrderDocument> = {};
    const createdAt = createdWithin(query);
    if (createdAt) filter.createdAt = createdAt;

    return OrderModel.aggregate<ProductPerformanceRow>([
      { $match: filter },
      { $unwind: '$lineItems' },
      {
        $group: {
          _id: '$lineItems.product',
          unitsSold: { $sum: '$lineItems.quantity' },
          revenue: { $sum: '$lineItems.lineTotal' },
          orderCount: { $addToSet: '$_id' },
        },
      },
      { $addFields: { orderCount: { $size: '$orderCount' } } },
      { $sort: { revenue: -1 } },
      { $limit: query.limit },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          product: '$_id',
          name: '$product.name',
          category: '$product.category',
          unitsSold: 1,
          revenue: 1,
          orderCount: 1,
        },
      },
    ]).exec();
  },

  approvals: async (query: ReportPeriodQuery): Promise<ApprovalReport> => {
    const filter: FilterQuery<ApprovalDocument> = {};
    const createdAt = createdWithin(query);
    if (createdAt) filter.createdAt = createdAt;

    const rows = await ApprovalModel.aggregate<{ status: string; count: number }>([
      { $match: filter },
      { $group: { _id: '$finalStatus', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]).exec();

    const countFor = (status: string): number =>
      rows.find((row) => row.status === status)?.count ?? 0;

    return {
      period: period(query),
      total: rows.reduce((sum, row) => sum + row.count, 0),
      pending: countFor('pending'),
      approved: countFor('approved'),
      rejected: countFor('rejected'),
    };
  },

  salesRows: async (query: SalesReportQuery): Promise<SalesExportRow[]> => {
    const quotations = await QuotationModel.find(quotationFilter(query))
      .sort({ createdAt: -1 })
      .populate('customer', 'companyName')
      .populate('createdBy', 'firstName lastName')
      .lean()
      .exec();

    return quotations.map((quotation) => {
      const customer = quotation.customer as unknown as { companyName?: string } | null;
      const rep = quotation.createdBy as unknown as {
        firstName?: string;
        lastName?: string;
      } | null;
      return {
        quoteNumber: quotation.quoteNumber,
        customer: customer?.companyName ?? '',
        createdBy: [rep?.firstName, rep?.lastName].filter(Boolean).join(' '),
        status: quotation.status,
        grandTotal: quotation.grandTotal,
        createdAt: quotation.createdAt.toISOString(),
      };
    });
  },
};
