'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { billingService } from '@/services/billingService';
import { PageHeader, Callout } from '@/components/ui/PageHeader';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterBar, SearchInput } from '@/components/ui/FilterBar';
import { useSession } from '@/lib/hooks/useSession';
import type { Subscription } from '@/types';

type StatusFilter = 'All' | Subscription['status'];

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user } = useSession();
  const { data: subs = [] } = useQuery({ queryKey: ['subscriptions'], queryFn: billingService.listSubscriptions });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const active = subs.filter((s) => s.status === 'Active').length;
  const paused = subs.filter((s) => s.status === 'Paused').length;
  const cancelled = subs.filter((s) => s.status === 'Cancelled').length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subs.filter((s) => {
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      if (q && !s.customerName.toLowerCase().includes(q) && !s.plan.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [subs, search, statusFilter]);

  const toggleStatus = (s: StatusFilter) => setStatusFilter((cur) => (cur === s ? 'All' : s));
  const dim = (s: StatusFilter) => (statusFilter !== 'All' && statusFilter !== s ? 0.4 : 1);

  return (
    <div>
      <PageHeader title="Subscriptions" subtitle="Every recurring plan across every customer, regardless of which order it came from" />

      <div className="mb-4 flex gap-2">
        <button onClick={() => toggleStatus('Active')} className="transition-opacity" style={{ opacity: dim('Active') }}>
          <Badge tone="green">{active} Active</Badge>
        </button>
        <button onClick={() => toggleStatus('Paused')} className="transition-opacity" style={{ opacity: dim('Paused') }}>
          <Badge tone="amber">{paused} Paused</Badge>
        </button>
        <button onClick={() => toggleStatus('Cancelled')} className="transition-opacity" style={{ opacity: dim('Cancelled') }}>
          <Badge tone="red">{cancelled} Cancelled</Badge>
        </button>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by customer or plan…" />
      </FilterBar>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">No subscriptions match these filters.</p>
        </div>
      ) : (
        <Table>
          <Thead>
            <Th>Customer</Th>
            <Th>Plan</Th>
            <Th>Cycle</Th>
            <Th>Next Bill</Th>
            <Th>Status</Th>
          </Thead>
          <Tbody>
            {filtered.map((s) => (
              <Tr key={s.id} onClick={() => router.push(`/subscriptions/${s.id}`)}>
                <Td className="font-medium text-slate-900">{s.customerName}</Td>
                <Td>{s.plan}</Td>
                <Td>{s.cycle}</Td>
                <Td>{s.nextBillDate ?? '—'}</Td>
                <Td>
                  <Badge tone={s.status === 'Active' ? 'green' : s.status === 'Paused' ? 'amber' : 'red'}>
                    {s.status}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <div className="mt-4">
        <Callout>Click a subscription row to open its billing detail and proration history.</Callout>
      </div>

      {user?.role === 'Admin' && (
        <Button className="mt-4" disabled title="Subscription plan authoring is deferred past hackathon MVP">
          + New Plan (Admin)
        </Button>
      )}
    </div>
  );
}
