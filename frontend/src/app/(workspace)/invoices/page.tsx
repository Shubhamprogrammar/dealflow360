'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { billingService } from '@/services/billingService';
import { PageHeader, Callout } from '@/components/ui/PageHeader';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { FilterBar, SearchInput } from '@/components/ui/FilterBar';

type StatusFilter = 'All' | 'Unpaid' | 'Paid';

export default function InvoicesPage() {
  const router = useRouter();
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: billingService.listInvoices });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const unpaid = invoices.filter((i) => i.status === 'Unpaid').length;
  const paid = invoices.filter((i) => i.status === 'Paid').length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter !== 'All' && inv.status !== statusFilter) return false;
      if (q && !inv.customerName.toLowerCase().includes(q) && !inv.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [invoices, search, statusFilter]);

  const toggleStatus = (s: StatusFilter) => setStatusFilter((cur) => (cur === s ? 'All' : s));

  return (
    <div>
      <PageHeader title="Invoices" subtitle="Every invoice generated from one-time and recurring orders" />

      <div className="mb-4 flex gap-2">
        <button onClick={() => toggleStatus('Unpaid')} className="transition-opacity" style={{ opacity: statusFilter === 'Paid' ? 0.4 : 1 }}>
          <Badge tone="red">{unpaid} Unpaid</Badge>
        </button>
        <button onClick={() => toggleStatus('Paid')} className="transition-opacity" style={{ opacity: statusFilter === 'Unpaid' ? 0.4 : 1 }}>
          <Badge tone="green">{paid} Paid</Badge>
        </button>
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by customer or invoice #…" />
      </FilterBar>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">No invoices match these filters.</p>
        </div>
      ) : (
        <Table>
          <Thead>
            <Th>Invoice #</Th>
            <Th>Customer</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
            <Th>Due Date</Th>
          </Thead>
          <Tbody>
            {filtered.map((inv) => (
              <Tr key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)}>
                <Td className="font-medium text-slate-900">{inv.id}</Td>
                <Td>{inv.customerName}</Td>
                <Td>${inv.amount.toLocaleString()}</Td>
                <Td>
                  <Badge tone={inv.status === 'Paid' ? 'green' : 'red'}>{inv.status}</Badge>
                </Td>
                <Td>{inv.dueDate}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <div className="mt-4">
        <Callout>Click an invoice row to open its full payment and delivery reconciliation detail.</Callout>
      </div>
    </div>
  );
}
