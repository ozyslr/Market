// ─── Seller Behavioral Analysis ──────────────────────────────────────────
// Analyzes seller behavior patterns to detect suspicious account activity.

export interface BehaviorProfile {
  sellerId: string;
  accountAgeDays: number;
  productCount: number;
  avgProductPrice: number;
  priceVolatility: number;
  listingFrequency: number; // products listed per week
  discountFrequency: number; // % of products with >30% discount
  imageReuseRate: number; // % of images reused across listings
  categoryDiversity: number; // number of distinct categories
  rapidPriceChanges: number; // count of >50% price changes in 24h
  suspiciousScore: number; // 0-100
}

export function analyzeSellerBehavior(seller: {
  createdAt: number; // timestamp seconds
  products: Array<{
    price: number;
    oldPrice?: number;
    images: string[];
    categoryId: string;
    createdAt: number;
    updatedAt?: number;
  }>;
}): BehaviorProfile {
  const now = Date.now() / 1000;
  const accountAgeDays = (now - seller.createdAt) / 86400;
  const products = seller.products || [];
  const productCount = products.length;

  if (productCount === 0) {
    return {
      sellerId: '',
      accountAgeDays,
      productCount: 0,
      avgProductPrice: 0,
      priceVolatility: 0,
      listingFrequency: 0,
      discountFrequency: 0,
      imageReuseRate: 0,
      categoryDiversity: 0,
      rapidPriceChanges: 0,
      suspiciousScore: 0,
    };
  }

  // Price analysis
  const prices = products.map((p) => p.price);
  const avgProductPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const priceVariance = prices.reduce((s, p) => s + (p - avgProductPrice) ** 2, 0) / prices.length;
  const priceVolatility = Math.sqrt(priceVariance) / Math.max(avgProductPrice, 1);

  // Listing frequency (products per week)
  const oldestProduct = Math.min(...products.map((p) => p.createdAt));
  const sellerActiveWeeks = Math.max(1, (now - oldestProduct) / 604800);
  const listingFrequency = productCount / sellerActiveWeeks;

  // Discount frequency
  const deepDiscounts = products.filter(
    (p) => p.oldPrice && (p.oldPrice - p.price) / p.oldPrice > 0.3,
  );
  const discountFrequency = productCount > 0 ? deepDiscounts.length / productCount : 0;

  // Image reuse rate
  const allImages = products.flatMap((p) => p.images);
  const uniqueImages = new Set(allImages);
  const imageReuseRate = allImages.length > 0 ? 1 - uniqueImages.size / allImages.length : 0;

  // Category diversity
  const categories = new Set(products.map((p) => p.categoryId));
  const categoryDiversity = categories.size;

  // Rapid price changes (>50% change in 24h)
  let rapidPriceChanges = 0;
  for (const p of products) {
    if (p.updatedAt && p.oldPrice) {
      const changeHours = (p.updatedAt - p.createdAt) / 3600;
      if (changeHours < 24 && Math.abs(p.price - p.oldPrice) / p.oldPrice > 0.5) {
        rapidPriceChanges++;
      }
    }
  }

  // Suspicious score computation
  let score = 0;
  if (accountAgeDays < 7) score += 20;
  if (listingFrequency > 20) score += 25;
  if (discountFrequency > 0.5) score += 20;
  if (imageReuseRate > 0.3) score += 15;
  if (priceVolatility > 1.0) score += 10;
  if (rapidPriceChanges > 2) score += 10;

  return {
    sellerId: '',
    accountAgeDays,
    productCount,
    avgProductPrice,
    priceVolatility,
    listingFrequency,
    discountFrequency,
    imageReuseRate,
    categoryDiversity,
    rapidPriceChanges,
    suspiciousScore: Math.min(100, score),
  };
}

export function getBehaviorFlags(profile: BehaviorProfile): string[] {
  const flags: string[] = [];
  if (profile.accountAgeDays < 7)
    flags.push(`Yeni hesap (${Math.round(profile.accountAgeDays)} gün)`);
  if (profile.listingFrequency > 20)
    flags.push(`Yüksek listeleme hızı (${profile.listingFrequency.toFixed(1)}/hafta)`);
  if (profile.discountFrequency > 0.5)
    flags.push(`Sık derin indirim (%${Math.round(profile.discountFrequency * 100)})`);
  if (profile.imageReuseRate > 0.3)
    flags.push(`Görsel tekrar kullanımı (%${Math.round(profile.imageReuseRate * 100)})`);
  if (profile.priceVolatility > 1.0) flags.push(`Yüksek fiyat oynaklığı`);
  if (profile.rapidPriceChanges > 2)
    flags.push(`Hızlı fiyat değişimi (${profile.rapidPriceChanges} kez)`);
  return flags;
}
