'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quotationService } from '@/services/quotationService';
import { catalogService } from '@/services/catalogService';
import { PageHeader, Callout } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { inputClassSm } from '@/components/ui/inputClass';
import { Select } from '@/components/ui/Select';
import { statusLabel, statusTone } from '@/lib/statusMeta';
import type { QuoteLine } from '@/types';

export default function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationService.get(id),
  });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: catalogService.list });

  // Seed local editable lines once per quotation id -- not on every refetch,
  // so an in-progress edit isn't clobbered by a background revalidation.
  if (quotation && loadedId !== quotation.id) {
    setLoadedId(quotation.id);
    setLines(quotation.lines);
  }

  const saveMutation = useMutation({
    mutationFn: () => quotationService.updateLines(id, lines),
    onSuccess: (q) => {
      queryClient.setQueryData(['quotation', id], q);
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      await quotationService.updateLines(id, lines);
      return quotationService.submit(id);
    },
    onSuccess: (q) => {
      queryClient.setQueryData(['quotation', id], q);
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      if (q.status === 'PendingApproval') router.push(`/approvals/${q.id}`);
    },
  });

  if (isLoading || !quotation) return <p className="text-slate-400">Loading…</p>;

  const editable = quotation.status === 'Draft' || quotation.status === 'Returned';
  const total = lines.reduce((sum, l) => sum + l.qty * l.unitPrice * (1 - l.discountPct / 100), 0);
  const upsellCandidates = products.filter((p) => !lines.some((l) => l.productId === p.id)).slice(0, 3);

  const updateLine = (lineId: string, patch: Partial<QuoteLine>) => {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, ...patch } : l)));
  };

  const removeLine = (lineId: string) => {
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  const addProduct = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setLines((prev) => [
      ...prev,
      { id: `${productId}-${Math.random().toString(36).slice(2, 7)}`, productId: p.id, productName: p.name, category: p.category, qty: 1, unitPrice: p.price, discountPct: 0 },
    ]);
    setSelectedProduct('');
  };

  return (
    <div>
      <PageHeader
        title={`Quotation Detail: ${quotation.id} (${quotation.customerName})`}
        subtitle="Opened by clicking a row on the Quotations list. Add products, apply discounts, review upsells."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge tone={statusTone[quotation.status]}>{statusLabel[quotation.status]}</Badge>
        <span className="text-sm text-slate-500">Tier: {quotation.tier}</span>
        {!editable && (
          <span className="text-sm text-amber-600">
            Quotation locked for editing while {statusLabel[quotation.status].toLowerCase()}.
          </span>
        )}
      </div>

      <Table>
        <Thead>
          <Th>Product</Th>
          <Th>Qty</Th>
          <Th>Price</Th>
          <Th>Discount</Th>
          <Th>Limit</Th>
          <Th>Status</Th>
          {editable && <Th>{''}</Th>}
        </Thead>
        <Tbody>
          {lines.map((l) => {
            const { ceiling, over } = quotationService.lineOverage(l);
            return (
              <Tr key={l.id}>
                <Td className="font-medium text-slate-900">{l.productName}</Td>
                <Td>
                  {editable ? (
                    <input
                      type="number"
                      min={1}
                      value={l.qty}
                      onChange={(e) => updateLine(l.id, { qty: Number(e.target.value) })}
                      className={`w-16 ${inputClassSm}`}
                    />
                  ) : (
                    l.qty
                  )}
                </Td>
                <Td>${l.unitPrice.toLocaleString()}</Td>
                <Td>
                  {editable ? (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={l.discountPct}
                      onChange={(e) => updateLine(l.id, { discountPct: Number(e.target.value) })}
                      className={`w-16 ${inputClassSm}`}
                    />
                  ) : (
                    `${l.discountPct}%`
                  )}
                </Td>
                <Td>{ceiling}%</Td>
                <Td>
                  {over > 0 ? <Badge tone="red">OVER (+{over}pt)</Badge> : <Badge tone="green">OK</Badge>}
                </Td>
                {editable && (
                  <Td>
                    <button onClick={() => removeLine(l.id)} className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline">
                      Remove
                    </button>
                  </Td>
                )}
              </Tr>
            );
          })}
        </Tbody>
      </Table>

      <div className="mt-4">
        <Callout>Discount is checked against each line&apos;s own limit, live as it is entered, not only at submit time.</Callout>
      </div>

      {editable && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            ariaLabel="Add a product"
            placeholder="Add a product…"
            value={selectedProduct}
            onChange={setSelectedProduct}
            options={products.map((p) => ({ value: p.id, label: `${p.name} — $${p.price}` }))}
            className="min-w-0 flex-1"
          />
          <Button className="shrink-0" onClick={() => selectedProduct && addProduct(selectedProduct)}>
            Add Line
          </Button>
        </div>
      )}

      <div className="mt-4 text-right text-lg font-semibold text-slate-900">
        Total: ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-blue-700">Upsell and Cross-Sell Suggestions</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {upsellCandidates.map((p) => (
          <Card key={p.id}>
            <div className="text-sm font-medium text-slate-900">+ {p.name}</div>
            <div className="text-xs text-slate-500">Margin impact: +${Math.round(p.price * 0.2)}</div>
            {editable && (
              <button
                onClick={() => addProduct(p.id)}
                className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                Add to Quote
              </button>
            )}
          </Card>
        ))}
      </div>

      {editable && (
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            Save Draft
          </Button>
          <Button variant="primary" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
            Submit for Approval
          </Button>
        </div>
      )}

      {quotation.status === 'PendingApproval' && (
        <div className="mt-6">
          <Button onClick={() => router.push(`/approvals/${quotation.id}`)}>View Approval Status</Button>
        </div>
      )}
    </div>
  );
}
