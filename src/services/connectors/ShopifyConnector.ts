/**
 * Shopify Connector
 *
 * Uses the Shopify Admin REST API (2024-01) to fetch products, map them
 * into Benim Olan's Product format, and import images via Firebase Storage.
 *
 * Authentication: HTTP Basic — API key as username, API secret as password.
 *
 * @see https://shopify.dev/docs/api/admin-rest/2024-01/resources/product
 */

import type {
  PlatformConnector,
  ConnectorConfig,
  ConnectorPlatform,
  ExternalProduct,
  ExternalProductVariant,
  FetchResult,
} from './types';
import type { Product } from '@/types';
import { uploadImage } from '@/lib/storage';

// ── Shopify REST API Response Types ──────────────────────────────────────────

interface ShopifyImage {
  id: number;
  src: string;
  width: number;
  height: number;
  position: number;
}

interface ShopifyOption {
  name: string;
  values: string[];
  position: number;
}

interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string;
  barcode: string | null;
  inventory_quantity: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  image_id: number | null;
  weight: number;
  weight_unit: string;
  position: number;
}

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  options: ShopifyOption[];
  image: ShopifyImage | null;
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Strip HTML tags from Shopify's body_html field. */
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/** Build Basic Auth header from API key + secret. */
function basicAuth(apiKey: string, apiSecret: string): string {
  const encoded = btoa(`${apiKey}:${apiSecret}`);
  return `Basic ${encoded}`;
}

/** Convert weight to kg (Shopify default is grams). */
function toKg(value: number, unit: string): number {
  const normalized = unit?.toLowerCase() || 'g';
  switch (normalized) {
    case 'kg':
      return value;
    case 'g':
      return value / 1000;
    case 'oz':
      return value * 0.0283495;
    case 'lb':
      return value * 0.453592;
    default:
      return value / 1000;
  }
}

// ── Connector Implementation ─────────────────────────────────────────────────

export class ShopifyConnector implements PlatformConnector {
  readonly platform: ConnectorPlatform = 'shopify';

  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly storeUrl: string;
  private readonly authHeader: string;

  constructor(config: ConnectorConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    // Normalize store URL: strip trailing slash, ensure https
    this.storeUrl = config.storeUrl.replace(/\/+$/, '').replace(/^http:\/\//, 'https://');
    if (!this.storeUrl.startsWith('https://')) {
      this.storeUrl = `https://${this.storeUrl}`;
    }
    this.authHeader = basicAuth(this.apiKey, this.apiSecret);
  }

  /** Build the full REST API base URL. */
  private apiBase(): string {
    return `${this.storeUrl}/admin/api/2024-01`;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.apiBase()}/shop.json`, {
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  async fetchProducts(
    onProgress?: (progress: { fetched: number; total: number }) => void,
  ): Promise<FetchResult> {
    const products: ExternalProduct[] = [];
    let url: string | null = `${this.apiBase()}/products.json?limit=250`;
    let total = 0;

    while (url) {
      const resp = await fetch(url, {
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`Shopify API error ${resp.status}: ${body.slice(0, 200)}`);
      }

      const data: ShopifyProductsResponse = await resp.json();
      if (total === 0) {
        // Total is estimated from the first page; Shopify returns up to 250/page
        total = data.products.length;
      }

      for (const sp of data.products) {
        products.push(this.parseShopifyProduct(sp));
      }

      if (onProgress) {
        onProgress({ fetched: products.length, total });
      }

      // Pagination: check Link header for next page
      url = this.getNextPageUrl(resp);
      // If first page was full, total is likely much larger
      if (data.products.length === 250 && total === 250) {
        total = Math.max(total, products.length + 250); // estimate
      }
    }

    return {
      products,
      pagination: {
        hasMore: false,
        total: products.length,
      },
    };
  }

  /** Parse Link header for next page URL (Shopify REST pagination). */
  private getNextPageUrl(response: Response): string | null {
    const linkHeader = response.headers.get('Link');
    if (!linkHeader) return null;

    const matches = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    if (matches) return matches[1];

    return null;
  }

  /** Parse a single Shopify REST product into our ExternalProduct shape. */
  private parseShopifyProduct(sp: ShopifyProduct): ExternalProduct {
    const images: string[] = sp.images
      .sort((a, b) => a.position - b.position)
      .map((img) => img.src);

    // Build option name list
    const optionNames = sp.options.sort((a, b) => a.position - b.position).map((o) => o.name);

    const variants: ExternalProductVariant[] = sp.variants.map((v) => {
      const attrs: Record<string, string> = {};
      if (optionNames[0] && v.option1) attrs[optionNames[0]] = v.option1;
      if (optionNames[1] && v.option2) attrs[optionNames[1]] = v.option2;
      if (optionNames[2] && v.option3) attrs[optionNames[2]] = v.option3;

      // Find variant image
      let variantImage: string | undefined;
      if (v.image_id) {
        const match = sp.images.find((img) => img.id === v.image_id);
        if (match) variantImage = match.src;
      }

      return {
        id: String(v.id),
        sku: v.sku || '',
        price: parseFloat(v.price) || 0,
        compareAtPrice: v.compare_at_price ? parseFloat(v.compare_at_price) : undefined,
        stock: v.inventory_quantity ?? 0,
        title: v.title || sp.title,
        attributes: attrs,
        imageUrl: variantImage,
        barcode: v.barcode || undefined,
      };
    });

    const tags = sp.tags
      ? sp.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // Use first variant as the default price/stock/SKU if available
    const firstVar = sp.variants[0];

    return {
      id: String(sp.id),
      title: sp.title,
      description: stripHtml(sp.body_html),
      vendor: sp.vendor || '',
      productType: sp.product_type || '',
      tags,
      price: firstVar ? parseFloat(firstVar.price) || 0 : 0,
      compareAtPrice: firstVar?.compare_at_price
        ? parseFloat(firstVar.compare_at_price) || undefined
        : undefined,
      stock: sp.variants.reduce((sum, v) => sum + (v.inventory_quantity ?? 0), 0),
      sku: firstVar?.sku || '',
      barcode: firstVar?.barcode || undefined,
      weight: firstVar ? toKg(firstVar.weight ?? 0, firstVar.weight_unit) : 0,
      weightUnit: 'kg',
      imageUrls: images,
      variants,
      status: sp.status === 'active' ? 'active' : sp.status === 'draft' ? 'draft' : 'archived',
      createdAt: sp.created_at,
      updatedAt: sp.updated_at,
    };
  }

  async getCategories(): Promise<string[]> {
    try {
      const resp = await fetch(`${this.apiBase()}/custom_collections.json?limit=250`, {
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
      });
      if (!resp.ok) return [];
      const data = await resp.json();
      return (data.custom_collections || []).map((c: { id: number; title: string }) => c.title);
    } catch {
      return [];
    }
  }

  mapToProduct(
    external: ExternalProduct,
    sellerId: string,
    categoryId?: string,
  ): Omit<Product, 'id'> {
    const slug = external.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 80);

    const hasVariants = external.variants.length > 1;

    return {
      sellerId,
      title: external.title,
      slug,
      description: external.description || external.title,
      longDescription: external.description || '',
      brand: external.vendor,
      categoryId: categoryId || '',
      tags: external.tags,
      price: external.price,
      oldPrice: external.compareAtPrice,
      currency: 'TRY',
      stock: external.stock,
      sku: external.sku,
      weight: external.weight,
      originCountry: 'Türkiye',
      images: [], // populated during import after uploading to Firebase Storage
      variants: hasVariants
        ? external.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            attributes: v.attributes,
            barcode: v.barcode,
          }))
        : undefined,
      variantAttributes: hasVariants
        ? external.variants.length > 0
          ? Object.keys(external.variants[0].attributes)
          : undefined
        : undefined,
      rating: 0,
      reviewsCount: 0,
      status: external.status === 'active' ? 'approved' : 'pending',
      visibility: 'public',
      isActive: external.status === 'active',
    };
  }

  async downloadImage(imageUrl: string): Promise<Blob> {
    const resp = await fetch(imageUrl, {
      headers: {
        Authorization: this.authHeader,
      },
    });
    if (!resp.ok) {
      throw new Error(`Failed to download image: ${resp.status} ${resp.statusText}`);
    }
    return resp.blob();
  }

  /**
   * Full import pipeline: fetch products, map them, upload images, save.
   * @param sellerId the seller's Firebase UID
   * @param categoryId optional default category
   * @param onProgress callback for import progress
   * @returns array of mapped products (without Firebase IDs) ready for createProduct
   */
  async importAll(
    sellerId: string,
    categoryId?: string,
    onProgress?: (msg: string) => void,
  ): Promise<Omit<Product, 'id'>[]> {
    onProgress?.('Fetching products from Shopify...');
    const { products: externals } = await this.fetchProducts(({ fetched }) => {
      onProgress?.(`Fetched ${fetched} products...`);
    });

    onProgress?.(`Mapping ${externals.length} products...`);
    const mapped: Omit<Product, 'id'>[] = externals
      .filter((e) => e.status !== 'archived')
      .map((e) => this.mapToProduct(e, sellerId, categoryId));

    // Upload images in batches
    const productsWithImages = externals.length;
    let imageUploaded = 0;

    for (let i = 0; i < mapped.length; i++) {
      const ext = externals[i];
      const imageUrls = ext.imageUrls.slice(0, 10); // limit to 10 images per product

      const uploadedUrls: string[] = [];
      for (const imgUrl of imageUrls) {
        try {
          const blob = await this.downloadImage(imgUrl);
          const file = new File([blob], `shopify-${ext.id}-${Date.now()}.jpg`, {
            type: blob.type || 'image/jpeg',
          });
          const firebaseUrl = await uploadImage(file, `products/${sellerId}`);
          uploadedUrls.push(firebaseUrl);
          imageUploaded++;
        } catch {
          // Skip failed images
        }
      }

      mapped[i].images = uploadedUrls;
      onProgress?.(`Importing images ${imageUploaded}/${productsWithImages}...`);
    }

    onProgress?.(`Import complete: ${mapped.length} products ready`);
    return mapped;
  }
}
