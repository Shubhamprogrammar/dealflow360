import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { quotationService } from './quotation.service.js';
import { approvalService } from '../approvals/approval.service.js';
import type { ListQuotationsQuery } from './quotation.types.js';

export const createQuotation = async (req: Request, res: Response): Promise<void> => {
  const quotation = await quotationService.create(req.body, req.user!);
  sendSuccess(res, 201, 'Quotation created successfully', quotation);
};

export const listQuotations = async (req: Request, res: Response): Promise<void> => {
  const { items, pagination } = await quotationService.list(
    req.query as unknown as ListQuotationsQuery,
    req.user!,
  );
  sendSuccess(res, 200, 'Quotations fetched successfully', items, pagination);
};

export const getQuotation = async (req: Request, res: Response): Promise<void> => {
  const quotation = await quotationService.getById(req.params.id as string, req.user!);
  sendSuccess(res, 200, 'Quotation fetched successfully', quotation);
};

export const updateQuotation = async (req: Request, res: Response): Promise<void> => {
  const quotation = await quotationService.update(req.params.id as string, req.body, req.user!);
  sendSuccess(res, 200, 'Quotation updated successfully', quotation);
};

export const deleteQuotation = async (req: Request, res: Response): Promise<void> => {
  await quotationService.remove(req.params.id as string, req.user!);
  res.status(204).send();
};

export const addLineItem = async (req: Request, res: Response): Promise<void> => {
  const quotation = await quotationService.addLineItem(
    req.params.id as string,
    req.body,
    req.user!,
  );
  sendSuccess(res, 201, 'Line item added successfully', quotation);
};

export const updateLineItem = async (req: Request, res: Response): Promise<void> => {
  const quotation = await quotationService.updateLineItem(
    req.params.id as string,
    req.params.itemId as string,
    req.body,
    req.user!,
  );
  sendSuccess(res, 200, 'Line item updated successfully', quotation);
};

export const removeLineItem = async (req: Request, res: Response): Promise<void> => {
  const quotation = await quotationService.removeLineItem(
    req.params.id as string,
    req.params.itemId as string,
    req.user!,
  );
  sendSuccess(res, 200, 'Line item removed successfully', quotation);
};
export const calculateRisk = async (req: Request, res: Response): Promise<void> => {
  const quotation = await quotationService.calculateRisk(req.params.id as string, req.user!);
  sendSuccess(res, 200, 'Risk score calculated successfully', quotation);
};

export const submitApproval = async (req: Request, res: Response): Promise<void> => {
  const result = await approvalService.submitForApproval(req.params.id as string, req.user!);
  const message = result.approval
    ? 'Quotation submitted for approval'
    : 'Quotation auto-approved, no policy violations found';
  sendSuccess(res, 200, message, result);
};

export const getUpsellSuggestions = async (req: Request, res: Response): Promise<void> => {
  const suggestions = await quotationService.getUpsellSuggestions(
    req.params.id as string,
    req.user!,
  );
  sendSuccess(res, 200, 'Upsell suggestions fetched successfully', suggestions);
};
