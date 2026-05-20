import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, getConsent } from '../../lib/analytics';

/**
 * AnalyticsTracker — place once in the app root to track SPA route changes.
 * Fires a page_view event on every route change (after consent is granted).
 */
export function AnalyticsTracker() {
  const location = useLocation();
  const lastPath = useRef<string>('');

  useEffect(() => {
    const currentPath = location.pathname + location.search;

    // Skip duplicate tracking for the same path
    if (lastPath.current === currentPath) return;
    lastPath.current = currentPath;

    // Only track if consent has been granted
    if (getConsent() === 'granted') {
      // Small delay to ensure document.title is updated by react-helmet-async
      const timer = setTimeout(() => {
        trackPageView(window.location.href);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [location]);

  return null; // This component renders nothing
}
