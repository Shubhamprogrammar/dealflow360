import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response.js';
import { approvalService } from './approval.service.js';
import type { ListQueueQuery } from './approval.types.js';

export const listQueue = async (req: Request, res: Response): Promise<void> => {
  const { items, pagination } = await approvalService.listQueue(
    req.query as unknown as ListQueueQuery,
    req.user!,
  );
  sendSuccess(res, 200, 'Approval queue fetched successfully', items, pagination);
};

export const approveApproval = async (req: Request, res: Response): Promise<void> => {
  const approval = await approvalService.approve(req.params.id as string, req.user!, req.body);
  sendSuccess(res, 200, 'Approval approved successfully', approval);
};

export const rejectApproval = async (req: Request, res: Response): Promise<void> => {
  const approval = await approvalService.reject(req.params.id as string, req.user!, req.body);
  sendSuccess(res, 200, 'Approval rejected successfully', approval);
};

export const requestRevisionApproval = async (req: Request, res: Response): Promise<void> => {
  const approval = await approvalService.requestRevision(
    req.params.id as string,
    req.user!,
    req.body,
  );
  sendSuccess(res, 200, 'Revision requested successfully', approval);
};
