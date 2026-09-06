'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fulfillmentService } from '@/services/fulfillmentService';
import { useSession } from '@/lib/hooks/useSession';
import { PageHeader, Callout } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { inputClassSm } from '@/components/ui/inputClass';
import type { SplitLine } from '@/types';

export default function FulfillmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [overriding, setOverriding] = useState(false);
  const [split, setSplit] = useState<SplitLine[]>([]);

  const { data: order, isLoading } = useQuery({
    queryKey: ['fulfillment', id],
    queryFn: () => fulfillmentService.get(id),
  });

  const accept = useMutation({
    mutationFn: () => fulfillmentService.acceptSplit(id),
    onSuccess: (o) => {
      queryClient.setQueryData(['fulfillment', id], o);
      queryClient.invalidateQueries({ queryKey: ['fulfillment'] });
    },
  });

  const saveOverride = useMutation({
    mutationFn: () => fulfillmentService.overrideSplit(id, split),
    onSuccess: (o) => {
      queryClient.setQueryData(['fulfillment', id], o);
      queryClient.invalidateQueries({ queryKey: ['fulfillment'] });
      setOverriding(false);
    },
  });

  if (isLoading || !order) return <p className="text-slate-400">Loading…</p>;

  const canOverride = user?.role === 'FinanceOps' || user?.role === 'Admin';
  const rows = overriding ? split : order.suggestedSplit;

  return (
    <div>
      <PageHeader title={`Fulfillment Detail: ${id} (${order.customerName})`} subtitle="Opened by clicking an order row on the Fulfillment list" />

      <Table>
        <Thead>
          <Th>Warehouse</Th>
          <Th>Qty Fulfilled</Th>
          <Th>Est. Shipments</Th>
          <Th>Cost</Th>
        </Thead>
        <Tbody>
          {rows.map((r, i) => (
            <Tr key={r.warehouseId}>
              <Td>{r.warehouseName}</Td>
              <Td>
                {overriding ? (
                  <input
                    type="number"
                    value={r.qty}
                    onChange={(e) =>
                      setSplit((prev) => prev.map((p, idx) => (idx === i ? { ...p, qty: Number(e.target.value) } : p)))
                    }
                    className={`w-20 ${inputClassSm}`}
                  />
                ) : (
                  `${r.qty} units`
                )}
              </Td>
              <Td>{r.estShipments}</Td>
              <Td>${r.estCost}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <div className="mt-4">
        <Callout>&quot;Consolidate Remaining Backorder&quot; prompt appears automatically once stock is replenished.</Callout>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {!overriding ? (
          <>
            <Button variant="primary" onClick={() => accept.mutate()} disabled={order.accepted || accept.isPending}>
              {order.accepted ? 'Split Accepted' : 'Accept Suggested Split'}
            </Button>
            {canOverride && (
              <Button
                onClick={() => {
                  setSplit(order.suggestedSplit);
                  setOverriding(true);
                }}
              >
                Manual Override
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant="primary" onClick={() => saveOverride.mutate()} disabled={saveOverride.isPending}>
              Save Override
            </Button>
            <Button onClick={() => setOverriding(false)}>Cancel</Button>
          </>
        )}
      </div>

      <Button className="mt-6" onClick={() => router.push('/fulfillment')}>
        Back to Fulfillment List
      </Button>
    </div>
  );
}
