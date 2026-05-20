import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { amount, currency = 'gbp', orderId } = await req.json();
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey || stripeKey === 'YOUR_STRIPE_SECRET_KEY') {
    console.warn('STRIPE_SECRET_KEY not set, using mock response.');
    return NextResponse.json({
      clientSecret: 'mock_secret_' + Math.random().toString(36).substring(7),
      isMock: true,
    });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-03-31.basil' as any });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: orderId || '' },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
