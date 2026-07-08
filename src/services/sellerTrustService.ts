// ── Seller trust score computation ───────────────────────────────────────────

interface TrustFactors {
  orderCompletionRate: number; // 0-1
  avgReviewRating: number; // 1-5
  sellerAgeDays: number;
  responseRate: number; // 0-1 (messages responded within 24h)
  totalOrders: number;
}

export function computeTrustScore(factors: TrustFactors): number {
  // Each factor contributes 0-20 points for a 0-100 score
  let score = 0;

  // Order completion (20 pts): 95%+ = full, <50% = 0
  score += Math.max(0, Math.min(20, (factors.orderCompletionRate - 0.5) * 40));

  // Review rating (20 pts): 4.5+ = full, <2 = 0
  score += Math.max(0, Math.min(20, (factors.avgReviewRating - 2) * 6.67));

  // Seller age (20 pts): 1 year+ = full, <30 days = 5
  score += Math.max(5, Math.min(20, (factors.sellerAgeDays / 365) * 20));

  // Response rate (20 pts): 80%+ = full
  score += Math.max(0, Math.min(20, factors.responseRate * 25));

  // Total orders (20 pts): 100+ = full, each order = 0.2 pts
  score += Math.min(20, factors.totalOrders * 0.2);

  return Math.round(score);
}

export function getTrustLevel(score: number): { label: string; color: string; minOrders: number } {
  if (score >= 80) return { label: 'Güvenilir Satıcı', color: 'emerald', minOrders: 50 };
  if (score >= 60) return { label: 'Başarılı Satıcı', color: 'blue', minOrders: 10 };
  if (score >= 40) return { label: 'Yeni Satıcı', color: 'amber', minOrders: 0 };
  return { label: 'Değerlendiriliyor', color: 'zinc', minOrders: 0 };
}
