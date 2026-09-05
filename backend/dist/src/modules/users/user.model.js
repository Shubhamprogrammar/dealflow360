import { Schema, model } from 'mongoose';
const schema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'user', 'manager', 'staff'], default: 'user' },
}, { timestamps: true });
export const UserModel = model('User', schema);
