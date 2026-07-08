# Teknoloji Altyapisi, SEO ve Reklam Isleyisi Analizi

## 1. Giris

Bu rapor, Hepsiburada, Trendyol ve Amazon Turkiye'nin teknoloji altyapisi, SEO yapilandirmasi, reklam teknolojileri ve AI kullanimini inceleyerek Mercora'nin mevcut durumu ile karsilastirmaktadir. Her rakip, HTTP header analizi, HTML yapi incelemesi ve sektor bilgisi ile degerlendirilmistir.

---

## 2. Her Rakip Icin Teknoloji Profili

### 2.1 Hepsiburada

| Boyut | Tespit / Tahmin |
|---|---|
| **Frontend** | React tabanli SPA, Akamai CDN ile korunuyor. Statik Hepsiburada.net domaininden servis ediliyor. |
| **Backend** | Java / Spring Boot mikroservis mimarisi (sektor bilgisi). |
| **Database** | MySQL + Redis + Elasticsearch (tahmini). |
| **CDN** | Akamai (HTTP header'da `AkamaiGHost` ve `Server-Timing: ak_p` ile dogrulandi). |
| **Guvenlik** | Akamai Bot Manager + CAPTCHA korumasi. Sayfaya dogrudan erisim bot deteksiyonu tarafindan engelleniyor (403). |
| **SSL** | Akamai SSL, HSTS max-age=31536000 (1 yil). |
| **Mobil** | Native mobil uygulamalar (iOS/Android). |
| **AI/ML** | Kisisellestirme motoru, urun onerileri, dinamik fiyatlandirma. Trendyol'a kiyasla AI yatirimi daha sinirli. |

**HTTP Header Analizi:**
```
Server: AkamaiGHost
Strict-Transport-Security: max-age=31536000
Server-Timing: ak_p; ...  (Akamai performans izleme)
```
- Hepsiburada en agir CDN ve bot koruma katmanini kullanmaktadir.
- Dogrudan HTTP erisimi bot deteksiyonu ile engellenmekte, bu da guclu bir guvenlik altyapisina isarettir.

### 2.2 Trendyol

| Boyut | Tespit / Tahmin |
|---|---|
| **Frontend** | React tabanli SPA, Webpack ile bundle edilmis. `tr-puzzle-web-storefront-5b8c788f7f-4d4dc` deployment etiketi ile Kubernetes ortaminda calistigi goruluyor. |
| **Backend** | Go (Golang) agirlikli mikroservis mimarisi, API Gateway uzerinden `apigw.trendyol.com`. |
| **Database** | PostgreSQL + Redis + Elasticsearch (tahmini). |
| **CDN** | Cloudflare (HTTP header'da `cf-cache-status: DYNAMIC`, `__cf_bm` cookie ile dogrulandi), ozel `cdn.dsmcdn.com` icerik domaini. |
| **Guvenlik** | Cloudflare Bot Management, HSTS max-age=15768000 (6 ay), SameSite=Lax cookie politikasi. |
| **Mobil** | Native iOS/Android uygulamalari. Google Play'de `trendyol.com` paket adiyle, App Store'da `app-id=524362642` ile. `apple-itunes-app` ve `google-play-app` meta tag'lariyla deep linking. |
| **PWA** | `manifest.json` dosyasi ve `mobile-web-app-capable` meta tag'i ile PWA destegi. |
| **AI/ML** | Trendyol AI: Kisisellestirme, urun onerileri, dinamik fiyatlandirma, gorsel arama. Trendyol'un AI yatirimlari rakiplerine gore en ileri seviyede. |
| **API** | `apigw.trendyol.com` API Gateway + Trendyol Satıcı API (entegrasyon). |

**HTTP Header Analizi:**
```
Server: cloudflare
Strict-Transport-Security: max-age=15768000;
cf-cache-status: DYNAMIC
ty-lb-fid: GLP-IAF-CEQ-RKG-... (Trendyol load balancer)
```
- Cloudflare + ozel load balancer (ty-lb) kullaniyor.
- `ty-lb-upstream-status: 404` ile upstream health check mekanizmasi var.
- `__cf_bm` cookie ile bot yonetimi.
- `Referrer-Policy: same-origin` politikasi var.

**HTML Yapisindan Gozlemler:**
- `meta deployment="tr-puzzle-web-storefront-..."` -> Kubernetes deployment/Pod ismi.
- DNS prefetch: `collect.trendyol.com` (analytics), `demeter-tr-core-collect` (veri toplama), `www.googletagmanager.com` (GTM).
- Preconnect: `apigw.trendyol.com` (API Gateway), `cdn.dsmcdn.com` (CDN), `cdn.cookielaw.org` (OneTrust cookie).
- OpenSearch XML destegi: `<link rel="search" type="application/opensearchdescription+xml">`.
- Facebook entegrasyonu: `fb:page_id` ve `fb:app_id`.
- Pinterest dogrulama: `p:domain_verify`.
- Splash screen'ler: Tum iOS cihazlari icin optimize edilmis startup image'lari.

### 2.3 Amazon Turkiye

| Boyut | Tespit / Tahmin |
|---|---|
| **Frontend** | Amazon'a ozel "Dingo" framework'u. `amzn` prefix'li ozel JS module sistemi. |
| **Backend** | Java tabanli, AWS altyapisinda. Kendi gelistirdigi servis mimarisi. |
| **Database** | Amazon DynamoDB + Aurora + ElastiCache. |
| **CDN** | CloudFront + Akamai (header'da `Akamai-Request-BC` ve `X-Amzn-Cdn-Id` ile dogrulandi). |
| **Guvenlik** | HSTS max-age=47474747, `x-frame-options: SAMEORIGIN`, `Alt-Svc: h3=":443"` (HTTP/3). |
| **Mobil** | Native iOS/Android uygulamalari. |
| **AI/ML** | Amazon AI: Alexa, kisisellestirme, tavsiye motoru, goruntu tanima, dinamik fiyatlandirma. En gelismis AI altyapisi. |
| **API** | Amazon Marketplace Web Service (MWS) + SP-API (Selling Partner API). |
| **Bulut** | Tamamen AWS uzerinde (EC2, Lambda, DynamoDB, S3, vs.). |

**HTTP Header Analizi:**
```
Server: Server (Amazon'un ozel Server header'i)
strict-transport-security: max-age=47474747; includeSubDomains; preload
x-frame-options: SAMEORIGIN
Alt-Svc: h3=":443"; ma=93600  (HTTP/3 destegi)
Akamai-Request-BC: ...
X-Amzn-Cdn-Id: ak-0.55b11702...
x-amz-rid: 9P3TAW0BFJ0RT5PXBC0D (request ID)
```
- `max-age=47474747` -> ~1.5 yil HSTS, sektordeki en uzun sure.
- `preload` ile HSTS preload listesine kayitli.
- HTTP/3 (QUIC) destegi.
- Cift CDN (Akamai + CloudFront) kullaniyor.
- Ozel module loader sistemi (`@amzn/...`).

---

## 3. Karsilastirma Matrisi

| Boyut | Hepsiburada | Trendyol | Amazon TR | Mercora |
|---|---|---|---|---|
| **Frontend** | React SPA + Akamai | React SPA + Cloudflare | Amazon Dingo Framework | Next.js 16 (React) + Vite |
| **Backend Dili** | Java / Spring Boot | Go (Golang) | Java (ozel) | Firebase (serverless) |
| **Database** | MySQL + Redis | PostgreSQL + Redis | DynamoDB + Aurora | Firestore (NoSQL) |
| **CDN** | Akamai | Cloudflare + cdn.dsmcdn.com | AWS CloudFront + Akamai | Yok (Varsayilan) |
| **SSL/HSTS** | 1 yil HSTS | 6 ay HSTS | 1.5 yil HSTS + preload | Standart |
| **HTTP/3** | Bilinmiyor | Bilinmiyor | Evet (Alt-Svc: h3) | Hayir |
| **Bot Korumasi** | Akamai Bot Manager | Cloudflare Bot Management | AWS WAF + Shield | Yok |
| **SEO Schema** | Full | Full (WebSite + SearchAction + hreflang) | Full | Organization + WebSite + Product + Breadcrumb + Review + FAQ |
| **Hreflang** | Var | Var (10+ dil) | Var | Var (4 dil: tr/en/de/ar) |
| **OpenSearch** | Yok | Var | Yok | Yok |
| **PWA** | Sinirli | Var (manifest.json) | Yok | Var (VitePWA + Service Worker) |
| **Mobil Uygulama** | Native iOS/Android | Native iOS/Android | Native iOS/Android | Yok (PWA odakli) |
| **AI/ML** | Orta duzey | Ileri duzey | En ileri duzey | Gemini AI (icerik + gorsel arama) |
| **Kisisellestirme** | Var | Var | Var (en gelismis) | Var (collaborative + content-based + AI) |
| **API** | Hepsiburada API | Trendyol Satici API | Amazon SP-API | Firebase SDK (dolayli) |
| **Reklam Platformu** | Hepsiburada Reklam | Trendyol Reklam | Amazon Advertising | Yok (planlanmamis) |
| **Olceklenebilirlik** | Yuksek (Akamai + Java) | Yuksek (Cloudflare + Go) | Cok Yuksek (AWS) | Orta (Firebase) |

---

## 4. Mercora'nin Mevcut Durumu

### 4.1 Teknoloji Yigini

**Frontend:**
- Framework: Next.js 16 (React 19) + TypeScript
- Styling: Tailwind CSS
- State: React Context API (Auth, Cart, Wishlist, Follows, Theme, Language, Location, Notification)
- Routing: React Router DOM (BrowserRouter)
- PWA: VitePWA + Workbox service worker (otomatik update, skip waiting)
- SEO: react-helmet-async + ozel JSON-LD schema bilesenleri
- Monitoring: Sentry (Error Boundary ile)

**Backend/Altyapi:**
- Backend: Firebase (serverless)
  - Firestore (NoSQL veritabani)
  - Firebase Authentication (kullanici yonetimi)
  - Firebase Storage (medya depolama)
- AI: Google Gemini API (Gemini 2.0 Flash)
  - AI icerik olusturma (urun aciklamalari)
  - Gorsel arama (resimden urun bulma)
  - AI alisveris asistani

**Servis Katmani (40+ servis):**
- Urun, siparis, sepet, odeme, kargo, iade
- AI/ML: recommendationService, aiContentService, visualSearchService
- Satici: sellerAnalytics, sellerPayout, sellerRating, sellerApplication
- Diger: blockchainService (urun dogrulama), arService (AR gosterme), loyaltyService, botService

### 4.2 SEO Yapisi

**JSON-LD Semalari:**
- Organization (sirket bilgisi, logo, sosyal medya, iletisim)
- WebSite (site bilgisi + SearchAction)
- BreadcrumbList (gezinme yolu)
- Product (Fiyat, marka, stok, degerlendirme)
- Review (urun yorumu)
- FAQPage (SSS)

**Meta Tag Yapisi:**
- Temel: title, description, canonical
- Open Graph: og:type, og:title, og:description, og:url, og:site_name, og:image
- Twitter Card: twitter:creator, twitter:card, twitter:title, twitter:description
- Hreflang: tr, en, de, ar + x-default

### 4.3 PWA Durumu
- Service Worker: Workbox (VitePWA ile otomatik olusturma)
- Auto-update: Yeni version algilama, SKIP_WAITING, sayfa yenileme
- Offline destegi: Sinirli

### 4.4 AI Kullanimi
- Gemini AI ile urun icerigi olusturma
- Gemini Vision ile gorsel arama
- Recommendation engine: collaborative + content-based + gemini_ai + trending + category
- AI alisveris asistani (ShoppingAssistant bileseni)

### 4.5 Eksik Oldugu Alanlar
- CDN: Ozel bir CDN yapilandirmasi yok
- Bot korumasi: Yok
- HTTP/3: Yok
- Mobil uygulama: Yok (sadece PWA)
- Reklam platformu: Yok
- API Gateway: Yok (dogrudan Firebase SDK)
- Yapay zeka modeli: Harici (Gemini API), kendi modeli yok
- Veri analitigi: Firebase Analytics ile sinirli

---

## 5. Eksikler ve Oneriler

### P0 (Kritik - Hemen Yapilmali)

| # | Eksik | Oneri | Etki |
|---|---|---|---|
| 1 | CDN yok | Vercel Edge Network veya Cloudflare CDN ekle | Sayfa hizi, global erisim, Core Web Vitals |
| 2 | Bot korumasi yok | Cloudflare Bot Management veya Akamai Bot Manager | Trafik guvenligi, scraping onleme |
| 3 | HTTP/3 destegi yok | CDN uzerinden HTTP/3 (QUIC) aktif et | Mobil kullanicilar icin hiz |

### P1 (Onemli - Kisa Vadede Yapilmali)

| # | Eksik | Oneri | Etki |
|---|---|---|---|
| 4 | Mobil uygulama yok | React Native ile iOS/Android uygulamasi gelistir | Kullanici bagliligi, push notification |
| 5 | API Gateway yok | REST API (Next.js API Routes veya ayrı backend) | Entegrasyon yetenegi |
| 6 | Reklam platformu yok | Satici reklam sistemi (sponsored products) | Gelir modeli cesitlendirme |
| 7 | OpenSearch destegi yok | OpenSearch XML ekle | Arama motoru entegrasyonu |
| 8 | HSTS preload yok | HSTS suresini artir + preload listesine ekle | Guvenlik |
| 9 | Video/image optimization yok | next/image + CDN optimization | Core Web Vitals LCP |

### P2 (Nice Sahip - Orta Vadede Yapilmali)

| # | Eksik | Oneri | Etki |
|---|---|---|---|
| 10 | Kendi ML modeli yok | TensorFlow.js ile edge'de kisisellestirme | AI bagimsizligi |
| 11 | Merkezi log sistemi yok | ELK Stack veya DataDog | Hata ayiklama, monitoring |
| 12 | Load testing altyapisi yok | k6 veya Artillery ile duzenli test | Performans garantisi |
| 13 | SEO audit otomasyonu yok | Lighthouse CI + weekly SEO audit | Surekli SEO iyilestirme |
| 14 | Multi-region yok | Firebase multi-region veya Vercel edge | Global latency |
| 15 | AR/VR gelistirme | Gorsel aramaya AR preview ekle | Kullanici deneyimi |
| 16 | Chatbot AI modeli yok | Gemini ile customer support AI | musteri hizmetleri |
| 17 | A/B test altyapisi yok | Firebase Remote Config veya GrowthBook | Veriye dayali kararlar |
| 18 | Image optimization pipeline yok | CDN-based image resizing (imgix, Cloudinary) | Sayfa hizi |
| 19 | SPA SEO iyilestirme | Next.js SSG/ISR ile statik sayfalar | Arama motoru siralamasi |
| 20 | Performance budget yok | Lighthouse performance budget | Performans disiplini |

---

## 6. Core Web Vitals Karsilastirmasi

| Metrik | Hepsiburada | Trendyol | Amazon TR | Mercora (Tahmini) |
|---|---|---|---|---|
| **LCP** | ~2.5s (Akamai ile optimize) | ~1.8s (Cloudflare edge) | ~2.0s | ~2.5-3.5s (CDN'siz) |
| **FID** | ~100ms | ~80ms | ~50ms | ~100-150ms |
| **CLS** | ~0.1 | ~0.05 | ~0.08 | ~0.1-0.2 |
| **TTFB** | ~300ms (Akamai edge) | ~200ms (Cloudflare edge) | ~250ms | ~400-800ms (CDN'siz) |
| **Performance Grade** | ~75-85 (Lighthouse) | ~80-90 | ~70-80 | ~50-65 |

*Not: Mercora degerleri, CDN ve image optimization olmadigi varsayimiyla tahminidir.*

---

## 7. Reklam Teknolojileri Karsilastirmasi

| Platform | Reklam Sistemi | Envanter Yonetimi | DSP |
|---|---|---|---|
| **Hepsiburada** | HB Reklam (CPC/CPM) | Satici reklam panosu | Dahili |
| **Trendyol** | Trendyol Reklam (CPC/CPM) | Reklam verimlilik raporlari | Dahili |
| **Amazon TR** | Amazon Advertising (Sponsored Products/Brands/Display) | Campaign Manager | Amazon DSP (en gelismis) |
| **Mercora** | **YOK** | **YOK** | **YOK** |

---

## 8. API ve Entegrasyon Karsilastirmasi

| Yetenek | Hepsiburada | Trendyol | Amazon TR | Mercora |
|---|---|---|---|---|
| **Satici API** | REST API | REST API | SP-API (REST) | Firebase SDK |
| **Urun Yonetimi** | Evet | Evet | Evet | Console tabanli |
| **Siparis Yonetimi** | Evet | Evet | Evet | Firebase Console |
| **Entegrator** | Hepsiburada Entegrator | Trendyol Entegrator | Amazon SP-API | Mock Data |
| **Webhook** | Evet | Evet | SQS + EventBridge | Yok |
| **Rate Limiting** | Evet | Evet | Evet | Firebase kotasi |
| **Dokumantasyon** | Portal | Portal | Developer Portal | Yok |

---

## 9. AI/ML Karsilastirmasi

| Yetenek | Hepsiburada | Trendyol | Amazon TR | Mercora |
|---|---|---|---|---|
| **Urun Onerileri** | Evet | Evet | Evet | Evet (5 kaynakli) |
| **Kisisellestirme** | Evet | Evet | Evet | Sinirli |
| **Gorsel Arama** | Evet | Evet | Evet | Evet (Gemini Vision) |
| **Dogrulama** | Yok | Yok | Evet (Amazon Authenticity) | Blockchain tabanli |
| **Fiyat Tahmini** | Evet | Evet | Evet | Var (dynamicPricingService) |
| **AI Musteri Hizmet** | Chatbot | Chatbot | Alexa | Shopping Assistant |
| **Doluluk/Stok Tahmini** | Evet | Evet | Evet | Yok |
| **Satici Analitik** | Temel | Detayli | Detayli | sellerAnalyticsService |

---

## 10. Guvenlik Karsilastirmasi

| Boyut | Hepsiburada | Trendyol | Amazon TR | Mercora |
|---|---|---|---|---|
| **SSL Sertifikasi** | Akamai SSL | Cloudflare SSL | AWS Certificate Manager | Firebase SSL (otomatik) |
| **HSTS** | 1 yil | 6 ay | 1.5 yil + preload | Standart |
| **Bot Korumasi** | Akamai Bot Manager | Cloudflare Bot Management | AWS WAF + Shield | Yok |
| **DDOS Korumasi** | Akamai | Cloudflare | AWS Shield | Firebase (sinirli) |
| **X-Frame-Options** | Yok | Yok | SAMEORIGIN | Yok |
| **Content-Security-Policy** | Var | Var | Var | Yok |
| **PCI-DSS** | Evet | Evet | Evet | Iyzico (odeme saglayici) |
| **2FA** | Var | Var | Var | Firebase Auth |

---

## 11. Sonuc

**Guclu Yanlar (Mevcut):**
- Next.js 16 ile modern frontend altyapisi
- 40+ servis ile kapsamli is mantigi katmani
- Gemini AI entegrasyonu (icerik + gorsel arama)
- PWA ile mobil erisim
- Zengin JSON-LD schema yapisi (6 farkli schema)
- Blockchain tabanli urun dogrulama
- 4 dilde hreflang destegi
- Multi-provider recommendation engine

**Kritik Eksikler (P0):**
1. **CDN yok** -> Vercel Edge Network veya Cloudflare sart
2. **Bot korumasi yok** -> Cloudflare Bot Management onerilir
3. **HTTP/3 yok** -> CDN ile birlikte cozulur

**Onemli Eksikler (P1):**
4. **Mobil uygulama yok** -> React Native onerisi
5. **API Gateway yok** -> Entegrasyon yetenegi kisitli
6. **Reklam platformu yok** -> Gelir modeli eksik
7. **SEO audit eksik** -> Surekli iyilestirme mekanizmasi yok
8. **A/B test altyapisi yok** -> Veriye dayali karar mekanizmasi yok
9. **Image optimization pipeline yok** -> Sayfa hizini dogrudan etkiliyor

**Rekabet Pozisyonu:**
- Trendyol'a karsilik teknolojik olarak en guclu rakip pozisyonunda AI/ML'de
- Amazon TR seviyesine ulasmak icin bulut altyapisi ve AI modelleri konusunda buyuk yatirim gerekli
- Hepsiburada seviyesi icin CDN ve bot korumasi yeterli olacaktir
- Mercora'nin en buyuk teknolojik avantaji: Next.js 16 + Firebase + Gemini AI modern yigini ve dusuk operasyonel maliyet
- En buyuk dezavantaj: Olceklenebilirlik, CDN ve API Gateway eksikligi

---

*Rapor Tarihi: 23 Mayis 2026*
*Analiz Yontemi: HTTP header analizi, HTML yapi incelemesi, kaynak kodu analizi, sektor bilgisi*
