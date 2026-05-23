/**
 * Seller Subscription Service
 * Manages subscription lifecycle, billing, and tier management
 *
 * Firestore Collections:
 * - sellers/{sellerId}/subscriptions/{subscriptionId}
 * - sellers/{sellerId}/billing/invoices/{invoiceId}
 * - platform/subscription_config
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  WriteBatch,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  SellerSubscription,
  SellerSubscriptionTier,
  SellerSubscriptionTierBenefits,
  SellerBillingInvoice,
  SubscriptionStatus,
  BillingCycle,
} from '@/types';

// Firestore collection paths
const SELLERS_COLLECTION = 'sellers';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const BILLING_COLLECTION = 'billing';
const INVOICES_COLLECTION = 'invoices';
const SUBSCRIPTION_CONFIG = 'subscription_config';

/**
 * Tier Benefits Configuration
 * Updated from spec: Standard/Pro/Enterprise with escalating benefits
 */
export const TIER_BENEFITS: Record<SellerSubscriptionTier, SellerSubscriptionTierBenefits> = {
  standard: {
    maxProducts: 10,
    inventorySyncApi: false,
    advancedAnalytics: false,
    featuredListings: false,
    featuredBadge: false,
    prioritySupport: 'none',
    dedicatedAccountManager: false,
    whiteLabelOptions: false,
    customIntegrations: false,
    commissionRate: 0.1, // 10%
    monthlyPrice: 0,
    yearlyPrice: 0,
  },
  pro: {
    maxProducts: 100,
    inventorySyncApi: true,
    advancedAnalytics: true,
    featuredListings: true,
    featuredBadge: true,
    prioritySupport: 'email',
    dedicatedAccountManager: false,
    whiteLabelOptions: false,
    customIntegrations: false,
    commissionRate: 0.08, // 8%
    monthlyPrice: 9.99,
    yearlyPrice: 99.9,
  },
  enterprise: {
    maxProducts: -1, // unlimited
    inventorySyncApi: true,
    advancedAnalytics: true,
    featuredListings: true,
    featuredBadge: true,
    prioritySupport: 'phone',
    dedicatedAccountManager: true,
    whiteLabelOptions: true,
    customIntegrations: true,
    commissionRate: 0.05, // 5%
    monthlyPrice: 49.99,
    yearlyPrice: 499.9,
  },
};

/**
 * Get seller's current subscription
 */
export async function getSellerSubscription(
  sellerId: string
): Promise<SellerSubscription | null> {
  try {
    const subscriptionRef = doc(
      db,
      SELLERS_COLLECTION,
      sellerId,
      SUBSCRIPTIONS_COLLECTION,
      'current'
    );
    const snapshot = await getDoc(subscriptionRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as SellerSubscription;
  } catch (error) {
    console.error(`[sellerSubscriptionService] Error fetching subscription for ${sellerId}:`, error);
    throw error;
  }
}

/**
 * Create new subscription for seller
 * Called during onboarding or tier upgrade
 */
export async function createSubscription(
  sellerId: string,
  tier: SellerSubscriptionTier,
  billingCycle: BillingCycle = 'monthly',
  stripeSubscriptionId?: string,
  stripePriceId?: string,
  trialEndDate?: Date
): Promise<SellerSubscription> {
  try {
    const now = new Date();
    const currentPeriodEnd = new Date();

    // Set period end based on billing cycle
    if (billingCycle === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }

    const subscription: SellerSubscription = {
      id: `sub_${Date.now()}`,
      sellerId,
      tier,
      status: trialEndDate ? 'trial' : 'active',
      billingCycle,
      stripeSubscriptionId,
      stripePriceId,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: currentPeriodEnd.toISOString(),
      trialEndDate: trialEndDate?.toISOString(),
      autoRenew: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const subscriptionRef = doc(
      db,
      SELLERS_COLLECTION,
      sellerId,
      SUBSCRIPTIONS_COLLECTION,
      'current'
    );

    await setDoc(subscriptionRef, subscription, { merge: true });

    // Update seller tier in main sellers collection
    const sellerRef = doc(db, SELLERS_COLLECTION, sellerId);
    await updateDoc(sellerRef, {
      subscriptionTier: tier,
      subscriptionStatus: subscription.status,
      updatedAt: Timestamp.now(),
    });

    return subscription;
  } catch (error) {
    console.error(
      `[sellerSubscriptionService] Error creating subscription for ${sellerId}:`,
      error
    );
    throw error;
  }
}

/**
 * Upgrade or downgrade seller subscription tier
 */
export async function changeTier(
  sellerId: string,
  newTier: SellerSubscriptionTier,
  stripeSubscriptionId?: string
): Promise<SellerSubscription> {
  try {
    const currentSub = await getSellerSubscription(sellerId);
    if (!currentSub) {
      throw new Error(`No active subscription found for seller ${sellerId}`);
    }

    const now = new Date();
    const updated: Partial<SellerSubscription> = {
      tier: newTier,
      stripeSubscriptionId: stripeSubscriptionId || currentSub.stripeSubscriptionId,
      updatedAt: now.toISOString(),
    };

    const subscriptionRef = doc(
      db,
      SELLERS_COLLECTION,
      sellerId,
      SUBSCRIPTIONS_COLLECTION,
      'current'
    );

    await updateDoc(subscriptionRef, updated);

    // Update seller tier
    const sellerRef = doc(db, SELLERS_COLLECTION, sellerId);
    await updateDoc(sellerRef, {
      subscriptionTier: newTier,
      updatedAt: Timestamp.now(),
    });

    return { ...currentSub, ...updated } as SellerSubscription;
  } catch (error) {
    console.error(`[sellerSubscriptionService] Error changing tier for ${sellerId}:`, error);
    throw error;
  }
}

/**
 * Cancel subscription (soft delete)
 */
export async function cancelSubscription(
  sellerId: string,
  reason?: string
): Promise<SellerSubscription> {
  try {
    const currentSub = await getSellerSubscription(sellerId);
    if (!currentSub) {
      throw new Error(`No active subscription found for seller ${sellerId}`);
    }

    const now = new Date();
    const updated: Partial<SellerSubscription> = {
      status: 'cancelled',
      autoRenew: false,
      cancelledAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const subscriptionRef = doc(
      db,
      SELLERS_COLLECTION,
      sellerId,
      SUBSCRIPTIONS_COLLECTION,
      'current'
    );

    await updateDoc(subscriptionRef, updated);

    // Revert to standard tier
    const sellerRef = doc(db, SELLERS_COLLECTION, sellerId);
    await updateDoc(sellerRef, {
      subscriptionTier: 'standard',
      subscriptionStatus: 'cancelled',
      updatedAt: Timestamp.now(),
    });

    // Log cancellation reason if provided
    if (reason) {
      const logsRef = doc(
        db,
        SELLERS_COLLECTION,
        sellerId,
        'cancellation_logs',
        `${Date.now()}`
      );
      await setDoc(logsRef, {
        reason,
        timestamp: Timestamp.now(),
      });
    }

    return { ...currentSub, ...updated } as SellerSubscription;
  } catch (error) {
    console.error(`[sellerSubscriptionService] Error cancelling subscription for ${sellerId}:`, error);
    throw error;
  }
}

/**
 * Pause subscription
 */
export async function pauseSubscription(sellerId: string): Promise<SellerSubscription> {
  try {
    const currentSub = await getSellerSubscription(sellerId);
    if (!currentSub) {
      throw new Error(`No active subscription found for seller ${sellerId}`);
    }

    const updated: Partial<SellerSubscription> = {
      status: 'paused',
      autoRenew: false,
      updatedAt: new Date().toISOString(),
    };

    const subscriptionRef = doc(
      db,
      SELLERS_COLLECTION,
      sellerId,
      SUBSCRIPTIONS_COLLECTION,
      'current'
    );

    await updateDoc(subscriptionRef, updated);

    return { ...currentSub, ...updated } as SellerSubscription;
  } catch (error) {
    console.error(`[sellerSubscriptionService] Error pausing subscription for ${sellerId}:`, error);
    throw error;
  }
}

/**
 * Resume paused subscription
 */
export async function resumeSubscription(sellerId: string): Promise<SellerSubscription> {
  try {
    const currentSub = await getSellerSubscription(sellerId);
    if (!currentSub) {
      throw new Error(`No active subscription found for seller ${sellerId}`);
    }

    if (currentSub.status !== 'paused') {
      throw new Error('Subscription is not paused');
    }

    const now = new Date();
    const currentPeriodEnd = new Date(currentSub.currentPeriodEnd);
    // Extend period by 1 cycle
    if (currentSub.billingCycle === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }

    const updated: Partial<SellerSubscription> = {
      status: 'active',
      autoRenew: true,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: currentPeriodEnd.toISOString(),
      updatedAt: now.toISOString(),
    };

    const subscriptionRef = doc(
      db,
      SELLERS_COLLECTION,
      sellerId,
      SUBSCRIPTIONS_COLLECTION,
      'current'
    );

    await updateDoc(subscriptionRef, updated);

    return { ...currentSub, ...updated } as SellerSubscription;
  } catch (error) {
    console.error(`[sellerSubscriptionService] Error resuming subscription for ${sellerId}:`, error);
    throw error;
  }
}

/**
 * Create invoice for subscription billing
 */
export async function createInvoice(
  sellerId: string,
  subscriptionId: string,
  tier: SellerSubscriptionTier,
  billingCycle: BillingCycle,
  stripeInvoiceId?: string
): Promise<SellerBillingInvoice> {
  try {
    const benefits = TIER_BENEFITS[tier];
    const amount = billingCycle === 'monthly' ? benefits.monthlyPrice : benefits.yearlyPrice;

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 14); // 14 days payment window

    const periodStart = now;
    const periodEnd = new Date(now);
    if (billingCycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const invoice: SellerBillingInvoice = {
      id: `inv_${Date.now()}`,
      sellerId,
      subscriptionId,
      stripeInvoiceId,
      amount,
      currency: 'USD',
      status: 'open',
      dueAt: dueDate.toISOString(),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      createdAt: now.toISOString(),
    };

    const invoiceRef = doc(
      db,
      SELLERS_COLLECTION,
      sellerId,
      BILLING_COLLECTION,
      INVOICES_COLLECTION,
      invoice.id
    );

    await setDoc(invoiceRef, invoice);

    return invoice;
  } catch (error) {
    console.error(`[sellerSubscriptionService] Error creating invoice for ${sellerId}:`, error);
    throw error;
  }
}

/**
 * Get seller invoices
 */
export async function getSellerInvoices(
  sellerId: string,
  limit = 10
): Promise<SellerBillingInvoice[]> {
  try {
    const invoicesRef = collection(
      db,
      SELLERS_COLLECTION,
      sellerId,
      BILLING_COLLECTION,
      INVOICES_COLLECTION
    );
    const q = query(invoicesRef);
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((doc) => doc.data() as SellerBillingInvoice)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error(`[sellerSubscriptionService] Error fetching invoices for ${sellerId}:`, error);
    throw error;
  }
}

/**
 * Get subscription tier benefits
 */
export function getTierBenefits(tier: SellerSubscriptionTier): SellerSubscriptionTierBenefits {
  return TIER_BENEFITS[tier];
}

/**
 * Check if seller can perform action based on tier
 */
export async function checkTierPermission(
  sellerId: string,
  permission: keyof SellerSubscriptionTierBenefits
): Promise<boolean> {
  try {
    const subscription = await getSellerSubscription(sellerId);
    if (!subscription) {
      // No subscription = standard tier
      return TIER_BENEFITS.standard[permission] !== false && TIER_BENEFITS.standard[permission] !== 'none';
    }

    const tierBenefits = getTierBenefits(subscription.tier);
    const benefit = tierBenefits[permission];

    if (typeof benefit === 'boolean') {
      return benefit;
    }
    if (typeof benefit === 'number') {
      return benefit > 0 || benefit === -1; // -1 = unlimited
    }
    return benefit !== 'none';
  } catch (error) {
    console.error(
      `[sellerSubscriptionService] Error checking tier permission for ${sellerId}:`,
      error
    );
    return false;
  }
}

/**
 * Get all active subscriptions (admin/analytics)
 */
export async function getAllActiveSubscriptions(
  status: SubscriptionStatus = 'active'
): Promise<Array<SellerSubscription & { sellerId: string }>> {
  try {
    // This is a complex query requiring a composite index
    // For now, collect from individual seller docs
    const sellers = await getDocs(collection(db, SELLERS_COLLECTION));
    const subscriptions: Array<SellerSubscription & { sellerId: string }> = [];

    for (const sellerDoc of sellers.docs) {
      const subscription = await getSellerSubscription(sellerDoc.id);
      if (subscription && subscription.status === status) {
        subscriptions.push({ ...subscription, sellerId: sellerDoc.id });
      }
    }

    return subscriptions;
  } catch (error) {
    console.error('[sellerSubscriptionService] Error fetching all subscriptions:', error);
    throw error;
  }
}

export default {
  getSellerSubscription,
  createSubscription,
  changeTier,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  createInvoice,
  getSellerInvoices,
  getTierBenefits,
  checkTierPermission,
  getAllActiveSubscriptions,
  TIER_BENEFITS,
};
