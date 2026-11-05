// ─── Product XML feed → normalized items ─────────────────────────────────────
// Supports Google Shopping RSS/Atom (g:id, g:title, g:price, g:image_link …) and the usual Turkish
// marketplace exports (<urunler><urun>…, <products><product>…). Pure: no I/O, unit-tested.
import { XMLParser } from 'fast-xml-parser';

export interface FeedItem {
  sku: string;
  title: string;
  price: number;
  oldPrice?: number;
  stock: number;
  description: string;
  brand: string;
  category: string;
  images: string[];
}

export interface ParsedFeed {
  items: FeedItem[];
  errors: Array<{ index: number; reason: string }>;
}

// Normalized tag name (lowercase, no _-space) → our field. First match in each list wins.
const FIELDS: Record<keyof FeedItem, string[]> = {
  sku: [
    'id',
    'sku',
    'stokkodu',
    'productcode',
    'urunkodu',
    'kod',
    'code',
    'barcode',
    'barkod',
    'gtin',
    'mpn',
  ],
  title: ['title', 'name', 'productname', 'urunadi', 'baslik', 'ad', 'isim'],
  price: ['saleprice', 'indirimlifiyat', 'price', 'fiyat', 'satisfiyati', 'satisfiyat'],
  oldPrice: ['listprice', 'oldprice', 'eskifiyat', 'piyasafiyati'],
  stock: ['stock', 'stok', 'quantity', 'qty', 'miktar', 'adet', 'inventory'],
  description: ['description', 'aciklama', 'summary', 'detay', 'ozet'],
  brand: ['brand', 'marka', 'manufacturer', 'uretici', 'vendor'],
  category: ['producttype', 'category', 'kategori', 'googleproductcategory', 'categoryname'],
  images: [
    'imagelink',
    'image',
    'images',
    'resim',
    'gorsel',
    'picture',
    'imageurl',
    'additionalimagelink',
  ],
};

const norm = (k: string) => k.toLowerCase().replace(/[-_\s]/g, '');

function text(v: unknown): string {
  if (v == null) return '';
  if (Array.isArray(v)) return text(v[0]);
  if (typeof v === 'object') return text((v as any)['#text'] ?? Object.values(v as object)[0]);
  return String(v).trim();
}

/** "1.299,90 TRY", "1299.90", "₺199,9" → number (Turkish and English separators). */
export function parsePrice(raw: string): number {
  const s = raw.replace(/[^\d.,]/g, '');
  if (!s) return NaN;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  const decimalSep = lastComma > lastDot ? ',' : '.';
  const thousandsSep = decimalSep === ',' ? '.' : ',';
  return Number(s.split(thousandsSep).join('').replace(decimalSep, '.'));
}

/** The repeated product element: the largest array of objects anywhere in the document. */
function findItems(node: unknown): Record<string, unknown>[] {
  let best: Record<string, unknown>[] = [];
  const walk = (n: unknown) => {
    if (Array.isArray(n)) {
      if (n.length > best.length && n.every((x) => x && typeof x === 'object')) best = n;
      n.forEach(walk);
    } else if (n && typeof n === 'object') {
      Object.values(n).forEach(walk);
    }
  };
  walk(node);
  // A single product is not an array after parsing: fall back to common container paths.
  if (best.length === 0 && node && typeof node === 'object') {
    for (const v of Object.values(node as object)) {
      for (const key of ['item', 'entry', 'product', 'urun', 'Product', 'Urun']) {
        const one = (v as any)?.[key] ?? (v as any)?.channel?.[key];
        if (one && typeof one === 'object') return [one];
      }
    }
  }
  return best;
}

export function parseProductFeed(xml: string, maxItems = 2000): ParsedFeed {
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true, // g:price → price
    parseTagValue: false,
    trimValues: true,
  });
  const doc = parser.parse(xml);
  const raw = findItems(doc).slice(0, maxItems);

  const items: FeedItem[] = [];
  const errors: ParsedFeed['errors'] = [];
  raw.forEach((entry, index) => {
    const byKey = new Map<string, unknown>();
    for (const [k, v] of Object.entries(entry)) byKey.set(norm(k), v);
    const pick = (field: keyof FeedItem) => {
      for (const alias of FIELDS[field]) if (byKey.has(alias)) return byKey.get(alias);
      return undefined;
    };

    const title = text(pick('title'));
    const sku = text(pick('sku')) || title;
    const price = parsePrice(text(pick('price')));
    if (!title) return errors.push({ index, reason: 'Ürün adı yok' });
    if (!(price > 0)) return errors.push({ index, reason: `Geçersiz fiyat (${title})` });

    // Google feeds: "price" is the list price when "sale_price" exists.
    const listPrice = byKey.has('saleprice')
      ? parsePrice(text(byKey.get('price')))
      : parsePrice(text(pick('oldPrice')));
    const availability = text(byKey.get('availability')).toLowerCase();
    const stockRaw = text(pick('stock'));
    const stock = stockRaw
      ? Math.max(0, Math.floor(Number(stockRaw.replace(/[^\d]/g, '')) || 0))
      : availability.includes('out') || availability.includes('yok')
        ? 0
        : 1;

    const images = FIELDS.images
      .flatMap((alias) => {
        const v = byKey.get(alias);
        return (Array.isArray(v) ? v : [v]).map(text);
      })
      .flatMap((u) => u.split(/[|,\s]+/))
      .filter((u) => /^https:\/\//i.test(u));

    items.push({
      sku: sku.slice(0, 120),
      title: title.slice(0, 200),
      price,
      ...(listPrice > price ? { oldPrice: listPrice } : {}),
      stock,
      description: text(pick('description'))
        .replace(/<[^>]+>/g, ' ')
        .slice(0, 5000),
      brand: text(pick('brand')).slice(0, 80),
      category: text(pick('category')).split('>').pop()!.trim(),
      images: [...new Set(images)].slice(0, 8),
    });
  });
  return { items, errors };
}
