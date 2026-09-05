import * as mock from '@/lib/mock/server';
import type { ApprovalDecision, ApprovalRole } from '@/types';

export const approvalService = {
  decide: (id: string, role: ApprovalRole, decision: ApprovalDecision, reason: string, by: string) =>
    mock.decideApproval(id, role, decision, reason, by),
};
