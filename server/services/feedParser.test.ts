import { describe, it, expect } from 'vitest';
import { parseProductFeed, parsePrice } from './feedParser';

describe('parsePrice', () => {
  it('reads Turkish and English separators', () => {
    expect(parsePrice('1.299,90 TRY')).toBe(1299.9);
    expect(parsePrice('1299.90')).toBe(1299.9);
    expect(parsePrice('₺199,9')).toBe(199.9);
    expect(parsePrice('2,499.00 TRY')).toBe(2499);
    expect(parsePrice('')).toBeNaN();
  });
});

describe('parseProductFeed', () => {
  it('parses a Google Shopping RSS feed (namespaced, sale price, availability)', () => {
    const xml = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><channel>
  <item><g:id>A1</g:id><g:title><![CDATA[Deri Cüzdan & Kartlık]]></g:title>
    <g:price>499.90 TRY</g:price><g:sale_price>399.90 TRY</g:sale_price>
    <g:availability>in stock</g:availability><g:brand>Usta</g:brand>
    <g:product_type>Moda &gt; Aksesuar</g:product_type>
    <g:image_link>https://cdn.example.com/a1.jpg</g:image_link>
    <g:additional_image_link>https://cdn.example.com/a1b.jpg</g:additional_image_link>
    <g:description>&lt;p&gt;El yapımı&lt;/p&gt;</g:description></item>
  <item><g:id>A2</g:id><g:title>Bozuk</g:title><g:price>yok</g:price></item>
</channel></rss>`;
    const { items, errors } = parseProductFeed(xml);
    expect(errors).toHaveLength(1);
    expect(items).toEqual([
      {
        sku: 'A1',
        title: 'Deri Cüzdan & Kartlık',
        price: 399.9,
        oldPrice: 499.9,
        stock: 1,
        description: ' El yapımı ',
        brand: 'Usta',
        category: 'Aksesuar',
        images: ['https://cdn.example.com/a1.jpg', 'https://cdn.example.com/a1b.jpg'],
      },
    ]);
  });

  it('parses a Turkish <urunler><urun> export and drops non-https images', () => {
    const xml = `<urunler>
      <urun><stok_kodu>K-1</stok_kodu><urun_adi>Seramik Kupa</urun_adi><fiyat>149,90</fiyat>
        <stok>12</stok><kategori>Ev &amp; Yaşam</kategori><resim>http://x/a.jpg|https://x/b.jpg</resim></urun>
      <urun><stok_kodu>K-2</stok_kodu><urun_adi>Tabak</urun_adi><fiyat>99</fiyat><stok>0</stok></urun>
    </urunler>`;
    const { items } = parseProductFeed(xml);
    expect(items.map((i) => [i.sku, i.price, i.stock, i.category, i.images])).toEqual([
      ['K-1', 149.9, 12, 'Ev & Yaşam', ['https://x/b.jpg']],
      ['K-2', 99, 0, '', []],
    ]);
  });
});
