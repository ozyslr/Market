// ── Rule-based fraud detection ──────────────────────────────────────────────

interface ProductFlags {
  isNewSeller: boolean; // registered < 30 days ago
  discountPercent: number; // e.g., 50 = 50% off
  hasStockImages: boolean; // images match known stock photo URLs
  priceBelowAverage: boolean; // >40% below category average
  titleAllCaps: boolean;
  noDescription: boolean;
}

export function analyzeProduct(
  seller: any,
  product: any,
  categoryAvgPrice: number,
): {
  score: number;
  flags: string[];
  needsReview: boolean;
} {
  const flags: string[] = [];
  let score = 0;

  const factors: ProductFlags = {
    isNewSeller: (seller.createdAt?._seconds || 0) > Date.now() / 1000 - 30 * 86400,
    discountPercent: product.oldPrice
      ? ((product.oldPrice - product.price) / product.oldPrice) * 100
      : 0,
    hasStockImages: checkStockImages(product.images || []),
    priceBelowAverage: categoryAvgPrice > 0 && product.price < categoryAvgPrice * 0.6,
    titleAllCaps:
      (product.title || '') === (product.title || '').toUpperCase() && product.title?.length > 10,
    noDescription: !product.description || product.description.length < 20,
  };

  if (factors.isNewSeller) {
    score += 15;
    flags.push('Yeni satıcı');
  }
  if (factors.discountPercent > 50) {
    score += 20;
    flags.push(`%${Math.round(factors.discountPercent)} indirim`);
  }
  if (factors.hasStockImages) {
    score += 25;
    flags.push('Stok görseller kullanılmış');
  }
  if (factors.priceBelowAverage) {
    score += 20;
    flags.push('Kategori ortalamasının çok altında fiyat');
  }
  if (factors.titleAllCaps) {
    score += 10;
    flags.push('Başlık tamamen büyük harf');
  }
  if (factors.noDescription) {
    score += 10;
    flags.push('Açıklama çok kısa veya yok');
  }

  return {
    score,
    flags,
    needsReview: score >= 50, // threshold: 50+ points = admin review required
  };
}

function checkStockImages(images: string[]): boolean {
  const stockDomains = [
    'unsplash.com',
    'picsum.photos',
    'placeholder.com',
    'pexels.com',
    'pixabay.com',
    'shutterstock.com',
    'istockphoto.com',
    'alamy.com',
  ];
  if (!images.length) return false;
  const stockCount = images.filter((url) => stockDomains.some((d) => url.includes(d))).length;
  return stockCount === images.length; // ALL images are stock → flag
}
