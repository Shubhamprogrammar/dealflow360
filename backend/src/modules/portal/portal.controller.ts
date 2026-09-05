import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { portalService } from './portal.service.js';

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
