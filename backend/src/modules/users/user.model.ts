import { Schema, model } from 'mongoose';
import type { Role } from '../../types/common.types.js';
export type UserDocument = {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};
const schema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'user', 'manager', 'staff'], default: 'user' },
  },
  { timestamps: true },
);
export const UserModel = model<UserDocument>('User', schema);
