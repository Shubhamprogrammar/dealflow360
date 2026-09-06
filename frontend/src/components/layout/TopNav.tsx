'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';
import { isRouteAllowed } from '@/lib/permissions';

const TABS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Quotations', href: '/quotations' },
  { label: 'Approvals', href: '/approvals' },
  { label: 'Fulfillment', href: '/fulfillment' },
  { label: 'Subscriptions', href: '/subscriptions' },
  { label: 'Invoices', href: '/invoices' },
  { label: 'Deal Health', href: '/deal-health' },
  { label: 'Reports', href: '/reports' },
  { label: 'Products', href: '/products' },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();

  const visibleTabs = TABS.filter((t) => user && isRouteAllowed(t.href, user.role));

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
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-sm print:hidden">
      <div className="flex items-center gap-2 px-4 sm:px-6">
        <span className="shrink-0 py-3.5 text-lg font-semibold tracking-tight text-slate-900">
          DealFlow<span className="text-blue-600">360</span>
        </span>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`shrink-0 border-b-2 px-3 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3 pl-2">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
              {initials}
            </span>
            <span className="hidden text-sm text-slate-600 md:inline">
              {user?.name} <span className="text-slate-400">· {user?.role}</span>
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
