import PDFDocument from 'pdfkit';

export type QuotationEmailLineItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
};

export type QuotationEmailData = {
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  customerContactName?: string;
  paymentTerms: string;
  status: string;
  createdAt: string;
  validUntil?: string;
  lineItems: QuotationEmailLineItem[];
  subtotal: number;
  totalDiscount: number;
  tax: number;
  grandTotal: number;
};

const COLORS = {
  ink: '#172B4D',
  muted: '#64748B',
  border: '#D8E0EA',
  blue: '#0B6E99',
  paleBlue: '#EAF4F8',
  white: '#FFFFFF',
} as const;

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value: string | undefined): string =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : 'Not specified';

const drawLabelValue = (
  document: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
): void => {
  document
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(label.toUpperCase(), x, y);
  document
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.ink)
    .text(value, x, y + 13);
};

const drawTableHeader = (document: PDFKit.PDFDocument, y: number, width: number): void => {
  document.roundedRect(48, y, width, 28, 4).fill(COLORS.ink);
  document.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.white);
  document.text('DESCRIPTION', 60, y + 10);
  document.text('QTY', 315, y + 10, { width: 35, align: 'right' });
  document.text('UNIT PRICE', 360, y + 10, { width: 65, align: 'right' });
  document.text('DISCOUNT', 435, y + 10, { width: 55, align: 'right' });
  document.text('AMOUNT', 505, y + 10, { width: 42, align: 'right' });
};

const drawFooter = (document: PDFKit.PDFDocument): void => {
  const pageHeight = document.page.height;
  document
    .moveTo(48, pageHeight - 58)
    .lineTo(document.page.width - 48, pageHeight - 58)
    .strokeColor(COLORS.border)
    .stroke();
  document
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text('DealFlow360  |  Thank you for your business', 48, pageHeight - 44);
  document.text('This document is a quotation and is not an invoice.', 350, pageHeight - 44, {
    width: 197,
    align: 'right',
  });
};

export const createQuotationPdf = async (quotation: QuotationEmailData): Promise<Buffer> => {
  const document = new PDFDocument({
    size: 'A4',
    margin: 48,
    info: {
      Title: `Quotation ${quotation.quoteNumber}`,
      Author: 'DealFlow360',
      Subject: 'Quotation details',
    },
  });
  const chunks: Buffer[] = [];

  return new Promise<Buffer>((resolve, reject) => {
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    const pageWidth = document.page.width;
    const contentWidth = pageWidth - 96;

    document.rect(0, 0, pageWidth, 104).fill(COLORS.ink);
    document
      .font('Helvetica-Bold')
      .fontSize(21)
      .fillColor(COLORS.white)
      .text('DEALFLOW360', 48, 32);
    document.font('Helvetica').fontSize(10).fillColor('#B7D6E3').text('Sales made simple', 50, 60);
    document
      .font('Helvetica-Bold')
      .fontSize(24)
      .fillColor(COLORS.white)
      .text('QUOTATION', 365, 34, {
        width: 182,
        align: 'right',
      });
    document
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#B7D6E3')
      .text(quotation.status.toUpperCase(), 365, 67, {
        width: 182,
        align: 'right',
      });

    drawLabelValue(document, 'Quotation no.', quotation.quoteNumber, 48, 135);
    drawLabelValue(document, 'Created', formatDate(quotation.createdAt), 205, 135);
    drawLabelValue(document, 'Valid until', formatDate(quotation.validUntil), 365, 135);

    document.roundedRect(48, 190, contentWidth, 94, 6).fill(COLORS.paleBlue);
    document
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(COLORS.blue)
      .text('PREPARED FOR', 64, 207);
    document
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(COLORS.ink)
      .text(quotation.customerName, 64, 225);
    document
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text(quotation.customerEmail, 64, 246);
    if (quotation.customerContactName)
      document.text(`Attn: ${quotation.customerContactName}`, 64, 263);
    drawLabelValue(document, 'Payment terms', quotation.paymentTerms, 380, 218);

    let tableY = 326;
    drawTableHeader(document, tableY, contentWidth);
    tableY += 28;

    if (quotation.lineItems.length === 0) {
      document.roundedRect(48, tableY, contentWidth, 48, 0).fill('#F8FAFC').stroke(COLORS.border);
      document
        .font('Helvetica-Oblique')
        .fontSize(10)
        .fillColor(COLORS.muted)
        .text('No line items have been added to this draft quotation yet.', 60, tableY + 18);
      tableY += 48;
    } else {
      quotation.lineItems.forEach((item, index) => {
        const rowHeight = 32;
        if (index % 2 === 0) document.rect(48, tableY, contentWidth, rowHeight).fill('#F8FAFC');
        document.font('Helvetica').fontSize(9).fillColor(COLORS.ink);
        document.text(item.productName, 60, tableY + 11, { width: 255, ellipsis: true });
        document.text(String(item.quantity), 315, tableY + 11, { width: 35, align: 'right' });
        document.text(formatCurrency(item.unitPrice), 360, tableY + 11, {
          width: 65,
          align: 'right',
        });
        document.text(`${item.discountPercent.toFixed(1)}%`, 435, tableY + 11, {
          width: 55,
          align: 'right',
        });
        document.font('Helvetica-Bold').text(formatCurrency(item.lineTotal), 505, tableY + 11, {
          width: 42,
          align: 'right',
        });
        document
          .moveTo(48, tableY + rowHeight)
          .lineTo(547, tableY + rowHeight)
          .strokeColor(COLORS.border)
          .stroke();
        tableY += rowHeight;
      });
    }

    const totalsY = Math.max(tableY + 30, 440);
    document.roundedRect(350, totalsY, 197, 124, 6).fill('#F8FAFC').stroke(COLORS.border);
    document.font('Helvetica').fontSize(10).fillColor(COLORS.muted);
    document.text('Subtotal', 368, totalsY + 18);
    document.text(formatCurrency(quotation.subtotal), 450, totalsY + 18, {
      width: 82,
      align: 'right',
    });
    document.text('Discount', 368, totalsY + 42);
    document.text(`-${formatCurrency(quotation.totalDiscount)}`, 450, totalsY + 42, {
      width: 82,
      align: 'right',
    });
    document.text('Tax', 368, totalsY + 66);
    document.text(formatCurrency(quotation.tax), 450, totalsY + 66, { width: 82, align: 'right' });
    document
      .moveTo(368, totalsY + 89)
      .lineTo(532, totalsY + 89)
      .strokeColor(COLORS.border)
      .stroke();
    document
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(COLORS.ink)
      .text('TOTAL', 368, totalsY + 99);
    document.text(formatCurrency(quotation.grandTotal), 440, totalsY + 98, {
      width: 92,
      align: 'right',
    });

    document
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(
        'Please review the quotation details and contact your DealFlow360 representative with any questions. Pricing and availability are subject to confirmation.',
        48,
        totalsY + 151,
        { width: 270, lineGap: 4 },
      );

    drawFooter(document);
    document.end();
  });
};
