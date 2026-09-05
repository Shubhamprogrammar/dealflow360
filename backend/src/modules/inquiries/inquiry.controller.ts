import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { inquiryService } from './inquiry.service.js';
import type { ListInquiriesQuery } from './inquiry.types.js';

export const listInquiries = async (req: Request, res: Response): Promise<void> => {
  const { items, pagination } = await inquiryService.listForStaff(
    req.query as unknown as ListInquiriesQuery,
  );
  sendSuccess(res, 200, 'Inquiries fetched successfully', items, pagination);
};

export const getInquiry = async (req: Request, res: Response): Promise<void> => {
  const inquiry = await inquiryService.getById(req.params.id as string);
  sendSuccess(res, 200, 'Inquiry fetched successfully', inquiry);
};

export const dismissInquiry = async (req: Request, res: Response): Promise<void> => {
  const inquiry = await inquiryService.dismiss(req.params.id as string, req.user!.id);
  sendSuccess(res, 200, 'Inquiry dismissed', inquiry);
};
