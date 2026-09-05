import { Schema, model, type Types } from 'mongoose';

export type MagicLinkTokenDocument = {
  customer: Types.ObjectId;
  // sha256 of the raw token -- the raw value only ever lives in the emailed link.
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
};

const schema = new Schema<MagicLinkTokenDocument>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Housekeeping: let MongoDB drop rows once they are well past useful life.
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export const MagicLinkTokenModel = model<MagicLinkTokenDocument>('MagicLinkToken', schema);
