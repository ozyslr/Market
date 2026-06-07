import Typesense from 'typesense';

const client = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || 'localhost',
      port: Number(process.env.TYPESENSE_PORT) || 8108,
      protocol: (process.env.TYPESENSE_PROTOCOL as 'http' | 'https') || 'https',
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY || '',
  connectionTimeoutSeconds: 5,
});

export const COLLECTIONS = ['products_tr', 'products_en', 'products_de', 'products_ar'] as const;

const ANALYZERS: Record<string, string> = {
  tr: 'tr',
  en: 'en',
  de: 'de',
  ar: 'ar',
};

export interface TypesenseProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  categoryId: string;
  brand: string;
  rating: number;
  imageUrl: string;
  storeId: string;
  language: string;
  tags: string[];
  createdAt: number;
}

export async function initializeCollections(): Promise<void> {
  const existing = await client.collections().retrieve();
  const existingNames = existing.map((c: { name: string }) => c.name);

  for (const lang of ['tr', 'en', 'de', 'ar'] as const) {
    const collectionName = `products_${lang}`;
    if (existingNames.includes(collectionName)) continue;

    await client.collections().create({
      name: collectionName,
      default_sorting_field: 'createdAt',
      fields: [
        { name: 'title', type: 'string', locale: lang as 'tr' | 'en' | 'de' | 'ar' },
        { name: 'description', type: 'string', locale: lang as 'tr' | 'en' | 'de' | 'ar' },
        { name: 'price', type: 'float', facet: true },
        { name: 'categoryId', type: 'string', facet: true },
        { name: 'brand', type: 'string', facet: true },
        { name: 'rating', type: 'float', facet: true },
        { name: 'imageUrl', type: 'string', index: false },
        { name: 'storeId', type: 'string' },
        { name: 'language', type: 'string', facet: true },
        { name: 'tags', type: 'string[]', optional: true },
        { name: 'createdAt', type: 'int64' },
      ],
    });
  }
}

function toTypesenseDoc(product: TypesenseProduct) {
  return {
    id: product.id,
    title: product.title,
    description: (product.description || '').slice(0, 800),
    price: product.price,
    categoryId: product.categoryId || '',
    brand: product.brand || '',
    rating: product.rating || 0,
    imageUrl: product.imageUrl || '',
    storeId: product.storeId || '',
    language: product.language || 'tr',
    tags: product.tags || [],
    createdAt: product.createdAt || Math.floor(Date.now() / 1000),
  };
}

export async function upsertProduct(product: TypesenseProduct): Promise<void> {
  const doc = toTypesenseDoc(product);
  const lang = doc.language;
  if (!lang || !COLLECTIONS.includes(`products_${lang}` as any)) {
    // Fallback: upsert to all collections
    for (const col of COLLECTIONS) {
      await client.collections(col).documents().upsert(doc);
    }
    return;
  }
  await client.collections(`products_${lang}`).documents().upsert(doc);
}

export async function deleteProduct(productId: string): Promise<void> {
  for (const col of COLLECTIONS) {
    try {
      await client
        .collections(col)
        .documents()
        .delete({ id: productId } as any);
    } catch {
      // ignore if not found in a collection
    }
  }
}

export async function searchProducts(
  query: string,
  filters?: {
    categoryId?: string;
    brand?: string[];
    priceMin?: number;
    priceMax?: number;
    rating?: number;
  },
  language = 'tr',
  sortBy = '_text_match:desc',
  page = 1,
  perPage = 24,
): Promise<{ found: number; hits: any[] }> {
  const collectionName = `products_${language}`;
  const filterParts: string[] = [];

  if (filters?.categoryId) {
    filterParts.push(`categoryId:=${filters.categoryId}`);
  }
  if (filters?.brand?.length) {
    filterParts.push(`brand:=[${filters.brand.join(',')}]`);
  }
  if (filters?.priceMin != null || filters?.priceMax != null) {
    const min = filters?.priceMin ?? 0;
    const max = filters?.priceMax ?? 999999;
    filterParts.push(`price:>=${min} && price:<=${max}`);
  }
  if (filters?.rating != null) {
    filterParts.push(`rating:>=${filters.rating}`);
  }

  const filterBy = filterParts.length ? filterParts.join(' && ') : undefined;

  const result = await client
    .collections(collectionName)
    .documents()
    .search({
      q: query || '*',
      query_by: 'title,description,brand,tags',
      filter_by: filterBy,
      sort_by: sortBy,
      page,
      per_page: perPage,
      facet_by: 'categoryId,brand,price,rating',
      highlight_full_fields: 'title',
    });

  return result as { found: number; hits: any[] };
}

export async function getIndexStatus(): Promise<{
  counts: Record<string, number>;
  lastSyncAt: string | null;
}> {
  const counts: Record<string, number> = {};
  for (const col of COLLECTIONS) {
    try {
      const c = await client.collections(col).retrieve();
      counts[col] = c.num_documents || 0;
    } catch {
      counts[col] = 0;
    }
  }
  return { counts, lastSyncAt: null };
}

export async function deleteAllProducts(): Promise<void> {
  for (const col of COLLECTIONS) {
    try {
      const docs = await client.collections(col).documents().search({ q: '*', per_page: 250 });
      for (const hit of (docs as any).hits || []) {
        await client
          .collections(col)
          .documents()
          .delete({ id: hit.document.id } as any);
      }
    } catch {
      // collection may not exist
    }
  }
}

export { client as typesenseClient };
