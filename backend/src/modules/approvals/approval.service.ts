import { Types } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import type { Role } from '../../types/common.types.js';
import { getDiscountTierForCustomer, quotationService } from '../quotations/quotation.service.js';
import { QuotationModel } from '../quotations/quotation.model.js';
import type { QuotationView } from '../quotations/quotation.types.js';
import type { ApprovalChainRule } from '../discount-tiers/discount-tier.model.js';
import { ApprovalModel } from './approval.model.js';
import type { ApprovalDocument, ApprovalStep } from './approval.model.js';
import type {
  ApprovalActionInput,
  ApprovalView,
  ListQueueQuery,
  Pagination,
} from './approval.types.js';

type Requester = { id: string; role: Role };

const view = (approval: ApprovalDocument & { _id: Types.ObjectId }): ApprovalView => ({
  id: approval._id.toString(),
  quotation: approval.quotation.toString(),
  approvalChain: approval.approvalChain.map((step) => ({
    id: step._id.toString(),
    step: step.step,
    approverRole: step.approverRole,
    approver: step.approver?.toString(),
    status: step.status,
    decision: step.decision,
    reason: step.reason,
    timestamp: step.timestamp,
  })),
  currentStep: approval.currentStep,
  finalStatus: approval.finalStatus,
  createdAt: approval.createdAt,
  updatedAt: approval.updatedAt,
});

const findApproval = async (id: string): Promise<ReturnType<typeof ApprovalModel.hydrate>> => {
  const approval = await ApprovalModel.findById(id).exec();
  if (!approval) throw new ApiError(404, 'Approval not found', 'APPROVAL_NOT_FOUND');
  return approval;
};

const assertActionable = (approval: ApprovalDocument, requester: Requester): ApprovalStep => {
  if (approval.finalStatus !== 'pending')
    throw new ApiError(
      409,
      'This approval has already been finalized',
      'APPROVAL_ALREADY_FINALIZED',
    );

  const currentStepDoc = approval.approvalChain[approval.currentStep];
  if (!currentStepDoc)
    throw new ApiError(500, 'Approval chain is in an inconsistent state', 'APPROVAL_CHAIN_CORRUPT');

  if (currentStepDoc.approverRole !== requester.role)
    throw new ApiError(
      403,
      `This step requires approval from ${currentStepDoc.approverRole}`,
      'FORBIDDEN',
    );

  return currentStepDoc;
};

const findApprovalChainRule = (rules: ApprovalChainRule[], score: number): ApprovalChainRule => {
  const matched = rules.find((rule) => score >= rule.minDiscount && score <= rule.maxDiscount);
  if (matched) return matched;

  // Score exceeds every configured band -- escalate to the highest-ceiling
  // rule rather than silently skipping approval for the riskiest deals.
  const highest = [...rules].sort((a, b) => b.maxDiscount - a.maxDiscount)[0];
  if (!highest)
    throw new ApiError(
      422,
      'No approval chain configured for this discount tier',
      'APPROVAL_CHAIN_NOT_CONFIGURED',
    );
  return highest;
};

export const approvalService = {
  submitForApproval: async (
    quotationId: string,
    requester: Requester,
  ): Promise<{ quotation: QuotationView; approval?: ApprovalView }> => {
    // Refresh the risk score at the moment of submission, reusing B1/B2's
    // ownership + draft-only guards instead of duplicating them here.
    const refreshed = await quotationService.calculateRisk(quotationId, requester);

    const quotation = await QuotationModel.findById(quotationId).exec();
    if (!quotation) throw new ApiError(404, 'Quotation not found', 'QUOTATION_NOT_FOUND');
    if (quotation.lineItems.length === 0)
      throw new ApiError(422, 'Cannot submit an empty quotation for approval', 'EMPTY_QUOTATION');

    if (!refreshed.approvalRequired) {
      // No policy violation -- nothing to route through approvers.
      quotation.status = 'approved';
      await quotation.save();
      const updated = await quotationService.getById(quotationId, requester);
      return { quotation: updated };
    }

    const discountTier = await getDiscountTierForCustomer(quotation.customer);
    const rule = findApprovalChainRule(
      discountTier.approvalChain,
      refreshed.blendedRiskScore.score,
    );

    const approvalChain = rule.requiredApprovers.map(
      (role, index) =>
        ({
          step: index,
          approverRole: role,
          status: 'pending',
        }) as ApprovalStep,
    );

    const approval = await ApprovalModel.create({
      quotation: quotation._id,
      approvalChain,
      currentStep: 0,
      finalStatus: 'pending',
    });

    quotation.status = 'pending_approval';
    quotation.currentApprovalStep = 0;
    await quotation.save();

    const updated = await quotationService.getById(quotationId, requester);
    return { quotation: updated, approval: view(approval) };
  },

  approve: async (
    id: string,
    requester: Requester,
    input: ApprovalActionInput,
  ): Promise<ApprovalView> => {
    const approval = await findApproval(id);
    const stepDoc = assertActionable(approval, requester);

    stepDoc.status = 'approved';
    stepDoc.approver = new Types.ObjectId(requester.id);
    stepDoc.decision = 'approved';
    stepDoc.reason = input.reason;
    stepDoc.timestamp = new Date();

    const quotation = await QuotationModel.findById(approval.quotation).exec();
    if (!quotation) throw new ApiError(404, 'Quotation not found', 'QUOTATION_NOT_FOUND');

    const isLastStep = approval.currentStep === approval.approvalChain.length - 1;
    if (isLastStep) {
      approval.finalStatus = 'approved';
      quotation.status = 'approved';
    } else {
      approval.currentStep += 1;
      quotation.currentApprovalStep = approval.currentStep;
    }

    await approval.save();
    await quotation.save();
    return view(approval);
  },

  reject: async (
    id: string,
    requester: Requester,
    input: ApprovalActionInput,
  ): Promise<ApprovalView> => {
    const approval = await findApproval(id);
    const stepDoc = assertActionable(approval, requester);

    stepDoc.status = 'rejected';
    stepDoc.approver = new Types.ObjectId(requester.id);
    stepDoc.decision = 'rejected';
    stepDoc.reason = input.reason;
    stepDoc.timestamp = new Date();
    approval.finalStatus = 'rejected';

    const quotation = await QuotationModel.findById(approval.quotation).exec();
    if (!quotation) throw new ApiError(404, 'Quotation not found', 'QUOTATION_NOT_FOUND');
    quotation.status = 'rejected';

    await approval.save();
    await quotation.save();
    return view(approval);
  },

  // ApprovalFinalStatus has no "revision" value -- this attempt is closed out
  // as `rejected` (the step's own `status: 'revision_requested'` + `reason`
  // carry the nuance that it's a send-back, not a hard no). A resubmission
  // creates a fresh Approval document once the rep edits the now-draft quote.
  requestRevision: async (
    id: string,
    requester: Requester,
    input: ApprovalActionInput,
  ): Promise<ApprovalView> => {
    const approval = await findApproval(id);
    const stepDoc = assertActionable(approval, requester);

    stepDoc.status = 'revision_requested';
    stepDoc.approver = new Types.ObjectId(requester.id);
    stepDoc.decision = 'revision_requested';
    stepDoc.reason = input.reason;
    stepDoc.timestamp = new Date();
    approval.finalStatus = 'rejected';

    const quotation = await QuotationModel.findById(approval.quotation).exec();
    if (!quotation) throw new ApiError(404, 'Quotation not found', 'QUOTATION_NOT_FOUND');
    quotation.status = 'draft';

    await approval.save();
    await quotation.save();
    return view(approval);
  },

  listQueue: async (
    query: ListQueueQuery,
    requester: Requester,
  ): Promise<{ items: ApprovalView[]; pagination: Pagination }> => {
    const pending = await ApprovalModel.find({ finalStatus: 'pending' })
      .sort({ createdAt: 1 })
      .exec();

    const mine = pending.filter((approval) => {
      const currentStepDoc = approval.approvalChain[approval.currentStep];
      return currentStepDoc?.status === 'pending' && currentStepDoc.approverRole === requester.role;
    });

    const total = mine.length;
    const start = (query.page - 1) * query.limit;
    const items = mine.slice(start, start + query.limit).map(view);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  },
};
