export const ROLES = ['admin', 'user', 'manager', 'staff'] as const;
export type Role = (typeof ROLES)[number];
