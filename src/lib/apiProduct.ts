import type { Product } from '@/types'

interface DbProduct {
  id: string
  seller_id: string
  title: string
  slug: string
  description: string | null
  price: number
  old_price: number | null
  currency: string
  stock: number
  category_id: string | null
  brand: string | null
  origin_country: string | null
  hs_code: string | null
  images: string
  rating: number
  reviews_count: number
}

export function normalizeProduct(db: DbProduct): Product {
  let images: string[] = []
  try { images = JSON.parse(db.images) } catch { images = [] }

  return {
    id: db.id,
    sellerId: db.seller_id,
    title: db.title,
    slug: db.slug,
    description: db.description ?? '',
    brand: db.brand ?? '',
    categoryId: db.category_id ?? '',
    price: db.price,
    oldPrice: db.old_price ?? undefined,
    currency: db.currency,
    stock: db.stock,
    weight: 0,
    originCountry: db.origin_country ?? '',
    hsCode: db.hs_code ?? '',
    images,
    attributes: {},
    rating: db.rating ?? 0,
    reviewsCount: db.reviews_count ?? 0,
  }
}

export async function fetchProducts(params?: {
  category?: string
  q?: string
  limit?: number
}): Promise<Product[]> {
  const qs = new URLSearchParams()
  if (params?.category) qs.set('category', params.category)
  if (params?.q) qs.set('q', params.q)
  qs.set('limit', String(params?.limit ?? 40))
  try {
    const res = await fetch(`/api/products?${qs}`)
    if (!res.ok) return []
    const { products } = await res.json()
    return (products as DbProduct[]).map(normalizeProduct)
  } catch {
    return []
  }
}

export async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/products/${slug}`)
    if (!res.ok) return null
    return normalizeProduct(await res.json())
  } catch {
    return null
  }
}
