import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { invoiceService } from './invoice.service.js';

export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  const invoice = await invoiceService.createFromOrder(req.body);
  sendSuccess(res, 201, 'Invoice created successfully', invoice);
};

export const markInvoicePaid = async (req: Request, res: Response): Promise<void> => {
  const invoice = await invoiceService.markPaid(req.params.id as string, req.body);
  sendSuccess(res, 200, 'Invoice marked as paid', invoice);
};
