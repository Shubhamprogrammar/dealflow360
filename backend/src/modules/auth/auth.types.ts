import type { Role } from '../../types/common.types.js';
export type AuthTokens = { accessToken: string; refreshToken?: string };
export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  team?: string;
};
export type MagicLinkResult = { expiresAt: Date };
export type CustomerSession = { accessToken: string; customerId: string; companyName: string };
