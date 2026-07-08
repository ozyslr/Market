/**
 * Platform Connector Types
 *
 * Base interfaces for Shopify, WooCommerce, and future platform connectors.
 * Each connector implements PlatformConnector to fetch products from external
 * stores and map them into Benim Olan's Product format.
 */

import type { Product } from '@/types';

// ── Connector Configuration ──────────────────────────────────────────────────

export interface ConnectorConfig {
  apiKey: string;
  apiSecret: string;
  storeUrl: string;
}

export type ConnectorPlatform = 'shopify' | 'woocommerce';

export interface SavedIntegration {
  id: string;
  platform: ConnectorPlatform;
  storeUrl: string;
  apiKey: string;
  /** Never stored in plain text — only held in memory during import */
  apiSecret: string;
  label?: string;
  createdAt: string;
  updatedAt: string;
}

/** Persisted shape (secret is excluded). */
export interface PersistedIntegration extends Omit<SavedIntegration, 'apiSecret'> {
  apiSecret: never;
}

// ── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationInfo {
  hasMore: boolean;
  nextCursor?: string;
  total: number;
}

export interface FetchResult {
  products: ExternalProduct[];
  pagination: PaginationInfo;
}

// ── External Product (intermediate representation) ───────────────────────────

export interface ExternalProductVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  title: string;
  attributes: Record<string, string>;
  imageUrl?: string;
  barcode?: string;
}

export interface ExternalProduct {
  id: string;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string[];
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
  barcode?: string;
  weight: number;
  weightUnit: string;
  imageUrls: string[];
  variants: ExternalProductVariant[];
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
}

// ── Connector Interface ──────────────────────────────────────────────────────

export interface PlatformConnector {
  /** Human-readable platform name for UI display. */
  readonly platform: ConnectorPlatform;

  /** Validate credentials against the platform API. Returns true if valid. */
  validateCredentials(): Promise<boolean>;

  /**
   * Fetch all products from the platform.
   * Handles pagination internally, yielding all products.
   * @param onProgress callback with {fetched, total} for progress reporting
   */
  fetchProducts(
    onProgress?: (progress: { fetched: number; total: number }) => void,
  ): Promise<FetchResult>;

  /**
   * Fetch product categories from the platform.
   * Returns a flat list of category names or hierarchical paths.
   */
  getCategories(): Promise<string[]>;

  /**
   * Map an external product to Benim Olan's Product format.
   * @param external the external product from the platform
   * @param sellerId the seller's Firebase UID
   * @param categoryId optional category mapping override
   */
  mapToProduct(
    external: ExternalProduct,
    sellerId: string,
    categoryId?: string,
  ): Omit<Product, 'id'>;

  /**
   * Download an image from an external URL and return it as a File blob
   * ready for Firebase Storage upload.
   * Platform-specific auth headers are handled internally.
   */
  downloadImage(imageUrl: string): Promise<Blob>;
}

// ── Import Progress ──────────────────────────────────────────────────────────

export interface ImportProgress {
  platform: ConnectorPlatform;
  status: 'connecting' | 'fetching' | 'importing' | 'completed' | 'failed';
  fetched: number;
  total: number;
  imported: number;
  skipped: number;
  errors: ImportError[];
  startedAt: string;
}

export interface ImportError {
  externalId: string;
  title: string;
  reason: string;
}
