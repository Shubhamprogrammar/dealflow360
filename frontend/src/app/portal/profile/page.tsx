'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { useEffect, useState } from 'react';
import { loadCustomerSession, clearCustomerSession, type CustomerSession } from '@/lib/auth/tokenStore';
import { clearTokens } from '@/lib/api/apiClient';

export default function PortalProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<CustomerSession | null>(null);

  useEffect(() => {
    setSession(loadCustomerSession());
  }, []);

  const handleLogout = () => {
    clearCustomerSession();
    clearTokens();
    router.push('/login');
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your portal account" />
      <p className="text-sm font-medium text-slate-900">{session?.companyName ?? 'Customer'}</p>
      <p className="text-sm text-slate-500">Customer ID: {session?.customerId}</p>
      <Button
        className="mt-6"
        onClick={handleLogout}
      >
        Log out
      </Button>
    </div>
  );
}
