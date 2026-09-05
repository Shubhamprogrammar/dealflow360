'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quotationService } from '@/services/quotationService';
import { negotiationService } from '@/services/negotiationService';
import { PageHeader, Callout } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { inputClass } from '@/components/ui/inputClass';
import { Select } from '@/components/ui/Select';

const PORTAL_STATUS_LABEL: Record<string, string> = {
  Draft: 'Sent',
  PendingApproval: 'Sent',
  Approved: 'Sent',
  UnderNegotiation: 'Under Negotiation',
  Returned: 'Under Negotiation',
  Rejected: 'Under Negotiation',
  Confirmed: 'Confirmed',
};

export default function CustomerPortalPage() {
  const queryClient = useQueryClient();
  const { data: quotations = [] } = useQuery({ queryKey: ['quotations'], queryFn: quotationService.list });
  const negotiable = quotations.filter((q) => q.status !== 'Draft');
  const [selectedId, setSelectedId] = useState<string>('');
  const activeId = selectedId || negotiable[0]?.id || '';

  const { data: quotation } = useQuery({
    queryKey: ['quotation', activeId],
    queryFn: () => quotationService.get(activeId),
    enabled: !!activeId,
  });

  const [comment, setComment] = useState('');
  const [counterPct, setCounterPct] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const submitRequest = useMutation({
    mutationFn: async () => {
      if (comment) await negotiationService.addComment(activeId, comment);
      if (counterPct) return negotiationService.submitCounterDiscount(activeId, Number(counterPct), deliveryDate || undefined);
      return quotationService.get(activeId);
    },
    onSuccess: (q) => {
      if (q) queryClient.setQueryData(['quotation', activeId], q);
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setComment('');
    },
  });

  const confirm = useMutation({
    mutationFn: () => negotiationService.confirm(activeId),
    onSuccess: (q) => {
      queryClient.setQueryData(['quotation', activeId], q);
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  if (!quotation) return <p className="text-slate-400">No quotation to display yet.</p>;

  const total = quotation.lines.reduce((sum, l) => sum + l.qty * l.unitPrice * (1 - l.discountPct / 100), 0);
  const portalStatus = PORTAL_STATUS_LABEL[quotation.status] ?? quotation.status;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Demo: viewing as customer for</span>
        <Select
          ariaLabel="Viewing as customer"
          value={activeId}
          onChange={setSelectedId}
          options={negotiable.map((q) => ({ value: q.id, label: `${q.customerName} (${q.id})` }))}
          className="w-56"
        />
      </div>

      <PageHeader
        title="Customer Portal Negotiation Screen"
        subtitle="Customer reviews and negotiates the quote directly, no email needed"
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
        Total: ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
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
