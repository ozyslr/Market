/**
 * Centralized analytics service — GA4 + Meta Pixel + TikTok Pixel + Firestore events
 * All third-party scripts load only after user consent.
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    ttq: { track: (event: string, data?: any) => void; load: (id: string) => void; page: () => void };
    dataLayer: any[];
    _trid: string;
  }
}

type ConsentStatus = 'pending' | 'granted' | 'denied';

let consentStatus: ConsentStatus = getStoredConsent();
let initialized = false;

function getStoredConsent(): ConsentStatus {
  try {
    const stored = sessionStorage.getItem('mcr_analytics_consent') || localStorage.getItem('mcr_analytics_consent');
    return (stored as ConsentStatus) || 'pending';
  } catch {
    return 'pending';
  }
}

function setStoredConsent(status: ConsentStatus) {
  consentStatus = status;
  try {
    localStorage.setItem('mcr_analytics_consent', status);
  } catch { /* noop */ }
}

/** Get all configured IDs from env vars */
function getIds() {
  return {
    ga: import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined,
    meta: import.meta.env.VITE_META_PIXEL_ID as string | undefined,
    tiktok: import.meta.env.VITE_TIKTOK_PIXEL_ID as string | undefined,
  };
}

/** Check if any analytics IDs are configured */
export function isAnalyticsConfigured(): boolean {
  const ids = getIds();
  return !!(ids.ga || ids.meta || ids.tiktok);
}

/** Initialize all analytics scripts (only after consent) */
export function initAnalytics(): void {
  if (initialized || consentStatus !== 'granted') return;
  initialized = true;
  const ids = getIds();

  // GA4
  if (ids.ga) {
    initGA4(ids.ga);
  }

  // Meta Pixel
  if (ids.meta) {
    initMetaPixel(ids.meta);
  }

  // TikTok Pixel
  if (ids.tiktok) {
    initTikTokPixel(ids.tiktok);
  }
}

function initGA4(measurementId: string) {
  const existing = document.getElementById('ga4-script');
  if (existing) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    cookie_flags: 'SameSite=None;Secure',
  });

  const script = document.createElement('script');
  script.id = 'ga4-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

function initMetaPixel(pixelId: string) {
  const existing = document.getElementById('meta-pixel-script');
  if (existing) return;

  const script = document.createElement('script');
  script.id = 'meta-pixel-script';
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
    t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />`;
  document.body.appendChild(noscript);
}

function initTikTokPixel(pixelId: string) {
  const existing = document.getElementById('tt-pixel-script');
  if (existing) return;

  const script = document.createElement('script');
  script.id = 'tt-pixel-script';
  script.innerHTML = `
    !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(n,a)};
    ttq.load('${pixelId}');
    ttq.page();
  }(window,document,'ttq');
  `;
  document.head.appendChild(script);
}

// ─── Consent Management ───────────────────────────────────────────────────

export function getConsent(): ConsentStatus {
  return consentStatus;
}

/** Accept analytics cookies — load scripts and track */
export function acceptAnalytics(): void {
  setStoredConsent('granted');
  initialized = false; // allow re-init
  initAnalytics();
  trackEvent('page_view', { page_title: document.title, page_location: window.location.href });
}

/** Deny analytics cookies — stop all tracking */
export function denyAnalytics(): void {
  setStoredConsent('denied');
  // GA4 consent update
  if (window.gtag) {
    window.gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied' });
  }
}

// ─── Event Tracking ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnalyticsParams = Record<string, any>;

/** Track event across all active analytics providers */
export function trackEvent(eventName: string, params?: AnalyticsParams): void {
  const ids = getIds();

  // GA4
  if (ids.ga && window.gtag) {
    window.gtag('event', eventName, params);
  }

  // Meta Pixel
  if (ids.meta && window.fbq) {
    const fbEventName = mapToMetaEvent(eventName);
    window.fbq('track', fbEventName, params || {});
  }

  // TikTok Pixel
  if (ids.tiktok && window.ttq) {
    window.ttq.track(eventName, params || {});
  }
}

/** Track a product view */
export function trackViewContent(productId: string, productName: string, price: number, currency: string): void {
  trackEvent('view_item', {
    content_type: 'product',
    content_ids: [productId],
    contents: [{ id: productId, item_price: price }],
    currency,
    value: price,
    items: [{ item_id: productId, item_name: productName, price }],
  });
}

/** Track add to cart */
export function trackAddToCart(productId: string, productName: string, price: number, quantity: number, currency: string): void {
  trackEvent('add_to_cart', {
    content_type: 'product',
    content_ids: [productId],
    contents: [{ id: productId, quantity, item_price: price }],
    currency,
    value: price * quantity,
    items: [{ item_id: productId, item_name: productName, price, quantity }],
  });
}

/** Track purchase/checkout */
export function trackPurchase(orderId: string, total: number, currency: string, items: Array<{ id: string; name: string; price: number; quantity: number }>): void {
  trackEvent('purchase', {
    transaction_id: orderId,
    value: total,
    currency,
    items: items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
    content_type: 'product',
  });
}

/** Track search */
export function trackSearch(query: string): void {
  trackEvent('search', { search_term: query });
}

/** Track begin checkout */
export function trackBeginCheckout(total: number, currency: string): void {
  trackEvent('begin_checkout', { value: total, currency });
}

// ─── Meta Pixel event name mapping ──────────────────────────────────────

const META_EVENT_MAP: Record<string, string> = {
  page_view: 'PageView',
  view_item: 'ViewContent',
  add_to_cart: 'AddToCart',
  remove_from_cart: 'RemoveFromCart',
  begin_checkout: 'InitiateCheckout',
  purchase: 'Purchase',
  search: 'Search',
  add_to_wishlist: 'AddToWishlist',
};

function mapToMetaEvent(eventName: string): string {
  return META_EVENT_MAP[eventName] || eventName;
}
