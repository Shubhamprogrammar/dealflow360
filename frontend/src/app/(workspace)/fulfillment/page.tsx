'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fulfillmentService } from '@/services/fulfillmentService';
import { PageHeader, Callout } from '@/components/ui/PageHeader';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { FilterBar, SearchInput } from '@/components/ui/FilterBar';

export default function FulfillmentPage() {
  const router = useRouter();
  const { data: stock = [] } = useQuery({ queryKey: ['stock'], queryFn: fulfillmentService.listStock });
  const { data: orders = [] } = useQuery({ queryKey: ['fulfillment'], queryFn: fulfillmentService.list });

  const [stockSearch, setStockSearch] = useState('');

  const filteredStock = useMemo(() => {
    const q = stockSearch.trim().toLowerCase();
    if (!q) return stock;
    return stock.filter((s) => s.productName.toLowerCase().includes(q) || s.warehouseName.toLowerCase().includes(q));
  }, [stock, stockSearch]);

  const pendingOrders = orders.filter((o) => !o.accepted);

  return (
    <div>
      <PageHeader title="Fulfillment and Stock" subtitle="Live stock per warehouse, plus every order that still needs fulfilling" />

      <FilterBar>
        <SearchInput value={stockSearch} onChange={setStockSearch} placeholder="Search by product or warehouse…" />
      </FilterBar>

      {filteredStock.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center">
          <p className="text-sm text-slate-500">No stock rows match this search.</p>
        </div>
      ) : (
        <Table>
          <Thead>
            <Th>Warehouse</Th>
            <Th>Product</Th>
            <Th>In Stock</Th>
            <Th>Reserved</Th>
            <Th>Available</Th>
          </Thead>
          <Tbody>
            {filteredStock.map((s, i) => (
              <Tr key={i}>
                <Td className="font-medium text-slate-900">{s.warehouseName}</Td>
                <Td>{s.productName}</Td>
                <Td>{s.inStock}</Td>
                <Td>{s.reserved}</Td>
                <Td>{s.inStock - s.reserved}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <h2 className="mt-8 mb-3 text-sm font-semibold text-blue-700">Orders Awaiting Fulfillment</h2>
      {pendingOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center">
          <p className="text-sm text-slate-500">Nothing awaiting fulfillment right now.</p>
        </div>
      ) : (
        <Table>
          <Thead>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Status</Th>
            <Th>Warehouses</Th>
          </Thead>
          <Tbody>
            {pendingOrders.map((o) => (
              <Tr key={o.id} onClick={() => router.push(`/fulfillment/${o.id}`)}>
                <Td className="font-medium text-slate-900">{o.id}</Td>
                <Td>{o.customerName}</Td>
                <Td>
                  <Badge tone={o.status === 'Backorder' ? 'amber' : 'blue'}>
                    {o.status === 'Backorder' ? 'Backorder' : 'Split Pending'}
                  </Badge>
                </Td>
                <Td>{o.warehouses.join(' + ')}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <div className="mt-4">
        <Callout>Click an order row to open its warehouse split detail.</Callout>
      </div>
    </div>
  );
}
