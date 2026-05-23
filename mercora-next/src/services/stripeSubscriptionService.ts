/**
 * Stripe Subscription Service
 * Handles all Stripe API interactions for seller subscriptions
 *
 * Features:
 * - Create subscriptions with 30-day trial
 * - Handle tier upgrades/downgrades
 * - Process cancellations with Stripe
 * - Webhook event handling (invoice.payment_succeeded, customer.subscription_deleted, etc.)
 */

import Stripe from 'stripe';
import { SellerSubscriptionTier, BillingCycle } from '@/types';
import { createSubscription, changeTier, cancelSubscription } from './sellerSubscriptionService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

/**
 * Stripe Price IDs
 * Must be configured in Stripe dashboard and added to env vars
 */
const STRIPE_PRICES: Record<SellerSubscriptionTier, Record<BillingCycle, string>> = {
  standard: {
    monthly: process.env.STRIPE_PRICE_STANDARD_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_STANDARD_YEARLY || '',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || '',
  },
};

/**
 * Create Stripe customer for seller if not exists
 */
export async function createOrGetStripeCustomer(
  sellerId: string,
  email: string,
  name: string
): Promise<string> {
  try {
    // Try to find existing customer by metadata
    const existing = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existing.data.length > 0) {
      return existing.data[0].id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        sellerId,
        type: 'seller',
      },
    });

    return customer.id;
  } catch (error) {
    console.error(
      `[stripeSubscriptionService] Error creating/getting Stripe customer for ${sellerId}:`,
      error
    );
    throw error;
  }
}

/**
 * Create subscription with 30-day trial
 */
export async function createSubscriptionWithTrial(
  sellerId: string,
  email: string,
  name: string,
  tier: SellerSubscriptionTier,
  billingCycle: BillingCycle = 'monthly'
): Promise<{
  stripeSubscriptionId: string;
  stripePriceId: string;
  clientSecret?: string;
}> {
  try {
    // Get or create Stripe customer
    const customerId = await createOrGetStripeCustomer(sellerId, email, name);

    // Get price ID
    const priceId = STRIPE_PRICES[tier][billingCycle];
    if (!priceId) {
      throw new Error(`No Stripe price configured for ${tier} ${billingCycle}`);
    }

    // Create subscription with 30-day trial
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      trial_period_days: 30,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      metadata: {
        sellerId,
        tier,
        billingCycle,
      },
    });

    // Get client secret if payment needed
    const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
    const clientSecret = latestInvoice?.payment_intent
      ? (latestInvoice.payment_intent as Stripe.PaymentIntent).client_secret
      : undefined;

    return {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      clientSecret,
    };
  } catch (error) {
    console.error(
      `[stripeSubscriptionService] Error creating subscription for ${sellerId}:`,
      error
    );
    throw error;
  }
}

/**
 * Update subscription tier (upgrade/downgrade)
 */
export async function updateSubscriptionTier(
  stripeSubscriptionId: string,
  newTier: SellerSubscriptionTier,
  billingCycle: BillingCycle
): Promise<{
  stripeSubscriptionId: string;
  stripePriceId: string;
}> {
  try {
    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    if (!subscription.items.data || subscription.items.data.length === 0) {
      throw new Error('Subscription has no items');
    }

    const currentItem = subscription.items.data[0];
    const newPriceId = STRIPE_PRICES[newTier][billingCycle];

    if (!newPriceId) {
      throw new Error(`No Stripe price configured for ${newTier} ${billingCycle}`);
    }

    // Update subscription with new price
    const updated = await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [
        {
          id: currentItem.id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations', // Create credit/charge for difference
      billing_cycle_anchor: 'unchanged',
      metadata: {
        tier: newTier,
        billingCycle,
      },
    });

    return {
      stripeSubscriptionId: updated.id,
      stripePriceId: newPriceId,
    };
  } catch (error) {
    console.error(
      `[stripeSubscriptionService] Error updating subscription tier:`,
      error
    );
    throw error;
  }
}

/**
 * Cancel subscription at end of billing period
 */
export async function cancelSubscriptionAtPeriodEnd(
  stripeSubscriptionId: string
): Promise<void> {
  try {
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (error) {
    console.error(
      `[stripeSubscriptionService] Error cancelling subscription:`,
      error
    );
    throw error;
  }
}

/**
 * Immediately cancel subscription
 */
export async function cancelSubscriptionImmediate(
  stripeSubscriptionId: string
): Promise<void> {
  try {
    await stripe.subscriptions.del(stripeSubscriptionId);
  } catch (error) {
    console.error(
      `[stripeSubscriptionService] Error immediately cancelling subscription:`,
      error
    );
    throw error;
  }
}

/**
 * Handle Stripe webhook events
 * Called from /api/webhooks/stripe route
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[stripeSubscriptionService] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('[stripeSubscriptionService] Error handling webhook:', error);
    throw error;
  }
}

// Webhook event handlers

async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  const sellerId = subscription.metadata?.sellerId;
  const tier = subscription.metadata?.tier as SellerSubscriptionTier;
  const billingCycle = subscription.metadata?.billingCycle as BillingCycle;

  if (!sellerId || !tier) {
    console.warn('[stripeSubscriptionService] Missing metadata in subscription.created');
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : undefined;

  // Create/update local subscription record
  await createSubscription(
    sellerId,
    tier,
    billingCycle || 'monthly',
    subscription.id,
    priceId,
    trialEnd
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const sellerId = subscription.metadata?.sellerId;
  const tier = subscription.metadata?.tier as SellerSubscriptionTier;

  if (!sellerId || !tier) {
    console.warn('[stripeSubscriptionService] Missing metadata in subscription.updated');
    return;
  }

  // Update local record if tier changed
  await changeTier(sellerId, tier, subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const sellerId = subscription.metadata?.sellerId;

  if (!sellerId) {
    console.warn('[stripeSubscriptionService] Missing sellerId in subscription.deleted');
    return;
  }

  // Cancel local subscription
  await cancelSubscription(sellerId, 'Cancelled via Stripe webhook');
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  // Update invoice status in Firestore if needed
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) {
    return;
  }

  console.log(`[stripeSubscriptionService] Invoice paid: ${invoice.id} for subscription ${subscriptionId}`);
  // Could trigger email receipt generation, renewal notifications, etc.
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  // Alert seller about failed payment
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) {
    return;
  }

  console.error(
    `[stripeSubscriptionService] Invoice payment failed: ${invoice.id} for subscription ${subscriptionId}`
  );
  // Could trigger retry logic, dunning emails, etc.
}

export default {
  createOrGetStripeCustomer,
  createSubscriptionWithTrial,
  updateSubscriptionTier,
  cancelSubscriptionAtPeriodEnd,
  cancelSubscriptionImmediate,
  handleStripeWebhook,
};
