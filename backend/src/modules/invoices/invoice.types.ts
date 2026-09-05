import type { InvoiceStatus, InvoiceType } from '../../types/domain.types.js';

export type CreateInvoiceInput = {
  order: string;
};

export type MarkInvoicePaidInput = {
  paidDate?: string;
};

export type InvoiceView = {
  id: string;
  invoiceNumber: string;
  order?: string;
  customer: string;
  invoiceType: InvoiceType;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  dueDate?: Date;
  paidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};
