import { Types } from 'mongoose';
import { ApiError } from '../../utils/api-error.js';
import { OrderModel } from '../orders/order.model.js';
import { ProductModel } from '../products/product.model.js';
import { InvoiceModel } from './invoice.model.js';
import type { InvoiceDocument } from './invoice.model.js';
import type { CreateInvoiceInput, InvoiceView, MarkInvoicePaidInput } from './invoice.types.js';

type InvoiceHydrated = ReturnType<typeof InvoiceModel.hydrate>;

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const generateInvoiceNumber = (): string =>
  `INV-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: number }).code === 11000;

const view = (invoice: InvoiceDocument & { _id: Types.ObjectId }): InvoiceView => ({
  id: invoice._id.toString(),
  invoiceNumber: invoice.invoiceNumber,
  order: invoice.order?.toString(),
  customer: invoice.customer.toString(),
  invoiceType: invoice.invoiceType,
  lineItems: invoice.lineItems.map((item) => ({
    id: item._id.toString(),
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  })),
  subtotal: invoice.subtotal,
  tax: invoice.tax,
  total: invoice.total,
  status: invoice.status,
  dueDate: invoice.dueDate,
  paidDate: invoice.paidDate,
  createdAt: invoice.createdAt,
  updatedAt: invoice.updatedAt,
});

const findInvoice = async (id: string): Promise<InvoiceHydrated> => {
  const invoice = await InvoiceModel.findById(id).exec();
  if (!invoice) throw new ApiError(404, 'Invoice not found', 'INVOICE_NOT_FOUND');
  return invoice;
};

export const invoiceService = {
  createFromOrder: async (input: CreateInvoiceInput): Promise<InvoiceView> => {
    const order = await OrderModel.findById(input.order).exec();
    if (!order) throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND');

    const existing = await InvoiceModel.findOne({
      order: order._id,
      invoiceType: 'one_time',
    }).exec();
    if (existing)
      throw new ApiError(
        409,
        'A one-time invoice already exists for this order',
        'INVOICE_ALREADY_EXISTS',
      );

    const lineItems = order.lineItems.filter((item) => !item.isSubscription);
    if (lineItems.length === 0)
      throw new ApiError(422, 'Order has no one-time line items', 'NO_ONE_TIME_ITEMS');

    const productIds = [...new Set(lineItems.map((item) => item.product))];
    const products = await ProductModel.find({ _id: { $in: productIds } })
      .select('name taxRate')
      .exec();
    const productById = new Map(products.map((product) => [product._id.toString(), product]));

    const invoiceLineItems = lineItems.map((item) => {
      const product = productById.get(item.product.toString());
      if (!product)
        throw new ApiError(
          404,
          `Product ${item.product.toString()} not found`,
          'PRODUCT_NOT_FOUND',
        );
      return {
        description: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: roundMoney(item.lineTotal),
        taxRate: product.taxRate,
      };
    });

    const subtotal = roundMoney(invoiceLineItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const tax = roundMoney(
      invoiceLineItems.reduce((sum, item) => sum + item.lineTotal * item.taxRate, 0),
    );
    const invoiceData = {
      order: order._id,
      customer: order.customer,
      invoiceType: 'one_time' as const,
      lineItems: invoiceLineItems.map(({ taxRate: _taxRate, ...item }) => item),
      subtotal,
      tax,
      total: roundMoney(subtotal + tax),
      status: 'sent' as const,
    };

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const invoice = await InvoiceModel.create({
          ...invoiceData,
          invoiceNumber: generateInvoiceNumber(),
        });
        return view(invoice);
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
      }
    }
    throw new ApiError(
      500,
      'Failed to generate a unique invoice number',
      'INVOICE_NUMBER_CONFLICT',
    );
  },

  markPaid: async (id: string, input: MarkInvoicePaidInput): Promise<InvoiceView> => {
    const invoice = await findInvoice(id);
    if (invoice.status === 'paid')
      throw new ApiError(409, 'This invoice has already been paid', 'PAYMENT_ALREADY_RECORDED');
    if (invoice.status === 'cancelled')
      throw new ApiError(409, 'Cancelled invoices cannot be paid', 'INVOICE_NOT_PAYABLE');

    invoice.status = 'paid';
    invoice.paidDate = input.paidDate ? new Date(input.paidDate) : new Date();
    await invoice.save();

    if (invoice.order) {
      const order = await OrderModel.findById(invoice.order).exec();
      if (order && order.lineItems.every((item) => !item.isSubscription)) {
        order.paymentStatus = 'paid';
        await order.save();
      }
    }
    return view(invoice);
  },
};
