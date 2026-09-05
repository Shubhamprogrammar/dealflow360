'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/lib/hooks/useSession';

export default function PortalProfilePage() {
  const { user, logout } = useSession();
  const router = useRouter();

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your portal account" />
      <p className="text-sm font-medium text-slate-900">{user?.name ?? 'Customer'}</p>
      <p className="text-sm text-slate-500">{user?.email}</p>
      <Button
        className="mt-6"
        onClick={() => {
          logout();
          router.push('/login');
        }}
      >
        Log out
      </Button>
    </div>
  );
}
