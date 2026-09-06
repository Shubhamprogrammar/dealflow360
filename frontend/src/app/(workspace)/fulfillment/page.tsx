'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fulfillmentService } from '@/services/fulfillmentService';
import { quotationService } from '@/services/quotationService';
import { api } from '@/lib/api/apiClient';
import { PageHeader, Callout } from '@/components/ui/PageHeader';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { FilterBar, SearchInput } from '@/components/ui/FilterBar';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

export default function FulfillmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: stock = [] } = useQuery({ queryKey: ['stock'], queryFn: fulfillmentService.listStock });
  const { data: orders = [] } = useQuery({ queryKey: ['fulfillment'], queryFn: fulfillmentService.list });
  const { data: quotations = [] } = useQuery({ queryKey: ['quotations'], queryFn: quotationService.list });
  const { data: convertedQuotationIds = new Set<string>() } = useQuery({
    queryKey: ['convertedQuotationIds'],
    queryFn: fulfillmentService.listConvertedQuotationIds,
  });

  const [stockSearch, setStockSearch] = useState('');
  const [selectedQuoteId, setSelectedQuoteId] = useState('');

  const createOrder = useMutation({
    mutationFn: async () => {
      const res = await api.post<any>('/orders', { quotation: selectedQuoteId });
      return res.data;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment'] });
      queryClient.invalidateQueries({ queryKey: ['convertedQuotationIds'] });
      setSelectedQuoteId('');
      router.push(`/fulfillment/${order._id || order.id}`);
    }
  });

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
      
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <span className="text-sm font-medium text-slate-700">Convert Confirmed Quote to Order:</span>
        <Select
          ariaLabel="Select confirmed quotation"
          value={selectedQuoteId}
          onChange={setSelectedQuoteId}
          options={[
            { value: '', label: 'Select quotation...' },
            ...quotations
              .filter(q => q.status === 'Confirmed' && !convertedQuotationIds.has(q.id))
              .map(q => ({ value: q.id, label: `${q.customerName} (${q.id})` }))
          ]}
          className="flex-1 max-w-xs"
        />
        <Button 
          variant="primary" 
          disabled={!selectedQuoteId || createOrder.isPending}
          onClick={() => createOrder.mutate()}
        >
          Create Order
        </Button>
      </div>

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
