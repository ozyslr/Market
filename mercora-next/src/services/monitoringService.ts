/**
 * Monitoring Service (STREAM C)
 * Tracks application health metrics and alerts
 *
 * Metrics:
 * - Error rate
 * - API latency
 * - User session health
 * - Payment success rate
 * - Page load times
 */

export interface MetricPoint {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

export interface HealthMetrics {
  errorRate: number; // % of requests resulting in error
  apiLatency: number; // ms average
  paymentSuccessRate: number; // % of successful payments
  checkoutAbandonmentRate: number; // % of carts abandoned
  sessionDuration: number; // average seconds
  pageLoadTime: number; // ms average
}

class MonitoringService {
  private metrics: Map<string, MetricPoint[]> = new Map();
  private readonly MAX_HISTORY = 1000; // Keep last 1000 data points

  /**
   * Record performance metric
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>) {
    const key = `${name}:${JSON.stringify(labels || {})}`;
    const point: MetricPoint = {
      timestamp: Date.now(),
      value,
      labels,
    };

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const points = this.metrics.get(key)!;
    points.push(point);

    // Keep only recent data
    if (points.length > this.MAX_HISTORY) {
      points.shift();
    }

    // Send to monitoring backend
    this.reportMetric(name, value, labels);
  }

  /**
   * Record API latency
   */
  recordApiLatency(endpoint: string, durationMs: number) {
    this.recordMetric('api.latency', durationMs, { endpoint });
  }

  /**
   * Record checkout event
   */
  recordCheckoutEvent(event: 'started' | 'completed' | 'abandoned' | 'error', cartValue?: number) {
    this.recordMetric('checkout.event', 1, { event });
    if (cartValue) {
      this.recordMetric('checkout.value', cartValue, { event });
    }
  }

  /**
   * Record payment event
   */
  recordPaymentEvent(
    event: 'initiated' | 'succeeded' | 'failed' | 'refunded',
    amount?: number,
    provider?: string
  ) {
    this.recordMetric('payment.event', 1, { event, provider });
    if (amount) {
      this.recordMetric('payment.amount', amount, { event, provider });
    }
  }

  /**
   * Record user authentication
   */
  recordAuthEvent(method: 'phone' | 'email' | 'google' | 'facebook', success: boolean) {
    this.recordMetric('auth.event', success ? 1 : 0, { method });
  }

  /**
   * Record page performance
   */
  recordPageLoadTime(pageName: string, durationMs: number) {
    this.recordMetric('page.load', durationMs, { page: pageName });
  }

  /**
   * Record custom event
   */
  recordEvent(name: string, value: number = 1, labels?: Record<string, string>) {
    this.recordMetric(name, value, labels);
  }

  /**
   * Get metrics summary
   */
  getMetrics(name: string, timeWindowMs: number = 3600000): MetricPoint[] {
    const key = Array.from(this.metrics.keys()).find((k) => k.startsWith(name));
    if (!key) return [];

    const now = Date.now();
    return (this.metrics.get(key) || []).filter((p) => now - p.timestamp <= timeWindowMs);
  }

  /**
   * Get metric average
   */
  getMetricAverage(name: string, timeWindowMs: number = 3600000): number {
    const points = this.getMetrics(name, timeWindowMs);
    if (points.length === 0) return 0;

    const sum = points.reduce((acc, p) => acc + p.value, 0);
    return sum / points.length;
  }

  /**
   * Report metric to backend
   */
  private async reportMetric(
    name: string,
    value: number,
    labels?: Record<string, string>
  ) {
    // Batch send to backend (can be debounced)
    try {
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          value,
          timestamp: Date.now(),
          labels,
        }),
      }).catch(() => {
        // Silent fail for monitoring
      });
    } catch {
      // Ignore monitoring errors
    }
  }

  /**
   * Get health summary
   */
  async getHealthSummary(): Promise<HealthMetrics> {
    const errorRate = this.getMetricAverage('error.rate');
    const apiLatency = this.getMetricAverage('api.latency');
    const paymentSuccess = this.getMetricsRatio('payment.event', 'succeeded', 'failed');
    const checkoutAbandonment = this.getMetricsRatio('checkout.event', 'abandoned', 'completed');

    return {
      errorRate,
      apiLatency,
      paymentSuccessRate: paymentSuccess,
      checkoutAbandonmentRate: checkoutAbandonment,
      sessionDuration: 0, // TODO: Calculate from session data
      pageLoadTime: this.getMetricAverage('page.load'),
    };
  }

  /**
   * Calculate ratio between two metric types
   */
  private getMetricsRatio(metricName: string, numerator: string, denominator: string): number {
    const numPoints = this.getMetrics(metricName).filter((p) => p.labels?.event === numerator);
    const denomPoints = this.getMetrics(metricName).filter((p) => p.labels?.event === denominator);

    const numSum = numPoints.reduce((acc, p) => acc + p.value, 0);
    const denomSum = denomPoints.reduce((acc, p) => acc + p.value, 0);

    if (denomSum === 0) return 100;
    return (numSum / (numSum + denomSum)) * 100;
  }
}

export const monitoring = new MonitoringService();

export default monitoring;
