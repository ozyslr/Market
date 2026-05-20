import { adminDb } from '@/lib/firebase-admin';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mercora.app';

export default async function sitemap() {
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${BASE_URL}/cart`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/checkout`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/sell`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE_URL}/support`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.4 },
    { url: `${BASE_URL}/wishlist`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.4 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
  ];

  let productPages: typeof staticPages = [];
  let categoryPages: typeof staticPages = [];

  if (adminDb) {
    try {
      const productsSnap = await adminDb.collection('products')
        .where('isActive', '==', true)
        .limit(1000)
        .get();
      productPages = productsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          url: `${BASE_URL}/product/${data.slug || doc.id}`,
          lastModified: data.updatedAt?.toDate?.() || new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        };
      });
    } catch { /* skip products */ }

    try {
      const catsSnap = await adminDb.collection('categories').limit(100).get();
      categoryPages = catsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          url: `${BASE_URL}/category/${data.slug || doc.id}`,
          lastModified: data.updatedAt?.toDate?.() || new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        };
      });
    } catch { /* skip categories */ }
  }

  return [...staticPages, ...productPages, ...categoryPages];
}
