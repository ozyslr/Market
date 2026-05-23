/**
 * POST /api/checkout/guest-payment
 * Process payment for guest checkout flow
 *
 * Request body:
 * {
 *   sessionId: string (guest session ID)
 *   paymentMethod: string (card, apple_pay, google_pay, installment, cod, etc)
 *   cartTotal: number
 *   region: string (TR, US, GB, etc)
 *   paymentIntentId?: string (for Stripe)
 *   installmentMonths?: number (for installment plans)
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   orderId?: string
 *   status?: string (pending, confirmed, processing)
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { completeGuestCheckout } from '@/services/guestCheckoutService';
import { createPaymentIntent } from '@/services/paymentGatewayService';

interface GuestPaymentRequest {
  sessionId: string;
  paymentMethod: string;
  cartTotal: number;
  region: string;
  paymentIntentId?: string;
  installmentMonths?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: GuestPaymentRequest = await request.json();

    // Validate required fields
    if (!body.sessionId || !body.paymentMethod || !body.cartTotal) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, paymentMethod, cartTotal' },
        { status: 400 }
      );
    }

    // Get guest checkout session
    const sessionRef = doc(db, 'guest_checkout_sessions', body.sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return NextResponse.json(
        { error: 'Guest session not found' },
        { status: 404 }
      );
    }

    const session = sessionSnap.data();

    // Check if session expired
    const expiresAt = new Date(session.expiresAt);
    if (new Date() > expiresAt) {
      return NextResponse.json(
        { error: 'Checkout session expired' },
        { status: 400 }
      );
    }

    // Handle COD (Cash on Delivery) - no payment processing required
    if (body.paymentMethod === 'cod') {
      const order = await completeGuestCheckout(
        body.sessionId,
        session.email,
        session.phone
      );

      return NextResponse.json({
        success: true,
        orderId: order.id,
        status: 'pending',
        message: 'Order created. You will receive confirmation email shortly.',
      });
    }

    // For card payments, create or use existing payment intent
    let paymentIntentId = body.paymentIntentId;

    if (!paymentIntentId) {
      const intent = await createPaymentIntent({
        amount: Math.round(body.cartTotal * 100), // cents
        currency: body.region === 'TR' ? 'TRY' : 'USD',
        paymentMethod: body.paymentMethod,
        email: session.email,
        metadata: {
          sessionId: body.sessionId,
          type: 'guest_checkout',
        },
      });

      paymentIntentId = intent.id;
    }

    // For installments, return installment plan
    if (body.paymentMethod === 'installment') {
      return NextResponse.json({
        success: true,
        paymentIntentId,
        status: 'pending_payment',
        installmentMonths: body.installmentMonths || 3,
        monthlyAmount: (body.cartTotal / (body.installmentMonths || 3)).toFixed(2),
      });
    }

    // For card/express payments, payment will be confirmed client-side
    // Then webhook will update order status
    return NextResponse.json({
      success: true,
      paymentIntentId,
      status: 'pending_payment',
      message: 'Complete payment to finalize order',
    });
  } catch (error) {
    console.error('[guest-payment] Error processing payment:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Payment processing failed',
      },
      { status: 500 }
    );
  }
}
