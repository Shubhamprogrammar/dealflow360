import type { CustomerDocument } from '../customers/customer.model.js';
import type { QuotationDocument } from './quotation.model.js';
import type { QuotationEmailData } from './quotation.pdf.js';

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const buildQuotationEmail = (
  quotation: QuotationDocument,
  customer: CustomerDocument,
): { to: string; subject: string; text: string; html: string; quotation: QuotationEmailData } => {
  const contactName = customer.contactName?.trim();
  const greeting = contactName ? `Hello ${contactName},` : `Hello ${customer.companyName},`;
  const data: QuotationEmailData = {
    quoteNumber: quotation.quoteNumber,
    customerName: customer.companyName,
    customerEmail: customer.contactEmail,
    customerContactName: contactName,
    paymentTerms: customer.paymentTerms,
    status: quotation.status,
    createdAt: quotation.createdAt.toISOString(),
    validUntil: quotation.validUntil?.toISOString(),
    lineItems: quotation.lineItems.map((item) => {
      const product = item.product as unknown as { name?: string };
      return {
        productName: product.name || 'Product',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        lineTotal: item.lineTotal,
      };
    }),
    subtotal: quotation.subtotal,
    totalDiscount: quotation.totalDiscount,
    tax: quotation.tax,
    grandTotal: quotation.grandTotal,
  };

  const text = `${greeting}

Your DealFlow360 quotation ${quotation.quoteNumber} has been created.

The quotation PDF is attached for your records. This is currently a draft and does not contain line items yet. Your sales representative will share the completed quotation when it is ready.

Current total: ${formatCurrency(quotation.grandTotal)}

Regards,
DealFlow360`;

  const safeName = escapeHtml(customer.contactName || customer.companyName);
  const html = `<div style="font-family:Arial,sans-serif;color:#172B4D;line-height:1.6;max-width:640px">
  <div style="background:#172B4D;padding:24px 28px;color:#fff"><div style="font-size:20px;font-weight:700;letter-spacing:1px">DEALFLOW360</div><div style="font-size:12px;color:#B7D6E3;margin-top:4px">Quotation notification</div></div>
  <div style="padding:28px">
    <p style="font-size:16px">${safeName},</p>
    <p>Your quotation <strong>${escapeHtml(quotation.quoteNumber)}</strong> has been created.</p>
    <p>The professionally formatted quotation PDF is attached for your records. This is currently a draft; line items will be included in the completed quotation.</p>
    <div style="background:#EAF4F8;border-radius:6px;padding:16px 18px;margin:22px 0"><div style="font-size:12px;color:#64748B;text-transform:uppercase">Current total</div><div style="font-size:22px;font-weight:700;margin-top:4px">${formatCurrency(quotation.grandTotal)}</div></div>
    <p style="color:#64748B;font-size:13px">Please contact your DealFlow360 representative if you have any questions.</p>
    <p>Regards,<br><strong>DealFlow360</strong></p>
  </div>
</div>`;

  return {
    to: customer.contactEmail,
    subject: `Quotation ${quotation.quoteNumber} has been created`,
    text,
    html,
    quotation: data,
  };
};
