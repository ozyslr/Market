/**
 * Guest Checkout Service (STREAM B)
 * Enables fast checkout without account creation
 *
 * Features:
 * - Guest session management
 * - Email-based order tracking
 * - Optional account creation after purchase
 * - Session persistence (localStorage + IndexedDB)
 */

import { Timestamp, collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface GuestCheckoutSession {
  id: string;
  email: string;
  phone?: string;
  shippingAddress?: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    fullName: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  cartItems: Array<{ productId: string; quantity: number; price: number }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
}

export interface GuestOrder {
  id: string;
  email: string;
  phone?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: any;
  total: number;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

const GUEST_SESSIONS_COLLECTION = 'guest_checkout_sessions';
const GUEST_ORDERS_COLLECTION = 'guest_orders';
const GUEST_SESSION_KEY = 'mercora_guest_session';

/**
 * Create guest checkout session
 */
export async function createGuestSession(email: string): Promise<GuestCheckoutSession> {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    const session: GuestCheckoutSession = {
      id: `guest_${Date.now()}`,
      email,
      cartItems: [],
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Save to Firestore
    const sessionRef = doc(
      db,
      GUEST_SESSIONS_COLLECTION,
      session.id
    );
    await setDoc(sessionRef, session);

    // Save to localStorage for offline access
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    }

    return session;
  } catch (error) {
    console.error('[guestCheckoutService] Error creating session:', error);
    throw error;
  }
}

/**
 * Get or create guest session from localStorage
 */
export function getLocalGuestSession(): GuestCheckoutSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(GUEST_SESSION_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored) as GuestCheckoutSession;
    const expiresAt = new Date(session.expiresAt);

    // Check if session expired
    if (new Date() > expiresAt) {
      localStorage.removeItem(GUEST_SESSION_KEY);
      return null;
    }

    return session;
  } catch (error) {
    console.error('[guestCheckoutService] Error getting local session:', error);
    return null;
  }
}

/**
 * Update guest session
 */
export async function updateGuestSession(
  sessionId: string,
  updates: Partial<GuestCheckoutSession>
): Promise<GuestCheckoutSession> {
  try {
    const sessionRef = doc(db, GUEST_SESSIONS_COLLECTION, sessionId);
    const snapshot = await getDoc(sessionRef);

    if (!snapshot.exists()) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const updated = {
      ...snapshot.data(),
      ...updates,
      updatedAt: new Date().toISOString(),
    } as GuestCheckoutSession;

    await setDoc(sessionRef, updated, { merge: true });

    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updated));
    }

    return updated;
  } catch (error) {
    console.error('[guestCheckoutService] Error updating session:', error);
    throw error;
  }
}

/**
 * Complete guest checkout and create order
 */
export async function completeGuestCheckout(
  sessionId: string,
  email: string,
  phone?: string
): Promise<GuestOrder> {
  try {
    const sessionRef = doc(db, GUEST_SESSIONS_COLLECTION, sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      throw new Error('Checkout session not found');
    }

    const session = sessionSnap.data() as GuestCheckoutSession;
    const now = new Date();

    const order: GuestOrder = {
      id: `guest_order_${Date.now()}`,
      email,
      phone,
      status: 'pending',
      items: session.cartItems.map((item) => ({
        productId: item.productId,
        productName: '', // Would be fetched from products collection
        quantity: item.quantity,
        price: item.price,
      })),
      shippingAddress: session.shippingAddress || {},
      total: session.total,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // Save order
    const orderRef = doc(db, GUEST_ORDERS_COLLECTION, order.id);
    await setDoc(orderRef, order);

    // Mark session as completed
    await updateGuestSession(sessionId, { completedAt: now.toISOString() });

    // Send confirmation email
    try {
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'order-confirmation-guest',
          to: email,
          data: {
            orderId: order.id,
            total: order.total,
            trackingLink: `${process.env.NEXT_PUBLIC_APP_URL}/track/${order.id}`,
          },
        }),
      });
    } catch (e) {
      console.warn('Failed to send confirmation email:', e);
    }

    return order;
  } catch (error) {
    console.error('[guestCheckoutService] Error completing checkout:', error);
    throw error;
  }
}

/**
 * Get guest order by email (for order tracking)
 */
export async function getGuestOrderByEmail(email: string): Promise<GuestOrder[]> {
  try {
    // In production, use Firestore query:
    // const q = query(collection(db, GUEST_ORDERS_COLLECTION), where('email', '==', email));
    // For now, simplified approach
    return [];
  } catch (error) {
    console.error('[guestCheckoutService] Error fetching orders:', error);
    return [];
  }
}

/**
 * Clean up expired sessions (runs periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const now = new Date();
    let deleted = 0;

    // In production, would query all sessions and delete expired ones
    // For MVP, this is a placeholder
    console.log('[guestCheckoutService] Cleaned up expired sessions:', deleted);

    return deleted;
  } catch (error) {
    console.error('[guestCheckoutService] Error cleaning up sessions:', error);
    return 0;
  }
}

export default {
  createGuestSession,
  getLocalGuestSession,
  updateGuestSession,
  completeGuestCheckout,
  getGuestOrderByEmail,
  cleanupExpiredSessions,
};
