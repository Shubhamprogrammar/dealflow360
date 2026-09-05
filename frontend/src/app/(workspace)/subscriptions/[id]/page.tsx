'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingService } from '@/services/billingService';
import { useSession } from '@/lib/hooks/useSession';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';

export default function BillingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useSession();
  const queryClient = useQueryClient();

  const { data: sub, isLoading } = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => billingService.getSubscription(id),
  });

  const cancel = useMutation({
    mutationFn: () => billingService.cancelSubscription(id),
    onSuccess: (s) => {
      queryClient.setQueryData(['subscription', id], s);
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  if (isLoading || !sub) return <p className="text-slate-400">Loading…</p>;

  const canManage = user?.role === 'FinanceOps' || user?.role === 'Admin';

  return (
    <div>
      <PageHeader
        title={`Billing Detail: ${sub.customerName} - ${sub.plan}`}
        subtitle="Opened by clicking a row on the Subscriptions list"
      />

      <h2 className="mb-3 text-sm font-semibold text-blue-700">One-Time Lines (from originating order)</h2>
      <Table>
        <Thead>
          <Th>Product</Th>
          <Th>Qty</Th>
          <Th>Amount</Th>
        </Thead>
        <Tbody>
          {sub.oneTimeLines.length === 0 ? (
            <Tr>
              <Td className="text-slate-500">No one-time lines on this order.</Td>
              <Td>{''}</Td>
              <Td>{''}</Td>
            </Tr>
          ) : (
            sub.oneTimeLines.map((l, i) => (
              <Tr key={i}>
                <Td>{l.name}</Td>
                <Td>{l.qty}</Td>
                <Td>${l.amount.toLocaleString()}</Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-blue-700">Recurring Lines</h2>
      <Table>
        <Thead>
          <Th>Plan</Th>
          <Th>Cycle</Th>
          <Th>Next Bill Date</Th>
          <Th>Amount</Th>
        </Thead>
        <Tbody>
          {sub.recurringLines.map((l, i) => (
            <Tr key={i}>
              <Td>{l.plan}</Td>
              <Td>{l.cycle}</Td>
              <Td>{l.nextBillDate}</Td>
              <Td>${l.amount}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {canManage && sub.status !== 'Cancelled' && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button>Modify Subscription</Button>
          <Button variant="danger" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
            Cancel Subscription
          </Button>
        </div>
      )}

      <Button className="mt-6" onClick={() => router.push('/subscriptions')}>
        Back to Subscriptions List
      </Button>
    </div>
  );
}
