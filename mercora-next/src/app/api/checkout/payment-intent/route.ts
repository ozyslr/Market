/**
 * POST /api/checkout/payment-intent
 * Create payment intent for checkout
 *
 * Supports:
 * - Stripe (cards, Apple Pay, Google Pay, IDEAL, Bancontact)
 * - Iyzico (Turkish cards, installments)
 * - Cash on Delivery (COD)
 * - PayTR fallback
 *
 * Request body:
 * {
 *   orderId: string,
 *   amount: number,
 *   currency: string,
 *   method: 'card' | 'apple_pay' | 'google_pay' | 'cod' | 'installment',
 *   region: string,
 *   metadata?: { userId, email, etc }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   intent: { id, clientSecret, publishableKey, method, provider }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createPaymentIntent,
  createCODOrder,
  PaymentMethod,
} from '@/services/paymentGatewayService';

interface PaymentIntentRequest {
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  region: string;
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentIntentRequest = await request.json();

    // Validate required fields
    if (!body.orderId || !body.amount || !body.currency || !body.method || !body.region) {
      return NextResponse.json(
        {
          error: 'Missing required fields: orderId, amount, currency, method, region',
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Handle COD separately (no payment processing)
    if (body.method === 'cod') {
      const codIntent = await createCODOrder(
        body.orderId,
        body.amount,
        body.currency,
        body.metadata
      );

      return NextResponse.json({
        success: true,
        intent: {
          id: codIntent.id,
          method: codIntent.method,
          provider: codIntent.primaryProvider,
          status: codIntent.status,
          amount: codIntent.amount,
          currency: codIntent.currency,
          message: 'Cash on Delivery order created. You will pay at delivery.',
        },
      });
    }

    // Create payment intent with provider selection
    const intent = await createPaymentIntent(
      body.orderId,
      body.amount,
      body.currency,
      body.method,
      body.region,
      body.metadata
    );

    return NextResponse.json({
      success: true,
      intent: {
        id: intent.id,
        clientSecret: intent.clientSecret,
        publishableKey: intent.publishableKey,
        method: intent.method,
        provider: intent.primaryProvider,
        status: intent.status,
        currency: intent.currency,
      },
    });
  } catch (error) {
    console.error('[payment-intent] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create payment intent',
      },
      { status: 500 }
    );
  }
}
