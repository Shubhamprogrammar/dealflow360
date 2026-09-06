import { Types } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import type { Role } from '../../types/common.types.js';
import {
  calculateBlendedRisk,
  getDiscountTierForCustomer,
  quotationService,
  recalculateTotals,
} from '../quotations/quotation.service.js';
import { QuotationModel } from '../quotations/quotation.model.js';
import type { QuotationLineItem } from '../quotations/quotation.model.js';
import type { QuotationView, RespondNegotiationInput } from '../quotations/quotation.types.js';
import { ProductModel } from '../products/product.model.js';
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
  let approval = await ApprovalModel.findOne({ quotation: id, finalStatus: 'pending' }).exec();
  if (!approval) {
    if (Types.ObjectId.isValid(id)) {
      approval = await ApprovalModel.findById(id).exec();
    }
  }
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

// Shared by submitForApproval (draft -> pending_approval/approved) and
// respondToNegotiation (under_negotiation -> pending_approval/approved):
// given a quotation whose blendedRiskScore/approvalRequired are already
// current, either clear it straight to approved or build a fresh approval
// chain. Callers are responsible for having just recomputed the risk score.
const routeQuotationThroughApproval = async (
  quotation: ReturnType<typeof QuotationModel.hydrate>,
): Promise<ApprovalView | undefined> => {
  if (!quotation.approvalRequired) {
    quotation.status = 'approved';
    await quotation.save();
    return undefined;
  }

  const discountTier = await getDiscountTierForCustomer(quotation.customer);
  const rule = findApprovalChainRule(discountTier.approvalChain, quotation.blendedRiskScore.score);

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

  return view(approval);
};

export const approvalService = {
  submitForApproval: async (
    quotationId: string,
    requester: Requester,
  ): Promise<{ quotation: QuotationView; approval?: ApprovalView }> => {
    // Refresh the risk score at the moment of submission, reusing B1/B2's
    // ownership + draft-only guards instead of duplicating them here.
    await quotationService.calculateRisk(quotationId, requester);

    const quotation = await QuotationModel.findById(quotationId).exec();
    if (!quotation) throw new ApiError(404, 'Quotation not found', 'QUOTATION_NOT_FOUND');
    if (quotation.lineItems.length === 0)
      throw new ApiError(422, 'Cannot submit an empty quotation for approval', 'EMPTY_QUOTATION');

    const approval = await routeQuotationThroughApproval(quotation);
    const updated = await quotationService.getById(quotationId, requester);
    return { quotation: updated, approval };
  },

  // roleaccess.md: rep permission "Respond to customer negotiation" -- same
  // canBuild gate as the rest of quotation mutation, but the quotation
  // reaches here via the portal's request-changes flow rather than B1's
  // usual draft-only path, so it gets its own status guard.
  respondToNegotiation: async (
    quotationId: string,
    requester: Requester,
    input: RespondNegotiationInput,
  ): Promise<QuotationView> => {
    const quotation = await QuotationModel.findById(quotationId).exec();
    if (!quotation) throw new ApiError(404, 'Quotation not found', 'QUOTATION_NOT_FOUND');
    if (quotation.createdBy.toString() !== requester.id)
      throw new ApiError(403, 'You do not own this quotation', 'FORBIDDEN');
    if (quotation.status !== 'under_negotiation')
      throw new ApiError(
        409,
        'Only quotations under negotiation can be responded to',
        'QUOTATION_NOT_UNDER_NEGOTIATION',
      );

    if (input.lineItems?.length) {
      const costPriceByProduct = new Map<string, number>();
      for (const edit of input.lineItems) {
        const index = quotation.lineItems.findIndex(
          (lineItem) => lineItem._id.toString() === edit.itemId,
        );
        if (index === -1)
          throw new ApiError(404, `Line item ${edit.itemId} not found`, 'LINE_ITEM_NOT_FOUND');
        const item = quotation.lineItems[index] as QuotationLineItem;

        let costPrice = costPriceByProduct.get(item.product.toString());
        if (costPrice === undefined) {
          const product = await ProductModel.findById(item.product).select('costPrice').exec();
          if (!product) throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
          costPrice = product.costPrice;
          costPriceByProduct.set(item.product.toString(), costPrice);
        }

        item.discountPercent = edit.discountPercent;
        item.lineTotal = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
        item.margin = item.lineTotal - item.quantity * costPrice;
      }
      await recalculateTotals(quotation);
    }

    quotation.customerNegotiation.repResponse = input.repResponse;
    quotation.customerNegotiation.lastModifiedBy = 'rep';

    const { score, level, violations } = await calculateBlendedRisk(quotation);
    quotation.blendedRiskScore = { score, level, violations };
    quotation.approvalRequired = violations.length > 0;

    await routeQuotationThroughApproval(quotation);
    return quotationService.getById(quotationId, requester);
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

  // This is the shared "Approvals" overview (Sales Manager, Finance, Admin all
  // land here per the frontend's route table), not a personal action queue --
  // it used to filter to "is the current step's role mine", which meant Admin
  // (never an approverRole) always saw nothing, and Sales Manager/Finance only
  // ever saw their own currently-pending step, hiding everything already
  // decided. `assertActionable` independently re-checks role + pending state
  // before any decide action, so broadening what's *listed* here doesn't
  // widen who can actually approve/reject/return.
  listQueue: async (
    query: ListQueueQuery,
  ): Promise<{ items: QuotationView[]; pagination: Pagination }> => {
    const total = await ApprovalModel.countDocuments({}).exec();
    const approvals = await ApprovalModel.find({})
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .exec();

    const items = await Promise.all(
      approvals.map(async (approval) => {
        try {
          // getById already resolves and attaches approvalSteps (preferring
          // the pending attempt), so no need to duplicate that here.
          return await quotationService.getById(approval.quotation.toString(), {
            id: approval.quotation.toString(),
            role: 'admin',
          });
        } catch {
          return null;
        }
      })
    );

    return {
      items: items.filter(Boolean) as QuotationView[],
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  },
};
