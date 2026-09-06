'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { approvalService } from '@/services/approvalService';
import { PageHeader, Callout } from '@/components/ui/PageHeader';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { FilterBar, SearchInput, FilterSelect } from '@/components/ui/FilterBar';
import { riskTone } from '@/lib/statusMeta';

type StageFilter = 'All' | 'Pending' | 'Returned' | 'Approved';

export default function ApprovalsPage() {
  const router = useRouter();
  const [stageFilter, setStageFilter] = useState<StageFilter>('All');
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const { data: quotations = [] } = useQuery({ queryKey: ['approvals'], queryFn: approvalService.queue });

  const inApproval = quotations.filter((q) => q.approvalSteps.length > 0);
  const pendingCount = inApproval.filter((q) => q.status === 'PendingApproval').length;
  const returnedCount = quotations.filter((q) => q.status === 'Returned').length;
  const approvedCount = quotations.filter((q) => q.status === 'Approved' || q.status === 'Confirmed').length;

  const rows = quotations;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((quote) => {
      if (stageFilter === 'Pending' && quote.status !== 'PendingApproval') return false;
      if (stageFilter === 'Returned' && quote.status !== 'Returned') return false;
      if (stageFilter === 'Approved' && quote.status !== 'Approved' && quote.status !== 'Confirmed') return false;
      if (riskFilter !== 'All' && quote.blendedRiskScore !== riskFilter) return false;
      if (q && !quote.customerName.toLowerCase().includes(q) && !quote.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, stageFilter, riskFilter, search]);

  const toggleStage = (s: StageFilter) => setStageFilter((cur) => (cur === s ? 'All' : s));
  const dim = (s: StageFilter) => (stageFilter !== 'All' && stageFilter !== s ? 0.4 : 1);

  return (
    <div>
      <PageHeader title="Approvals" subtitle="Every quotation that needed, needs, or is going through discount approval" />

      <div className="mb-4 flex gap-2">
        <button onClick={() => toggleStage('Pending')} className="transition-opacity" style={{ opacity: dim('Pending') }}>
          <Badge tone="amber">{pendingCount} Pending</Badge>
        </button>
        <button onClick={() => toggleStage('Returned')} className="transition-opacity" style={{ opacity: dim('Returned') }}>
          <Badge tone="red">{returnedCount} Returned</Badge>
        </button>
        <button onClick={() => toggleStage('Approved')} className="transition-opacity" style={{ opacity: dim('Approved') }}>
          <Badge tone="green">{approvedCount} Approved</Badge>
        </button>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by customer or quotation ID…" />
        <FilterSelect
          ariaLabel="Filter by blended risk"
          value={riskFilter}
          onChange={setRiskFilter}
          options={[
            { value: 'All', label: 'All risk levels' },
            { value: 'LOW', label: 'Low risk' },
            { value: 'MEDIUM', label: 'Medium risk' },
            { value: 'HIGH', label: 'High risk' },
          ]}
        />
      </FilterBar>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">No quotations match these filters.</p>
        </div>
      ) : (
        <Table>
          <Thead>
            <Th>Quotation</Th>
            <Th>Customer</Th>
            <Th>Blended Risk</Th>
            <Th>Stage</Th>
            <Th>Assigned To</Th>
          </Thead>
          <Tbody>
            {filtered.map((q) => {
              const pendingStep = q.approvalSteps.find((s) => s.decision === 'pending');
              return (
                <Tr key={q.id} onClick={() => router.push(`/approvals/${q.id}`)}>
                  <Td className="font-medium text-slate-900">{q.id}</Td>
                  <Td>{q.customerName}</Td>
                  <Td>
                    <Badge tone={riskTone[q.blendedRiskScore]}>{q.blendedRiskScore}</Badge>
                  </Td>
                  <Td>{pendingStep ? (pendingStep.role === 'SalesManager' ? 'Sales Manager' : 'Finance') : q.status}</Td>
                  <Td>{pendingStep ? '—' : q.approvalSteps.at(-1)?.by ?? '—'}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}

      <div className="mt-4">
        <Callout>Click any row to open its full approval detail, risk breakdown, and audit trail.</Callout>
      </div>
    </div>
  );
}
