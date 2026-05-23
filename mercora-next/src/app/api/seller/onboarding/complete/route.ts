/**
 * POST /api/seller/onboarding/complete
 * Finalize seller onboarding
 *
 * Request body:
 * {
 *   sellerId, storeName, storeSlug, description, businessAddress, taxId, bankAccount,
 *   selectedTier, billingCycle, stripeSubscriptionId, stripePriceId
 * }
 *
 * Response: { success: true, subscriptionId }
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createSubscription } from '@/services/sellerSubscriptionService';
import { SellerSubscriptionTier, BillingCycle } from '@/types';

interface OnboardingCompleteRequest {
  sellerId: string;
  storeName: string;
  storeSlug: string;
  description: string;
  businessAddress: {
    line1: string;
    city: string;
    state: string;
    country: string;
  };
  taxId?: string;
  bankAccount?: {
    accountNumber: string;
    accountHolder: string;
    bankName: string;
  };
  selectedTier: SellerSubscriptionTier;
  billingCycle: BillingCycle;
  stripeSubscriptionId: string;
  stripePriceId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OnboardingCompleteRequest = await request.json();

    // Validate required fields
    if (!body.sellerId || !body.storeName || !body.storeSlug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update seller profile in Firestore
    const sellerRef = doc(db, 'sellers', body.sellerId);

    await updateDoc(sellerRef, {
      storeName: body.storeName,
      slug: body.storeSlug,
      description: body.description,
      businessAddress: body.businessAddress,
      taxId: body.taxId || null,
      bankAccount: body.bankAccount || null,
      onboardingCompleted: true,
      onboardingCompletedAt: Timestamp.now(),
      subscriptionTier: body.selectedTier,
      subscriptionStatus: 'trial', // Trial until first payment
      updatedAt: Timestamp.now(),
    });

    // Create subscription record
    const subscription = await createSubscription(
      body.sellerId,
      body.selectedTier,
      body.billingCycle,
      body.stripeSubscriptionId,
      body.stripePriceId,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial
    );

    // Log onboarding event (for analytics)
    try {
      const logsRef = doc(db, 'sellers', body.sellerId, 'onboarding_logs', 'completed');
      await updateDoc(logsRef, {
        completedAt: Timestamp.now(),
        selectedTier: body.selectedTier,
        billingCycle: body.billingCycle,
      });
    } catch (e) {
      // Ignore if log update fails (doc might not exist)
      console.warn('Failed to log onboarding completion:', e);
    }

    // Send onboarding complete email (async, not blocking)
    try {
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'seller-onboarding-complete',
          to: body.businessAddress.email || 'seller@example.com',
          data: {
            storeName: body.storeName,
            tier: body.selectedTier,
            trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          },
        }),
      });
    } catch (e) {
      console.error('Failed to send onboarding email:', e);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      message: `Welcome to Mercora! Your ${body.selectedTier} plan is now active with 30 days free trial.`,
    });
  } catch (error) {
    console.error('[onboarding/complete] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
