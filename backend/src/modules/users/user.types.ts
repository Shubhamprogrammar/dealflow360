import type { Role } from '../../types/common.types.js';
export type UserView = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  team?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  team?: string;
};
