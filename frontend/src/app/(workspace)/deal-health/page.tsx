'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { dealHealthService } from '@/services/dealHealthService';
import { quotationService } from '@/services/quotationService';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatTile } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterBar, FilterSelect } from '@/components/ui/FilterBar';
import type { HealthAlert } from '@/types';

type SeverityFilter = 'All' | HealthAlert['severity'];

const severityTone: Record<HealthAlert['severity'], 'blue' | 'amber' | 'red'> = {
  Info: 'blue',
  Warning: 'amber',
  Critical: 'red',
};

export default function DealHealthPage() {
  const router = useRouter();
  const { data: alerts = [] } = useQuery({ queryKey: ['healthAlerts'], queryFn: dealHealthService.listAlerts });
  const { data: quotations = [] } = useQuery({ queryKey: ['quotations'], queryFn: quotationService.list });

  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('All');

  const nudgeMutation = useMutation({
    mutationFn: (quotationId: string) => dealHealthService.nudgeRep(quotationId),
  });
  const escalateMutation = useMutation({
    mutationFn: (quotationId: string) => dealHealthService.escalate(quotationId),
  });

  const stalled = alerts.filter((a) => a.issue.toLowerCase().includes('idle')).length;
  const anomalies = alerts.filter((a) => a.issue.toLowerCase().includes('discount')).length;
  const slippage = alerts.filter((a) => a.issue.toLowerCase().includes('late') || a.issue.toLowerCase().includes('delivery')).length;

  const filtered = useMemo(
    () => (severityFilter === 'All' ? alerts : alerts.filter((a) => a.severity === severityFilter)),
    [alerts, severityFilter],
  );

  const openQuoteFor = (alert: HealthAlert) => {
    const q = alert.quotationId
      ? quotations.find((x) => x.id === alert.quotationId)
      : quotations.find((x) => x.customerName === alert.dealName);
    if (q) router.push(`/quotations/${q.id}`);
  };

  return (
    <div>
      <PageHeader title="Deal Health and Anomaly Dashboard" subtitle="Real-time flags for stalled deals and unusual discount patterns" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Stalled Deals" value={stalled} hint="quotes idle 7+ days" />
        <StatTile label="Discount Anomalies" value={anomalies} hint="above rep average" />
        <StatTile label="Delivery Slippage" value={slippage} hint="promise dates at risk" />
      </div>

      <FilterBar>
        <FilterSelect
          ariaLabel="Filter by severity"
          value={severityFilter}
          onChange={(v) => setSeverityFilter(v as SeverityFilter)}
          options={[
            { value: 'All', label: 'All severities' },
            { value: 'Critical', label: 'Critical' },
            { value: 'Warning', label: 'Warning' },
            { value: 'Info', label: 'Info' },
          ]}
        />
      </FilterBar>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">No alerts at this severity.</p>
        </div>
      ) : (
        <Table>
          <Thead>
            <Th>Severity</Th>
            <Th>Deal</Th>
            <Th>Issue</Th>
            <Th>Flagged</Th>
            <Th>Action</Th>
          </Thead>
          <Tbody>
            {filtered.map((a) => {
              const isNudging = nudgeMutation.isPending && nudgeMutation.variables === a.quotationId;
              const isEscalating = escalateMutation.isPending && escalateMutation.variables === a.quotationId;
              const nudgeDone = nudgeMutation.isSuccess && nudgeMutation.variables === a.quotationId;
              const nudgeFailed = nudgeMutation.isError && nudgeMutation.variables === a.quotationId;
              const escalateDone = escalateMutation.isSuccess && escalateMutation.variables === a.quotationId;
              const escalateFailed = escalateMutation.isError && escalateMutation.variables === a.quotationId;

              return (
                <Tr key={a.id} onClick={() => openQuoteFor(a)}>
                  <Td>
                    <Badge tone={severityTone[a.severity]}>{a.severity}</Badge>
                  </Td>
                  <Td className="font-medium text-slate-900">{a.dealName}</Td>
                  <Td>{a.issue}</Td>
                  <Td>{a.flaggedDate ? new Date(a.flaggedDate).toLocaleDateString() : '—'}</Td>
                  <Td>
                    {a.quotationId ? (
                      <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="danger"
                          onClick={() => escalateMutation.mutate(a.quotationId!)}
                          disabled={isEscalating}
                        >
                          {isEscalating ? 'Escalating…' : 'Escalate'}
                        </Button>
                        <Button onClick={() => nudgeMutation.mutate(a.quotationId!)} disabled={isNudging}>
                          {isNudging ? 'Nudging…' : 'Nudge Rep'}
                        </Button>
                        {(nudgeDone || escalateDone) && (
                          <span className="text-xs font-medium text-emerald-600">Sent</span>
                        )}
                        {(nudgeFailed || escalateFailed) && (
                          <span className="text-xs font-medium text-red-600">Failed to send</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No linked quotation</span>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
