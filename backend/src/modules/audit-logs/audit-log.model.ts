import { Schema, model, type Types } from 'mongoose';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  type AuditAction,
  type AuditEntityType,
} from '../../types/domain.types.js';

export type AuditLogDocument = {
  entityType: AuditEntityType;
  entityId: Types.ObjectId;
  action: AuditAction;
  performedBy?: Types.ObjectId;
  changes?: unknown;
  reason?: string;
  ipAddress?: string;
  timestamp: Date;
};

const schema = new Schema<AuditLogDocument>(
  {
    entityType: { type: String, enum: AUDIT_ENTITY_TYPES, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    action: { type: String, enum: AUDIT_ACTIONS, required: true, index: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    changes: Schema.Types.Mixed,
    reason: { type: String, trim: true },
    ipAddress: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

schema.index({ entityType: 1, entityId: 1, timestamp: -1 });
schema.index({ performedBy: 1, timestamp: -1 });

export const AuditLogModel = model<AuditLogDocument>('AuditLog', schema);
