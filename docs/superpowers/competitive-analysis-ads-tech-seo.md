# Reklam Teknoloji Altyapisi ve SEO Karsilastirmasi

## Ajan 8 / 8 — Rekabet Analizi

---

## 1. Her Rakibin Teknik Altyapi Ozeti

### Etsy
| Katman | Teknoloji |
|--------|-----------|
| Frontend | React.js (legacy), ozel CSS framework, Hybrid SSR/CSR, Redux |
| Backend | PHP (HHVM), C++ (perf-critical), SOA, GraphQL (BFF) |
| Veri | MySQL (sharded), Memcached, Redis, Elasticsearch |
| Infra | Ozel data center + Google Cloud, Nginx, HAProxy, Kafka |
| Mobil | Native iOS/Android (React Native) — PWA yok |
| PWA | Yok — responsive mobil web |
| SEO | Schema.org: Product, Org, BreadcrumbList, Review; segmentli sitemaps |
| Reklam | Etsy Ads (PPC), Offsite Ads, Promoted Listings, Pattern |
| Performans | TTFB ~800-1500ms, FCP ~1.5-2.5s, Lighthouse ~50-65 |
| Guvenlik | HSTS, CSP, CSRF, rate limiting, Braintree odeme, ML fraud detection |

### Amazon
| Katman | Teknoloji |
|--------|-----------|
| Frontend | React.js (SPA-like), Custom UI framework, SSR, Micro-frontends |
| Backend | Java (primary), C++, Python, Ruby — AWS-native microservices |
| Veri | DynamoDB, Aurora, S3, ElastiCache, Kinesis |
| Infra | AWS (EC2, Lambda, ECS, EKS), CloudFront CDN, custom load balancers |
| Mobil | Amazon Shopping app (native) — PWA yok |
| PWA | Yok |
| SEO | Schema.org: Product, Offer, AggregateRating, Review, FAQPage; A+ Content |
| Reklam | Amazon PPC (Sponsored Products/Brands/Display), Amazon DSP |
| Performans | TTFB ~200-500ms (edge), FCP ~1.0-1.8s, Lighthouse ~30-50 (agir sayfa) |
| Guvenlik | AWS Shield WAF, DDoS, PCI-DSS Level 1, advanced fraud detection |

### Trendyol
| Katman | Teknoloji |
|--------|-----------|
| Frontend | React.js + Next.js (yeni migrasyon), Custom component library, SSR, Micro-frontend |
| Backend | Java Spring Boot (primary), Go (high-throughput), Event-driven |
| Veri | PostgreSQL (primary), Redis, Elasticsearch, Kafka |
| Infra | AWS + kendi data center, Docker + K8s (EKS), CloudFront, ozel API Gateway |
| Mobil | Native iOS/Android — PWA yok |
| PWA | Yok |
| SEO | Schema.org: Product, Offer, AggregateRating, BreadcrumbList; blog/lookbook SEO |
| Reklam | Trendyol Ads (PPC), Promoted Products, Brand Page Ads |
| Performans | TTFB ~400-800ms, FCP ~1.2-2.0s, Lighthouse ~50-70 |
| Guvenlik | WAF, DDoS, PCI-DSS, rate limiting, bot detection |

---

## 2. Teknoloji Karsilastirma Tablosu

| Kriter | Etsy | Amazon | Trendyol | **Mercora** |
|--------|------|--------|----------|-------------|
| **Frontend** | React.js legacy | React.js custom | React + Next.js | **Next.js 16** |
| **SSR/SSG** | Hybrid | SSR | SSR (Next.js) | **SSR (Next.js)** |
| **CSS** | Custom | Custom | Custom library | **Tailwind CSS** |
| **Backend** | PHP (HHVM) + C++ | Java + C++ + Python | Java Spring + Go | **Next.js API** |
| **Database** | MySQL sharded | DynamoDB + Aurora | PostgreSQL | **Firebase Firestore** |
| **Cache** | Memcached + Redis | ElastiCache | Redis | **Vercel Edge + SW** |
| **Search** | Elasticsearch | Custom (A9) | Elasticsearch | **Firebase (basic)** |
| **CDN** | CloudFront + ozel | CloudFront | CloudFront | **CloudFront** |
| **Container** | Ozel | Ozel | Docker + K8s | **Docker multi-stage** |
| **CI/CD** | Ozel | AWS CodePipeline | GitLab CI | **Vercel CI/CD** |
| **Monitoring** | Ozel | CloudWatch | Ozel | **Sentry** |
| **PWA** | Yok | Yok | Yok | **Var (manifest + SW)** |
| **Test** | Kapsamli | Kapsamli | Kapsamli | **Vitest (3 test)** |

---

## 3. SEO Stratejisi Karsilastirmasi

| SEO Faktoru | Etsy | Amazon | Trendyol | **Mercora** |
|-------------|------|--------|----------|-------------|
| **JSON-LD/Schema** | Product, Review, BreadcrumbList | Product, Offer, AggregateRating, Review, FAQPage | Product, Offer, AggregateRating, BreadcrumbList | **Organization + Website** |
| **Sitemap** | Segmentli (listings, shops, categories, reviews) | Kategori bazli devasa sitemaps | Kategori bazli sitemaps | **Tek sitemap.xml** |
| **robots.txt** | Parametreleri disallow eder | Herseye izin verir | Yapilandirilmis | **Temel seviye** |
| **Canonical URL** | Var | Var | Var | **Var** |
| **Hreflang** | Var (multi-language) | Var (international) | Var (TR + intl) | **Var (4 dil)** |
| **URL Yapisi** | /listing/123/title | /dp/ASIN | /kategori/... /urun/... | **Belirlenmemis** |
| **Icerik SEO** | Shop aciklamalari | A+ Content | Blog, lookbook, trend | **Yok** |
| **Domain Authority** | Cok yuksek | En yuksek | Yuksek (Turkiye) | **Sifir (yeni)** |
| **Sayfa Hizi** | Orta | Dusuk (agir) | Orta-Yuksek | **Yuksek (hafif)** |
| **Mobil SEO** | Responsive | Native app | Native app | **PWA avantaji** |

---

## 4. Performans Metrikleri Karsilastirmasi

| Metrik | Etsy | Amazon | Trendyol | **Mercora (tahmini)** |
|--------|------|--------|----------|----------------------|
| **TTFB** | 800-1500ms | 200-500ms | 400-800ms | **<200ms (Vercel Edge)** |
| **FCP** | 1.5-2.5s | 1.0-1.8s | 1.2-2.0s | **<1.0s** |
| **Lighthouse** | 50-65 | 30-50 | 50-70 | **70-90** |
| **Page Weight** | 2-4MB | 3-6MB | 2-3.5MB | **<1MB** |
| **3rd Party Scripts** | Cok (ads, analytics) | Cok (ads, tracking) | Cok (ads, tracking) | **Az** |

---

## 5. Mercora'nin Mevcut Altyapi Degerlendirmesi

### Guclu Yonler
1. **Next.js 16** — Trendyol ile ayni yonde, hatta daha yeni surum
2. **PWA** — Rakiplerin HICBIRINDE yok. Buyuk mobil avantaj
3. **Tailwind CSS** — Custom CSS'den cok daha hizli gelistirme ve kucuk bundle
4. **Vercel Edge** — En hizli TTFB'yi potansiyel olarak sunabilir
5. **Docker multi-stage** — Trendyol ile benzer container yaklasimi
6. **Modern toolchain** — Turbopack, optimizePackageImports

### Zayif Yonler
1. **Firebase Firestore** — Olceklendirme ve karmasik query'lerde Amazon/Trendyol'un PostgreSQL/DynamoDB'sine gore zayif
2. **Elasticsearch eksik** — Tum rakipler ozel arama altyapisi kullanirken Mercora Firebase aramasina bagimli
3. **Schema markup cok sinirli** — Sadece Organization + Website; Product, Offer, Review, BreadcrumbList eksik
4. **Test coverage cok dusuk** — 3 test dosyasi (rakiplerin yaninda yok denecek kadar az)
5. **Icerik SEO yok** — Blog, kategori aciklamalari, A+ Content benzeri yapi yok
6. **Auth tek saglayici** — Firebase Auth'a tam bagimli
7. **Redis/Memcached eksik** — Orta olcekte sorun yaratmayabilir ama buyuyunce gerekli
8. **Sentry disinda monitoring az** — Log yonetimi, APM, custom dashboard yok

---

## 6. Eksikler ve Oneriler (Implementasyon Onceligine Gore)

### PRIORITY 1 (Hemen — 0-2 Hafta)

| # | Eksik | Cozum | Etki |
|---|-------|-------|------|
| 1 | **Product schema eksik** | JSON-LD'ye Product, Offer, AggregateRating, Review, BreadcrumbList ekle | Google zengin sonuclar + gorunurluk |
| 2 | **Sitemap segmentasyonu** | Kategori, urun, satici bazinda ayri sitemaps | Indexleme hizi |
| 3 | **robots.txt iyilestirmesi** | Query parametrelerini disallow et, onemli sayfalari allow et | Crawl butcesi |
| 4 | **Elasticsearch entegrasyonu** | Urun arama icin Elasticsearch veya Typesense | Arama kalitesi + hiz |

### PRIORITY 2 (Kisa Vade — 2-4 Hafta)

| # | Eksik | Cozum | Etki |
|---|-------|-------|------|
| 5 | **Blog/Icerik modulu** | SEO blogu, kategori aciklamalari, lookbook sayfalari | Organik trafik |
| 6 | **A+ Content benzeri** | Saticilarin zengin urun aciklamasi eklemesi | Donusum + SEO |
| 7 | **Redis cache** | Vercel Edge + Redis ile page/API caching | TTFB iyilesmesi |
| 8 | **Test coverage** | Vitest ile en az %50 coverage | Kod kalitesi + guven |

### PRIORITY 3 (Orta Vade — 1-2 Ay)

| # | Eksik | Cozum | Etki |
|---|-------|-------|------|
| 9 | **Monitoring genisletme** | APM, custom metrics dashboard | Performans takibi |
| 10 | **Firestore -> PostgreSQL migrasyon** | Supabase veya AWS RDS'ye gecis | Olceklendirme |
| 11 | **Reklam modulu (PPC)** | Saticilar icin promoted listings | Gelir |
| 12 | **Satici performans puani** | Trendyol'daki gibi satici skorlama | Pazar yeri kalitesi |

### PRIORITY 4 (Uzun Vade — 2+ Ay)

| # | Eksik | Cozum | Etki |
|---|-------|-------|------|
| 13 | **Native mobil uygulama** | React Native veya Flutter | Kitle genisletme |
| 14 | **Kubernetes gecisi** | Docker -> K8s orchestration | Olceklendirme |
| 15 | **Fraud detection** | ML-based dolandiricilik tespiti | Guvenlik |
| 16 | **Multi-region deployment** | Vercel + ozel region yapisi | Global latency |

---

## Ozet

Mercora, **PWA avantaji** ve **Next.js 16 modern teknolojisi** ile rakiplerine karsi guclu bir konumda. Ancak:

1. **SEO altyapisi tamamlanmali** — Product schema, segmentli sitemaps, blog modulu en kritik eksikler
2. **Arama altyapisi guclendirilmeli** — Elasticsearch/Typesense eklenmeli
3. **Test ve monitoring** — Buyume oncesi saglamlastirilmali
4. **Reklam/Pazarlama araclari** — PPC modulu gelir modeli icin hayati

Rakiplerin PWA'siz oldugu goz onune alindiginda, Mercora'nin PWA'si en buyuk rekabet avantaji olarak one cikiyor. Mobil-first stratejide bu dogru sekilde kullanilmalidir.
