/**
 * Feature flags — admin can toggle these to enable/disable features.
 *
 * Usage:
 *   import { FEATURES } from '@/config/features';
 *   if (FEATURES.MESSAGING) { ... }
 */
export const FEATURES = {
  /** Kullanıcılar arası mesajlaşma (satıcı-alıcı). Varsayılan: kapalı. */
  MESSAGING: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;
