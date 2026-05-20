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

/** iyzico browser redirect callback (GET) — user lands here after payment */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') as string;
  const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!token) {
    return NextResponse.redirect(`${frontendUrl}/checkout?iyzico_status=error&reason=missing_token`);
  }

  try {
    const iyzico = await getIyzico();
    if (!iyzico) {
      return NextResponse.redirect(`${frontendUrl}/checkout?iyzico_status=error&reason=not_configured`);
    }

    const result = await iyzico.retrieveCheckoutForm(iyzico.client, { locale: 'tr', token });
    const orderId = result.basketId || '';

    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      return NextResponse.redirect(`${frontendUrl}/checkout?iyzico_status=success&orderId=${orderId}&token=${token}`);
    } else {
      return NextResponse.redirect(
        `${frontendUrl}/checkout?iyzico_status=failed&orderId=${orderId}&reason=${result.errorMessage || 'payment_failed'}`
      );
    }
  } catch (err: any) {
    return NextResponse.redirect(
      `${frontendUrl}/checkout?iyzico_status=error&reason=${encodeURIComponent(err.message)}`
    );
  }
}

/** iyzico callback (POST) — server-to-server payment notification */
export async function POST(req: NextRequest) {
  try {
    const iyzico = await getIyzico();
    if (!iyzico) {
      return NextResponse.json({ error: 'iyzico not configured' }, { status: 503 });
    }

    const { adminDb, FieldValue } = await import('@/lib/firebase-admin');
    const body = await req.json();
    const token = body.token;

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const result = await iyzico.retrieveCheckoutForm(iyzico.client, {
      locale: 'tr',
      token,
    });

    if (result.status === 'success') {
      const orderId = result.basketId;
      if (orderId && adminDb) {
        const orderRef = adminDb.collection('orders').doc(orderId);
        await orderRef.update({
          status: result.paymentStatus === 'SUCCESS' ? 'paid' : 'pending',
          paymentStatus: result.paymentStatus === 'SUCCESS' ? 'succeeded' : 'failed',
          iyzicoPaymentToken: token,
          paidAt: result.paymentStatus === 'SUCCESS' ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
        });

        if (result.paymentStatus === 'SUCCESS') {
          const orderSnap = await orderRef.get();
          const orderData = orderSnap.data();
          if (orderData?.items) {
            for (const item of orderData.items) {
              try {
                await adminDb.collection('products').doc(item.productId).update({
                  stock: FieldValue.increment(-item.quantity),
                });
              } catch (e) {
                console.warn(`Failed to decrease stock for ${item.productId}:`, e);
              }
            }
          }
          if (orderData?.userEmail) {
            try {
              await adminDb.collection('mail').add({
                to: orderData.userEmail,
                message: {
                  subject: `Siparişiniz Alındı — #${orderId.slice(0, 8).toUpperCase()}`,
                  html: `<p>Merhaba,</p><p>Siparişiniz başarıyla alındı. Sipariş numaranız: <strong>${orderId}</strong></p><p>Teşekkür ederiz.</p>`,
                },
              });
            } catch (e) {
              console.warn('Failed to send confirmation email:', e);
            }
          }
        }

        console.log(`iyzico: Order ${orderId} → ${result.paymentStatus}`);
      }
    }

    return NextResponse.json({ status: result.status, paymentStatus: result.paymentStatus });
  } catch (err: any) {
    console.error('iyzico callback error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
