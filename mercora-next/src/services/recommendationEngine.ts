/**
 * Recommendation Engine (STREAM N)
 * Collaborative filtering, content-based, and personalized recommendations
 */

export interface ProductVector {
  productId: string;
  vector: number[]; // Embedding vector
  category: string;
  tags: string[];
}

export interface UserVector {
  userId: string;
  vector: number[]; // Embedding vector
  preferences: Record<string, number>; // Category -> preference score
  viewedProducts: string[];
  purchasedProducts: string[];
}

export interface Recommendation {
  productId: string;
  score: number; // 0-100 confidence
  reason: 'collaborative' | 'content_based' | 'trending' | 'personalized';
  metadata?: Record<string, any>;
}

class RecommendationEngine {
  private readonly MIN_RECOMMENDATION_SCORE = 20; // Don't recommend below this confidence
  private readonly VECTOR_DIMENSION = 768; // Embedding dimension size
  private readonly MAX_RECOMMENDATIONS = 20;

  /**
   * Generate personalized recommendations for user
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<Recommendation[]> {
    try {
      // In production:
      // 1. Load user vector from cache or compute from interactions
      // 2. Load product vectors for candidate products
      // 3. Score candidates using multiple algorithms:
      //    - Cosine similarity (collaborative filtering)
      //    - Content-based matching
      //    - Trending boost
      //    - Diversity penalty
      // 4. Combine scores with weighted ensemble
      // 5. Cache results for 5 minutes

      const mockRecommendations: Recommendation[] = [
        {
          productId: 'prod_42',
          score: 92,
          reason: 'collaborative',
          metadata: { similarity: 0.92, viewedByCount: 1250 },
        },
        {
          productId: 'prod_85',
          score: 87,
          reason: 'content_based',
          metadata: { categoryMatch: 'electronics', tagMatch: 3 },
        },
        {
          productId: 'prod_103',
          score: 81,
          reason: 'trending',
          metadata: { dayViewsGrowth: 245, dayPurchases: 12 },
        },
      ];

      return mockRecommendations.slice(0, limit);
    } catch (error) {
      console.error('Get personalized recommendations error:', error);
      return [];
    }
  }

  /**
   * Find similar products to given product
   */
  async getSimilarProducts(
    productId: string,
    excludeIds: string[] = [],
    limit: number = 8
  ): Promise<Recommendation[]> {
    try {
      // In production:
      // 1. Load product vector
      // 2. Find k-nearest neighbors in embedding space
      // 3. Filter out excludeIds
      // 4. Score by cosine similarity
      // 5. Boost by product popularity/rating

      return [];
    } catch (error) {
      console.error('Get similar products error:', error);
      return [];
    }
  }

  /**
   * Get "frequently bought together" recommendations
   */
  async getFrequentlyBoughtTogether(
    productIds: string[],
    limit: number = 5
  ): Promise<Recommendation[]> {
    try {
      // In production:
      // Query transaction history
      // Find products frequently co-purchased with given productIds
      // Score by co-occurrence frequency and purchase value lift

      return [];
    } catch (error) {
      console.error('Get frequently bought together error:', error);
      return [];
    }
  }

  /**
   * Get trending products recommendations
   */
  async getTrendingRecommendations(
    category?: string,
    limit: number = 10
  ): Promise<Recommendation[]> {
    try {
      // In production:
      // Query daily/weekly trending products
      // Filter by category if specified
      // Rank by view velocity, purchase velocity, review growth

      return [];
    } catch (error) {
      console.error('Get trending recommendations error:', error);
      return [];
    }
  }

  /**
   * Update user interaction
   */
  async recordInteraction(
    userId: string,
    productId: string,
    interactionType: 'view' | 'click' | 'purchase' | 'like' | 'dislike' | 'cart_add'
  ): Promise<void> {
    try {
      // In production:
      // 1. Store interaction in time-series database (BigQuery, TimescaleDB)
      // 2. Update user interaction count
      // 3. Invalidate user vector cache (will be recomputed)
      // 4. Update product interaction metrics

      console.log(`[Recommendation] Recorded ${interactionType} for user ${userId} on product ${productId}`);
    } catch (error) {
      console.error('Record interaction error:', error);
    }
  }

  /**
   * Batch generate embeddings for products
   */
  async generateProductEmbeddings(
    productIds: string[]
  ): Promise<Map<string, ProductVector>> {
    try {
      // In production:
      // 1. Load product metadata (name, description, category, tags, rating)
      // 2. Convert to embeddings using Sentence Transformer or custom model
      // 3. Store in vector database (Pinecone, Weaviate, or managed Elasticsearch)
      // 4. Cache in Redis for hot products

      console.log(`[Recommendation] Generated embeddings for ${productIds.length} products`);
      return new Map();
    } catch (error) {
      console.error('Generate product embeddings error:', error);
      return new Map();
    }
  }

  /**
   * Rerank search results with personalization
   */
  async rerankSearchResults(
    userId: string,
    productIds: string[],
    query?: string
  ): Promise<string[]> {
    try {
      // In production:
      // 1. Get user vector
      // 2. Get product vectors
      // 3. Score each product by:
      //    - BM25 relevance to query
      //    - User preference alignment
      //    - Product popularity
      //    - Seller trust score
      // 4. Sort by combined score
      // 5. Apply diversity penalty to avoid repetition

      return productIds;
    } catch (error) {
      console.error('Rerank search results error:', error);
      return productIds;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      magnitude1 += vector1[i] * vector1[i];
      magnitude2 += vector2[i] * vector2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * A/B test recommendation algorithm
   */
  async runRecommendationABTest(
    userId: string,
    variantA: Recommendation[],
    variantB: Recommendation[]
  ): Promise<{ variant: 'A' | 'B'; recommendations: Recommendation[] }> {
    try {
      // In production:
      // 1. Check user's test bucket (consistent hashing based on userId)
      // 2. Return appropriate variant
      // 3. Track CTR, conversion, AOV for both variants
      // 4. After significance threshold, declare winner

      const bucket = Math.random();
      return bucket < 0.5
        ? { variant: 'A', recommendations: variantA }
        : { variant: 'B', recommendations: variantB };
    } catch (error) {
      console.error('Run A/B test error:', error);
      return { variant: 'A', recommendations: variantA };
    }
  }
}

export const recommendationEngine = new RecommendationEngine();
