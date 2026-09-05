import { Schema, model, type Types } from 'mongoose';

export type StockLevel = {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  reorderPoint?: number;
};

export type WarehouseDocument = {
  name: string;
  location?: string;
  shippingCostWeight: number;
  stockLevels: StockLevel[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const stockLevelSchema = new Schema<StockLevel>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 0, min: 0 },
    reorderPoint: { type: Number, min: 0 },
  },
  { _id: true },
);

const schema = new Schema<WarehouseDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    location: { type: String, trim: true },
    shippingCostWeight: { type: Number, default: 1, min: 0 },
    stockLevels: { type: [stockLevelSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

schema.index({ 'stockLevels.product': 1 });

export const WarehouseModel = model<WarehouseDocument>('Warehouse', schema);
