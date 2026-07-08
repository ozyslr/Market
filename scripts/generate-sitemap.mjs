/**
 * Dinamik Sitemap Oluşturucu
 * Build sırasında çalışır, tüm statik ve dinamik sayfaları sitemap.xml'e ekler.
 *
 * Kullanım: node scripts/generate-sitemap.mjs
 * Build pipeline'ında: "build": "node scripts/generate-sitemap.mjs && vite build"
 *
 * Ürün rotaları, Firestore REST API üzerinden build sırasında çekilir.
 * Ağ/erişim olmazsa statik sayfalarla zarif şekilde devam eder.
 */

import { writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const BASE_URL = 'https://benimolan.com';
const TODAY = new Date().toISOString().split('T')[0];

// Firebase projectId (config dosyasından okunur)
function getProjectId() {
  try {
    const cfg = JSON.parse(readFileSync(resolve(root, 'firebase-applet-config.json'), 'utf-8'));
    return cfg.projectId || null;
  } catch {
    return null;
  }
}

// Statik sayfalar
const STATIC_PAGES = [
  { loc: '/', priority: 1.0, changefreq: 'daily' },
  { loc: '/sell', priority: 0.8, changefreq: 'weekly' },
  { loc: '/wishlist', priority: 0.3, changefreq: 'weekly' },
  { loc: '/profile', priority: 0.3, changefreq: 'monthly' },
];

// Firestore REST API ile yayında olan ürünlerin slug'larını çeker.
// Hata/ağ sorununda boş dizi döner; sitemap yine de üretilir.
async function fetchProductSlugs(projectId) {
  if (!projectId) return [];
  const products = [];
  let pageToken = '';
  try {
    do {
      const url =
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products` +
        `?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      for (const docItem of data.documents || []) {
        const fields = docItem.fields || {};
        const slug = fields.slug?.stringValue;
        if (slug) {
          const canonicalUrl = fields.canonicalUrl?.stringValue || '';
          products.push({ slug, canonicalUrl });
        }
      }
      pageToken = data.nextPageToken || '';
    } while (pageToken);
  } catch (err) {
    console.warn('Ürün slug çekimi atlandı (ağ/erişim yok):', err?.message || err);
    return [];
  }
  return products;
}

async function generateSitemap() {
  const projectId = getProjectId();
  const urls = [...STATIC_PAGES];

  // Ürün sayfaları (dinamik)
  const products = await fetchProductSlugs(projectId);
  for (const p of products) {
    urls.push({
      loc: p.canonicalUrl || `/product/${p.slug}`,
      priority: 0.6,
      changefreq: 'weekly',
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(page => `  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
  </url>`).join('\n')}
</urlset>`;

  const outputPath = resolve(root, 'public', 'sitemap.xml');
  writeFileSync(outputPath, xml, 'utf-8');
  console.log(`Sitemap oluşturuldu: ${outputPath} (${urls.length} URL, ${products.length} ürün)`);
}

generateSitemap();
