'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { negotiationService } from '@/services/negotiationService';
import { PageHeader, Callout } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { inputClass } from '@/components/ui/inputClass';
import { Select } from '@/components/ui/Select';
import type { Quotation } from '@/types';

const PORTAL_STATUS_LABEL: Record<string, string> = {
  Draft: 'Sent',
  PendingApproval: 'Sent',
  Approved: 'Sent',
  UnderNegotiation: 'Under Negotiation',
  Returned: 'Under Negotiation',
  Rejected: 'Under Negotiation',
  Confirmed: 'Confirmed',
};

// Portal columns
const COLUMNS = [
  { key: 'Sent', label: 'Sent (Pending Review)' },
  { key: 'Under Negotiation', label: 'Under Negotiation' },
  { key: 'Confirmed', label: 'Confirmed' },
];

function total(q: Quotation) {
  return q.lines.reduce((sum, l) => sum + l.qty * l.unitPrice * (1 - l.discountPct / 100), 0);
}

export default function CustomerPortalPage() {
  const queryClient = useQueryClient();
  const { data: quotations = [], isLoading } = useQuery({ 
    queryKey: ['portal-quotations'], 
    queryFn: negotiationService.listPortalQuotations 
  });
  
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: quotation } = useQuery({
    queryKey: ['portal-quotation', activeId],
    queryFn: () => negotiationService.getQuotation(activeId!),
    enabled: !!activeId,
  });

  const [comment, setComment] = useState('');
  const [counterPct, setCounterPct] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const submitRequest = useMutation({
    mutationFn: async () => {
      if (!activeId) return null;
      if (comment) await negotiationService.addComment(activeId, comment);
      if (counterPct) return negotiationService.submitCounterDiscount(activeId, Number(counterPct), deliveryDate || undefined);
      return negotiationService.getQuotation(activeId);
    },
    onSuccess: (q) => {
      if (q) queryClient.setQueryData(['portal-quotation', activeId], q);
      queryClient.invalidateQueries({ queryKey: ['portal-quotations'] });
      setComment('');
    },
  });

  const confirm = useMutation({
    mutationFn: () => negotiationService.confirm(activeId!),
    onSuccess: (q) => {
      queryClient.setQueryData(['portal-quotation', activeId], q);
      queryClient.invalidateQueries({ queryKey: ['portal-quotations'] });
    },
  });

  if (isLoading) return <p className="p-8 text-slate-400">Loading your quotations...</p>;

  // If no quote is selected, show the Read-Only Kanban Board
  if (!activeId) {
    return (
      <div>
        <PageHeader
          title="My Quotations"
          subtitle="View and manage all your quotes at a glance."
        />

        {quotations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-sm text-slate-500">You have no quotations yet.</p>
          </div>
        ) : (
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            {COLUMNS.map((col) => {
              const colQuotes = quotations.filter(q => (PORTAL_STATUS_LABEL[q.status] ?? q.status) === col.key);
              return (
                <div key={col.key} className="w-80 shrink-0">
                  <div className="mb-2 text-sm font-medium text-slate-500">{col.label}</div>
                  <div className="flex min-h-[150px] flex-col gap-3 rounded-xl border border-slate-200 bg-slate-100/60 p-3">
                    {colQuotes.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => setActiveId(q.id)}
                        className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <div className="mb-1 text-sm font-medium text-slate-900">{q.quoteNumber || q.id}</div>
                        <div className="mb-2 text-xs text-slate-500">
                          Total: ${total(q).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                        <Badge tone={col.key === 'Confirmed' ? 'green' : col.key === 'Under Negotiation' ? 'amber' : 'blue'}>
                          {col.key}
                        </Badge>
                      </button>
                    ))}
                    {colQuotes.length === 0 && (
                      <div className="text-center text-xs text-slate-400 py-4">No quotes in this stage.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // If a quote IS selected, but still loading
  if (!quotation) return <p className="p-8 text-slate-400">Loading quotation details...</p>;

  const quoteTotal = quotation.lines.reduce((sum, l) => sum + l.qty * l.unitPrice * (1 - l.discountPct / 100), 0);
  const portalStatus = PORTAL_STATUS_LABEL[quotation.status] ?? quotation.status;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => setActiveId(null)}>
          &larr; Back to Board
        </Button>
      </div>

      <PageHeader
        title={`Quotation: ${quotation.quoteNumber || quotation.id}`}
        subtitle="Review terms and negotiate directly, no email needed"
      />

      <Badge tone={portalStatus === 'Confirmed' ? 'green' : portalStatus === 'Under Negotiation' ? 'amber' : 'blue'}>
        Status: {portalStatus}
      </Badge>

      <h2 className="mt-6 mb-3 text-sm font-semibold text-blue-700">Line Items</h2>
      <Table>
        <Thead>
          <Th>Line</Th>
          <Th>Qty</Th>
          <Th>Discount</Th>
          <Th>Customer Comment</Th>
        </Thead>
        <Tbody>
          {quotation.lines.map((l) => (
            <Tr key={l.id}>
              <Td className="font-medium text-slate-900">{l.productName}</Td>
              <Td>{l.qty}</Td>
              <Td>{l.discountPct}%</Td>
              <Td>{quotation.comments.find((c) => c.lineId === l.id)?.text ?? '—'}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {quotation.comments.filter((c) => c.lineId === 'seed' || c.lineId === 'general').length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-slate-500">
          {quotation.comments
            .filter((c) => c.lineId === 'seed' || c.lineId === 'general')
            .map((c, i) => (
              <li key={i}>&quot;{c.text}&quot;</li>
            ))}
        </ul>
      )}

      <div className="mt-4 text-right text-lg font-semibold text-slate-900">
        Total: ${quoteTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>

      {quotation.status !== 'Confirmed' && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600">
              Add a comment
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className={`text-sm ${inputClass}`} />
            </label>
            <div className="grid gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600">
                Counter Discount %
                <input
                  type="number"
                  value={counterPct}
                  onChange={(e) => setCounterPct(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600">
                Requested Delivery Date
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => submitRequest.mutate()} disabled={submitRequest.isPending}>
              Submit Request
            </Button>
            <Button variant="success" onClick={() => confirm.mutate()} disabled={confirm.isPending}>
              Confirm Quotation
            </Button>
          </div>

          <div className="mt-6">
            <Callout>If final terms exceed thresholds, the quote automatically re-enters approval.</Callout>
          </div>
        </>
      )}

      {quotation.status === 'Confirmed' && (
        <p className="mt-6 font-medium text-emerald-600">Thank you — your order is confirmed and moving to fulfillment.</p>
      )}
    </div>
  );
}
