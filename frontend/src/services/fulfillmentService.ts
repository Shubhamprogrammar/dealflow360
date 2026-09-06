import { api } from '@/lib/api/apiClient';
import { mapFulfillmentOrder, mapStockRow, mapSplitLine } from '@/lib/mapper/mappers';
import type { FulfillmentOrder, SplitLine, StockRow } from '@/types';

// Mock list of orders for the fulfillment list page since backend doesn't have GET /orders
let _mockOrders: FulfillmentOrder[] = [];

export const fulfillmentService = {
  // Store a created order from quotation in the mock list so it appears in the UI
  _addLocalOrder: (order: FulfillmentOrder) => {
    _mockOrders.push(order);
  },

  list: async (): Promise<FulfillmentOrder[]> => {
    return _mockOrders;
  },
  get: async (id: string): Promise<FulfillmentOrder> => {
    // If we have it locally, return it
    const local = _mockOrders.find(o => o.id === id);
    if (local) return local;
    
    // Fallback: try to calculate fulfillment for a given quotation id to simulate fetching an order
    const res = await api.post<any>(`/orders/${id}/calculate-fulfillment`);
    return mapFulfillmentOrder(res.data);
  },
  listStock: async (): Promise<StockRow[]> => {
    const res = await api.get<any>('/warehouses');
    const warehouses = res.data ?? [];
    const stockRows: StockRow[] = [];
    
    for (const w of warehouses) {
      for (const s of (w.stock ?? [])) {
        stockRows.push(mapStockRow(w, s));
      }
    }
    
    return stockRows;
  },
  acceptSplit: async (id: string): Promise<FulfillmentOrder> => {
    const res = await api.post<any>(`/orders/${id}/confirm-fulfillment`);
    const order = mapFulfillmentOrder(res.data);
    _mockOrders = _mockOrders.map(o => o.id === id ? order : o);
    return order;
  },
  overrideSplit: async (id: string, split: SplitLine[]): Promise<FulfillmentOrder> => {
    const body = {
      split: split.map(s => ({
        warehouseId: s.warehouseId,
        quantity: s.qty,
      })),
    };
    const res = await api.post<any>(`/orders/${id}/manual-split`, body);
    const order = mapFulfillmentOrder(res.data);
    _mockOrders = _mockOrders.map(o => o.id === id ? order : o);
    return order;
  },
};
