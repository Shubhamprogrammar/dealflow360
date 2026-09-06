import type { Role } from '@/types';

// Single source of truth for which internal roles can reach which top-level
// route. Used both to filter the TopNav tabs (UX) and to guard the routes
// themselves in the (workspace) layout (enforcement) -- hiding a nav tab is
// not access control on its own.
export const ROUTE_ROLES: { prefix: string; roles: Role[] }[] = [
  { prefix: '/dashboard', roles: ['Rep', 'SalesManager', 'FinanceOps', 'Admin'] },
  { prefix: '/quotations', roles: ['Rep', 'SalesManager', 'FinanceOps', 'Admin'] },
  { prefix: '/approvals', roles: ['SalesManager', 'FinanceOps', 'Admin'] },
  { prefix: '/fulfillment', roles: ['Rep', 'FinanceOps', 'Admin'] },
  { prefix: '/subscriptions', roles: ['Rep', 'FinanceOps', 'Admin'] },
  { prefix: '/invoices', roles: ['Rep', 'FinanceOps', 'Admin'] },
  { prefix: '/deal-health', roles: ['SalesManager', 'Admin'] },
  { prefix: '/reports', roles: ['SalesManager', 'Admin'] },
  { prefix: '/products', roles: ['Admin'] },
  { prefix: '/settings', roles: ['Admin'] },
];

export function isRouteAllowed(pathname: string, role: Role): boolean {
  const rule = ROUTE_ROLES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/'));
  if (!rule) return true; // unlisted workspace routes are not role-restricted
  return rule.roles.includes(role);
}
