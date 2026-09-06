'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  BarChart3,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Repeat,
  Truck,
} from 'lucide-react';
import { useSession } from '@/lib/hooks/useSession';
import { isRouteAllowed } from '@/lib/permissions';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Quotations', href: '/quotations', icon: FileText },
  { label: 'Approvals', href: '/approvals', icon: ClipboardCheck },
  { label: 'Fulfillment', href: '/fulfillment', icon: Truck },
  { label: 'Subscriptions', href: '/subscriptions', icon: Repeat },
  { label: 'Invoices', href: '/invoices', icon: Receipt },
  { label: 'Deal Health', href: '/deal-health', icon: Activity },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Products', href: '/products', icon: Package },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();

  const visibleItems = NAV_ITEMS.filter((item) => user && isRouteAllowed(item.href, user.role));

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white print:hidden">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 px-4">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-[11px] font-bold text-white">
          D
        </span>
        <span className="text-[15px] font-bold tracking-tight text-slate-900">
          DealFlow<span className="text-blue-600">360</span>
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Workspace
        </p>
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} strokeWidth={2} />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-slate-200 p-3">
        <div className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
            className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  );
}
