import { Schema, model, type Types } from 'mongoose';
import { ROLES, type Role } from '../../types/common.types.js';
import {
  APPROVAL_FINAL_STATUSES,
  APPROVAL_STEP_STATUSES,
  type ApprovalFinalStatus,
  type ApprovalStepStatus,
} from '../../types/domain.types.js';

export type ApprovalStep = {
  _id: Types.ObjectId;
  step: number;
  approverRole: Role;
  approver?: Types.ObjectId;
  status: ApprovalStepStatus;
  decision?: string;
  reason?: string;
  timestamp?: Date;
};

export type ApprovalDocument = {
  quotation: Types.ObjectId;
  approvalChain: ApprovalStep[];
  currentStep: number;
  finalStatus: ApprovalFinalStatus;
  createdAt: Date;
  updatedAt: Date;
};

const stepSchema = new Schema<ApprovalStep>(
  {
    step: { type: Number, required: true, min: 0 },
    approverRole: { type: String, enum: ROLES, required: true, index: true },
    approver: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: APPROVAL_STEP_STATUSES, default: 'pending', index: true },
    decision: { type: String, trim: true },
    reason: { type: String, trim: true },
    timestamp: Date,
  },
  { _id: true },
);

const schema = new Schema<ApprovalDocument>(
  {
    quotation: { type: Schema.Types.ObjectId, ref: 'Quotation', required: true, index: true },
    approvalChain: { type: [stepSchema], default: [] },
    currentStep: { type: Number, default: 0, min: 0 },
    finalStatus: { type: String, enum: APPROVAL_FINAL_STATUSES, default: 'pending', index: true },
  },
  { timestamps: true },
);

schema.index({ finalStatus: 1, 'approvalChain.approverRole': 1, 'approvalChain.status': 1 });

export const ApprovalModel = model<ApprovalDocument>('Approval', schema);
