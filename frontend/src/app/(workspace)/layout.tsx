'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useSession } from '@/lib/hooks/useSession';
import { isRouteAllowed } from '@/lib/permissions';

// Screens 17 (Product Detail) and 18 (Discount & Approval Setup) are drawn
// without the tab bar in the wireframe -- they read as config pages reached
// from inside a list screen, not top-level tabs.
const NO_NAV_PREFIXES = ['/settings'];

function shouldHideNav(pathname: string) {
  if (NO_NAV_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (/^\/products\/[^/]+$/.test(pathname)) return true;
  return false;
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Route-level guard: hiding a nav tab is UX, not access control. A role
  // that can't see a tab must also be redirected if it reaches the route
  // directly by URL -- this mirrors the "backend re-checks every call"
  // principle even though there's no real backend yet.
  const forbidden = !!user && user.role !== 'Customer' && !isRouteAllowed(pathname, user.role);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role === 'Customer') {
      router.replace('/portal');
    } else if (forbidden) {
      router.replace('/dashboard');
    }
  }, [hydrated, user, forbidden, router]);

  if (!hydrated || !user || user.role === 'Customer' || forbidden) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 bg-slate-50">
      {!shouldHideNav(pathname) && <Sidebar />}
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8">{children}</div>
      </main>
    </div>
  );
}
