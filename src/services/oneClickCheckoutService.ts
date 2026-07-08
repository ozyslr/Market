import type { User as FirebaseUser } from 'firebase/auth';
import type { OneClickCheckoutResult } from '../types/order';
import type { SavedCard } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Generates Authorization headers with Firebase ID token
 */
async function getAuthHeaders(firebaseUser: FirebaseUser): Promise<HeadersInit> {
  const token = await firebaseUser.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Creates a Stripe SetupIntent for saving a payment method.
 * The returned clientSecret is used by frontend Stripe Elements to confirm the card.
 */
export async function createSetupIntent(
  firebaseUser: FirebaseUser
): Promise<{ clientSecret: string; error?: string }> {
  const headers = await getAuthHeaders(firebaseUser);
  const res = await fetch(`${API_BASE}/api/create-setup-intent`, {
    method: 'POST',
    headers,
  });
  const data = await res.json();
  if (!res.ok) {
    return { clientSecret: '', error: data.error || 'Failed to create setup intent' };
  }
  return { clientSecret: data.clientSecret };
}

/**
 * Attaches a verified PaymentMethod to the user's Stripe Customer.
 * Call this after the frontend has confirmed the SetupIntent with Stripe Elements.
 */
export async function setupPaymentMethod(
  firebaseUser: FirebaseUser,
  paymentMethodId: string,
  last4: string,
  brand: string
): Promise<{ success?: boolean; error?: string }> {
  const headers = await getAuthHeaders(firebaseUser);
  const res = await fetch(`${API_BASE}/api/setup-payment-method`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ paymentMethodId, last4, brand }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { error: data.error || 'Failed to save payment method' };
  }
  return { success: true };
}

/**
 * Lists the user's saved Stripe cards (wallet).
 */
export async function listPaymentMethods(
  firebaseUser: FirebaseUser
): Promise<{ cards: SavedCard[]; error?: string }> {
  const headers = await getAuthHeaders(firebaseUser);
  const res = await fetch(`${API_BASE}/api/payment-methods`, { headers });
  const data = await res.json();
  if (!res.ok) {
    return { cards: [], error: data.error || 'Failed to load payment methods' };
  }
  return { cards: data.cards || [] };
}

/**
 * Detaches a saved card. If it was the default, the backend promotes the next
 * remaining card (returned as newDefaultId) or clears the default.
 */
export async function deletePaymentMethod(
  firebaseUser: FirebaseUser,
  id: string
): Promise<{ success?: boolean; newDefaultId?: string | null; error?: string }> {
  const headers = await getAuthHeaders(firebaseUser);
  const res = await fetch(`${API_BASE}/api/payment-methods/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  const data = await res.json();
  if (!res.ok) {
    return { error: data.error || 'Failed to remove card' };
  }
  return { success: true, newDefaultId: data.newDefaultId ?? null };
}

/**
 * Sets a saved card as the default (used by one-click checkout).
 */
export async function setDefaultPaymentMethod(
  firebaseUser: FirebaseUser,
  id: string
): Promise<{ success?: boolean; error?: string }> {
  const headers = await getAuthHeaders(firebaseUser);
  const res = await fetch(`${API_BASE}/api/payment-methods/default`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ paymentMethodId: id }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { error: data.error || 'Failed to set default card' };
  }
  return { success: true };
}

/**
 * Executes a one-click checkout order.
 * Requires the user to have both a saved payment method and default shipping address.
 * Handles three response cases:
 *   - succeeded: Order created, payment processed, cart cleared
 *   - requires_action: 3DS or other challenge needed; redirect to /checkout
 *   - failed: Card declined or validation error
 */
export async function executeOneClickCheckout(
  firebaseUser: FirebaseUser,
  items: Array<{ productId: string; variantId?: string; quantity: number }>,
  currency: string
): Promise<OneClickCheckoutResult> {
  const headers = await getAuthHeaders(firebaseUser);
  const res = await fetch(`${API_BASE}/api/one-click-checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ items, currency }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { status: 'failed', errorMessage: data.error || 'Checkout failed' };
  }
  return data as OneClickCheckoutResult;
}
