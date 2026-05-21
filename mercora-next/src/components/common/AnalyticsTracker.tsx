'use client';

import { useEffect } from 'react';

interface AnalyticsTrackerProps {
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
}

export function AnalyticsTracker({ googleAnalyticsId, googleTagManagerId }: AnalyticsTrackerProps) {
  // GTM — only in browser
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!googleTagManagerId) return;
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtm.js?id=${googleTagManagerId}`;
    script.async = true;
    document.head.appendChild(script);

    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

    return () => { script.remove(); };
  }, [googleTagManagerId]);

  // GA4 pageview tracking — uses window.location instead of usePathname for pre-rendering safety
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!googleAnalyticsId) return;

    if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
      script.async = true;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) { window.dataLayer.push(args); }
      (window as any).gtag = gtag;
      gtag('js', new Date());
      gtag('config', googleAnalyticsId);
    }

    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'page_view', {
        page_path: window.location.pathname,
        page_location: window.location.href,
      });
    }
  }, [googleAnalyticsId]);

  return null;
}
