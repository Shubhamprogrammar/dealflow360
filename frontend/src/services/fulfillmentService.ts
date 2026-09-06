import { api } from '@/lib/api/apiClient';
import { mapFulfillmentOrder, mapStockRow, mapSplitLine } from '@/lib/mapper/mappers';
import type { FulfillmentOrder, SplitLine, StockRow } from '@/types';

export const fulfillmentService = {
  list: async (): Promise<FulfillmentOrder[]> => {
    const res = await api.get<any[]>('/orders?page=1&limit=100');
    return (res.data ?? []).map(mapFulfillmentOrder);
  },
  // Order ids that already have an order created for them, so the "Convert
  // Confirmed Quote to Order" dropdown doesn't offer a quote a second time
  // (the backend rejects a duplicate with ORDER_ALREADY_EXISTS).
  listConvertedQuotationIds: async (): Promise<Set<string>> => {
    const res = await api.get<any[]>('/orders?page=1&limit=100');
    return new Set((res.data ?? []).map((o: any) => o.quotation).filter(Boolean));
  },
  get: async (id: string): Promise<FulfillmentOrder> => {
    const res = await api.get<any>(`/orders/${id}`);
    return mapFulfillmentOrder(res.data);
  },
  listStock: async (): Promise<StockRow[]> => {
    // The warehouse endpoint never populates stockLevels.product (it stays a
    // raw id), so product names have to be resolved separately here.
    const [warehousesRes, productsRes] = await Promise.all([
      api.get<any>('/warehouses?limit=100'),
      api.get<any>('/products?page=1&limit=100'),
    ]);
    const warehouses = warehousesRes.data ?? [];
    const productNameById = new Map<string, string>(
      (productsRes.data ?? []).map((p: any) => [p._id ?? p.id, p.name]),
    );
    const stockRows: StockRow[] = [];

    for (const w of warehouses) {
      for (const s of (w.stockLevels ?? [])) {
        const productId = typeof s.product === 'object' ? s.product?._id : s.product;
        stockRows.push(mapStockRow(w, { ...s, productName: productNameById.get(productId) ?? 'Unknown' }));
      }
    }

    return stockRows;
  },
  acceptSplit: async (id: string): Promise<FulfillmentOrder> => {
    const res = await api.post<any>(`/orders/${id}/confirm-fulfillment`);
    return mapFulfillmentOrder(res.data);
  },
  overrideSplit: async (id: string, split: SplitLine[]): Promise<FulfillmentOrder> => {
    // Known limitation: the backend expects a per-product breakdown
    // (warehouseSplit: [{ warehouse, items: [{ product, quantity }] }]), but
    // SplitLine only carries an aggregate warehouse-level quantity -- there's
    // no per-product editing UI yet. This will only behave correctly for a
    // single-product order.
    const order = await api.get<any>(`/orders/${id}`);
    const product = order.data.lineItems?.[0]?.product;
    const body = {
      warehouseSplit: split.map((s) => ({
        warehouse: s.warehouseId,
        items: product ? [{ product, quantity: s.qty }] : [],
      })),
    };
    const res = await api.post<any>(`/orders/${id}/manual-split`, body);
    return mapFulfillmentOrder(res.data);
  },
};
