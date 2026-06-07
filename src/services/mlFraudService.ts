// ─── ML Anomaly Detection Service ───────────────────────────────────────
// Statistical methods for fraud detection without requiring external ML libs.
// Computes Z-scores, IQR outliers, and moving averages on seller/product data.

export interface AnomalyResult {
  isAnomaly: boolean;
  score: number; // 0-100, higher = more suspicious
  method: string; // which method detected it
  details: string[];
  threshold: number;
}

// ── Z-Score Anomaly Detection ─────────────────────────────────────────────

export function zScoreAnomaly(
  value: number,
  mean: number,
  stdDev: number,
  threshold = 2.5,
): AnomalyResult {
  if (stdDev === 0) return { isAnomaly: false, score: 0, method: 'zscore', details: [], threshold };
  const z = Math.abs((value - mean) / stdDev);
  const score = Math.min(100, (z / threshold) * 50);
  return {
    isAnomaly: z > threshold,
    score: Math.round(score),
    method: 'zscore',
    details: z > threshold ? [`Z-score ${z.toFixed(2)} exceeds threshold ${threshold}`] : [],
    threshold,
  };
}

// ── IQR (Interquartile Range) Outlier Detection ────────────────────────────

export function iqrOutlier(value: number, q1: number, q3: number, multiplier = 1.5): AnomalyResult {
  const iqr = q3 - q1;
  const lower = q1 - multiplier * iqr;
  const upper = q3 + multiplier * iqr;
  const isOutlier = value < lower || value > upper;
  const distance = Math.min(Math.abs(value - lower), Math.abs(value - upper));
  const maxDist = iqr * 3;
  const score = Math.min(100, (distance / Math.max(maxDist, 1)) * 50);

  return {
    isAnomaly: isOutlier,
    score: Math.round(score),
    method: 'iqr',
    details: isOutlier
      ? [`Value ${value} outside IQR range [${lower.toFixed(2)}, ${upper.toFixed(2)}]`]
      : [],
    threshold: multiplier,
  };
}

// ── Moving Average Deviation ───────────────────────────────────────────────

export function movingAverageDeviation(
  currentValue: number,
  historicalValues: number[],
  windowSize = 10,
  thresholdMultiplier = 2.0,
): AnomalyResult {
  const window = historicalValues.slice(-windowSize);
  if (window.length < 3)
    return {
      isAnomaly: false,
      score: 0,
      method: 'moving_avg',
      details: [],
      threshold: thresholdMultiplier,
    };

  const avg = window.reduce((a, b) => a + b, 0) / window.length;
  const variance = window.reduce((s, v) => s + (v - avg) ** 2, 0) / window.length;
  const stdDev = Math.sqrt(variance);
  const deviation = Math.abs(currentValue - avg);
  const score = Math.min(100, (deviation / Math.max(stdDev * thresholdMultiplier, 0.01)) * 40);

  return {
    isAnomaly: deviation > stdDev * thresholdMultiplier,
    score: Math.round(score),
    method: 'moving_avg',
    details:
      deviation > stdDev * thresholdMultiplier
        ? [
            `Current ${currentValue} deviates from moving avg ${avg.toFixed(2)} by ${deviation.toFixed(2)}`,
          ]
        : [],
    threshold: thresholdMultiplier,
  };
}

// ── Combined ML Fraud Score ───────────────────────────────────────────────

export function computeMlFraudScore(
  product: { price: number; oldPrice?: number; discountPercent: number },
  sellerStats: {
    avgPrice: number;
    priceStdDev: number;
    recentPrices: number[];
    avgDiscount: number;
  },
  categoryStats: { avgPrice: number; priceStdDev: number; priceQ1: number; priceQ3: number },
): { totalScore: number; flags: string[]; anomalies: AnomalyResult[] } {
  const anomalies: AnomalyResult[] = [];
  const flags: string[] = [];

  // 1. Price Z-score vs category
  const priceZ = zScoreAnomaly(product.price, categoryStats.avgPrice, categoryStats.priceStdDev);
  if (priceZ.isAnomaly) {
    anomalies.push(priceZ);
    flags.push(`Anormal fiyat (Z=${priceZ.score})`);
  }

  // 2. Price IQR vs category
  const priceIqr = iqrOutlier(product.price, categoryStats.priceQ1, categoryStats.priceQ3);
  if (priceIqr.isAnomaly) {
    anomalies.push(priceIqr);
    flags.push(`Fiyat IQR dışı (skor=${priceIqr.score})`);
  }

  // 3. Discount anomaly vs seller history
  const discountMa = movingAverageDeviation(
    product.discountPercent,
    sellerStats.recentPrices.map(() => sellerStats.avgDiscount),
  );
  if (discountMa.isAnomaly) {
    anomalies.push(discountMa);
    flags.push(`Anormal indirim (skor=${discountMa.score})`);
  }

  // 4. Price deviation from seller's own average
  const sellerPriceZ = zScoreAnomaly(product.price, sellerStats.avgPrice, sellerStats.priceStdDev);
  if (sellerPriceZ.isAnomaly) {
    anomalies.push(sellerPriceZ);
    flags.push(`Satıcı fiyat sapması (Z=${sellerPriceZ.score})`);
  }

  // Weighted total: Z-score (30%) + IQR (30%) + moving avg (20%) + seller deviation (20%)
  const totalScore = Math.round(
    priceZ.score * 0.3 + priceIqr.score * 0.3 + discountMa.score * 0.2 + sellerPriceZ.score * 0.2,
  );

  return { totalScore: Math.min(100, totalScore), flags, anomalies };
}
