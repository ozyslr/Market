/**
 * Rakip Fiyat Analizi (Competitive Price Analysis)
 *
 * Analyzes seller product prices against mock competitor benchmarks
 * and provides optimization recommendations.
 *
 * In production: swap mock data with real competitor API scrapers.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CompetitorPrice {
  platform: 'Trendyol' | 'Hepsiburada' | 'AmazonTR' | 'N11';
  price: number;
  sellerName: string;
  rating: number;
  shippingIncluded: boolean;
  lastUpdated: string;
}

export interface ProductPriceAnalysis {
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  /** Seller's current price */
  yourPrice: number;
  /** Competitor prices */
  competitors: CompetitorPrice[];
  /** Market statistics */
  marketLow: number;
  marketHigh: number;
  marketAverage: number;
  marketMedian: number;
  /** Your position */
  position: 'lowest' | 'below_average' | 'average' | 'above_average' | 'highest';
  /** Recommended optimal price */
  recommendedPrice: number;
  /** Potential monthly savings/additional revenue */
  potentialImpact: number;
  /** Competitiveness score 0-100 */
  competitivenessScore: number;
}

export interface CategoryBenchmark {
  categoryId: string;
  categoryName: string;
  avgPrice: number;
  avgMargin: number;
  priceRange: { low: number; high: number };
  topSellerPrice: number;
  yourAvgPrice: number;
  yourPosition: 'below' | 'in_range' | 'above';
}

export interface PriceAnalysisSummary {
  totalProducts: number;
  analyzedProducts: number;
  /** Products priced below market average */
  belowMarket: number;
  /** Products priced at market average */
  atMarket: number;
  /** Products priced above market average */
  aboveMarket: number;
  /** Products where you're the cheapest */
  cheapest: number;
  /** Average competitiveness score */
  avgCompetitiveness: number;
  /** Estimated monthly revenue impact from price optimization */
  estimatedMonthlyImpact: number;
}

// ─── Mock Competitor Data Generator ──────────────────────────────────────────

const PLATFORM_SELLERS: Record<string, string[]> = {
  Trendyol: ['TrendyolMega', 'HızlıSatıcı', 'BestPrice', 'TrendStore'],
  Hepsiburada: ['HBMerchant', 'BüyükMağaza', 'HızlıTeslimat'],
  AmazonTR: ['Amazon', 'GlobalSeller', 'PrimeStore'],
  N11: ['N11Seller', 'UygunFiyat', 'KaliteliÜrün'],
};

function generateCompetitorPrices(yourPrice: number): CompetitorPrice[] {
  const platforms: Array<'Trendyol' | 'Hepsiburada' | 'AmazonTR' | 'N11'> = ['Trendyol', 'Hepsiburada', 'AmazonTR', 'N11'];
  const variation = yourPrice * 0.25; // 25% variation range

  return platforms.map(platform => {
    const offset = (Math.random() - 0.45) * variation * 2; // Slightly biased to be cheaper
    const price = Math.max(1, Math.round((yourPrice + offset) * 100) / 100);
    const sellers = PLATFORM_SELLERS[platform];
    return {
      platform,
      price,
      sellerName: sellers[Math.floor(Math.random() * sellers.length)],
      rating: Math.round((3 + Math.random() * 2) * 10) / 10,
      shippingIncluded: Math.random() > 0.3,
      lastUpdated: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString(),
    };
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Analyze a single product against competitors */
export function analyzeProductPrice(
  productId: string,
  productName: string,
  productImage: string,
  category: string,
  yourPrice: number,
): ProductPriceAnalysis {
  const competitors = generateCompetitorPrices(yourPrice);
  const allPrices = [yourPrice, ...competitors.map(c => c.price)];
  const sorted = [...allPrices].sort((a, b) => a - b);

  const marketLow = sorted[0];
  const marketHigh = sorted[sorted.length - 1];
  const marketAverage = Math.round(allPrices.reduce((s, p) => s + p, 0) / allPrices.length * 100) / 100;
  const marketMedian = sorted[Math.floor(sorted.length / 2)];

  // Position
  let position: ProductPriceAnalysis['position'];
  const pctDiff = ((yourPrice - marketAverage) / marketAverage) * 100;
  if (yourPrice === marketLow) position = 'lowest';
  else if (pctDiff < -5) position = 'below_average';
  else if (pctDiff > 10) position = 'highest';
  else if (pctDiff > 5) position = 'above_average';
  else position = 'average';

  // Recommended price: aim for 3-5% below average to be competitive but profitable
  const recommendedPrice = Math.round(marketAverage * 0.96 * 100) / 100;

  // Potential impact
  const priceGap = yourPrice - recommendedPrice;
  const monthlySalesEstimate = 30; // Assume ~30 units/month
  const potentialImpact = Math.round(priceGap * monthlySalesEstimate * 100) / 100;

  // Competitiveness score
  const cheaperThan = competitors.filter(c => c.price > yourPrice).length;
  const competitivenessScore = Math.round((cheaperThan / competitors.length) * 100);

  return {
    productId, productName, productImage, category, yourPrice,
    competitors, marketLow, marketHigh, marketAverage, marketMedian,
    position, recommendedPrice, potentialImpact, competitivenessScore,
  };
}

/** Analyze a batch of products and produce summary */
export function analyzeProductBatch(products: { id: string; name: string; image: string; category: string; price: number }[]): {
  analyses: ProductPriceAnalysis[];
  summary: PriceAnalysisSummary;
} {
  const analyses = products.map(p => analyzeProductPrice(p.id, p.name, p.image, p.category, p.price));

  const belowMarket = analyses.filter(a => a.position === 'below_average' || a.position === 'lowest').length;
  const atMarket = analyses.filter(a => a.position === 'average').length;
  const aboveMarket = analyses.filter(a => a.position === 'above_average' || a.position === 'highest').length;
  const cheapest = analyses.filter(a => a.position === 'lowest').length;
  const avgCompetitiveness = Math.round(analyses.reduce((s, a) => s + a.competitivenessScore, 0) / analyses.length);
  const estimatedMonthlyImpact = analyses.reduce((s, a) => s + a.potentialImpact, 0);

  return {
    analyses,
    summary: {
      totalProducts: products.length,
      analyzedProducts: analyses.length,
      belowMarket, atMarket, aboveMarket, cheapest,
      avgCompetitiveness,
      estimatedMonthlyImpact,
    },
  };
}

/** Get category benchmarks for comparison */
export function getCategoryBenchmarks(yourProducts: { category: string; price: number }[]): CategoryBenchmark[] {
  const categories = [...new Set(yourProducts.map(p => p.category))];

  return categories.map(cat => {
    const catProducts = yourProducts.filter(p => p.category === cat);
    const yourAvg = catProducts.reduce((s, p) => s + p.price, 0) / catProducts.length;

    // Simulate market data per category
    const marketBase = yourAvg * (0.8 + Math.random() * 0.4);
    const avgPrice = Math.round(marketBase * 100) / 100;
    const avgMargin = Math.round((15 + Math.random() * 25) * 10) / 10;

    return {
      categoryId: cat.toLowerCase().replace(/\s+/g, '-'),
      categoryName: cat,
      avgPrice,
      avgMargin,
      priceRange: {
        low: Math.round(avgPrice * 0.7 * 100) / 100,
        high: Math.round(avgPrice * 1.4 * 100) / 100,
      },
      topSellerPrice: Math.round(avgPrice * 0.85 * 100) / 100,
      yourAvgPrice: Math.round(yourAvg * 100) / 100,
      yourPosition: yourAvg < avgPrice * 0.9 ? 'below' : yourAvg > avgPrice * 1.1 ? 'above' : 'in_range',
    };
  });
}
