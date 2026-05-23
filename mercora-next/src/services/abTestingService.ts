/**
 * A/B Testing Service (STREAM H)
 * Manages A/B testing experiments with user bucketing and variant tracking
 */

import { Firestore, collection, doc, setDoc, getDoc } from 'firebase/firestore';

export interface Variant {
  id: string;
  name: string;
  percentage: number;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  variants: Variant[];
  startDate: Date;
  endDate?: Date;
  targetAudience?: {
    userSegment?: string;
    region?: string[];
    tier?: string[];
  };
  metrics: {
    primary: string; // e.g., 'conversion_rate'
    secondary?: string[];
  };
}

export interface UserVariant {
  testId: string;
  userId: string;
  variantId: string;
  assignedAt: Date;
  metadata?: Record<string, any>;
}

class ABTestingService {
  private db: Firestore | null = null;
  private userVariantCache: Map<string, UserVariant> = new Map();

  /**
   * Initialize with Firestore instance
   */
  initialize(db: Firestore) {
    this.db = db;
  }

  /**
   * Create a new A/B test
   */
  async createTest(test: ABTest): Promise<{ success: boolean; error?: string }> {
    if (!this.db) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      // Validate variants add up to 100%
      const totalPercentage = test.variants.reduce((sum, v) => sum + v.percentage, 0);
      if (totalPercentage !== 100) {
        return { success: false, error: 'Variant percentages must sum to 100%' };
      }

      const testRef = doc(collection(this.db, 'abTests'), test.id);
      await setDoc(testRef, {
        ...test,
        startDate: test.startDate.toISOString(),
        endDate: test.endDate?.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('Create test error:', error);
      return { success: false, error: 'Failed to create test' };
    }
  }

  /**
   * Get variant assignment for a user
   * Creates consistent assignment based on user ID hash
   */
  async getUserVariant(
    userId: string,
    testId: string,
    test?: ABTest
  ): Promise<{ variantId: string; variantName: string } | null> {
    try {
      // Check cache first
      const cacheKey = `${userId}_${testId}`;
      if (this.userVariantCache.has(cacheKey)) {
        const cached = this.userVariantCache.get(cacheKey)!;
        const variant = test?.variants.find((v) => v.id === cached.variantId);
        return variant
          ? { variantId: cached.variantId, variantName: variant.name }
          : null;
      }

      // Check if already assigned in database
      if (this.db) {
        const assignmentRef = doc(
          this.db,
          'abTests',
          testId,
          'userVariants',
          userId
        );
        const assignmentDoc = await getDoc(assignmentRef);

        if (assignmentDoc.exists()) {
          const data = assignmentDoc.data() as UserVariant;
          this.userVariantCache.set(cacheKey, data);

          const variant = test?.variants.find((v) => v.id === data.variantId);
          return variant
            ? { variantId: data.variantId, variantName: variant.name }
            : null;
        }
      }

      // Assign variant based on user hash if not already assigned
      if (test) {
        const variantId = this.assignVariant(userId, test.variants);
        const variant = test.variants.find((v) => v.id === variantId);

        // Store assignment
        if (this.db) {
          const assignmentRef = doc(
            this.db,
            'abTests',
            testId,
            'userVariants',
            userId
          );
          await setDoc(assignmentRef, {
            testId,
            userId,
            variantId,
            assignedAt: new Date().toISOString(),
          });
        }

        const userVariant: UserVariant = {
          testId,
          userId,
          variantId,
          assignedAt: new Date(),
        };
        this.userVariantCache.set(cacheKey, userVariant);

        return variant ? { variantId, variantName: variant.name } : null;
      }

      return null;
    } catch (error) {
      console.error('Get user variant error:', error);
      return null;
    }
  }

  /**
   * Assign variant based on consistent hash
   * Ensures same user always gets same variant
   */
  private assignVariant(userId: string, variants: Variant[]): string {
    const hash = this.hashString(userId);
    const bucket = hash % 100;

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.percentage;
      if (bucket < cumulative) {
        return variant.id;
      }
    }

    // Fallback to last variant
    return variants[variants.length - 1].id;
  }

  /**
   * Simple hash function for consistent bucketing
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Track event for A/B test analysis
   */
  async trackEvent(
    userId: string,
    testId: string,
    variantId: string,
    eventType: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.db) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const eventRef = doc(collection(this.db, 'abTests', testId, 'events'));
      await setDoc(eventRef, {
        userId,
        variantId,
        eventType,
        timestamp: new Date().toISOString(),
        metadata,
      });

      return { success: true };
    } catch (error) {
      console.error('Track event error:', error);
      return { success: false, error: 'Failed to track event' };
    }
  }

  /**
   * Get test results
   */
  async getTestResults(testId: string): Promise<{
    testId: string;
    variants: Array<{
      id: string;
      name: string;
      users: number;
      conversions: number;
      conversionRate: number;
    }>;
  } | null> {
    if (!this.db) {
      return null;
    }

    try {
      const testRef = doc(this.db, 'abTests', testId);
      const testDoc = await getDoc(testRef);

      if (!testDoc.exists()) {
        return null;
      }

      const test = testDoc.data() as ABTest;

      // Calculate results from user assignments and events
      const results = test.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        users: 0, // Would be fetched from database
        conversions: 0, // Would be fetched from database
        conversionRate: 0,
      }));

      return {
        testId,
        variants: results,
      };
    } catch (error) {
      console.error('Get results error:', error);
      return null;
    }
  }

  /**
   * Pause a test
   */
  async pauseTest(testId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.db) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const testRef = doc(this.db, 'abTests', testId);
      await setDoc(
        testRef,
        {
          status: 'paused',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return { success: true };
    } catch (error) {
      console.error('Pause test error:', error);
      return { success: false, error: 'Failed to pause test' };
    }
  }

  /**
   * Complete a test
   */
  async completeTest(
    testId: string,
    winner: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.db) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const testRef = doc(this.db, 'abTests', testId);
      await setDoc(
        testRef,
        {
          status: 'completed',
          winner,
          endDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return { success: true };
    } catch (error) {
      console.error('Complete test error:', error);
      return { success: false, error: 'Failed to complete test' };
    }
  }
}

export const abTestingService = new ABTestingService();
