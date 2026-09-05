import { Schema, model } from 'mongoose';
import { ROLES, type Role } from '../../types/common.types.js';
export type UserDocument = {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: Role;
  team?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
const schema = new Schema<UserDocument>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, index: true },
    team: { type: String, trim: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);
export const UserModel = model<UserDocument>('User', schema);
