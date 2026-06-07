// E-Fatura integration service
// Paraşüt / Logo API for Turkish e-invoice requirements

const EFATURA_API_URL = process.env.EFATURA_API_URL || '';
const EFATURA_API_KEY = process.env.EFATURA_API_KEY || '';

export async function sendInvoiceToEfatuta(invoice: {
  invoiceNumber: string;
  sellerTaxId: string;
  buyerTaxId: string;
  buyerName: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; vatRate: number }>;
  total: number;
  currency: string;
  date: string;
}): Promise<{ success: boolean; externalId?: string; error?: string }> {
  if (!EFATURA_API_URL || !EFATURA_API_KEY) {
    // E-fatura not configured — store for manual processing
    return {
      success: false,
      error: 'E-Fatura API yapılandırılmamış. Paraşüt/Logo API anahtarı gerekli.',
    };
  }

  try {
    const res = await fetch(EFATURA_API_URL + '/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${EFATURA_API_KEY}` },
      body: JSON.stringify(invoice),
    });
    const data = await res.json();
    return { success: res.ok, externalId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Stub: ready for Paraşüt/Logo API integration
// To enable: set EFATURA_API_URL and EFATURA_API_KEY in .env
export function isEfaturaEnabled(): boolean {
  return !!(EFATURA_API_URL && EFATURA_API_KEY);
}
