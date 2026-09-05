'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingService } from '@/services/billingService';
import { useSession } from '@/lib/hooks/useSession';
import { PageHeader, Callout } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';

const STAGES = ['OrderConfirmed', 'Shipped', 'Invoiced', 'Paid'] as const;
const STAGE_LABEL: Record<(typeof STAGES)[number], string> = {
  OrderConfirmed: 'Order Confirmed',
  Shipped: 'Shipped',
  Invoiced: 'Invoiced',
  Paid: 'Paid',
};

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useSession();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => billingService.getInvoice(id),
  });

  const recordPayment = useMutation({
    mutationFn: () => billingService.recordPayment(id),
    onSuccess: (inv) => {
      queryClient.setQueryData(['invoice', id], inv);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  if (isLoading || !invoice) return <p className="text-slate-400">Loading…</p>;

  const stageIndex = STAGES.indexOf(invoice.stage);
  const canRecordPayment = (user?.role === 'FinanceOps' || user?.role === 'Admin') && invoice.status === 'Unpaid';

  return (
    <div>
      <PageHeader title={`Invoice Detail: ${invoice.id} (${invoice.customerName})`} subtitle="Opened by clicking a row on the Invoices list" />

      <div className="my-8 flex items-center justify-between">
        {STAGES.map((stage, i) => (
          <div key={stage} className="flex flex-1 items-start">
            <div className="flex w-14 shrink-0 flex-col items-center sm:w-20">
              <div
                className={`h-4 w-4 shrink-0 rounded-full ring-4 ${
                  i < stageIndex ? 'bg-emerald-500 ring-emerald-100' : i === stageIndex ? 'bg-blue-600 ring-blue-100' : 'bg-slate-300 ring-transparent'
                }`}
              />
              <span
                className={`mt-2 text-center text-[11px] leading-tight sm:text-xs ${
                  i <= stageIndex ? 'font-medium text-slate-700' : 'text-slate-400'
                }`}
              >
                {STAGE_LABEL[stage]}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`mt-2 h-0.5 flex-1 ${i < stageIndex ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      <Table>
        <Thead>
          <Th>Invoice #</Th>
          <Th>Amount</Th>
          <Th>Status</Th>
          <Th>Due Date</Th>
        </Thead>
        <Tbody>
          <Tr>
            <Td>
              {invoice.id}
              {invoice.recurring ? ' (Recurring)' : ''}
            </Td>
            <Td>${invoice.amount.toLocaleString()}</Td>
            <Td>
              <Badge tone={invoice.status === 'Paid' ? 'green' : 'red'}>{invoice.status}</Badge>
            </Td>
            <Td>{invoice.dueDate}</Td>
          </Tr>
        </Tbody>
      </Table>

      <div className="mt-6 flex flex-wrap gap-3">
        {canRecordPayment && (
          <Button variant="success" onClick={() => recordPayment.mutate()} disabled={recordPayment.isPending}>
            Record Payment
          </Button>
        )}
        <Button>Download Summary</Button>
      </div>

      <div className="mt-6">
        <Callout>Partial invoicing stays reconciled with partial delivery, nothing is billed before it ships.</Callout>
      </div>

      <Button className="mt-6" onClick={() => router.push('/invoices')}>
        Back to Invoices List
      </Button>
    </div>
  );
}
