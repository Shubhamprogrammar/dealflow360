'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { portalCatalogService, type InquiryDraftItem } from '@/services/portalCatalogService';
import { PageHeader, Callout } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { inputClass, inputClassSm } from '@/components/ui/inputClass';
import type { CatalogProduct } from '@/types';

type Selection = { qty: number; note: string; variantId: string };

export default function PortalCatalogPage() {
  const { data: catalog, isLoading } = useQuery({
    queryKey: ['portal-catalog'],
    queryFn: portalCatalogService.listCatalog,
  });

  const [selected, setSelected] = useState<Record<string, Selection>>({});
  const [note, setNote] = useState('');

  const submit = useMutation({
    mutationFn: () => {
      const items: InquiryDraftItem[] = Object.entries(selected).map(([productId, sel]) => ({
        product: productId,
        variantId: sel.variantId || undefined,
        quantity: sel.qty,
        note: sel.note.trim() || undefined,
      }));
      return portalCatalogService.submitInquiry(items, note.trim() || undefined);
    },
  });

  const selectedCount = Object.keys(selected).length;

  const toggle = (product: CatalogProduct) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[product.id]) delete next[product.id];
      else next[product.id] = { qty: 1, note: '', variantId: '' };
      return next;
    });
  };

  const patch = (productId: string, p: Partial<Selection>) => {
    setSelected((prev) => ({ ...prev, [productId]: { ...prev[productId], ...p } }));
  };

  const priceFor = useMemo(
    () => (product: CatalogProduct, variantId: string) => {
      const variant = product.variants.find((v) => v.id === variantId);
      return product.basePrice + (variant?.extraPrice ?? 0);
    },
    [],
  );

  if (isLoading) return <p className="p-8 text-slate-400">Loading catalog…</p>;
  if (!catalog) return <p className="p-8 text-slate-400">Catalog unavailable.</p>;

  if (submit.isSuccess) {
    return (
      <div>
        <PageHeader title="Inquiry sent" subtitle="Your sales rep has been notified." />
        <Callout>
          We&apos;ve received your inquiry. A rep will review it and prepare a quotation for you.
        </Callout>
        <div className="mt-6 flex gap-3">
          <Link href="/portal/inquiries">
            <Button variant="primary">View my inquiries</Button>
          </Link>
          <Button
            onClick={() => {
              setSelected({});
              setNote('');
              submit.reset();
            }}
          >
            Browse again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <PageHeader
        title="Product Catalog"
        subtitle={`Browse products and services, then send an inquiry to sales. Pricing shown is indicative (${catalog.customerTier} tier).`}
      />

      {catalog.groups.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">No products are available right now.</p>
        </div>
      )}

      {catalog.groups.map((group) => (
        <section key={group.category} className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-blue-700">{group.category}</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {group.products.map((product) => {
              const sel = selected[product.id];
              return (
                <div
                  key={product.id}
                  className="flex flex-col gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-start"
                >
                  <label className="flex flex-1 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={!!sel}
                      onChange={() => toggle(product)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                    />
                    <span>
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        {product.name}
                        {product.isSubscription && <Badge tone="blue">Subscription</Badge>}
                      </span>
                      <span className="block text-xs text-slate-500">
                        ${priceFor(product, sel?.variantId ?? '').toLocaleString()} / {product.unit}
                      </span>
                    </span>
                  </label>

                  {sel && (
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {product.variants.length > 0 && (
                        <Select
                          ariaLabel={`${product.name} variant`}
                          value={sel.variantId}
                          onChange={(v) => patch(product.id, { variantId: v })}
                          options={[
                            { value: '', label: 'Standard' },
                            ...product.variants.map((v) => ({
                              value: v.id,
                              label: `${v.attribute}: ${v.value} (+$${v.extraPrice})`,
                            })),
                          ]}
                          className="w-48"
                        />
                      )}
                      <input
                        type="number"
                        min={1}
                        aria-label={`${product.name} quantity`}
                        value={sel.qty}
                        onChange={(e) =>
                          patch(product.id, { qty: Math.max(1, Number(e.target.value) || 1) })
                        }
                        className={`w-20 ${inputClassSm}`}
                      />
                      <input
                        type="text"
                        placeholder="Note (optional)"
                        value={sel.note}
                        onChange={(e) => patch(product.id, { note: e.target.value })}
                        className={`w-full sm:w-56 ${inputClassSm}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Overall note, e.g. need this by end of month"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`flex-1 ${inputClass}`}
          />
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{selectedCount} selected</span>
            <Button
              variant="primary"
              disabled={selectedCount === 0 || submit.isPending}
              onClick={() => submit.mutate()}
            >
              {submit.isPending ? 'Sending…' : 'Send Inquiry to Sales'}
            </Button>
          </div>
        </div>
        {submit.isError && (
          <p className="mx-auto mt-2 max-w-4xl text-sm text-red-600">
            {(submit.error as Error).message || 'Could not send inquiry.'}
          </p>
        )}
      </div>
    </div>
  );
}
