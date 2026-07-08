/**
 * E-Fatura (E-Invoice) Service — UBL-TR Format
 *
 * Turkish GİB-compliant e-invoice generation.
 * Mock provider simulates GİB API for development.
 * Plug in real GİB credentials for production.
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';

// ─── Types ──────────────────────────────────────────────────────────────────

export type InvoiceType = 'SATIS' | 'IADE' | 'TEVKIFAT' | 'IHRACAT';
export type InvoiceStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'cancelled';

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  vatRate: number; // e.g. 20 for %20
  vatAmount: number;
  totalAmount: number;
}

export interface InvoiceData {
  id?: string;
  invoiceNumber: string; // Auto-generated: e.g. BEN2026000001
  type: InvoiceType;
  status: InvoiceStatus;

  // Seller info
  sellerId: string;
  sellerName: string;
  sellerTaxNumber: string;
  sellerTaxOffice: string;
  sellerAddress: string;

  // Buyer info
  buyerName: string;
  buyerTaxNumber?: string;
  buyerTaxOffice?: string;
  buyerAddress: string;
  buyerEmail?: string;

  // Order info
  orderId?: string;
  orderDate: string;

  // Financial
  items: InvoiceItem[];
  subtotal: number;
  totalVat: number;
  totalAmount: number;
  currency: string;

  // E-Fatura specific
  /** UUID assigned by GİB */
  ettn?: string;
  /** GİB envelope ID */
  envelopeId?: string;
  /** GİB response status */
  gibStatus?: 'pending' | 'accepted' | 'rejected';
  /** GİB response message */
  gibMessage?: string;

  // Dates
  invoiceDate: string;
  dueDate?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceFilter {
  sellerId?: string;
  status?: InvoiceStatus;
  orderId?: string;
}

// ─── UBL-TR XML Generator ───────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso: string): string {
  return new Date(iso).toISOString().split('T')[0];
}

/**
 * Generate UBL-TR 2.1 compliant e-invoice XML.
 * Format: Basic Invoice (TEMELFATURA)
 */
export function generateUblTrXml(invoice: InvoiceData): string {
  const profileId = 'TEMELFATURA';
  const invoiceTypeCode = invoice.type;

  const itemXml = invoice.items
    .map(
      (item, idx) => `
    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="C62">${item.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${invoice.currency}">${item.totalAmount.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${invoice.currency}">${item.vatAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="${invoice.currency}">${(item.totalAmount - item.vatAmount).toFixed(2)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="${invoice.currency}">${item.vatAmount.toFixed(2)}</cbc:TaxAmount>
          <cbc:Percent>${item.vatRate}</cbc:Percent>
          <cac:TaxCategory>
            <cac:TaxScheme>
              <cbc:Name>KDV</cbc:Name>
              <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
            </cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Name>${escapeXml(item.name)}</cbc:Name>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${invoice.currency}">${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>${profileId}</cbc:ProfileID>
  <cbc:ID>${invoice.invoiceNumber}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${invoice.ettn || ''}</cbc:UUID>
  <cbc:IssueDate>${formatDate(invoice.invoiceDate)}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>${invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${invoice.currency}</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>${invoice.sellerTaxNumber}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXml(invoice.sellerName)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(invoice.sellerAddress)}</cbc:StreetName>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>${escapeXml(invoice.sellerTaxOffice)}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>${invoice.buyerTaxNumber || ''}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${escapeXml(invoice.buyerName)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(invoice.buyerAddress)}</cbc:StreetName>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>${escapeXml(invoice.buyerTaxOffice || '')}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${invoice.currency}">${invoice.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoice.currency}">${invoice.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoice.currency}">${invoice.totalAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoice.currency}">${invoice.totalAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${itemXml}
</Invoice>`;
}

// ─── Invoice Number Generator ────────────────────────────────────────────────

let _counter: number | null = null;

async function getNextInvoiceNumber(): Promise<string> {
  if (_counter === null) {
    // Load from Firestore counter or start from 1
    const snap = await getDocs(
      query(
        collection(db, 'invoices'),
        orderBy('invoiceNumber', 'desc'),
        where('invoiceNumber', '>=', 'BEN'),
        where('invoiceNumber', '<', 'BEO'),
      ),
    );
    // Fallback: count existing invoices
    _counter = snap.size + 1;
  }
  _counter++;
  const prefix = 'BEN'; // Benim Olan prefix
  const year = new Date().getFullYear().toString().slice(2);
  return `${prefix}${year}${String(_counter).padStart(6, '0')}`;
}

// ─── GİB Submission (via server API) ─────────────────────────────────────────

async function sendToGibViaApi(
  invoiceId: string,
): Promise<{
  success: boolean;
  ettn?: string;
  envelopeId?: string;
  message?: string;
  data?: InvoiceData;
}> {
  const { auth } = await import('@/lib/firebase');
  const user = auth.currentUser;
  if (!user) throw new Error('Oturum acmaniz gerekiyor');

  const token = await user.getIdToken();
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const resp = await fetch(`${baseUrl}/api/invoices/${invoiceId}/send-to-gib`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(err.error || 'GIB gönderimi başarısız');
  }

  const result = await resp.json();
  return {
    success: result.success,
    ettn: result.data?.ettn,
    envelopeId: result.data?.envelopeId,
    message: result.message,
    data: result.data,
  };
}

// ─── CRUD ───────────────────────────────────────────────────────────────────

const COL = 'invoices';

export async function createInvoice(
  sellerId: string,
  data: Omit<
    InvoiceData,
    | 'id'
    | 'invoiceNumber'
    | 'status'
    | 'ettn'
    | 'envelopeId'
    | 'gibStatus'
    | 'sentAt'
    | 'createdAt'
    | 'updatedAt'
    | 'sellerId'
  >,
): Promise<InvoiceData> {
  try {
    const now = new Date().toISOString();
    const invoiceNumber = await getNextInvoiceNumber();
    const invoice: InvoiceData = {
      ...data,
      invoiceNumber,
      status: 'draft',
      sellerId,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await addDoc(collection(db, COL), invoice);
    return { id: ref.id, ...invoice };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COL);
    throw error;
  }
}

export async function sendInvoiceToGib(invoiceId: string): Promise<InvoiceData> {
  try {
    // Call server-side GIB API (handles real GIB or mock fallback)
    const gibResult = await sendToGibViaApi(invoiceId);

    // If the server returned the updated invoice data, use it directly
    if (gibResult.data) {
      return gibResult.data;
    }

    // Fallback: read and update locally (should not normally happen)
    const snap = await getDocs(query(collection(db, COL), where('__name__', '==', invoiceId)));
    if (snap.empty) throw new Error('Fatura bulunamadı');
    const invoice = { id: snap.docs[0].id, ...snap.docs[0].data() } as InvoiceData;

    const now = new Date().toISOString();
    const updates: Partial<InvoiceData> = {
      status: gibResult.success ? 'sent' : 'rejected',
      gibStatus: gibResult.success ? 'accepted' : 'rejected',
      gibMessage: gibResult.message || '',
      sentAt: gibResult.success ? now : undefined,
      ettn: gibResult.ettn,
      envelopeId: gibResult.envelopeId,
      updatedAt: now,
    };

    await updateDoc(doc(db, COL, invoiceId), updates);
    return { ...invoice, ...updates };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${invoiceId}`);
    throw error;
  }
}

export async function getInvoices(filter?: InvoiceFilter): Promise<InvoiceData[]> {
  try {
    const constraints: any[] = [orderBy('createdAt', 'desc')];
    if (filter?.sellerId) constraints.push(where('sellerId', '==', filter.sellerId));
    if (filter?.status) constraints.push(where('status', '==', filter.status));
    if (filter?.orderId) constraints.push(where('orderId', '==', filter.orderId));
    const q = query(collection(db, COL), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InvoiceData);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function getInvoiceById(invoiceId: string): Promise<InvoiceData | null> {
  try {
    const snap = await getDocs(query(collection(db, COL), where('__name__', '==', invoiceId)));
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as InvoiceData;
  } catch {
    return null;
  }
}

export async function cancelInvoice(invoiceId: string): Promise<void> {
  try {
    await updateDoc(doc(db, COL, invoiceId), {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${invoiceId}`);
    throw error;
  }
}

/**
 * Auto-generate invoice when an order is shipped.
 * Called from order flow — non-blocking.
 */
export async function autoGenerateInvoice(
  orderId: string,
  sellerId: string,
  orderDate: string,
  items: { name: string; quantity: number; price: number; subtotal: number }[],
  buyerName: string,
  buyerAddress: string,
  totalAmount: number,
  currency: string,
): Promise<InvoiceData | null> {
  try {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0);
    const totalVat = Math.round(totalAmount - subtotal * 100) / 100;

    const invoiceItems: InvoiceItem[] = items.map((item) => {
      const vatRate = 20; // Default KDV
      const vatAmount = Math.round(((item.subtotal * vatRate) / (100 + vatRate)) * 100) / 100;
      return {
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        vatRate,
        vatAmount,
        totalAmount: item.subtotal,
      };
    });

    const invoice = await createInvoice(sellerId, {
      type: 'SATIS',
      sellerName: 'Benim Olan Satıcı',
      sellerTaxNumber: '1111111111',
      sellerTaxOffice: 'İstanbul',
      sellerAddress: 'İstanbul, Türkiye',
      buyerName,
      buyerAddress,
      buyerEmail: undefined,
      orderId,
      orderDate,
      items: invoiceItems,
      subtotal,
      totalVat,
      totalAmount,
      currency,
      invoiceDate: new Date().toISOString(),
    });

    // Auto-send to GİB (non-blocking)
    sendInvoiceToGib(invoice.id!).catch(() => {});

    return invoice;
  } catch {
    return null;
  }
}

/** Download invoice as UBL-TR XML */
export function downloadInvoiceXml(invoice: InvoiceData): void {
  const xml = generateUblTrXml(invoice);
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `e-fatura-${invoice.invoiceNumber}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download invoice as human-readable text summary */
export function downloadInvoiceText(invoice: InvoiceData): void {
  const text = [
    `BENİM OLAN — E-FATURA`,
    `Fatura No: ${invoice.invoiceNumber}`,
    `ETTN: ${invoice.ettn || 'Bekliyor'}`,
    `Tarih: ${new Date(invoice.invoiceDate).toLocaleDateString('tr-TR')}`,
    `Tür: ${invoice.type}`,
    `Durum: ${invoice.status}`,
    ``,
    `Satıcı: ${invoice.sellerName} (VKN: ${invoice.sellerTaxNumber})`,
    `Alıcı: ${invoice.buyerName}`,
    ``,
    `Ürünler:`,
    ...invoice.items.map(
      (i) =>
        `  ${i.name} x${i.quantity} — ${i.unitPrice.toFixed(2)} ₺ (KDV %${i.vatRate}) = ${i.totalAmount.toFixed(2)} ₺`,
    ),
    ``,
    `Ara Toplam: ${invoice.subtotal.toFixed(2)} ₺`,
    `KDV: ${invoice.totalVat.toFixed(2)} ₺`,
    `Genel Toplam: ${invoice.totalAmount.toFixed(2)} ₺`,
  ].join('\n');

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fatura-${invoice.invoiceNumber}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
