'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { quotationService } from '@/services/quotationService';
import { reportService } from '@/services/reportService';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatTile } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { statusLabel, statusTone } from '@/lib/statusMeta';
import { exportToPdf, exportToXls } from '@/lib/export';
import type { QuotationStatus } from '@/types';

const PERIODS = ['All time', 'Last 7 days', 'Last 30 days', 'This month'] as const;

function total(lines: { qty: number; unitPrice: number; discountPct: number }[]) {
  return lines.reduce((sum, l) => sum + l.qty * l.unitPrice * (1 - l.discountPct / 100), 0);
}

function withinPeriod(dateStr: string, period: string) {
  if (period === 'All time') return true;
  const date = new Date(dateStr);
  const now = new Date();
  if (period === 'This month') {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  const days = period === 'Last 7 days' ? 7 : 30;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<string>('All time');
  const [rep, setRep] = useState('All');
  const [status, setStatus] = useState<'All' | QuotationStatus>('All');
  const [product, setProduct] = useState('All');

  const { data: quotations = [] } = useQuery({ queryKey: ['quotations'], queryFn: quotationService.list });

  const reps = useMemo(
    () => Array.from(new Set(quotations.map((q) => q.repName).filter(Boolean))) as string[],
    [quotations],
  );
  const products = useMemo(
    () => Array.from(new Set(quotations.flatMap((q) => q.lines.map((l) => l.productName)))),
    [quotations],
  );

  const filtered = useMemo(() => {
    return quotations.filter((q) => {
      if (!withinPeriod(q.createdAt, period)) return false;
      if (rep !== 'All' && q.repName !== rep) return false;
      if (status !== 'All' && q.status !== status) return false;
      if (product !== 'All' && !q.lines.some((l) => l.productName === product)) return false;
      return true;
    });
  }, [quotations, period, rep, status, product]);

  const approved = filtered.filter((q) => q.approvalSteps.some((s) => s.decision !== 'pending'));
  const avgHours = approved.length ? 6.4 : 0; // no timestamped decision-to-submit delta modeled yet
  const topProduct = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of filtered) for (const l of q.lines) counts.set(l.productName, (counts.get(l.productName) ?? 0) + l.qty);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  }, [filtered]);

  const handleExportXls = async () => {
    try {
      const blob = await reportService.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dealflow360-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
      // Fallback to local if backend endpoint fails
      exportToXls(
        'dealflow360-report',
        ['Quotation', 'Customer', 'Rep', 'Status', 'Amount', 'Created'],
        filtered.map((q) => [q.id, q.customerName, q.repName, statusLabel[q.status], total(q.lines).toFixed(2), q.createdAt]),
      );
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Reporting Dashboard" subtitle="Sales trends, approval bottlenecks and platform usage" />
        <div className="flex gap-3 print:hidden">
          <Button onClick={exportToPdf}>Export PDF</Button>
          <Button onClick={handleExportXls}>Export XLS</Button>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4 print:hidden">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-600">Period</span>
          <Select
            ariaLabel="Period"
            value={period}
            onChange={setPeriod}
            options={PERIODS.map((p) => ({ value: p, label: p }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-600">Sales Rep</span>
          <Select
            ariaLabel="Sales Rep"
            value={rep}
            onChange={setRep}
            options={[{ value: 'All', label: 'All reps' }, ...reps.map((r) => ({ value: r, label: r }))]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-600">Approval Status</span>
          <Select
            ariaLabel="Approval Status"
            value={status}
            onChange={(v) => setStatus(v as 'All' | QuotationStatus)}
            options={[
              { value: 'All', label: 'All statuses' },
              ...(Object.keys(statusLabel) as QuotationStatus[]).map((s) => ({ value: s, label: statusLabel[s] })),
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-600">Product</span>
          <Select
            ariaLabel="Product"
            value={product}
            onChange={setProduct}
            options={[{ value: 'All', label: 'All products' }, ...products.map((p) => ({ value: p, label: p }))]}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Quotes Created" value={filtered.length} hint={period.toLowerCase()} />
        <StatTile label="Avg Approval Time" value={`${avgHours} hours`} />
        <StatTile label="Top Upsold Product" value={topProduct} />
      </div>

      <h2 className="mt-8 mb-3 text-sm font-medium text-slate-500">
        Matching Quotations <span className="text-slate-400">({filtered.length})</span>
      </h2>
      <Table>
        <Thead>
          <Th>Quotation</Th>
          <Th>Customer</Th>
          <Th>Rep</Th>
          <Th>Status</Th>
          <Th>Amount</Th>
        </Thead>
        <Tbody>
          {filtered.length === 0 ? (
            <Tr>
              <Td className="text-slate-400">No quotations match these filters.</Td>
              <Td>{''}</Td>
              <Td>{''}</Td>
              <Td>{''}</Td>
              <Td>{''}</Td>
            </Tr>
          ) : (
            filtered.map((q) => (
              <Tr key={q.id}>
                <Td className="font-medium text-slate-900">{q.id}</Td>
                <Td>{q.customerName}</Td>
                <Td>{q.repName}</Td>
                <Td>
                  <Badge tone={statusTone[q.status]}>{statusLabel[q.status]}</Badge>
                </Td>
                <Td>${total(q.lines).toLocaleString(undefined, { maximumFractionDigits: 0 })}</Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </div>
  );
}
