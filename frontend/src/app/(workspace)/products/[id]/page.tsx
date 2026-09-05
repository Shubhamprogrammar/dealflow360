'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { catalogService } from '@/services/catalogService';
import { PageHeader, Callout } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { inputClass } from '@/components/ui/inputClass';
import { Select } from '@/components/ui/Select';
import type { Product } from '@/types';

const BLANK: Product = {
  id: '',
  name: '',
  category: 'Hardware',
  price: 0,
  unit: 'Each',
  tax: 0,
  isSubscription: false,
  status: 'Active',
  variants: [],
};

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Product>(BLANK);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => catalogService.get(id),
    enabled: !isNew,
  });

  if (existing && loadedId !== existing.id) {
    setLoadedId(existing.id);
    setForm(existing);
  }

  const save = useMutation({
    mutationFn: () =>
      catalogService.save({
        ...form,
        id: form.id || `p-${Date.now()}`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/products');
    },
  });

  if (!isNew && isLoading) {
    return <p className="px-6 py-8 text-slate-400">Loading…</p>;
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            DealFlow<span className="text-blue-600">360</span>
          </span>
          <button onClick={() => router.push('/products')} className="text-sm font-medium text-slate-500 hover:text-slate-900">
            ← Back
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <PageHeader title="Product and pricelist" />

        <h2 className="mb-3 text-sm font-medium text-slate-500">General Info</h2>
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600">
            Product name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600">
            Tax %
            <input
              type="number"
              value={form.tax}
              onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })}
              className={inputClass}
            />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-600">Category</span>
            <Select
              ariaLabel="Category"
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v as Product['category'] })}
              options={[
                { value: 'Hardware', label: 'Hardware' },
                { value: 'Services', label: 'Services' },
                { value: 'Subscription', label: 'Subscription' },
              ]}
            />
          </div>
          <div className="flex flex-col gap-1.5 text-sm font-medium text-slate-600">
            Subscription
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-1.5 font-normal text-slate-700">
                <input
                  type="radio"
                  checked={form.isSubscription}
                  onChange={() => setForm({ ...form, isSubscription: true })}
                  className="accent-blue-600"
                />
                Yes
              </label>
              <label className="flex items-center gap-1.5 font-normal text-slate-700">
                <input
                  type="radio"
                  checked={!form.isSubscription}
                  onChange={() => setForm({ ...form, isSubscription: false, recurring: undefined })}
                  className="accent-blue-600"
                />
                No
              </label>
            </div>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600">
            Price
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className={inputClass}
            />
          </label>
          {form.isSubscription && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-600">Recurring</span>
              <Select
                ariaLabel="Recurring"
                value={form.recurring ?? 'Monthly'}
                onChange={(v) => setForm({ ...form, recurring: v as Product['recurring'] })}
                options={[
                  { value: 'Monthly', label: 'Monthly' },
                  { value: 'Quarterly', label: 'Quarterly' },
                  { value: 'Yearly', label: 'Yearly' },
                ]}
              />
            </div>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600">
            Unit
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputClass} />
          </label>
        </div>

        <h2 className="mt-6 mb-3 text-sm font-medium text-slate-500">Product Variants</h2>
        <Table>
          <Thead>
            <Th>Attribute</Th>
            <Th>Values</Th>
            <Th>Extra price</Th>
          </Thead>
          <Tbody>
            {form.variants.length === 0 ? (
              <Tr>
                <Td className="text-slate-400">No variants configured</Td>
                <Td>{''}</Td>
                <Td>{''}</Td>
              </Tr>
            ) : (
              form.variants.map((v, i) => (
                <Tr key={i}>
                  <Td className="font-medium text-slate-900">{v.attribute}</Td>
                  <Td>{v.values.join(', ')}</Td>
                  <Td>${v.extraPrice}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>

        <h2 className="mt-6 mb-3 text-sm font-medium text-slate-500">Pricelists</h2>
        <Table>
          <Thead>
            <Th>Tier</Th>
            <Th>Currency</Th>
            <Th>Price Rule</Th>
          </Thead>
          <Tbody>
            <Tr>
              <Td className="font-medium text-slate-900">Bronze</Td>
              <Td>USD</Td>
              <Td>Price, no adjustment</Td>
            </Tr>
            <Tr>
              <Td className="font-medium text-slate-900">Gold</Td>
              <Td>USD</Td>
              <Td>Price minus 10 percent base</Td>
            </Tr>
          </Tbody>
        </Table>

        <div className="mt-6">
          <Callout>
            Product details should be filled. Recurring order with this product will be invoiced at the beginning of
            the period.
          </Callout>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="primary" disabled={!form.name || save.isPending} onClick={() => save.mutate()}>
            Save Product
          </Button>
          <Button onClick={() => router.push('/products')}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
