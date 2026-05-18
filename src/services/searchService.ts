import { MOCK_PRODUCTS } from '@/mockData';
import { Product } from '@/types';

export function searchProducts(query: string, limitCount = 6): Product[] {
  if (!query.trim() || query.trim().length < 2) return [];
  const q = query.toLowerCase();
  return MOCK_PRODUCTS.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    (p.tags?.some(t => t.toLowerCase().includes(q)) ?? false)
  ).slice(0, limitCount);
}
