/**
 * Feature Flag Service (STREAM H)
 * Enable/disable features per user, region, or globally
 *
 * Features:
 * - Global flags (enabled for all users)
 * - Rollout flags (percentage-based gradual rollout)
 * - User flags (enable for specific users)
 * - Region/tier flags (based on location or subscription tier)
 */

import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number; // 0-100
  allowedUsers?: string[]; // User IDs with access
  allowedRegions?: string[]; // TR, US, GB, etc
  allowedTiers?: string[]; // Standard, Pro, Enterprise
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

const FLAGS_COLLECTION = 'feature_flags';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class FeatureFlagService {
  private flagCache: Map<string, { flags: FeatureFlag[]; timestamp: number }> = new Map();

  /**
   * Get all feature flags (with caching)
   */
  async getFlags(): Promise<FeatureFlag[]> {
    const cacheKey = 'all_flags';
    const cached = this.flagCache.get(cacheKey);

    // Return cached if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.flags;
    }

    try {
      const flagsRef = collection(db, FLAGS_COLLECTION);
      const q = query(flagsRef, where('enabled', '==', true));
      const snapshot = await getDocs(q);

      const flags = snapshot.docs.map((doc) => doc.data() as FeatureFlag);
      this.flagCache.set(cacheKey, { flags, timestamp: Date.now() });

      return flags;
    } catch (error) {
      console.error('[featureFlagService] Error getting flags:', error);
      return [];
    }
  }

  /**
   * Check if flag is enabled for user
   */
  async isFlagEnabled(
    flagName: string,
    userId?: string,
    region?: string,
    tier?: string
  ): Promise<boolean> {
    try {
      const flagsRef = collection(db, FLAGS_COLLECTION);
      const q = query(flagsRef, where('name', '==', flagName));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return false; // Flag doesn't exist = disabled
      }

      const flag = snapshot.docs[0].data() as FeatureFlag;

      if (!flag.enabled) {
        return false;
      }

      // Check user-specific access
      if (flag.allowedUsers && userId && !flag.allowedUsers.includes(userId)) {
        return false;
      }

      // Check region
      if (flag.allowedRegions && region && !flag.allowedRegions.includes(region)) {
        return false;
      }

      // Check tier
      if (flag.allowedTiers && tier && !flag.allowedTiers.includes(tier)) {
        return false;
      }

      // Check rollout percentage
      if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
        // Use user ID or session ID for consistent rollout
        const hash = this.hashUserId(userId || 'anonymous');
        const percentage = (hash % 100) + 1;
        return percentage <= flag.rolloutPercentage;
      }

      return true;
    } catch (error) {
      console.error('[featureFlagService] Error checking flag:', error);
      return false;
    }
  }

  /**
   * Get flag configuration
   */
  async getFlag(flagName: string): Promise<FeatureFlag | null> {
    try {
      const flagsRef = collection(db, FLAGS_COLLECTION);
      const q = query(flagsRef, where('name', '==', flagName));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as FeatureFlag;
    } catch (error) {
      console.error('[featureFlagService] Error getting flag:', error);
      return null;
    }
  }

  /**
   * Simple hash for consistent user bucketing
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.flagCache.clear();
  }
}

export const featureFlags = new FeatureFlagService();

export default featureFlags;
