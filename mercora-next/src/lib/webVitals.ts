/**
 * Web Vitals Monitoring (STREAM C)
 * Measure and report Core Web Vitals
 *
 * Metrics:
 * - LCP (Largest Contentful Paint) - Loading performance
 * - FID (First Input Delay) - Interactivity
 * - CLS (Cumulative Layout Shift) - Visual stability
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 */

import { monitoring } from '@/services/monitoringService';

export interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
}

/**
 * Thresholds for Web Vitals (ms)
 */
const VITAL_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 600, poor: 1800 },
};

/**
 * Get rating for a vital based on thresholds
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = VITAL_THRESHOLDS[name as keyof typeof VITAL_THRESHOLDS];
  if (!threshold) return 'needs-improvement';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vital to monitoring service
 */
export function reportVital(vital: WebVital) {
  // Log to monitoring
  monitoring.recordMetric(`web_vital.${vital.name}`, vital.value, {
    rating: vital.rating,
  });

  // Send to backend
  if (typeof window !== 'undefined') {
    fetch('/api/monitoring/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: vital.name,
        value: vital.value,
        rating: vital.rating,
        timestamp: Date.now(),
        url: window.location.href,
      }),
    }).catch(() => {
      // Ignore monitoring errors
    });
  }
}

/**
 * Measure Largest Contentful Paint (LCP)
 */
export function onLCP(callback: (vital: WebVital) => void) {
  if (!('PerformanceObserver' in window)) {
    return;
  }

  let lastLCP = 0;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];

    const lcp = lastEntry.renderTime || lastEntry.loadTime;
    const delta = lcp - lastLCP;

    lastLCP = lcp;

    callback({
      name: 'LCP',
      value: lcp,
      rating: getRating('LCP', lcp),
      delta,
    });
  });

  observer.observe({ entryTypes: ['largest-contentful-paint'] });
}

/**
 * Measure First Input Delay (FID)
 */
export function onFID(callback: (vital: WebVital) => void) {
  if (!('PerformanceObserver' in window)) {
    return;
  }

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry: any) => {
      const fid = entry.processingEnd - entry.startTime;

      callback({
        name: 'FID',
        value: fid,
        rating: getRating('FID', fid),
        delta: fid,
      });
    });
  });

  observer.observe({ entryTypes: ['first-input'] });
}

/**
 * Measure Cumulative Layout Shift (CLS)
 */
export function onCLS(callback: (vital: WebVital) => void) {
  if (!('PerformanceObserver' in window)) {
    return;
  }

  let cls = 0;

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        cls += entry.value;

        callback({
          name: 'CLS',
          value: cls,
          rating: getRating('CLS', cls),
          delta: entry.value,
        });
      }
    });
  });

  observer.observe({ entryTypes: ['layout-shift'] });
}

/**
 * Measure First Contentful Paint (FCP)
 */
export function onFCP(callback: (vital: WebVital) => void) {
  if (!('PerformanceObserver' in window)) {
    return;
  }

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      const fcp = entry.startTime;

      callback({
        name: 'FCP',
        value: fcp,
        rating: getRating('FCP', fcp),
        delta: fcp,
      });
    });
  });

  observer.observe({ entryTypes: ['paint'] });
}

/**
 * Measure Time to First Byte (TTFB)
 */
export function onTTFB(callback: (vital: WebVital) => void) {
  if (typeof window === 'undefined') return;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  if (navigation) {
    const ttfb = navigation.responseStart - navigation.requestStart;

    callback({
      name: 'TTFB',
      value: ttfb,
      rating: getRating('TTFB', ttfb),
      delta: ttfb,
    });
  }
}

/**
 * Initialize all Web Vitals monitoring
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  onLCP(reportVital);
  onFID(reportVital);
  onCLS(reportVital);
  onFCP(reportVital);
  onTTFB(reportVital);
}
