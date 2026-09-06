export const ROLES = ['admin', 'sales_rep', 'sales_manager', 'finance'] as const;
export type Role = (typeof ROLES)[number];
