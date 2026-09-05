import type { Role } from '../../types/common.types.js';
import type { ApprovalFinalStatus, ApprovalStepStatus } from '../../types/domain.types.js';

export type ApprovalStepView = {
  id: string;
  step: number;
  approverRole: Role;
  approver?: string;
  status: ApprovalStepStatus;
  decision?: string;
  reason?: string;
  timestamp?: Date;
};

export type ApprovalView = {
  id: string;
  quotation: string;
  approvalChain: ApprovalStepView[];
  currentStep: number;
  finalStatus: ApprovalFinalStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ApprovalActionInput = {
  reason?: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ListQueueQuery = {
  page: number;
  limit: number;
};
