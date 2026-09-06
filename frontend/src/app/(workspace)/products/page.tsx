'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services/catalogService';
import { PageHeader, Callout } from '@/components/ui/PageHeader';
import { StatTile } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterBar, SearchInput, FilterSelect } from '@/components/ui/FilterBar';
import type { Product } from '@/types';

export default function ProductsPage() {
  const router = useRouter();
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: catalogService.list });

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'All' | Product['category']>('All');
  const [status, setStatus] = useState<'All' | Product['status']>('All');

  const active = products.filter((p) => p.status === 'Active').length;
  const archived = products.length - active;
  const totalVariantSkus = products.reduce((sum, p) => sum + p.variants.reduce((s, v) => s + v.values.length, 1), 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      if (status !== 'All' && p.status !== status) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, category, status]);

  return (
    <div>
      <PageHeader title="Product Catalog" subtitle="Every product, variant and price list in one place." />

      <div className="mb-6 flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => router.push('/products/new')}>
          + New Product
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Total Products" value={products.length} hint={`${active} active, ${archived} archived`} />
        <StatTile label="Pricelists" value="3 tiers" hint="Bronze / Silver / Gold" />
        <StatTile label="Variants" value={totalVariantSkus} hint="SKUs across all products" />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search products…" />
        <FilterSelect
          ariaLabel="Filter by category"
          value={category}
          onChange={(v) => setCategory(v as 'All' | Product['category'])}
          options={[
            { value: 'All', label: 'All categories' },
            { value: 'Hardware', label: 'Hardware' },
            { value: 'Services', label: 'Services' },
            { value: 'Subscription', label: 'Subscription' },
          ]}
        />
        <FilterSelect
          ariaLabel="Filter by status"
          value={status}
          onChange={(v) => setStatus(v as 'All' | Product['status'])}
          options={[
            { value: 'All', label: 'All statuses' },
            { value: 'Active', label: 'Active' },
            { value: 'Archived', label: 'Archived' },
          ]}
        />
      </FilterBar>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">No products match these filters.</p>
        </div>
      ) : (
        <Table>
          <Thead>
            <Th>Product name</Th>
            <Th>Category</Th>
            <Th>Variants</Th>
            <Th>Price</Th>
            <Th>Unit</Th>
            <Th>Tax</Th>
            <Th>Status</Th>
          </Thead>
          <Tbody>
            {filtered.map((p) => (
              <Tr key={p.id} onClick={() => router.push(`/products/${p.id}`)}>
                <Td className="font-medium text-slate-900">{p.name}</Td>
                <Td>{p.category}</Td>
                <Td>{p.variants.length > 0 ? p.variants.map((v) => v.attribute).join(', ') : '—'}</Td>
                <Td>
                  ${p.price}
                  {p.isSubscription && p.recurring ? `/${p.recurring.toLowerCase()}` : ''}
                </Td>
                <Td>{p.unit}</Td>
                <Td>{p.tax}%</Td>
                <Td>
                  <Badge tone={p.status === 'Active' ? 'green' : 'neutral'}>{p.status}</Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <div className="mt-4">
        <Callout>Click a product row to open general info, variants and tier/currency price lists.</Callout>
      </div>
    </div>
  );
}
