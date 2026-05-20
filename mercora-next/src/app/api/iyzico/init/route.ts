import { NextRequest, NextResponse } from 'next/server';

let iyzicoSdk: any = null;

async function getIyzico() {
  if (!iyzicoSdk) {
    const apiKey = process.env.IYZICO_API_KEY || '';
    const secretKey = process.env.IYZICO_SECRET_KEY || '';
    const baseUrl = process.env.IYZICO_BASE_URL || 'https://sandbox.iyzipay.com';
    if (apiKey && secretKey) {
      const mod = await import('O:/AI/E-tic 2026/server/iyzico.cjs');
      const client = mod.createClient({ apiKey, secretKey, uri: baseUrl });
      iyzicoSdk = { client, ...mod };
    } else {
      iyzicoSdk = null;
    }
  }
  return iyzicoSdk;
}

export async function POST(req: NextRequest) {
  try {
    const iyzico = await getIyzico();
    if (!iyzico) {
      return NextResponse.json({ error: 'iyzico not configured', isMock: true }, { status: 503 });
    }

    const { userId, userEmail, userName, total, currency, installment, orderId, items, shippingAddress, buyerPhone } = await req.json();

    const basketItems = (items || []).map((item: any, i: number) => ({
      id: item.productId || String(i),
      name: item.name,
      category1: item.category || 'General',
      itemType: 'PHYSICAL',
      price: String(item.price),
    }));

    const request = {
      locale: 'tr',
      conversationId: orderId,
      price: String(total),
      paidPrice: String(total),
      currency: currency === 'TRY' ? 'TRY' : 'GBP',
      installment: String(installment || 1),
      basketId: orderId,
      paymentGroup: 'PRODUCT',
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/iyzico/callback`,
      buyer: {
        id: userId,
        name: userName?.split(' ')[0] || 'Buyer',
        surname: userName?.split(' ').slice(1).join(' ') || 'Unknown',
        gsmNumber: buyerPhone || '+905555555555',
        email: userEmail,
        identityNumber: '11111111111',
        registrationAddress: shippingAddress?.line1 || 'Address',
        city: shippingAddress?.city || 'Istanbul',
        country: shippingAddress?.country || 'Turkey',
      },
      shippingAddress: {
        contactName: shippingAddress?.fullName || userName,
        city: shippingAddress?.city || 'Istanbul',
        country: shippingAddress?.country || 'Turkey',
        address: shippingAddress?.line1 || 'Address',
      },
      billingAddress: {
        contactName: shippingAddress?.fullName || userName,
        city: shippingAddress?.city || 'Istanbul',
        country: shippingAddress?.country || 'Turkey',
        address: shippingAddress?.line1 || 'Address',
      },
      basketItems,
    };

    const result = await iyzico.createCheckoutForm(iyzico.client, request);

    if (result.status === 'success') {
      return NextResponse.json({
        token: result.token,
        checkoutFormContent: result.checkoutFormContent,
        paymentPageUrl: result.paymentPageUrl,
      });
    } else {
      return NextResponse.json(
        { error: result.errorMessage || 'iyzico initialization failed', errorCode: result.errorCode },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error('iyzico init error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
