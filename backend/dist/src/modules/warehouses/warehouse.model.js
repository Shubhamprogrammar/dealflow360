import { Schema, model } from 'mongoose';
const stockLevelSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 0, min: 0 },
    reorderPoint: { type: Number, min: 0 },
}, { _id: true });
const schema = new Schema({
    name: { type: String, required: true, trim: true, index: true },
    location: { type: String, trim: true },
    shippingCostWeight: { type: Number, default: 1, min: 0 },
    stockLevels: { type: [stockLevelSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });
schema.index({ 'stockLevels.product': 1 });
export const WarehouseModel = model('Warehouse', schema);
