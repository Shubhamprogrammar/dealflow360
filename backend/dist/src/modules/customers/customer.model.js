import { Schema, model } from 'mongoose';
import { CUSTOMER_TIERS } from '../../types/domain.types.js';
const schema = new Schema({
    companyName: { type: String, required: true, trim: true, index: true },
    contactEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    contactName: { type: String, trim: true },
    customerTier: { type: String, enum: CUSTOMER_TIERS, default: 'bronze', index: true },
    portalPasswordHash: { type: String, select: false },
    magicLinkToken: { type: String, select: false, index: true },
    magicLinkExpiry: { type: Date, select: false },
    creditScore: { type: Number, min: 0 },
    paymentTerms: { type: String, default: 'Net 30', trim: true },
    assignedRep: { type: Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });
schema.index({ customerTier: 1, assignedRep: 1 });
export const CustomerModel = model('Customer', schema);
