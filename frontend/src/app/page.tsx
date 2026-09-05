'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useSession';

export default function RootPage() {
  const { user, hydrated } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace('/login');
    else if (user.role === 'Customer') router.replace('/portal');
    else router.replace('/dashboard');
  }, [hydrated, user, router]);

  return <div className="flex flex-1 items-center justify-center text-slate-500">Loading…</div>;
}
