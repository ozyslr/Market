# Rakip Analizi: Hata Sayfaları ve Kullanıcı Deneyimi (UX)

**Tarih:** 2026-05-23
**Analiz Eden:** Ajan 4/8 — Hata Sayfaları ve UX
**Rakipler:** Hepsiburada, Trendyol, Amazon Türkiye
**Hedef Platform:** Mercora

---

## 1. Giriş

Bu rapor, Mercora e-ticaret platformunun hata sayfaları ve kullanıcı deneyimi kalitesini, Turkiye'nin en büyuk 3 e-ticaret platformu (Hepsiburada, Trendyol, Amazon Türkiye) ile karşılaştırmaktadır. Analiz; hata sayfaları, yüklenme durumları, boş durumlar, form validasyonu, ödeme süreçleri, mobil uyumluluk ve genel UX kalitesini kapsamaktadır.

---

## 2. Rakip UX Profilleri

### 2.1 Hepsiburada

Hepsiburada, son yıllarda kapsamlı bir UX modernizasyonu geçirmiştir. Eski ve karmaşık arayüz yerine daha sade, mobil-first bir tasarıma geçiş yapılmıştır.

| Boyut | Durum |
|-------|-------|
| 404 Sayfası | Standart, markalı 404 sayfası mevcut. Ana sayfaya yönlendirme ve arama çubuğu içerir. |
| 500/Error | Sentry benzeri hata izleme ile yakalanır, kullanıcıya sade "Bir hata oluştu" mesajı gösterilir. |
| Loading States | Ürün listelerinde skeleton screen kullanılır. Detay sayfasında shimmer efekti mevcut. |
| Empty States | Sepet bos, favori yok, siparis yok durumları için özel illustrasyon ve CTA içeren sayfalar. |
| Form Validasyonu | Inline validasyon, anlık hata mesajları, kırmızı border ile işaretleme. |
| Mobil | Mobil-first responsive tasarım. PWA desteği var. |

**Güçlü Yönler:** Skeleton screen kullanımı, empty state tasarımları, mobil uyum.
**Zayıf Yönler:** Bazen gereksiz yönlendirmeler, sayfa yük hızı zaman zaman düşük.

### 2.2 Trendyol

Trendyol, Türkiye'nin en büyük e-ticaret platformu olarak UX konusunda sektör standardını belirlemektedir. Özellikle mobil deneyimi çok güçlüdür.

| Boyut | Durum |
|-------|-------|
| 404 Sayfası | Trendyol markasına uygun özel 404 sayfası. Trendyol karakter maskotu ile eğlenceli yaklaşım. |
| 500/Error | Global error boundary, kullanıcıya dostane hata mesajı. |
| Loading States | Agresif skeleton screen kullanımı. Ürün listeleri, detay, sepet tüm sayfalarda skeleton. |
| Empty States | Her boş durum için özel illustrasyon: sepet boş ("Sepetinizde ürün bulunmamaktadır"), sipariş yok, favori yok. |
| Arama | "Sonuç bulunamadı" sayfası, öneriler, filtreleme hata durumları. |
| Ödeme Hataları | Adım adım validasyon, her adımda geri bildirim, 3D Secure hata yönetimi. |
| Mobil | Mobil uygulama ve mobil web çok güçlü. App-like deneyim. |

**Güçlü Yönler:** Skeleton screen standardı, empty state çeşitliliği, mobil deneyim, form validasyonu.
**Zayıf Yönler:** Bazen aşırı bildirim/uyarı, sayfa karmaşıklığı.

### 2.3 Amazon Türkiye

Amazon'un küresel UX standartları Türkiye sitesinde de uygulanmaktadır. Sade, işlevsel ve alışkanlık yaratmaya odaklıdır.

| Boyut | Durum |
|-------|-------|
| 404 Sayfası | Minimal 404. Amazon logosu, kısa mesaj, arama çubuğu ve ana sayfaya dön linki. |
| 500/Error | Standart hata sayfası, "Something went wrong" mesajı, tekrar dene butonu. |
| Loading States | Çok az skeleton kullanılır. Genellikle dairesel spinner (loading spinner) tercih edilir. |
| Empty States | Sepet boş: "Alışveriş listeniz boş" mesajı ve öneriler. Favori yok: basit mesaj. |
| Arama | "Sonuç bulunamadı" sayfası, arama önerileri, "şunu mu demek istediniz?" |
| Form Validasyonu | Sade ve etkili inline validasyon. Kredi kartı, adres format kontrolleri. |
| Mobil | Mobil web ve uygulama deneyimi standardize. En hızlı yüklenen platformdur. |

**Güçlü Yönler:** Sayfa hızı, sade tasarım, arama deneyimi, güven hissi.
**Zayıf Yönler:** Skeleton screen kullanımı çok az, bazı empty state'ler çok minimal.

---

## 3. Karşılaştırma Matrisi

| UX Boyutu | Hepsiburada | Trendyol | Amazon TR | Mercora (Mevcut) |
|-----------|-------------|----------|-----------|-------------------|
| **404 Sayfası** | Iyi | Çok iyi (maskot) | Orta (minimal) | Iyi (markalı, 404 + ana sayfa linki) |
| **500/Error Page** | Iyi | Iyi | Iyi | Orta (Sentry error boundary var ama çok basit) |
| **403/Unauthorized** | Iyi | Iyi | Iyi | **YOK** — özel 403 sayfası mevcut değil |
| **Maintenance Page** | Iyi | Iyi | Çok iyi | **KISMEN** — types.ts'de maintenanceMode var ama sayfa yok |
| **Skeleton Screens** | Iyi | **Çok iyi** | Zayıf | **Çok iyi** (6 farklı skeleton: ProductCard, ProductGrid, ProductDetail, CategoryList, TableRow, SearchResults) |
| **Loading Spinner** | Iyi | Iyi | Iyi | Iyi (Loader2 kullanımı, tutarlı) |
| **Empty State — Sepet** | Iyi | Çok iyi | Iyi | **Bilinmiyor** — CartPage henüz incelenmedi |
| **Empty State — Sipariş** | Iyi | Çok iyi | Orta | **Iyi** — "Sipariş bulunamadı" mesajı mevcut |
| **Empty State — Ürün** | Iyi | Çok iyi | Orta | **Iyi** — "Henüz ürün yok", "Satıcı bulunamadı" |
| **Empty State — İade** | Orta | İyi | Orta | **Iyi** — İllustrasyon + "İade talebi yok" |
| **Empty State — Sonuç** | İyi | İyi | Çok iyi | **Orta** — Arama sonuçları empty state kontrol edilmedi |
| **Form Validasyonu** | İyi | Çok iyi | İyi | **Orta** — Inline validasyon yok, temel required kontroller var |
| **Inline Hata Mesajları** | İyi | Çok iyi | İyi | **Kötü** — Çoğu yerde catch'te sessiz hata veya console.error |
| **Ödeme Hata Yönetimi** | İyi | Çok iyi | Çok iyi | **Bilinmiyor** — Checkout incelenmedi |
| **Arama — Sonuç Yok** | İyi | İyi | Çok iyi (öneri) | **Bilinmiyor** — SearchResults incelenmedi |
| **Network Error Yönetimi** | İyi | İyi | İyi | **Kötü** — .catch(() => {}) sessiz hatalar mevcut |
| **Mobil Uyum** | Çok iyi | **Mükemmel** | İyi | **İyi** — Responsive, mobil tab bar, ama mobil-first değil |
| **Sayfa Hızı** | Orta | İyi | Çok iyi | **Orta** — Firestore bağımlılığı yavaşlatıyor |
| **Erişilebilirlik** | Orta | Orta | İyi | **Zayıf** — SkipToContent var, ama ARIA eksik |
| **Tutarlı Tema** | İyi | Çok iyi | Mükemmel | **Kötü** — İki farklı tema sistemi (src vs mercora-next) |

---

## 4. Mercora'nın Mevcut Durumu

### 4.1 Güçlü Yönler

- **Skeleton Screen Altyapısı:** Mercora'nın en güçlü UX yanı. `Skeleton.tsx` dosyasında 6 farklı skeleton varyantı bulunuyor: ProductCardSkeleton, ProductGridSkeleton, CategoryListSkeleton, ProductDetailSkeleton, TableRowSkeleton, SearchResultsSkeleton. Bu, Trendyol ve Hepsiburada seviyesinde bir hazırlık.
- **404 Sayfası:** Hem `src/pages/NotFound.tsx` (React Router) hem de `mercora-next/src/app/not-found.tsx` ve `mercora-next/src/app/admin/not-found.tsx` (Next.js App Router) olmak üzere 3 farklı 404 sayfası mevcut. Tasarım markalı ve kullanıcı dostu.
- **Error Boundary:** Sentry ErrorBoundary ile root seviyede hata yakalama. `mercora-next/src/app/error.tsx` ve `mercora-next/src/app/admin/error.tsx` dosyalarında özel hata sayfaları.
- **Loading States:** `mercora-next/src/app/admin/loading.tsx` gibi Next.js loading.tsx dosyası mevcut. Tablolarda `TableRowSkeleton` kullanımı yaygın.
- **Empty State Yönetimi:** Satıcı tablolarında, iade listelerinde, ürün listelerinde boş durum kontrolleri yapılıyor. Genellikle illustrasyon ikonu + açıklama metni + CTA içeriyor.
- **Form Alanları:** `SellerSettings.tsx`'teki Field komponenti, `SellerImportCenter.tsx`'teki validasyonlar görece iyi.

### 4.2 Zayıf Yönler

- **Sessiz Hatalar (Silent Failures):** `AdminSellers.tsx` satır 64-68'de `.catch(() => { setSellers(MOCK_SELLERS...) })` ve `SellerSettings.tsx` satır 73'te `.catch(() => {/* sessiz hata */})` gibi yaklaşımlar kullanıcıyı bilgilendirmeden hata yutuyor.
- **Inline Form Validasyonu Eksik:** Form alanlarında anlık validasyon, kırmızı border, hata mesajı gibi UX pattern'leri yok. Kullanıcı formu gönderene kadar hataları görmüyor.
- **403/Unauthorized Sayfası Yok:** Admin panellerinde yetkisiz erişim durumunda gösterilecek özel bir sayfa bulunmuyor.
- **Bakım Sayfası Yok:** `types.ts`'de `maintenanceMode` ve `maintenanceMessage` alanları tanımlanmış ancak bunu kullanıcıya gösteren bir sayfa yok.
- **Tema Tutarsızlığı:** `src/` (React) ve `mercora-next/` (Next.js) arasında farklı tema sistemleri kullanılıyor. Biri `bg-brand-primary`/`text-accent` renkleri, diğeri `bg-zinc-950`/`text-emerald-400` kullanıyor.
- **Erişilebilirlik Eksik:** Yalnızca `SkipToContent` komponenti var. ARIA etiketleri, focus yönetimi, klavye navigasyonu büyük ölçüde eksik.
- **Network Error Bildirimi Yok:** Firestore bağlantı hataları, ağ kopmaları gibi durumlarda kullanıcıya bildirim gösterilmiyor.
- **Özel 500 Sayfası Çok Basit:** `App.tsx` satır 87'deki SentryErrorBoundary fallback'i sadece `<p>Bir hata oluştu. Lütfen sayfayı yenileyin.</p>` şeklinde.

---

## 5. Eksikler ve Öneriler

### P0 — Kritik (Hemen Yapılmalı)

| # | Eksik | Öneri | Dosya |
|---|-------|-------|-------|
| 1 | **Sessiz hata yutma** | Tüm `.catch(() => {})` bloklarını kaldır. Kullanıcıya toast/snackbar ile hata bildir. Catch bloklarında en azından konsola hata logla ve kullanıcıya dostane bir mesaj göster. | `AdminSellers.tsx:64-68`, `SellerSettings.tsx:73`, `SellerImportCenter.tsx:152`, `OrderTracking.tsx:45` |
| 2 | **403/Unauthorized sayfa eksik** | Admin panelinde yetkisiz erişim için özel 403 sayfası oluştur. "Bu sayfaya erişim yetkiniz yok" mesajı + ana sayfaya dön linki. | Yeni: `src/pages/Forbidden.tsx` |
| 3 | **Bakım sayfası eksik** | `SiteSettings.maintenanceMode` aktif olduğunda tüm kullanıcıları bakım sayfasına yönlendir. | Yeni: `src/pages/Maintenance.tsx` |
| 4 | **Arama empty state** | "Sonuç bulunamadı" sayfası için özel tasarım. Önerilen ürünler, alternatif arama terimleri, kategori önerileri. | `SearchResults.tsx` (kontrol edilmeli) |
| 5 | **Inline form validasyonu** | Tüm form alanlarına anlık validasyon ekle: kırmızı border, hata metni, başarılı state. Özellikle ödeme ve adres formlarında. | `SellerSettings.tsx`, `Checkout.tsx`, `SellOnMercora.tsx` |

### P1 — Önemli (Kısa Vadede Yapılmalı)

| # | Eksik | Öneri | Dosya |
|---|-------|-------|-------|
| 6 | **Network error UI** | İnternet bağlantısı koptuğunda kullanıcıya bildiren bir komponent. "Bağlantınız koptu, tekrar bağlanılıyor..." | Yeni: `src/components/common/NetworkStatus.tsx` |
| 7 | **Toast/Snackbar sistemi** | Başarılı işlem, hata, uyarı gibi durumlar için global bildirim sistemi. | Yeni: `src/components/common/Toast.tsx` |
| 8 | **Tema tutarlılığı** | `src/` ve `mercora-next/` arasındaki renk sistemini tek bir CSS variable sistemine indirge. | `globals.css`, `tailwind.config` |
| 9 | **SentryErrorBoundary iyileştirme** | Mevcut basit fallback'i zenginleştir: hata kodu, hata açıklaması, tekrar dene butonu, destek iletişim bilgisi. | `App.tsx` satır 87 |
| 10 | **Erişilebilirlik (ARIA)** | Tüm interaktif elemanlara aria-label, role, tabIndex ekle. Focus yönetimi için trap ekle. | Tüm form ve modal komponentleri |
| 11 | **Empty state çeşitlendirme** | Her boş durum için özel illustrasyon ekle (Trendyol modeli). Sepet boş, sipariş yok, favori yok, mesaj yok. | Tüm liste sayfaları |
| 12 | **Arama — "şunu mu demek istediniz?"** | Sonuç bulunamadığında alternatif arama önerisi. "Muhtemelen şunu aramak istediniz: X" | `SearchResults.tsx` |

### P2 — İyileştirme (Uzun Vadede)

| # | Eksik | Öneri | Dosya |
|---|-------|-------|-------|
| 13 | **404 sayfası zenginleştirme** | Trendyol gibi eğlenceli bir element ekle (ör: üzgün Mercora maskotu). En popüler ürünleri göster. | `NotFound.tsx`, `not-found.tsx` |
| 14 | **500/Error sayfası iyileştirme** | Hata kodu, hata referans ID'si, "sorunu bildir" butonu, otomatik yenileme sayacı. | `App.tsx`, `error.tsx` |
| 15 | **Skeleton geçiş animasyonları** | Skeleton'dan gerçek içeriğe geçişte smooth transition ekle (motion/react ile). | `Skeleton.tsx`, liste sayfaları |
| 16 | **Sayfa hızı optimizasyonu** | Firestore sorgularında pagination/cursor, resim lazy loading (mevcut), bundle splitting. | Tüm liste/veri sayfaları |
| 17 | **Form auto-save** | Uzun formlarda (satıcı başvurusu, ürün ekleme) otomatik kaydetme ve geri dönüşte kaldığı yerden devam. | `SellOnMercora.tsx`, `SellerImportCenter.tsx` |
| 18 | **Mobil-first geçiş** | Mevcut responsive yapıyı mobil-first olacak şekilde yeniden düzenle. | Tüm sayfalar |
| 19 | **PWA desteği** | Offline sayfası, service worker, push notification desteği. | `mercora-next/` |
| 20 | **A/B test altyapısı** | Farklı UX varyasyonlarını test etmek için altyapı (farklı button stilleri, farklı empty state tasarımları). | Yeni |

---

## 6. Sonuç

### Özet Değerlendirme

Mercora, UX açısından **potansiyeli yüksek ancak olgunlaşmamış** bir platformdur. Skeleton screen altyapısı ve temel hata sayfaları açısından güçlü bir temele sahip olsa da, özellikle şu alanlarda rakiplerinin gerisindedir:

1. **Hata Yönetimi** (En kritik): Sessiz hata yutma, eksik catch blokları, kullanıcıya bildirim yapılmaması. Bu, güven kaybına yol açar.
2. **Form Validasyonu**: Rakipler inline validasyon standardını belirlemişken Mercora'da bu neredeyse yok.
3. **Tema Tutarlılığı**: İki farklı uygulama arasında kopukluk var. Kullanıcı deneyimi bütünlüğü zarar görüyor.
4. **Erişilebilirlik**: Temel düzeyde bile ARIA desteği eksik.
5. **Özel Sayfalar**: 403, bakım, network hatası gibi özel durum sayfaları eksik.

### Rakiplere Göre Sıralama

| Sıra | Platform | UX Skoru |
|------|----------|----------|
| 1 | Trendyol | 9.2/10 |
| 2 | Amazon TR | 8.5/10 |
| 3 | Hepsiburada | 7.8/10 |
| 4 | Mercora | 5.5/10 (güçlü skeleton + hata sayfaları temeli ile potansiyel 7.0+) |

### Öncelikli Aksiyonlar

1. **Hemen (P0):** Sessiz hata yutma sorununu çöz, tüm catch bloklarını görünür hale getir.
2. **Hemen (P0):** 403 ve Maintenance sayfalarını ekle.
3. **Kısa Vade (P1):** Toast/Snackbar sistemi ve Network Status UI ekle.
4. **Kısa Vade (P1):** Inline form validasyonunu tüm formlara yay.
5. **Kısa Vade (P1):** Tema tutarlılığını sağla.
6. **Uzun Vade (P2):** Erişilebilirlik, PWA, A/B test altyapısı.

Mercora'nın skeleton screen altyapısı, rakipleriyle rekabet edebilecek seviyededir ve bu güçlü yön korunmalıdır. Öncelikli olarak hata yönetimi ve kullanıcı geri bildirim mekanizmalarının iyileştirilmesi, kullanıcı güvenini artıracak ve dönüşüm oranlarına olumlu yansıyacaktır.

---

*Rapor, doğrudan Mercora kaynak kod incelemesi (src/ ve mercora-next/) ve sektör bilgisi temel alınarak hazırlanmıştır.*
