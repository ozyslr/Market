import PDFDocument from 'pdfkit';

interface OrderData {
  id: string;
  buyerName: string;
  buyerAddress: string;
  buyerCountry: string;
  sellerName: string;
  sellerAddress: string;
  sellerTaxId: string;
  items: Array<{
    description: string;
    hsCode: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  shipping: number;
  vat: number;
  total: number;
  currency: string;
}

function formatPrice(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
}

export async function generateCommercialInvoice(order: OrderData): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Bilingual header
    doc.fontSize(18).font('Helvetica-Bold').text('COMMERCIAL INVOICE', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('TİCARİ FATURA', { align: 'center' });
    doc.moveDown(1);

    // Invoice details
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`Invoice #: INV-${order.id.slice(0, 8).toUpperCase()}`);
    doc.font('Helvetica').text(`Date: ${new Date().toISOString().slice(0, 10)}`);
    doc.text(`Country of Origin: Türkiye (TR)`);
    doc.moveDown(0.5);

    // Seller info
    doc.font('Helvetica-Bold').text('Seller / Satıcı:');
    doc.font('Helvetica').text(`${order.sellerName}`);
    doc.text(`${order.sellerAddress}`);
    if (order.sellerTaxId) doc.text(`Tax ID: ${order.sellerTaxId}`);
    doc.moveDown(0.5);

    // Buyer info
    doc.font('Helvetica-Bold').text('Buyer / Alıcı:');
    doc.font('Helvetica').text(`${order.buyerName}`);
    doc.text(`${order.buyerAddress}`);
    doc.text(`${order.buyerCountry}`);
    doc.moveDown(1);

    // Items table
    doc.font('Helvetica-Bold');
    const tableTop = doc.y;
    doc.text('Description', 50, tableTop);
    doc.text('HS Code', 280, tableTop);
    doc.text('Qty', 380, tableTop);
    doc.text('Unit Price', 430, tableTop);
    doc.text('Total', 510, tableTop);
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);

    doc.font('Helvetica');
    for (const item of order.items) {
      const y = doc.y;
      doc.text(item.description, 50, y, { width: 220 });
      doc.text(item.hsCode || '6117.90', 280, y);
      doc.text(String(item.quantity), 380, y);
      doc.text(formatPrice(item.unitPrice, order.currency), 430, y);
      doc.text(formatPrice(item.unitPrice * item.quantity, order.currency), 510, y);
      doc.moveDown(0.3);
    }

    doc.moveDown(1);

    // Totals
    const rightX = 400;
    doc.font('Helvetica').text('Subtotal:', rightX, doc.y);
    doc.text(formatPrice(order.subtotal, order.currency), 510, doc.y - 14);
    doc.text('Shipping:', rightX);
    doc.text(formatPrice(order.shipping, order.currency), 510, doc.y - 14);
    doc.text('VAT:', rightX);
    doc.text(formatPrice(order.vat, order.currency), 510, doc.y - 14);
    doc.moveDown(0.3);
    doc.moveTo(rightX, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').text('TOTAL:', rightX);
    doc.text(formatPrice(order.total, order.currency), 510, doc.y - 14);

    doc.moveDown(2);
    doc
      .fontSize(8)
      .font('Helvetica')
      .text('This invoice is electronically generated and valid without signature.', {
        align: 'center',
      });

    doc.end();
  });
}

export async function generateProformaInvoice(order: OrderData): Promise<Buffer> {
  const buf = await generateCommercialInvoice(order);
  // For MVP, proforma = commercial invoice with different header
  // In production, proforma would differ (no VAT, estimated values)
  return buf;
}
