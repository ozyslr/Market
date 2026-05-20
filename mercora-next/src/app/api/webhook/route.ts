import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set — skipping webhook verification');
    return NextResponse.json({ received: true });
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-03-31.basil' as any,
  });

  const { adminDb } = await import('@/lib/firebase-admin');
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  console.log(`Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (orderId && adminDb) {
          await adminDb.collection('orders').doc(orderId).update({
            status: 'paid',
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            stripePaymentIntentId: session.payment_intent as string,
          });
          console.log(`Order ${orderId} marked as paid`);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent ${pi.id} succeeded: ${pi.amount} ${pi.currency}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const failedPi = event.data.object as Stripe.PaymentIntent;
        const failedOrderId = failedPi.metadata?.orderId;
        if (failedOrderId && adminDb) {
          await adminDb.collection('orders').doc(failedOrderId).update({
            status: 'cancelled',
            updatedAt: new Date().toISOString(),
          });
          console.log(`Order ${failedOrderId} cancelled due to payment failure`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  return NextResponse.json({ received: true });
}
