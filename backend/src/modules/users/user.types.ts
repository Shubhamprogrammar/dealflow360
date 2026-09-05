import type { Role } from '../../types/common.types.js';
export type UserView = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};
export type CreateUserInput = { name: string; email: string; password: string; role?: Role };
