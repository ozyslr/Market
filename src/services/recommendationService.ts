import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface RecommendationGroup {
  title: string;
  subtitle: string;
  products: Product[];
  source: 'collaborative' | 'content_based' | 'gemini_ai' | 'trending' | 'category';
}

// ─── Collaborative: "Bunu alanlar şunları da aldı" ────────────────────────

/**
 * Find products frequently bought together with the given product.
 * Uses order history — finds orders containing the product, then extracts co-occurring products.
 */
export async function getCollaborativeRecommendations(
  productId: string,
  maxResults = 8,
): Promise<Product[]> {
  try {
    // Find orders containing this product
    const ordersSnap = await getDocs(query(
      collection(db, 'orders'),
      where('status', 'in', ['delivered', 'paid', 'processing']),
      limit(50),
    ));

    // Extract co-occurring product IDs
    const coOccurrence = new Map<string, number>();
    const productIds = new Set<string>();

    ordersSnap.docs.forEach(doc => {
      const items = doc.data().items || [];
      const idsInOrder = items.map((i: any) => i.productId || i.id).filter(Boolean);
      if (!idsInOrder.includes(productId)) return; // Skip orders without the target product

      idsInOrder.forEach((id: string) => {
        if (id !== productId) {
          coOccurrence.set(id, (coOccurrence.get(id) || 0) + 1);
          productIds.add(id);
        }
      });
    });

    if (productIds.size === 0) return [];

    // Fetch product details for co-occurring products
    const products: Product[] = [];
    const sortedIds = [...coOccurrence.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxResults)
      .map(([id]) => id);

    for (const id of sortedIds) {
      const { getDoc, doc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'products', id));
      if (snap.exists()) {
        products.push({ id: snap.id, ...snap.data() } as Product);
      }
    }

    return products;
  } catch {
    return [];
  }
}

// ─── Content-based: Kategori / etiket benzerliği ──────────────────────────

/**
 * Find similar products based on category, tags, and price range.
 */
export async function getContentBasedRecommendations(
  product: Product,
  maxResults = 8,
): Promise<Product[]> {
  try {
    const constraints: any[] = [];

    // Primary filter: same category
    if (product.categoryId) {
      constraints.push(where('categoryId', '==', product.categoryId));
    }

    // Exclude the product itself
    const productsRef = collection(db, 'products');
    let q = query(productsRef, ...constraints, limit(maxResults + 5));
    const snap = await getDocs(q);

    let products = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Product))
      .filter(p => p.id !== product.id && p.isActive !== false);

    // Score by tag overlap + price proximity
    const productTags = new Set(product.tags || []);
    products.sort((a, b) => {
      const aTagOverlap = (a.tags || []).filter(t => productTags.has(t)).length;
      const bTagOverlap = (b.tags || []).filter(t => productTags.has(t)).length;
      const aPriceDiff = Math.abs(a.price - product.price);
      const bPriceDiff = Math.abs(b.price - product.price);
      return bTagOverlap - aTagOverlap || aPriceDiff - bPriceDiff;
    });

    return products.slice(0, maxResults);
  } catch {
    return [];
  }
}

// ─── Gemini AI-powered personalized recommendations ───────────────────────

let geminiClient: any = null;

async function getGeminiClient() {
  if (geminiClient) return geminiClient;
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) return null;
  const { GoogleGenAI } = await import('@google/genai');
  geminiClient = new GoogleGenAI({ apiKey: key });
  return geminiClient;
}

interface RecommendationContext {
  userId?: string;
  recentOrderIds?: string[];
  viewedProductIds?: string[];
  cartProductIds?: string[];
}

/**
 * Use Gemini AI to generate personalized product recommendations.
 * Falls back to content-based if AI is unavailable.
 */
export async function getGeminiRecommendations(
  context: RecommendationContext,
  availableProducts: Product[],
  maxResults = 6,
): Promise<Product[]> {
  const ai = await getGeminiClient();
  if (!ai || availableProducts.length === 0) return [];

  try {
    const productCatalog = availableProducts.slice(0, 30).map(p => ({
      id: p.id,
      title: p.title,
      categoryId: p.categoryId,
      price: p.price,
      tags: p.tags,
      rating: p.rating,
    }));

    const prompt = `You are Benim Olan's AI recommendation engine. Analyze the user context and product catalog, then return the IDs of the ${maxResults} most relevant products to recommend.

User Context: ${JSON.stringify(context)}

Product Catalog: ${JSON.stringify(productCatalog)}

Rules:
- Return ONLY a JSON array of product IDs (strings).
- Prioritize products matching the user's viewed/carted categories.
- Diversity: don't recommend all from the same category.
- Prefer higher-rated products when relevance is equal.
- Do NOT include any product IDs from the user's cart or recently ordered products.

Return format: ["id1", "id2", ...]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text || '[]';
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) return [];

    const ids: string[] = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(ids) || ids.length === 0) return [];

    // Match IDs to products, preserving AI ranking order
    const productMap = new Map(availableProducts.map(p => [p.id, p]));
    return ids
      .map(id => productMap.get(id))
      .filter((p): p is Product => !!p)
      .slice(0, maxResults);
  } catch {
    return [];
  }
}

// ─── Trending products (fallback) ─────────────────────────────────────────

export async function getTrendingProducts(maxResults = 8): Promise<Product[]> {
  try {
    const snap = await getDocs(query(
      collection(db, 'products'),
      where('isActive', '==', true),
      orderBy('rating', 'desc'),
      limit(maxResults),
    ));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  } catch {
    // Fallback without composite index
    try {
      const snap = await getDocs(collection(db, 'products'));
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Product))
        .filter(p => p.isActive !== false)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, maxResults);
    } catch {
      return [];
    }
  }
}

// ─── Unified recommendation orchestrator ──────────────────────────────────

/**
 * Get all recommendation groups for a given context.
 * Used on the home page for personalized sections.
 */
export async function getAllRecommendations(context: {
  userId?: string;
  currentProduct?: Product;
  viewedProductIds?: string[];
  cartProductIds?: string[];
}): Promise<RecommendationGroup[]> {
  const groups: RecommendationGroup[] = [];

  // 1. Trending / popular (always shown)
  const trending = await getTrendingProducts(8);
  if (trending.length > 0) {
    groups.push({
      title: 'Popüler Ürünler',
      subtitle: 'En çok ilgi görenler',
      products: trending,
      source: 'trending',
    });
  }

  // 2. Category-based (if viewing a product)
  if (context.currentProduct) {
    const similar = await getContentBasedRecommendations(context.currentProduct, 8);
    if (similar.length > 0) {
      groups.push({
        title: 'Benzer Ürünler',
        subtitle: context.currentProduct.categoryId
          ? 'Aynı kategorideki diğer ürünler'
          : 'Benzer özellikteki ürünler',
        products: similar,
        source: 'content_based',
      });
    }

    const alsoBought = await getCollaborativeRecommendations(context.currentProduct.id, 6);
    if (alsoBought.length > 0) {
      groups.push({
        title: 'Bunu Alanlar Bunları da Aldı',
        subtitle: 'Sık birlikte satın alınanlar',
        products: alsoBought,
        source: 'collaborative',
      });
    }
  }

  // 3. AI personalized (if user context available)
  if (context.userId || context.viewedProductIds?.length || context.cartProductIds?.length) {
    const allProducts = [...trending, ...(groups.flatMap(g => g.products))];
    const uniqueProducts = Array.from(new Map(allProducts.map(p => [p.id, p])).values());
    const aiRecs = await getGeminiRecommendations(
      {
        userId: context.userId,
        viewedProductIds: context.viewedProductIds,
        cartProductIds: context.cartProductIds,
      },
      uniqueProducts,
      6,
    );
    if (aiRecs.length > 0) {
      groups.unshift({
        title: 'Size Özel',
        subtitle: 'Yapay zeka ile seçildi',
        products: aiRecs,
        source: 'gemini_ai',
      });
    }
  }

  return groups;
}
