# Kapsamlı Sistem Analizi Raporu

**Tarih:** 2026-05-20
**Proje:** mercora-next (Next.js 16.2.6 App Router)
**Karşılaştırma:** Vite (kaynak proje)

---

## 1. Sayfa/Rota Envanteri

### mercora-next: 49 sayfa (App Router)
### Vite: 47 sayfa

**İki projede de bulunan ana sayfalar:**
- Home, Search, Category, Product Detail, Cart, Checkout, Orders, Wishlist, Profile
- Admin (17 alt sayfa), Seller (8 alt sayfa), Moderator
- Support, Collection, Visual Search, Verification, Sell Application

**Vite'da olup mercora-next'te EKSİK OLAN servisler (4 adet):**

| Servis | Vite'da | mercora-next | Açıklama |
|--------|---------|-------------|----------|
| `arService.ts` | ✅ var | ❌ yok | 3D model yükleme (Firebase Storage + Firestore) |
| `emailService.ts` | ✅ var | ❌ yok | E-posta bildirim şablonları |
| `storageService.ts` | ✅ var | ❌ yok | Görsel resize/upload (canvas ile) |
| `swRegistration.ts` | ✅ var | ❌ yok | PWA Service Worker |

### Ölü/Kullanılmayan Dosyalar (merora-next)

| Dosya | Durum |
|-------|-------|
| `src/lib/csvTemplate.ts` | **ORPHAN** — hiçbir yerde import edilmiyor |
| `src/lib/taxEngine.ts` | **ORPHAN** — hiçbir yerde import edilmiyor |

---

## 2. Admin Panel — Kapsamlı Denetim

### ✅ Tam İşlevsel Admin Sayfaları (CRUD + States)
| Sayfa | Loading | Empty | Error | CRUD | Veri Kaynağı |
|-------|---------|-------|-------|------|-------------|
| Dashboard | ✅ | ✅ | ✅ | Read | Firestore |
| Languages | ✅ | ✅ | ✅ | Read/Update | settingsService |
| Coupons | ✅ | ✅ | ✅ | CRUD | couponService |
| Returns | ✅ | ✅ | ✅ | Read/Update | returnService |
| Reviews | ✅ | ✅ | ✅ | Read/Update | moderationService |
| Settings | ✅ | ✅ | ✅ | Read/Update | settingsService |
| Support | ✅ | ✅ | ✅ | Read/Update | supportService |
| Reports | ✅ | n/a | ✅ | Read | Static data |

### ⚠️ Kısmen İşlevsel (Temel CRUD var ama eksik states)
| Sayfa | Gözlem |
|-------|--------|
| Campaigns | CRUD var, loading/error var ama empty state yok |
| CMS | CRUD var, loading/error var |
| Chat | Firestore canlı dinleme var, loading/error var |
| Orders | Filtreleme var, loading/error var |
| Products | Arama/filtre var, loading/error var |
| Sellers | CRUD var, loading/error var |
| Users | Read var, loading/error var |
| Finance | Read-only, Firestore sorgu var |
| Payments | Read/update var |

### ❌ TASLAK (Stub) Admin Sayfaları
| Sayfa | Satır | İçerik |
|-------|-------|--------|
| **Categories** | 12 satır | `<p>Kategori yönetimi yakında eklenecek.</p>` — TAMAMEN BOŞ |

### Eksik Admin Özellikleri
- Toplu ürün güncelleme (batch operations)
- CSV/Excel export
- Rol tabanlı yetkilendirme UI
- Audit log görüntüleme
- A/B test yönetimi

---

## 3. Satıcı Özellikleri — Detaylı Analiz

### ✅ İşlevsel Satıcı Sayfaları
| Sayfa | Satır | Durum |
|-------|-------|-------|
| Dashboard | 48 | Temel istatistikler |
| Analytics | 457 | **Tam işlevsel** (recharts) |
| Orders/[orderId] | Karmaşık | Sipariş detayı |

### ❌ TASLAK (Stub) Satıcı Sayfaları (hepsi 16 satır)
| Sayfa | Açıklama |
|-------|----------|
| **Certificates** | `<p>Yakında eklenecek.</p>` |
| **Finance** | `<p>Yakında eklenecek.</p>` |
| **Import** | `<p>Ürün içe aktarma yakında eklenecek.</p>` |
| **Inventory** | `<p>Yakında eklenecek.</p>` |
| **Orders** | `<p>Yakında eklenecek.</p>` |
| **Pricing** | `<p>Yakında eklenecek.</p>` |
| **Settings** | `<p>Yakında eklenecek.</p>` |

### Satıcı Mağazası (Müşteri Görünümü)
| Sayfa | Satır | Durum |
|-------|-------|-------|
| **seller/[id]** (Next.js) | 19 | **TASLAK** — `<p>Satıcı mağazası yakında eklenecek.</p>` |
| SellerStore.tsx (Vite) | 350+ | Tam işlevsel: filtreleme, sıralama, grid/list görünüm, takip, kategoriler, flash ürünler |

### Vite'da Olup mercora-next'te EKSİK Olan Satıcı Özellikleri
1. **Toplu ürün yükleme (Import Center)** — Vite'da 786 satır, PapaParse CSV, XML, API mapping, AI destekli. Next.js'te 16 satır stub
2. **Envanter yönetimi** — Vite'da 804 satır, Next.js'te 16 satır stub
3. **Satıcı mağazası** — Vite'da 350+ satır (filtre, ızgara, takip, yorumlar), Next.js'te 19 satır stub
4. **Sertifikalar** — Vite'ta tam CRUD, Next.js'te stub
5. **Finans/Pricing** — Vite'ta tam, Next.js'te stub

---

## 4. Ürün Sayfası Özellikleri

### Vite ProductDetail.tsx (1.192 satır)
- **Sekmeli navigasyon**: details / specs / **reviews** / **qa**
- **Yorum sistemi**: addReview, getReviewsByProduct, checkUserReview
- **Puan/değerlendirme**: Star bileşeni, review formu (rating + comment)
- **Ürün soru-cevap**: productQuestionService entegrasyonu
- **Scroll anchoring**: Tab değişiminde ilgili bölüme kaydırma

### mercora-next ProductDetailContent.tsx
- **EKSİK**: Yorum/değerlendirme sekmeleri
- **EKSİK**: Yorum formu (addReview)
- **EKSİK**: Star rating interaction
- **EKSİK**: Q&A bölümü
- **EKSİK**: Yorumlara doğrudan bağlantı (anchor/#reviews)
- SADECE `product.rating` ve `product.reviewsCount` gösteriyor (2 satır)

### Rakip Platformlarda Ürün Sayfası Standart Özellikleri
Trendyol, Hepsiburada, Amazon, Etsy'de ortak olanlar:
- **Yeni sekmede açma**: Kullanıcının gezinirken karşılaştırma yapabilmesi için. CTRL+click / sağ tık + yeni sekme desteği
- **Direkt yorum/puan erişimi**: Ürün kartında yıldız + yorum sayısı → tıklandığında sayfada reviews bölümüne scroll/anchor
- **Karşılaştırma listesi**: 2+ ürünü yan yana karşılaştırma
- **Sorular & Cevaplar**: Alıcı-satıcı iletişimi
- **Stok/Fiyat geçmişi grafikleri**
- **Görsel arama**: "Find similar" (mercora-next'te Visual Search var)
- **Sosyal kanıt**: "X kişi satın aldı", "X kişi inceliyor"

---

## 5. Dil Dosyaları ve i18n Analizi

### Key Coverage by Language

| Dil | Toplam Key | EN'den Eksik | Tamamlanma % |
|-----|-----------|-------------|-------------|
| 🇬🇧 English | 92 | — | **100%** |
| 🇹🇷 Türkçe | 92 | 0 | **100%** |
| 🇩🇪 Deutsch | 36 | **56** | **39%** ❌ |
| 🇸🇦 العربية | 34 | **58** | **37%** ❌ |

### DE/AR'de EKSİK Olan Önemli Key'ler (56-58 adet)
```
nav.deliver_to, nav.my_account, nav.login_or_sign_up, nav.cart_count,
nav.favorite, nav.orders_list, nav.categories_nav, nav.switch_dark,
nav.switch_light, nav.seller_hub, nav.admin_hub, nav.logged_in_as,
nav.login_google, nav.location_default, nav.wishlist,

product.add_cart, product.description, product.specifications,
product.reviews, product.you_might_also_like, product.added,
product.freeShipping,

home.for_everyone, home.new_arrivals, home.popular_products,
home.special_for_you,

global.show_more,
search.products, search.popular,

cart.remove, cart.summary,
checkout.shipping, checkout.payment, checkout.place_order,
checkout.shipping_info,

wishlist.empty_title, wishlist.empty_desc,

seller.dashboard, seller.inventory, seller.orders, seller.finance,
seller.pricing, seller.analytics, seller.import, seller.certificates,
seller.settings,

badge.tomorrow_at_door,
trust.safe_payment, trust.easy_return, trust.original,
filter.categories, filter.priceRange, filter.minRating, filter.clearAll
```

### RTL Desteği
- **Arapça (ar)**: ❌ **RTL desteği TAMAMEN YOK**
  - `<html>` elementi `lang="tr"` ile sabitlenmiş
  - `dir` attribute'ü dinamik değil
  - CSS'de RTL override'ları yok
  - Flexbox/yön bağımlı bileşenler Arapça'da bozuk görünecek

### `t()` Fonksiyonu Davranışı
```typescript
t = (key: string) => {
  return translations[lang]?.[key] || initialTranslations['en']?.[key] || key;
};
```
- Eksik DE/AR key'leri sessizce EN'ye fallback yapıyor — gözle görülür hata yok ama UX tutarsız

---

## 6. Ölü Kod ve Gereksiz Dosyalar

### Silinebilecek Dosyalar
| Dosya | Nedeni |
|-------|--------|
| `src/lib/csvTemplate.ts` | Hiçbir yerde import edilmiyor, kullanılmıyor |
| `src/lib/taxEngine.ts` | Hiçbir yerde import edilmiyor, kullanılmıyor |

### Vite'dan Taşınmamış Servisler (Eklenmesi Gereken)
| Servis | İçerik |
|--------|--------|
| `arService.ts` | Firebase Storage'a 3D model yükleme |
| `emailService.ts` | E-posta HTML şablon oluşturma |
| `storageService.ts` | Görsel resize (canvas) + Firebase upload |
| `swRegistration.ts` | PWA service worker kaydı |

---

## 7. Rakip Karşılaştırma — Neden Yeni Sekmede Açılıyor?

### Trendyol, Hepsiburada, Amazon, Etsy'nin Ortak Özellikleri

| Özellik | Trendyol | Hepsiburada | Amazon | Etsy | Mercora |
|---------|----------|-------------|--------|------|---------|
| **Yeni sekme** | ✅ | ✅ | ✅ | ✅ | ❌ yok |
| **Yorum anchor link** | ✅ | ✅ | ✅ | ✅ | ❌ yok |
| **Star rating (kartta)** | ✅ | ✅ | ✅ | ✅ | ⚠️ sadece text |
| **Karşılaştırma** | ✅ | ✅ | ✅ | ❌ | ❌ yok |
| **Soru-Cevap** | ✅ | ✅ | ✅ | ✅ | ❌ yok |
| **Fiyat geçmişi** | ❌ | ❌ | ✅ Keepa | ❌ | ❌ yok |
| **Görsel arama** | ✅ | ✅ | ✅ | ✅ | ✅ var |
| **Toplu yükleme** | ✅ API | ✅ API | ✅ | ✅ CSV | ❌ yok |
| **Satıcı mağazası** | ✅ | ✅ | ✅ | ✅ | ⚠️ stub |
| **3D/AR görüntüleme** | ❌ | ❌ | ✅ | ❌ | ⚠️ ARViewer var |
| **PWA desteği** | ✅ | ✅ | ✅ | ✅ | ❌ swRegistration yok |

### "Yeni Sekme" Neden Önemli?
- Kullanıcı arama sonuçlarında gezinirken ürünleri karşılaştırabilmek için
- Sepet/sekmeler arası geçişte bağlam kaybetmemek için
- Dönüşüm oranını artırır (kullanıcı aynı anda birden fazla ürünü değerlendirebilir)
- Next.js'te `Link`'e `target="_blank"` veya CTRL+click ile yapılabilir

---

## 8. Öncelikli Yapılacaklar Listesi

### Acil (Hemen)
1. **📄 Seller Import Center** — Vite'tan 786 satırlık Import Center'ı taşı (CSV/XML/API/AI)
2. **📄 Seller Inventory** — Vite'tan 804 satırlık envanter sayfasını taşı
3. **🏪 Seller Store** — Vite'tan 350+ satırlık mağaza sayfasını taşı
4. **⭐ Product Reviews** — Vite'tan yorum sistemi ekle (sekmeler, addReview, star rating, Q&A)
5. **🌍 DE/AR Dil Dosyaları** — 56-58 eksik key'i çevir
6. **🔁 RTL Desteği** — Arapça için dir="rtl" ve CSS mirroring

### Önemli (Bu Hafta)
7. **🗑️ Orphaned libs** — `csvTemplate.ts` ve `taxEngine.ts`'yi entegre et veya sil
8. **📦 4 Eksik Servis** — arService, emailService, storageService, swRegistration
9. **🖼️ Admin Categories** — 12 satırlık stub'ı tam CRUD sayfasına çevir
10. **🔗 Ürün linkleri** — Arama/liste sayfalarında `target="_blank"` desteği

### İyileştirme (Önümüzdeki Günler)
11. **📊 Admin Reports** — Dinamik grafikler, CSV export
12. **🏷️ Admin Payments** — Ödeme sağlayıcı yönetimi
13. **📋 Toplu ürün güncelleme** — Admin batch operations
14. **👥 Rol tabanlı yetkilendirme UI**
15. **📈 Audit log** görüntüleme
16. **🔍 Karşılaştırma listesi** özelliği

---

## Özet

| Kategori | Toplam | ✅ Tamam | ⚠️ Kısmi | ❌ Eksik/Stub |
|----------|--------|---------|----------|-------------|
| Admin Sayfaları | 18 | 8 | 9 | **1 (Categories)** |
| Satıcı Sayfaları | 10 | 2 | 1 | **7 (stub)** |
| Satıcı Mağazası | 1 | 0 | 0 | **1 (stub)** |
| Dil (DE/AR) | 2 | 0 | 0 | **2 (%37-39)** |
| Ürün Sayfası | 1 | 0 | 0 | **1 (reviews/QA)** |
| Servisler | 41 | 37 | 0 | **4 (taşınmamış)** |
| Lib'ler | 13 | 11 | 0 | **2 (orphan)** |
| **TOPLAM** | | | | **~18 kritik eksik** |
