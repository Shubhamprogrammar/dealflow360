import { Schema, model } from 'mongoose';
import { ROLES } from '../../types/common.types.js';
import { APPROVAL_FINAL_STATUSES, APPROVAL_STEP_STATUSES, } from '../../types/domain.types.js';
const stepSchema = new Schema({
    step: { type: Number, required: true, min: 0 },
    approverRole: { type: String, enum: ROLES, required: true, index: true },
    approver: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: APPROVAL_STEP_STATUSES, default: 'pending', index: true },
    decision: { type: String, trim: true },
    reason: { type: String, trim: true },
    timestamp: Date,
}, { _id: true });
const schema = new Schema({
    quotation: { type: Schema.Types.ObjectId, ref: 'Quotation', required: true, index: true },
    approvalChain: { type: [stepSchema], default: [] },
    currentStep: { type: Number, default: 0, min: 0 },
    finalStatus: { type: String, enum: APPROVAL_FINAL_STATUSES, default: 'pending', index: true },
}, { timestamps: true });
schema.index({ finalStatus: 1, 'approvalChain.approverRole': 1, 'approvalChain.status': 1 });
export const ApprovalModel = model('Approval', schema);
