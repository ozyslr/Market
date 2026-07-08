/**
 * WooCommerce Connector
 *
 * Uses the WooCommerce REST API v3 to fetch products, map them
 * into Benim Olan's Product format, and import images via Firebase Storage.
 *
 * Authentication: OAuth 1.0a one-legged — consumer key + consumer secret
 * as query parameters (the most straightforward approach supported by WC REST API).
 *
 * @see https://woocommerce.com/document/woocommerce-rest-api/
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

// ── WooCommerce REST API Response Types ──────────────────────────────────────

interface WooImage {
  id: number;
  src: string;
  name: string;
  alt: string;
  position: number;
}

interface WooCategory {
  id: number;
  name: string;
  slug: string;
}

interface WooAttribute {
  id: number;
  name: string;
  options: string[];
  position: number;
  visible: boolean;
  variation: boolean;
}

interface WooDefaultAttr {
  id: number;
  name: string;
  option: string;
}

interface WooProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_modified: string;
  type: 'simple' | 'variable' | 'grouped' | 'external';
  status: string;
  featured: boolean;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: number | null;
  stock_status: string;
  weight: string;
  images: WooImage[];
  categories: WooCategory[];
  tags: { id: number; name: string; slug: string }[];
  attributes: WooAttribute[];
  default_attributes: WooDefaultAttr[];
  variations?: number[];
  meta_data?: { id: number; key: string; value: unknown }[];
}

interface WooVariation {
  id: number;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: number | null;
  stock_status: string;
  image: WooImage | null;
  attributes: { id: number; name: string; option: string }[];
  weight: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Strip HTML tags from WooCommerce description fields. */
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

// ── Connector Implementation ─────────────────────────────────────────────────

export class WooCommerceConnector implements PlatformConnector {
  readonly platform: ConnectorPlatform = 'woocommerce';

  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly storeUrl: string;
  private readonly apiBase: string;

  constructor(config: ConnectorConfig) {
    this.apiKey = config.apiKey; // WooCommerce consumer key
    this.apiSecret = config.apiSecret; // WooCommerce consumer secret
    this.storeUrl = config.storeUrl.replace(/\/+$/, '');
    if (!this.storeUrl.startsWith('https://') && !this.storeUrl.startsWith('http://')) {
      this.storeUrl = `https://${this.storeUrl}`;
    }
    this.apiBase = `${this.storeUrl}/wp-json/wc/v3`;
  }

  /** Append auth query params to a URL. */
  private authUrl(path: string, extraParams?: Record<string, string>): string {
    const url = new URL(`${this.apiBase}${path}`);
    url.searchParams.set('consumer_key', this.apiKey);
    url.searchParams.set('consumer_secret', this.apiSecret);
    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        url.searchParams.set(k, v);
      }
    }
    return url.toString();
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const resp = await fetch(this.authUrl('/products', { per_page: '1' }));
      return resp.ok;
    } catch {
      return false;
    }
  }

  async fetchProducts(
    onProgress?: (progress: { fetched: number; total: number }) => void,
  ): Promise<FetchResult> {
    const products: ExternalProduct[] = [];
    let page = 1;
    const perPage = 100;
    let total = 0;

    while (true) {
      const url = this.authUrl('/products', {
        per_page: String(perPage),
        page: String(page),
      });

      const resp = await fetch(url);

      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`WooCommerce API error ${resp.status}: ${body.slice(0, 200)}`);
      }

      // Read total from header on first page
      if (page === 1) {
        const totalHeader = resp.headers.get('X-WP-Total');
        total = totalHeader ? parseInt(totalHeader, 10) : 0;
      }

      const items: WooProduct[] = await resp.json();

      if (!items.length) break;

      for (const wp of items) {
        // Fetch variations for variable products
        const variations = wp.variations?.length ? await this.fetchVariations(wp.id) : [];

        products.push(this.parseWooProduct(wp, variations));
      }

      if (onProgress) {
        onProgress({ fetched: products.length, total });
      }

      if (items.length < perPage) break;
      page++;
    }

    return {
      products,
      pagination: {
        hasMore: false,
        total: products.length,
      },
    };
  }

  /** Fetch variations for a variable product. */
  private async fetchVariations(productId: number): Promise<WooVariation[]> {
    try {
      const resp = await fetch(
        this.authUrl(`/products/${productId}/variations`, { per_page: '100' }),
      );
      if (!resp.ok) return [];
      return resp.json();
    } catch {
      return [];
    }
  }

  /** Parse a WooCommerce product + its variations into ExternalProduct. */
  private parseWooProduct(wp: WooProduct, variations: WooVariation[]): ExternalProduct {
    const images: string[] = (wp.images || [])
      .sort((a, b) => a.position - b.position)
      .map((img) => img.src);

    const wpVariants: ExternalProductVariant[] = variations.map((v) => {
      const attrs: Record<string, string> = {};
      for (const a of v.attributes) {
        attrs[a.name] = a.option;
      }

      return {
        id: String(v.id),
        sku: v.sku || '',
        price: parseFloat(v.price || v.regular_price) || parseFloat(wp.price) || 0,
        compareAtPrice: v.regular_price && v.sale_price ? parseFloat(v.regular_price) : undefined,
        stock: v.stock_quantity ?? 0,
        title: Object.values(attrs).join(' - ') || wp.name,
        attributes: attrs,
        imageUrl: v.image?.src,
      };
    });

    const tags = (wp.tags || []).map((t) => t.name);

    const price = parseFloat(wp.price || wp.regular_price) || 0;
    const compareAtPrice =
      wp.regular_price && wp.sale_price ? parseFloat(wp.regular_price) : undefined;

    return {
      id: String(wp.id),
      title: wp.name,
      description: stripHtml(wp.short_description || wp.description) || wp.name,
      vendor: '', // WooCommerce doesn't have a top-level vendor field
      productType: (wp.categories || [])[0]?.name || '',
      tags,
      price,
      compareAtPrice,
      stock: wp.stock_quantity ?? (wp.stock_status === 'instock' ? 999 : 0),
      sku: wp.sku || '',
      barcode: undefined,
      weight: parseFloat(wp.weight || '0'),
      weightUnit: 'kg',
      imageUrls: images,
      variants: wpVariants,
      status: wp.status === 'publish' ? 'active' : wp.status === 'draft' ? 'draft' : 'archived',
      createdAt: wp.date_created,
      updatedAt: wp.date_modified,
    };
  }

  async getCategories(): Promise<string[]> {
    try {
      const resp = await fetch(this.authUrl('/products/categories', { per_page: '100' }));
      if (!resp.ok) return [];
      const data: WooCategory[] = await resp.json();
      return data.map((c) => c.name);
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
      brand: external.vendor || '',
      categoryId: categoryId || '',
      tags: external.tags,
      price: external.price,
      oldPrice: external.compareAtPrice,
      currency: 'TRY',
      stock: external.stock,
      sku: external.sku,
      weight: external.weight,
      originCountry: 'Türkiye',
      images: [], // populated during import
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
    // WooCommerce images are typically publicly accessible — no auth needed
    const resp = await fetch(imageUrl);
    if (!resp.ok) {
      throw new Error(`Failed to download image: ${resp.status} ${resp.statusText}`);
    }
    return resp.blob();
  }

  /**
   * Full import pipeline: fetch products, map them, upload images.
   */
  async importAll(
    sellerId: string,
    categoryId?: string,
    onProgress?: (msg: string) => void,
  ): Promise<Omit<Product, 'id'>[]> {
    onProgress?.('Fetching products from WooCommerce...');
    const { products: externals } = await this.fetchProducts(({ fetched, total }) => {
      onProgress?.(`Fetched ${fetched}/${total} products...`);
    });

    onProgress?.(`Mapping ${externals.length} products...`);
    const mapped: Omit<Product, 'id'>[] = externals
      .filter((e) => e.status !== 'archived')
      .map((e) => this.mapToProduct(e, sellerId, categoryId));

    let imageUploaded = 0;
    const totalWithImages = mapped.length;

    for (let i = 0; i < mapped.length; i++) {
      const ext = externals[i];
      const imageUrls = ext.imageUrls.slice(0, 10);

      const uploadedUrls: string[] = [];
      for (const imgUrl of imageUrls) {
        try {
          const blob = await this.downloadImage(imgUrl);
          const file = new File([blob], `wc-${ext.id}-${Date.now()}.jpg`, {
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
      onProgress?.(`Uploading images ${imageUploaded}/${totalWithImages}...`);
    }

    onProgress?.(`Import complete: ${mapped.length} products ready`);
    return mapped;
  }
}
