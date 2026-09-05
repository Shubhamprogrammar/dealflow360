'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'My Quotation', href: '/portal' },
  { label: 'Catalog', href: '/portal/catalog' },
  { label: 'My Inquiries', href: '/portal/inquiries' },
  { label: 'Messages', href: '/portal/messages' },
  { label: 'Profile', href: '/portal/profile' },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The magic-link landing page is pre-authentication -- no nav there.
  if (pathname === '/portal/verify') {
    return <div className="flex min-h-full flex-1 flex-col bg-slate-50">{children}</div>;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
          <span className="mr-4 shrink-0 py-3.5 text-lg font-semibold tracking-tight text-slate-900 sm:mr-6">
            DealFlow<span className="text-blue-600">360</span>
          </span>
          {TABS.map((tab) => {
            const active = pathname === tab.href;
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
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
