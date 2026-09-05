'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quotationService } from '@/services/quotationService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { inputClass } from '@/components/ui/inputClass';
import { Select } from '@/components/ui/Select';
import { FilterBar, SearchInput, FilterSelect } from '@/components/ui/FilterBar';
import { statusLabel, statusTone } from '@/lib/statusMeta';
import type { Quotation, QuotationStatus, Tier } from '@/types';

const COLUMNS: { key: QuotationStatus; label: string }[] = [
  { key: 'Draft', label: 'Draft' },
  { key: 'PendingApproval', label: 'Pending Approval' },
  { key: 'Approved', label: 'Approved' },
  { key: 'UnderNegotiation', label: 'Negotiation' },
  { key: 'Confirmed', label: 'Confirmed' },
];

function total(q: Quotation) {
  return q.lines.reduce((sum, l) => sum + l.qty * l.unitPrice * (1 - l.discountPct / 100), 0);
}

export default function QuotationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [showNew, setShowNew] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [tier, setTier] = useState<Tier>('Silver');

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: quotationService.list,
  });

  const createMutation = useMutation({
    mutationFn: () => quotationService.create(customerName, tier),
    onSuccess: (q) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      router.push(`/quotations/${q.id}`);
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotations.filter((quote) => {
      if (q && !quote.customerName.toLowerCase().includes(q) && !quote.id.toLowerCase().includes(q)) return false;
      if (tierFilter !== 'All' && quote.tier !== tierFilter) return false;
      if (statusFilter !== 'All' && quote.status !== statusFilter) return false;
      return true;
    });
  }, [quotations, search, tierFilter, statusFilter]);

  const rejectedOrReturned = filtered.filter((q) => q.status === 'Rejected' || q.status === 'Returned');
  const hasActiveFilters = search || tierFilter !== 'All' || statusFilter !== 'All';

  return (
    <div>
      <PageHeader title="Quotations" subtitle="Every quotation in the system, one row per quotation, click a row to open it" />

      <div className="mb-6 flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => setShowNew((v) => !v)}>
          + New Quotation
        </Button>
        <Button onClick={() => setView((v) => (v === 'kanban' ? 'table' : 'kanban'))}>
          Switch to {view === 'kanban' ? 'Table' : 'Kanban'} View
        </Button>
      </div>

      {showNew && (
        <Card className="mb-6 max-w-md">
          <div className="grid gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600">
              Customer name
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Acme Corp"
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-600">Customer tier</span>
              <Select
                ariaLabel="Customer tier"
                value={tier}
                onChange={(v) => setTier(v as Tier)}
                options={[
                  { value: 'Bronze', label: 'Bronze' },
                  { value: 'Silver', label: 'Silver' },
                  { value: 'Gold', label: 'Gold' },
                ]}
              />
            </div>
            <Button
              variant="primary"
              disabled={!customerName || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Create Draft
            </Button>
          </div>
        </Card>
      )}

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by customer or quotation ID…" />
        <FilterSelect
          ariaLabel="Filter by tier"
          value={tierFilter}
          onChange={setTierFilter}
          options={[
            { value: 'All', label: 'All tiers' },
            { value: 'Bronze', label: 'Bronze' },
            { value: 'Silver', label: 'Silver' },
            { value: 'Gold', label: 'Gold' },
          ]}
        />
        <FilterSelect
          ariaLabel="Filter by status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ value: 'All', label: 'All statuses' }, ...(Object.keys(statusLabel) as QuotationStatus[]).map((s) => ({ value: s, label: statusLabel[s] }))]}
        />
      </FilterBar>

      {isLoading && <p className="text-slate-400">Loading quotations…</p>}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">
            {hasActiveFilters ? 'No quotations match these filters.' : 'No quotations yet.'}
          </p>
        </div>
      )}

      {filtered.length > 0 && view === 'kanban' && (
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          {COLUMNS.map((col) => (
            <div key={col.key} className="w-64 shrink-0">
              <div className="mb-2 text-sm font-medium text-slate-500">{col.label}</div>
              <div className="flex min-h-[120px] flex-col gap-2 rounded-xl border border-slate-200 bg-slate-100/60 p-2">
                {filtered
                  .filter((q) => q.status === col.key)
                  .map((q) => (
                    <button
                      key={q.id}
                      onClick={() => router.push(`/quotations/${q.id}`)}
                      className="rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                    >
                      <div className="text-sm font-medium text-slate-900">{q.customerName}</div>
                      <div className="text-xs text-slate-500">
                        ${total(q).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ))}
          {rejectedOrReturned.length > 0 && (
            <div className="w-64 shrink-0">
              <div className="mb-2 text-sm font-medium text-slate-500">Rejected / Returned</div>
              <div className="flex min-h-[120px] flex-col gap-2 rounded-xl border border-slate-200 bg-slate-100/60 p-2">
                {rejectedOrReturned.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => router.push(`/quotations/${q.id}`)}
                    className="rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="mb-1.5 text-sm font-medium text-slate-900">{q.customerName}</div>
                    <Badge tone={statusTone[q.status]}>{statusLabel[q.status]}</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {filtered.length > 0 && view === 'table' && (
        <Table>
          <Thead>
            <Th>Quotation</Th>
            <Th>Customer</Th>
            <Th>Tier</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
          </Thead>
          <Tbody>
            {filtered.map((q) => (
              <Tr key={q.id} onClick={() => router.push(`/quotations/${q.id}`)}>
                <Td className="font-medium text-slate-900">{q.id}</Td>
                <Td>{q.customerName}</Td>
                <Td>{q.tier}</Td>
                <Td>${total(q).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Td>
                <Td>
                  <Badge tone={statusTone[q.status]}>{statusLabel[q.status]}</Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
