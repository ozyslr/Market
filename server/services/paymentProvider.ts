// ─── Payment Provider Abstraction (D-02) ─────────────────────────────────────
// IPaymentProvider interface enabling future provider swap (TR→Iyzico, EU→Stripe).
// IyzicoProvider wraps the iyzico.cjs SDK with marketplace subMerchant splits.
// StripeConnectProvider handles EU seller Stripe Connect Express onboarding (D-02).

import type Stripe from 'stripe';
import type { Firestore } from 'firebase-admin/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckoutItem {
  id: string;
  name: string;
  /** Item price in kurus (integer) */
  price: number;
  /** Iyzico marketplace sub-merchant key for the seller */
  subMerchantKey: string;
  /** Price minus commission, in kurus (integer) */
  subMerchantPrice: number;
  /** Optional: used for basket categorization */
  category?: string;
  sellerId?: string;
  categoryId?: string;
}

export interface CheckoutParams {
  orderSetId: string;
  /** Total payment amount in kurus */
  totalAmount: number;
  currency: string;
  items: CheckoutItem[];
  buyer: {
    id: string;
    email: string;
    name: string;
    phone: string;
  };
  shippingAddress: Record<string, unknown>;
  callbackUrl: string;
  installment?: number;
}

export interface CheckoutResult {
  token: string;
  paymentPageUrl: string;
  checkoutFormContent?: string;
}

export interface IPaymentProvider {
  initCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  verifyPayment(token: string): Promise<{ status: string; transactions: unknown[] }>;
  processRefund(params: {
    paymentId: string;
    paymentTransactionId?: string;
    amount?: number;
  }): Promise<{ refundId: string }>;
}

// ─── ConfigurationError ───────────────────────────────────────────────────────

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// ─── IyzicoProvider ───────────────────────────────────────────────────────────

interface IyzicoProviderDeps {
  getIyzico: () => Promise<{
    client: unknown;
    createCheckoutForm?: (client: unknown, request: unknown) => Promise<unknown>;
    retrieveCheckoutForm?: (client: unknown, request: unknown) => Promise<unknown>;
  }>;
}

export class IyzicoProvider implements IPaymentProvider {
  private readonly getIyzico: IyzicoProviderDeps['getIyzico'];

  constructor(deps: IyzicoProviderDeps) {
    this.getIyzico = deps.getIyzico;
  }

  async initCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const {
      orderSetId,
      totalAmount,
      currency,
      items,
      buyer,
      shippingAddress,
      callbackUrl,
      installment,
    } = params;

    // ── Validate: all items must have a subMerchantKey (T-02-004) ─────────────
    for (const item of items) {
      if (!item.subMerchantKey) {
        throw new ConfigurationError(
          `Item "${item.id}" is missing subMerchantKey — seller must be onboarded as iyzico sub-merchant before checkout`,
        );
      }
    }

    // ── Build basket items with marketplace fields ──────────────────────────
    const basketItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      category1: item.category ?? 'General',
      itemType: 'PHYSICAL',
      price: String(item.price),
      subMerchantKey: item.subMerchantKey,
      subMerchantPrice: String(item.subMerchantPrice),
    }));

    // ── Build buyer fields ─────────────────────────────────────────────────
    const nameParts = buyer.name.split(' ');
    const buyerFirstName = nameParts[0] ?? 'Buyer';
    const buyerLastName = nameParts.slice(1).join(' ') || 'Unknown';

    const addr = shippingAddress as Record<string, string>;

    const request = {
      locale: 'tr',
      conversationId: orderSetId,
      price: String(totalAmount),
      paidPrice: String(totalAmount),
      currency: currency === 'TRY' ? 'TRY' : 'GBP',
      installment: String(installment ?? 1),
      basketId: orderSetId,
      paymentGroup: 'PRODUCT',
      callbackUrl,
      buyer: {
        id: buyer.id,
        name: buyerFirstName,
        surname: buyerLastName,
        gsmNumber: buyer.phone || '+905555555555',
        email: buyer.email,
        identityNumber: '11111111111',
        registrationAddress: addr.line1 ?? 'Address',
        city: addr.city ?? 'Istanbul',
        country: addr.country ?? 'Turkey',
      },
      shippingAddress: {
        contactName: (addr.fullName as string) ?? buyer.name,
        city: addr.city ?? 'Istanbul',
        country: addr.country ?? 'Turkey',
        address: addr.line1 ?? 'Address',
      },
      billingAddress: {
        contactName: (addr.fullName as string) ?? buyer.name,
        city: addr.city ?? 'Istanbul',
        country: addr.country ?? 'Turkey',
        address: addr.line1 ?? 'Address',
      },
      basketItems,
    };

    // ── Dynamic import of CJS wrapper (ESM-compatible) ─────────────────────
    const { createCheckoutForm } = await import('../../server/iyzico.cjs');
    const iyzico = await this.getIyzico();
    const result = (await createCheckoutForm(iyzico.client, request)) as Record<string, unknown>;

    if (result.status !== 'success') {
      throw new Error((result.errorMessage as string) ?? 'iyzico checkout initialization failed');
    }

    return {
      token: result.token as string,
      paymentPageUrl: result.paymentPageUrl as string,
      checkoutFormContent: result.checkoutFormContent as string | undefined,
    };
  }

  async verifyPayment(token: string): Promise<{ status: string; transactions: unknown[] }> {
    const { retrieveCheckoutForm } = await import('../../server/iyzico.cjs');
    const iyzico = await this.getIyzico();
    const result = (await retrieveCheckoutForm(iyzico.client, {
      locale: 'tr',
      token,
    })) as Record<string, unknown>;

    return {
      status: (result.paymentStatus as string) ?? (result.status as string),
      transactions: (result.paymentTransactions as unknown[]) ?? [],
    };
  }

  async processRefund(params: {
    paymentId: string;
    paymentTransactionId?: string;
    amount?: number;
  }): Promise<{ refundId: string }> {
    const { refundV2Create, cancelCreate } = await import('../../server/iyzico.cjs');
    const iyzico = await this.getIyzico();

    let result: Record<string, unknown>;

    if (params.paymentTransactionId) {
      // Per-item refund using refundV2
      result = (await refundV2Create(iyzico.client, {
        locale: 'tr',
        paymentTransactionId: params.paymentTransactionId,
        price: params.amount !== undefined ? String(params.amount) : undefined,
        currency: 'TRY',
        ip: '85.34.78.112',
      })) as Record<string, unknown>;
    } else {
      // Full payment cancel
      result = (await cancelCreate(iyzico.client, {
        locale: 'tr',
        paymentId: params.paymentId,
        ip: '85.34.78.112',
      })) as Record<string, unknown>;
    }

    if (result.status !== 'success') {
      throw new Error((result.errorMessage as string) ?? 'Refund/cancel failed');
    }

    return {
      refundId: (result.paymentId as string) ?? (result.paymentTransactionId as string) ?? '',
    };
  }
}

// ─── StripeConnectProvider ────────────────────────────────────────────────────
// Handles Stripe Connect Express account creation + hosted onboarding (D-02).
// EU sellers: admin approval triggers provisionAccount → seller gets onboardingUrl.

interface StripeConnectProviderDeps {
  stripe: Stripe;
  adminDb: Firestore;
}

export interface StripeConnectProvisionResult {
  accountId: string;
  onboardingUrl: string;
  alreadyProvisioned?: boolean;
}

export class StripeConnectProvider {
  private readonly stripe: Stripe;
  private readonly adminDb: Firestore;

  constructor(deps: StripeConnectProviderDeps) {
    this.stripe = deps.stripe;
    this.adminDb = deps.adminDb;
  }

  // Idempotent: reads sellers/{sellerId}.stripeAccountId before creating (T-03-05).
  async provisionAccount(
    sellerId: string,
    sellerEmail: string,
    country: string,
  ): Promise<StripeConnectProvisionResult> {
    // ── Idempotency guard (T-03-03, T-03-05) ─────────────────────────────────
    const sellerSnap = await this.adminDb.collection('sellers').doc(sellerId).get();
    const sellerData = sellerSnap.data() ?? {};
    if (sellerData.stripeAccountId) {
      // Already provisioned — return existing accountId without creating a new one
      const existingLink = await this.stripe.accountLinks.create({
        account: sellerData.stripeAccountId as string,
        refresh_url: `${process.env.APP_URL ?? ''}/seller/dashboard?connect=refresh`,
        return_url: `${process.env.APP_URL ?? ''}/seller/dashboard?connect=complete`,
        type: 'account_onboarding',
      });
      return {
        accountId: sellerData.stripeAccountId as string,
        onboardingUrl: existingLink.url,
        alreadyProvisioned: true,
      };
    }

    // ── Create Stripe Connect Express account ─────────────────────────────────
    const account = await this.stripe.accounts.create({
      type: 'express',
      country,
      email: sellerEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
    });

    // ── Persist accountId to sellers doc ─────────────────────────────────────
    await this.adminDb.collection('sellers').doc(sellerId).update({
      stripeAccountId: account.id,
      stripeOnboardingStatus: 'pending',
      updatedAt: new Date().toISOString(),
    });

    // ── Create hosted onboarding link ─────────────────────────────────────────
    const accountLink = await this.stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.APP_URL ?? ''}/seller/dashboard?connect=refresh`,
      return_url: `${process.env.APP_URL ?? ''}/seller/dashboard?connect=complete`,
      type: 'account_onboarding',
    });

    return { accountId: account.id, onboardingUrl: accountLink.url };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

type ProviderType = 'iyzico' | 'stripe-connect';
type ProviderDeps = IyzicoProviderDeps | StripeConnectProviderDeps;

export function createPaymentProvider(type: 'iyzico', deps: IyzicoProviderDeps): IPaymentProvider;
export function createPaymentProvider(
  type: 'stripe-connect',
  deps: StripeConnectProviderDeps,
): StripeConnectProvider;
export function createPaymentProvider(
  type: ProviderType,
  deps: ProviderDeps,
): IPaymentProvider | StripeConnectProvider {
  if (type === 'iyzico') {
    return new IyzicoProvider(deps as IyzicoProviderDeps);
  }
  if (type === 'stripe-connect') {
    return new StripeConnectProvider(deps as StripeConnectProviderDeps);
  }
  throw new Error(`Unknown payment provider type: ${type}`);
}
