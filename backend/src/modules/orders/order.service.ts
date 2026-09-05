import { Types } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import { QuotationModel } from '../quotations/quotation.model.js';
import { WarehouseModel } from '../warehouses/warehouse.model.js';
import { OrderModel } from './order.model.js';
import type { OrderDocument, OrderLineItem, WarehouseSplit, Backorder } from './order.model.js';
import type {
  CreateOrderInput,
  FulfillmentPreview,
  ManualSplitInput,
  OrderView,
  WarehouseSplitView,
} from './order.types.js';

type WarehouseHydrated = ReturnType<typeof WarehouseModel.hydrate>;
type OrderHydrated = ReturnType<typeof OrderModel.hydrate>;

type RawAllocation = { warehouseId: string; product: string; quantity: number };
type RawBackorder = { product: string; quantityBackordered: number };

const view = (order: OrderDocument & { _id: Types.ObjectId }): OrderView => ({
  id: order._id.toString(),
  orderNumber: order.orderNumber,
  quotation: order.quotation?.toString(),
  customer: order.customer.toString(),
  lineItems: order.lineItems.map((item) => ({
    id: item._id.toString(),
    product: item.product.toString(),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    isSubscription: item.isSubscription,
  })),
  fulfillmentStatus: order.fulfillmentStatus,
  warehouseSplit: order.warehouseSplit.map((split) => ({
    warehouse: split.warehouse.toString(),
    items: split.items.map((item) => ({
      product: item.product.toString(),
      quantity: item.quantity,
    })),
    shippingCost: split.shippingCost,
    status: split.status,
    trackingNumber: split.trackingNumber,
  })),
  backorders: order.backorders.map((backorder) => ({
    product: backorder.product.toString(),
    quantityBackordered: backorder.quantityBackordered,
    status: backorder.status,
  })),
  totalAmount: order.totalAmount,
  paymentStatus: order.paymentStatus,
  promisedDeliveryDate: order.promisedDeliveryDate,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const findOrder = async (orderId: string): Promise<OrderHydrated> => {
  const order = await OrderModel.findById(orderId).exec();
  if (!order) throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');
  return order;
};

const assertFulfillmentPending = (order: OrderDocument): void => {
  if (order.fulfillmentStatus !== 'pending')
    throw new ApiError(
      409,
      'Fulfillment has already been confirmed for this order',
      'ALREADY_FULFILLED',
    );
};

const generateOrderNumber = (): string =>
  `O-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: number }).code === 11000;

// Greedy: for each line item, prioritize whichever active warehouse currently
// holds the most stock of that specific product, allocate from there first,
// then the next-best, until the line is covered or warehouses run out.
// Anything left over becomes a backorder. Stock is tracked locally so two
// line items sharing a product don't double-spend the same units.
const runGreedySplit = (
  lineItems: OrderLineItem[],
  warehouses: WarehouseHydrated[],
): { allocations: RawAllocation[]; backorders: RawBackorder[] } => {
  const remainingStock = new Map<string, number>();
  for (const warehouse of warehouses) {
    for (const stock of warehouse.stockLevels) {
      remainingStock.set(`${warehouse._id.toString()}:${stock.product.toString()}`, stock.quantity);
    }
  }

  const allocations: RawAllocation[] = [];
  const backorders: RawBackorder[] = [];

  for (const item of lineItems) {
    const productId = item.product.toString();
    let remaining = item.quantity;

    const ranked = warehouses
      .map((warehouse) => ({
        warehouseId: warehouse._id.toString(),
        available: remainingStock.get(`${warehouse._id.toString()}:${productId}`) ?? 0,
      }))
      .filter((candidate) => candidate.available > 0)
      .sort((a, b) => b.available - a.available);

    for (const candidate of ranked) {
      if (remaining <= 0) break;
      const allocate = Math.min(remaining, candidate.available);
      allocations.push({
        warehouseId: candidate.warehouseId,
        product: productId,
        quantity: allocate,
      });
      remaining -= allocate;
      remainingStock.set(`${candidate.warehouseId}:${productId}`, candidate.available - allocate);
    }

    if (remaining > 0) backorders.push({ product: productId, quantityBackordered: remaining });
  }

  return { allocations, backorders };
};

const groupAllocationsByWarehouse = (
  allocations: RawAllocation[],
  warehouses: WarehouseHydrated[],
): WarehouseSplitView[] => {
  const warehouseById = new Map(
    warehouses.map((warehouse) => [warehouse._id.toString(), warehouse]),
  );
  const grouped = new Map<string, { product: string; quantity: number }[]>();
  for (const allocation of allocations) {
    const items = grouped.get(allocation.warehouseId) ?? [];
    items.push({ product: allocation.product, quantity: allocation.quantity });
    grouped.set(allocation.warehouseId, items);
  }

  return [...grouped.entries()].map(([warehouseId, items]) => {
    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
    const shippingCostWeight = warehouseById.get(warehouseId)?.shippingCostWeight ?? 1;
    return {
      warehouse: warehouseId,
      items,
      shippingCost: totalUnits * shippingCostWeight,
      status: 'pending',
    };
  });
};

// Shared commit path for both confirm-fulfillment and manual-split: decrement
// the allocated stock, persist the split + backorders onto the order, and
// set fulfillmentStatus. Callers are responsible for having already verified
// every allocation is actually coverable by the given warehouses.
const applySplit = async (
  order: OrderHydrated,
  allocations: RawAllocation[],
  backorders: RawBackorder[],
  warehouses: WarehouseHydrated[],
): Promise<void> => {
  const warehouseById = new Map(
    warehouses.map((warehouse) => [warehouse._id.toString(), warehouse]),
  );
  for (const allocation of allocations) {
    const warehouse = warehouseById.get(allocation.warehouseId);
    const stock = warehouse?.stockLevels.find(
      (level) => level.product.toString() === allocation.product,
    );
    if (stock) stock.quantity -= allocation.quantity;
  }
  await Promise.all(warehouses.map((warehouse) => warehouse.save()));

  const grouped = groupAllocationsByWarehouse(allocations, warehouses);
  order.warehouseSplit = grouped.map(
    (split) =>
      ({
        warehouse: new Types.ObjectId(split.warehouse),
        items: split.items.map((item) => ({
          product: new Types.ObjectId(item.product),
          quantity: item.quantity,
        })),
        shippingCost: split.shippingCost,
        status: 'pending',
      }) as WarehouseSplit,
  );
  order.backorders = backorders.map(
    (backorder) =>
      ({
        product: new Types.ObjectId(backorder.product),
        quantityBackordered: backorder.quantityBackordered,
        status: 'pending',
      }) as Backorder,
  );
  order.fulfillmentStatus = backorders.length > 0 ? 'backordered' : 'in_progress';
  await order.save();
};

export const orderService = {
  createFromQuotation: async (input: CreateOrderInput): Promise<OrderView> => {
    const quotation = await QuotationModel.findById(input.quotation).exec();
    if (!quotation) throw new ApiError(404, 'Quotation not found', 'QUOTATION_NOT_FOUND');
    if (quotation.status !== 'confirmed')
      throw new ApiError(
        409,
        'Only customer-confirmed quotations can be converted to orders',
        'QUOTATION_NOT_CONFIRMED',
      );
    if (quotation.lineItems.length === 0)
      throw new ApiError(422, 'Cannot create an order from an empty quotation', 'EMPTY_QUOTATION');

    const existing = await OrderModel.findOne({ quotation: quotation._id }).exec();
    if (existing)
      throw new ApiError(409, 'An order already exists for this quotation', 'ORDER_ALREADY_EXISTS');

    const orderData = {
      quotation: quotation._id,
      customer: quotation.customer,
      lineItems: quotation.lineItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        isSubscription: item.isSubscription,
      })),
      totalAmount: quotation.grandTotal,
      promisedDeliveryDate: input.promisedDeliveryDate
        ? new Date(input.promisedDeliveryDate)
        : undefined,
    };

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const order = await OrderModel.create({ ...orderData, orderNumber: generateOrderNumber() });
        return view(order);
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
      }
    }
    throw new ApiError(500, 'Failed to generate a unique order number', 'ORDER_NUMBER_CONFLICT');
  },

  calculateFulfillment: async (orderId: string): Promise<FulfillmentPreview> => {
    const order = await findOrder(orderId);
    const warehouses = await WarehouseModel.find({ isActive: true }).exec();
    const { allocations, backorders } = runGreedySplit(order.lineItems, warehouses);

    return {
      warehouseSplit: groupAllocationsByWarehouse(allocations, warehouses),
      backorders: backorders.map((backorder) => ({ ...backorder, status: 'pending' })),
    };
  },

  confirmFulfillment: async (orderId: string): Promise<OrderView> => {
    const order = await findOrder(orderId);
    assertFulfillmentPending(order);

    const warehouses = await WarehouseModel.find({ isActive: true }).exec();
    const { allocations, backorders } = runGreedySplit(order.lineItems, warehouses);

    await applySplit(order, allocations, backorders, warehouses);
    return view(order);
  },

  manualSplit: async (orderId: string, input: ManualSplitInput): Promise<OrderView> => {
    const order = await findOrder(orderId);
    assertFulfillmentPending(order);

    const orderedQtyByProduct = new Map(
      order.lineItems.map((item) => [item.product.toString(), item.quantity]),
    );

    const warehouseIds = [...new Set(input.warehouseSplit.map((entry) => entry.warehouse))];
    const warehouses = await WarehouseModel.find({
      _id: { $in: warehouseIds },
      isActive: true,
    }).exec();
    const warehouseById = new Map(
      warehouses.map((warehouse) => [warehouse._id.toString(), warehouse]),
    );

    const allocations: RawAllocation[] = [];
    const allocatedByProduct = new Map<string, number>();
    const remainingStock = new Map<string, number>();

    for (const entry of input.warehouseSplit) {
      const warehouse = warehouseById.get(entry.warehouse);
      if (!warehouse)
        throw new ApiError(
          404,
          `Warehouse ${entry.warehouse} not found or inactive`,
          'WAREHOUSE_NOT_FOUND',
        );

      for (const item of entry.items) {
        if (!orderedQtyByProduct.has(item.product))
          throw new ApiError(
            422,
            `Product ${item.product} is not part of this order`,
            'PRODUCT_NOT_IN_ORDER',
          );

        const stockKey = `${entry.warehouse}:${item.product}`;
        const stockLevel = warehouse.stockLevels.find(
          (level) => level.product.toString() === item.product,
        );
        const available = remainingStock.get(stockKey) ?? stockLevel?.quantity ?? 0;
        if (item.quantity > available)
          throw new ApiError(
            409,
            `Warehouse ${entry.warehouse} does not have enough stock of product ${item.product}`,
            'INSUFFICIENT_STOCK',
          );
        remainingStock.set(stockKey, available - item.quantity);

        allocations.push({
          warehouseId: entry.warehouse,
          product: item.product,
          quantity: item.quantity,
        });
        allocatedByProduct.set(
          item.product,
          (allocatedByProduct.get(item.product) ?? 0) + item.quantity,
        );
      }
    }

    for (const [product, allocated] of allocatedByProduct) {
      const ordered = orderedQtyByProduct.get(product) ?? 0;
      if (allocated > ordered)
        throw new ApiError(
          422,
          `Allocated quantity for product ${product} exceeds the ordered quantity`,
          'OVER_ALLOCATED',
        );
    }

    const backorders: RawBackorder[] = [...orderedQtyByProduct.entries()]
      .map(([product, ordered]) => ({
        product,
        quantityBackordered: ordered - (allocatedByProduct.get(product) ?? 0),
      }))
      .filter((backorder) => backorder.quantityBackordered > 0);

    await applySplit(order, allocations, backorders, warehouses);
    return view(order);
  },
};
