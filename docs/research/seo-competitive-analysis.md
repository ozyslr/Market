# E-Ticaret SEO ve Yapısal Veri Rekabet Analizi

**Tarih:** 19 Mayıs 2026
**Hazırlayan:** Rekabet Analisti Ajanı (rekabet-analisti)

---

## 1. Büyük E-Ticaret Sitelerinde Schema.org Kullanımı

| Şirket | JSON-LD mi? | Kullanılan Şemalar |
|--------|------------|-------------------|
| **Trendyol** | Evet | Product + Offer + BreadcrumbList + Organization |
| **Hepsiburada** | Evet | Product, MerchantReturnPolicy, ShippingDetails, Seller |
| **Amazon** | JSON-LD + Microdata | SearchAction, AskAction, CategoryCode |
| **Etsy** | Evet | IndividualProduct, ImageObject, MerchantReturnPolicy, Review |

**Farklılıklar:**
- Hepsiburada iade/kargo şemalarında önde (Google Shopping surfacing için)
- Etsy, el yapımı ürünler için IndividualProduct kullanıyor
- Amazon sitelinks searchbox için SearchAction ekler

## 2. JSON-LD Best Practices (2026)

**Zorunlu Product alanları:** name, image (dizi), description (max 500), sku/mpn, brand (@type Brand), offers.availability (tam URL), offers.price (string), offers.priceCurrency

**2026 Güncellemeleri:**
- INP, FID'in yerini aldı (Core Web Vitals)
- Varyantlı ürünlerde her varyant ayrı Offer nesnesi
- VideoObject şeması önerilen → zorunluya dönüyor
- FAQ şeması yalnızca gerçek kullanıcı soruları için
- HasMerchantReturnPolicy + ShippingDetails Google "zengin sonuç" için neredeyse zorunlu

## 3. SSR - Sitemap ve robots.txt

**Önerilen yapı:**
- robots.txt ayrı bir dosya olarak public/ dizininde
- Çoklu sitemap: products.xml.gz, collections.xml.gz, pages.xml.gz → sitemap.xml (index)
- 50.000 URL / 50MB limiti, gzip zorunlu

**robots.txt kuralları:**
```
Disallow: /cart, /checkout, /account, /api/, /search?
Disallow: /collections/*?sort=, /collections/*?page=
Allow: /
Sitemap: https://mercora.com/sitemap.xml
```

**Meta robots:**
- Ürün: index,follow
- Kategori (0-2 filtre): index,follow
- 3+ filtre: noindex,follow
- Arama: noindex,follow
- Hesap/ödeme: noindex,nofollow

## 4. Çok Dilde hreflang ve Canonical

**Hedef diller:** EN, TR, DE, AR

**Önerilen URL yapısı:** Alt-dizin (mercora.com/tr/, mercora.com/en/)

**Kurallar:**
- Her sayfa tüm dil varyantlarına link rel="alternate" hreflang ekler
- x-default = EN
- canonical = o sayfanın kendisi (self-referencing)
- XML sitemap'te xhtml:link ile tüm varyantlar listelenir
- Arapça için: dir="rtl", lang="ar"

**Proje için risk:** LanguageContext mevcut ancak hreflang/canonical implementasyonu yok. Next.js geçişiyle birlikte çözülmeli.

## 5. Google 2026 Sıralama Faktörleri

| Metrik | İyi sınır | Kötü sınır |
|--------|-----------|------------|
| LCP | <= 2.5s | > 4.0s |
| INP | <= 200ms | > 500ms |
| CLS | <= 0.1 | > 0.25 |
| TBT | <= 200ms | > 500ms |

**INP kritiktir:** Varyant değiştirme, sepete ekleme, filtreleme gibi etkileşimler INP'yi doğrudan etkiler.

**Sıralama faktörleri:**
1. İçerik kalitesi (EEAT)
2. Kullanıcı deneyimi (Core Web Vitals)
3. Backlink profili
4. Mobile-first
5. Sayfa hızı + INP
6. Site güvenliği
7. JSON-LD yapısal veri
8. İç bağlantı mimarisi
9. Kullanıcı sinyalleri (CTR)
10. Site mimarisi

## 6. Mercora İçin Acil Aksiyonlar

1. **SSR geçişi** (Next.js App Router) — SPA en büyük SEO engeli
2. JSON-LD Product + BreadcrumbList eklendi ✅ (bu seansta yapıldı)
3. robots.txt oluşturuldu ✅
4. Sitemap oluşturucu yazıldı ✅
5. Meta robots mantığı eklenmeli
6. Open Graph + Twitter Card meta tagları geliştirildi ✅
7. INP odaklı performans optimizasyonu
