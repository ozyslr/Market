/**
 * Event Tracking Client Library (STREAM G)
 * Frontend event capturing and reporting
 */

import { trackEvent, createSession } from '@/services/analyticsService';
import type { AnalyticsEvent, EventType } from '@/services/analyticsService';

let sessionId: string | null = null;
let userId: string | null = null;

/**
 * Initialize tracking session
 */
export function initializeTracking(user?: string, entryPage?: string) {
  userId = user || undefined;
  sessionId = generateSessionId();

  if (typeof window !== 'undefined') {
    const userAgent = navigator.userAgent;
    const country = getCountryFromTimezone();

    createSession(
      userId,
      sessionId,
      entryPage || window.location.pathname,
      userAgent,
      country
    ).catch(() => {
      console.warn('[eventTracker] Failed to create session');
    });
  }
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get country from timezone (approximation)
 */
function getCountryFromTimezone(): string | undefined {
  if (typeof Intl === 'undefined') return undefined;

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Simple mapping (in production, use IP geolocation)
    const tzCountryMap: Record<string, string> = {
      'Europe/Istanbul': 'TR',
      'America/New_York': 'US',
      'Europe/London': 'GB',
      'Europe/Berlin': 'DE',
      'Europe/Paris': 'FR',
    };
    return tzCountryMap[timezone];
  } catch {
    return undefined;
  }
}

/**
 * Track event
 */
export async function track(
  eventType: EventType,
  properties?: Record<string, any>,
  metadata?: Record<string, any>
): Promise<void> {
  if (!sessionId) {
    initializeTracking();
  }

  if (typeof window === 'undefined') {
    return;
  }

  const event: Omit<AnalyticsEvent, 'id'> = {
    eventType,
    userId,
    sessionId: sessionId!,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    device: detectDevice(),
    country: getCountryFromTimezone(),
    properties: properties || {},
    metadata: metadata,
  };

  try {
    await trackEvent(event);
  } catch (error) {
    console.error('[eventTracker] Failed to track event:', error);
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName?: string): void {
  const page = pageName || window.location.pathname;
  track('page_view', { page });
}

/**
 * Track click event
 */
export function trackClick(elementId: string, elementText?: string): void {
  track('click', { elementId, elementText });
}

/**
 * Track conversion
 */
export function trackConversion(
  conversionType: string,
  value?: number,
  metadata?: Record<string, any>
): void {
  track('checkout_started', { conversionType, value }, metadata);
}

/**
 * Track product view
 */
export function trackProductView(productId: string, productName?: string, price?: number): void {
  track('product_view', { productId, productName, price });
}

/**
 * Track search
 */
export function trackSearch(query: string, resultsCount?: number): void {
  track('search', { query, resultsCount });
}

/**
 * Track add to cart
 */
export function trackAddToCart(productId: string, quantity: number, price: number): void {
  track('add_to_cart', { productId, quantity, price }, { value: price * quantity });
}

/**
 * Track checkout
 */
export function trackCheckout(cartValue: number, itemCount: number): void {
  track('checkout_started', { itemCount }, { value: cartValue });
}

/**
 * Track payment success
 */
export function trackPaymentSuccess(orderId: string, amount: number, method: string): void {
  track('payment_success', { orderId, amount, method }, { value: amount });
}

/**
 * Detect device type
 */
function detectDevice(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const userAgent = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod/.test(userAgent)) return 'mobile';
  if (/tablet|ipad|playbook/.test(userAgent)) return 'tablet';
  return 'desktop';
}

/**
 * Get session ID
 */
export function getSessionId(): string {
  if (!sessionId) {
    initializeTracking();
  }
  return sessionId!;
}

/**
 * Get user ID
 */
export function getUserId(): string | null {
  return userId;
}

/**
 * Set user ID (after login)
 */
export function setUserId(id: string): void {
  userId = id;
  track('login');
}

/**
 * Logout
 */
export function logout(): void {
  track('logout');
  userId = null;
  sessionId = null;
}
