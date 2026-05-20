import { NextRequest, NextResponse } from 'next/server';

let iyzicoSdk: any = null;

async function getIyzico() {
  if (!iyzicoSdk) {
    const apiKey = process.env.IYZICO_API_KEY || '';
    const secretKey = process.env.IYZICO_SECRET_KEY || '';
    const baseUrl = process.env.IYZICO_BASE_URL || 'https://sandbox.iyzipay.com';
    if (apiKey && secretKey) {
      const mod = await import('@/lib/iyzico.cjs');
      const client = mod.createClient({ apiKey, secretKey, uri: baseUrl });
      iyzicoSdk = { client, ...mod };
    } else {
      iyzicoSdk = null;
    }
  }
  return iyzicoSdk;
}

export async function GET(req: NextRequest) {
  try {
    const iyzico = await getIyzico();
    if (!iyzico) {
      return NextResponse.json({ installments: [] });
    }

    const bin = req.nextUrl.searchParams.get('bin');
    const amount = req.nextUrl.searchParams.get('amount');

    const request: any = { locale: 'tr' };
    if (bin) request.binNumber = String(bin);
    if (amount) request.price = String(amount);

    const result = await iyzico.getInstallmentOptions(iyzico.client, request);

    if (result.status === 'success') {
      return NextResponse.json({ installments: result.installmentDetails || [] });
    } else {
      return NextResponse.json({ installments: [] });
    }
  } catch (err: any) {
    console.error('iyzico installments error:', err);
    return NextResponse.json({ installments: [] });
  }
}
