'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { quotationService } from '@/services/quotationService';
import { dealHealthService } from '@/services/dealHealthService';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatTile } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/lib/hooks/useSession';
import { statusLabel } from '@/lib/statusMeta';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useSession();
  const { data: quotations = [] } = useQuery({
    queryKey: ['quotations'],
    queryFn: quotationService.list,
  });
  const { data: alerts = [] } = useQuery({
    queryKey: ['healthAlerts'],
    queryFn: dealHealthService.listAlerts,
  });

  const pendingApprovals = quotations.filter((q) => q.status === 'PendingApproval').length;
  const openQuotes = quotations.filter((q) => !['Confirmed', 'Rejected'].includes(q.status)).length;

  return (
    <div>
      <PageHeader title="Sales Dashboard / Home" subtitle="Central hub, links out to every module below" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Pending Approvals" value={pendingApprovals} hint={`${pendingApprovals} quotations waiting`} />
        <StatTile label="Open Quotations" value={openQuotes} hint={`${openQuotes} active deals`} />
        <StatTile label="At-Risk Deals" value={alerts.length} hint={`${alerts.length} flagged by Deal Health`} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => router.push('/quotations')}>
          + New Quotation
        </Button>
        <Button onClick={() => router.push('/approvals')}>View Approvals</Button>
        {user?.role === 'Admin' && (
          <>
            <Button onClick={() => router.push('/settings/discount-approval')}>Go to Back-end</Button>
            <Button onClick={() => router.push('/settings/users')}>Manage Staff</Button>
          </>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-blue-700">Recent Activity</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          {quotations.slice(0, 5).map((q) => (
            <li key={q.id}>
              - {q.customerName} quotation {q.id} is {statusLabel[q.status].toLowerCase()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
