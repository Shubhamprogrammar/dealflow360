import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { toCsv } from './report.csv.js';
import { reportService } from './report.service.js';
import type { ProductReportQuery, ReportPeriodQuery, SalesReportQuery } from './report.types.js';

export const salesReport = async (req: Request, res: Response): Promise<void> => {
  const report = await reportService.sales(req.query as unknown as SalesReportQuery);
  sendSuccess(res, 200, 'Sales report generated successfully', report);
};

export const productReport = async (req: Request, res: Response): Promise<void> => {
  const rows = await reportService.products(req.query as unknown as ProductReportQuery);
  sendSuccess(res, 200, 'Product performance report generated successfully', rows);
};

export const approvalReport = async (req: Request, res: Response): Promise<void> => {
  const report = await reportService.approvals(req.query as unknown as ReportPeriodQuery);
  sendSuccess(res, 200, 'Approval report generated successfully', report);
};

export const exportReport = async (req: Request, res: Response): Promise<void> => {
  const rows = await reportService.salesRows(req.query as unknown as SalesReportQuery);
  const csv = toCsv(
    ['quoteNumber', 'customer', 'createdBy', 'status', 'grandTotal', 'createdAt'],
    rows,
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="sales-report.csv"');
  res.status(200).send(csv);
};
