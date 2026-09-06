import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { portalService } from './portal.service.js';

export const getPortalCatalog = async (req: Request, res: Response): Promise<void> => {
  const catalog = await portalService.getCatalog(req.customer!.id);
  sendSuccess(res, 200, 'Catalog fetched successfully', catalog);
};

export const submitPortalInquiry = async (req: Request, res: Response): Promise<void> => {
  const inquiry = await portalService.submitInquiry(req.customer!.id, req.body);
  sendSuccess(res, 201, 'Inquiry sent to sales', inquiry);
};

export const getPortalInquiries = async (req: Request, res: Response): Promise<void> => {
  const inquiries = await portalService.listInquiries(req.customer!.id);
  sendSuccess(res, 200, 'Inquiries fetched successfully', inquiries);
};

export const getPortalQuotations = async (req: Request, res: Response): Promise<void> => {
  const quotations = await portalService.listQuotations(req.customer!.id);
  sendSuccess(res, 200, 'Quotations fetched successfully', quotations);
};

export const getPortalQuotation = async (req: Request, res: Response): Promise<void> => {
  const quotation = await portalService.getQuotation(req.params.id as string, req.customer!.id);
  sendSuccess(res, 200, 'Quotation fetched successfully', quotation);
};

export const requestChanges = async (req: Request, res: Response): Promise<void> => {
  const quotation = await portalService.requestChanges(
    req.params.id as string,
    req.customer!.id,
    req.body,
  );
  sendSuccess(res, 200, 'Change request submitted', quotation);
};

export const confirmQuotation = async (req: Request, res: Response): Promise<void> => {
  const quotation = await portalService.confirm(req.params.id as string, req.customer!.id);
  sendSuccess(res, 200, 'Quotation confirmed', quotation);
};
