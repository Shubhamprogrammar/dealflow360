import type { QuotationStatus } from '../../types/domain.types.js';

export type ReportPeriodQuery = {
  from?: Date;
  to?: Date;
};

export type SalesReportQuery = ReportPeriodQuery & {
  rep?: string;
  status?: QuotationStatus;
};

export type ProductReportQuery = ReportPeriodQuery & {
  limit: number;
};

export type SalesReport = {
  period: { from: Date | null; to: Date | null };
  quotations: { count: number; totalValue: number; averageValue: number };
  orders: { count: number; totalValue: number };
  byStatus: { status: string; count: number; totalValue: number }[];
};

export type ProductPerformanceRow = {
  product: string | null;
  name: string | null;
  category: string | null;
  unitsSold: number;
  revenue: number;
  orderCount: number;
};

export type ApprovalReport = {
  period: { from: Date | null; to: Date | null };
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

export type SalesExportRow = {
  quoteNumber: string;
  customer: string;
  createdBy: string;
  status: string;
  grandTotal: number;
  createdAt: string;
};
