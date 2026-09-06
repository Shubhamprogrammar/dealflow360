'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Inbox, MessageCircle, Package, User } from 'lucide-react';

const TABS = [
  { label: 'Catalog', href: '/portal/catalog', icon: Package },
  { label: 'My Quotation', href: '/portal', icon: FileText },
  { label: 'My Inquiries', href: '/portal/inquiries', icon: Inbox },
  { label: 'Messages', href: '/portal/messages', icon: MessageCircle },
  { label: 'Profile', href: '/portal/profile', icon: User },
] as const;


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
          <span className="mr-4 flex shrink-0 items-center gap-2 py-3.5 sm:mr-6">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
              D
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              DealFlow<span className="text-blue-600">360</span>
            </span>
          </span>
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
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
