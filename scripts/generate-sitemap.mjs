/**
 * Dinamik Sitemap Oluşturucu
 * Build sırasında çalışır, tüm statik ve dinamik sayfaları sitemap.xml'e ekler.
 *
 * Kullanım: node scripts/generate-sitemap.mjs
 * Build pipeline'ında: "build": "node scripts/generate-sitemap.mjs && vite build"
 */

import { writeFileSync, existsSync, readdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const BASE_URL = 'https://mercora.com';
const TODAY = new Date().toISOString().split('T')[0];

// Statik sayfalar
const STATIC_PAGES = [
  { loc: '/', priority: 1.0, changefreq: 'daily' },
  { loc: '/sell', priority: 0.8, changefreq: 'weekly' },
  { loc: '/wishlist', priority: 0.3, changefreq: 'weekly' },
  { loc: '/profile', priority: 0.3, changefreq: 'monthly' },
];

// Kategoriler (dinamik)
// TODO: Firestore'dan kategorileri çekmek için API çağrısı eklenebilir
const CATEGORIES = ['all'];

function generateSitemap() {
  const urls = [...STATIC_PAGES];

  // Kategori sayfaları
  for (const cat of CATEGORIES) {
    urls.push({
      loc: `/category/${cat}`,
      priority: 0.7,
      changefreq: 'daily',
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
  console.log(`Sitemap oluşturuldu: ${outputPath} (${urls.length} URL)`);
}

generateSitemap();
