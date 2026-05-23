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

### Vite ProductDetail.tsx (Şu Anki Durum: ✅ Geliştirildi)
- **Sekmeli navigasyon**: details / specs / **reviews** / **qa**
- **Yorum sistemi**: addReview, getReviewsByProduct, checkUserReview
- **Puan/değerlendirme**: Star bileşeni, review formu (rating + comment)
- **Ürün soru-cevap**: productQuestionService entegrasyonu
- **Scroll anchoring**: Tab değişiminde ilgili bölüme kaydırma
- **✅ Wishlist Entegrasyonu**: Görsel üzerindeki kalp ikonu `useWishlist` context'ine bağlandı.
- **✅ Sosyal Paylaşım**: Desktop'ta Framer Motion popover, mobil cihazlarda ise slide-up drawer ve native Web Share API entegre edildi.
- **✅ Son Gezilenler (Recently Viewed)**: Sayfa altında dynamic carousel ve hem üye hem de ziyaretçi (localStorage) bazlı çift hatlı izleme eklendi.

### mercora-next ProductDetailContent.tsx
- **EKSİK**: Yorum/değerlendirme sekmeleri
- **EKSİK**: Yorum formu (addReview)
- **EKSİK**: Star rating interaction
- **EKSİK**: Q&A bölümü
- **EKSİK**: Yorumlara doğrudan bağlantı (anchor/#reviews)
- SADECE `product.rating` ve `product.reviewsCount` gösteriyor (2 satır)

### Rakip Platformlarda Ürün Sayfası Standart Özellikleri
Trendyol, Hepsiburada, Amazon, Etsy'de ortak olanlar:
- **Yeni sekmede açma**: Kullanıcının gezinirken karşılaştırma yapabilmesi için. CTRL+click / sağ tık + yeni sekme desteği.
- **Direkt yorum/puan erişimi**: Ürün kartında yıldız + yorum sayısı → tıklandığında sayfada reviews bölümüne scroll/anchor.
- **Karşılaştırma listesi**: 2+ ürünü yan yana karşılaştırma.
- **Sorular & Cevaplar**: Alıcı-satıcı iletişimi.
- **Stok/Fiyat geçmişi grafikleri**.
- **Görsel arama**: "Find similar" (mercora-next'te Visual Search var).
- **Sosyal kanıt**: "X kişi satın aldı", "X kişi inceliyor".

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

## 7. Rakip Karşılaştırma — Güncel Durum ve Platform Standartları

### Trendyol, Hepsiburada, Amazon, Etsy ve Mercora Karşılaştırması

| Özellik | Trendyol | Hepsiburada | Amazon | Etsy | Mercora (Vite - Kaynak) | Mercora (Next.js - Hedef) |
|---------|----------|-------------|--------|------|------------------------|---------------------------|
| **Yeni Sekmede Açma** | ✅ | ✅ | ✅ | ✅ | ✅ **Tamamlandı** (`target="_blank"`) | ❌ Yok (Taşınacak) |
| **Yorum Anchor Link** | ✅ | ✅ | ✅ | ✅ | ✅ Var (Tab scroll anchoring) | ❌ Yok (Taşınacak) |
| **Star Rating (Kartta)** | ✅ | ✅ | ✅ | ✅ | ✅ Var (Yıldız ikonları) | ⚠️ Sadece Text |
| **Karşılaştırma Listesi** | ✅ | ✅ | ✅ | ❌ | ❌ Yok | ❌ Yok |
| **Soru-Cevap (Q&A)** | ✅ | ✅ | ✅ | ✅ | ✅ Var (qa / question service) | ❌ Yok (Taşınacak) |
| **Fiyat Geçmişi Grafiği** | ❌ | ❌ | ✅ Keepa | ❌ | ❌ Yok | ❌ Yok |
| **Görsel Arama (Visual)** | ✅ | ✅ | ✅ | ✅ | ✅ Var | ✅ Var |
| **Toplu Ürün Yükleme** | ✅ API | ✅ API | ✅ | ✅ CSV | ✅ Var (Import Center) | ❌ Stub |
| **Satıcı Mağazası** | ✅ | ✅ | ✅ | ✅ | ✅ Var (SellerStore 350+ satır) | ⚠️ Stub (19 satır) |
| **Takip Edilen Mağazalar**| ✅ | ✅ | ✅ | ✅ | ✅ **Tamamlandı** (Profil tabı) | ❌ Stub |
| **Kategori Ağacı Filtresi**| ✅ | ✅ | ✅ | ✅ | ✅ **Tamamlandı** (L1->L2->L3 Tree) | ❌ Yok |
| **Sosyal Paylaşım** | ✅ | ✅ | ✅ | ✅ | ✅ **Tamamlandı** (Share Drawer/Popover) | ❌ Yok |
| **Son Gezilenler** | ✅ | ✅ | ✅ | ✅ | ✅ **Tamamlandı** (Çift hatlı Carousel) | ❌ Yok |
| **3D/AR Görüntüleme** | ❌ | ❌ | ✅ | ❌ | ✅ Var | ❌ Servis Eksik |
| **PWA Desteği** | ✅ | ✅ | ✅ | ✅ | ✅ Var | ❌ Servis Eksik |

### "Yeni Sekme" Neden Önemli?
- Kullanıcı arama sonuçlarında gezinirken ürünleri karşılaştırabilmek için.
- Sepet/sekmeler arası geçişte arama filtresini ve sayfa kaydırma konumunu kaybetmemek için.
- Dönüşüm oranını artırır (kullanıcı aynı anda birden fazla ürünü değerlendirebilir).
- Vite projesinde ürün kartları, son gezilenler ve tavsiye şeritleri `target="_blank"` ile yeni sekmede açılacak şekilde güncellenmiştir. Next.js geçişinde de bu standart korunmalıdır.

---

## 8. Öncelikli Yapılacaklar Listesi ve Yol Haritası

### ✅ 1. Aşama: Vite Kaynak Projesinde Tamamlanan Geliştirmeler
Vite tarafındaki kullanıcı deneyimini iyileştirmek ve hataları çözmek amacıyla aşağıdaki özellikler başarıyla entegre edilmiştir:
- **Kalp İkonu & Wishlist Bağlantısı**: Ürün detay sayfasındaki favori ikonu `useWishlist` context'i ile ilişkilendirildi.
- **Sosyal Paylaşım Drawer/Popover**: Ürün detayında desktop için Framer Motion popover, mobil için slide-up drawer ve Web Share API entegrasyonu tamamlandı.
- **Takip Edilen Mağazalar**: Kullanıcı profilinde "Takip Edilen Mağazalar" sekmesi oluşturuldu ve `useFollows` servisi ile mağazaları takip etme/bırakma işlevleri eklendi.
- **Hiyerarşik Kategori Ağacı**: Arama sonuçları sol tarafındaki filtre alanı L1 -> L2 -> L3 kırılımlı ağaç yapısına kavuşturuldu ve kelime tabanlı ürün eşleştirme algoritması geliştirildi.
- **Yeni Sekmede Açma (`target="_blank"`)**: Ürün kartları, tavsiye şeritleri ve son gezilen ürün linkleri yeni sekmede açılacak şekilde düzenlendi; nested link konsol hataları giderildi.
- **Son Gezilenler (Recently Viewed)**: Hem giriş yapmış kullanıcılar (Firestore) hem de ziyaretçiler (LocalStorage) için çift hatlı izleme ve ürün detay sayfasının altında dinamik carousel gösterimi sağlandı.

---

### 🚀 2. Aşama: Next.js'e (mercora-next) Taşınacak Öncelikli Özellikler
Vite kaynak projesinde tam işlevsel olan ancak Next.js projesinde şu an taslak (stub) halinde bulunan kritik özelliklerin göç sıralaması:

#### P1: Kritik Entegrasyonlar ve Satıcı Modülleri (Kritik Öncelik)
1. **🏪 Satıcı Mağazası (`seller/[id]`)**: Vite'taki 350+ satırlık filtreleme, takip, sıralama ve ürün listeleme özelliklerine sahip satıcı mağazasını Next.js tarafına taşımak.
2. **📄 Satıcı Envanter Yönetimi (`Inventory`)**: Vite'ta 804 satır olan tam CRUD envanter yönetim arayüzünün Next.js'e entegrasyonu.
3. **📄 Satıcı İçerik/Ürün Yükleme (`Import Center`)**: CSV/XML/API entegrasyonu ve AI destekli veri eşleştirme sunan 786 satırlık modülün Next.js stub sayfası yerine geçirilmesi.
4. **⭐ Ürün Yorum, Puanlama ve Soru-Cevap (Reviews & QA)**: Vite projesindeki gelişmiş yorum ve soru-cevap sekmelerinin Next.js `ProductDetailContent.tsx` dosyasına port edilmesi.
5. **❤️ Wishlist, Paylaşım ve Son Gezilenler**: Vite'ta geliştirilen favoriye ekleme, sosyal paylaşım drawer'ı ve son gezilenler carousel'inin Next.js bileşenlerine entegre edilmesi.

#### P2: Çoklu Dil ve Altyapı Servisleri (Yüksek Öncelik)
6. **🌍 Almanca ve Arapça (DE/AR) Dil Eksikleri**: `LanguageContext` içinde tespit edilen 56-58 adet eksik çeviri anahtarının tamamlanması.
7. **🔁 Arapça Dil İçin RTL Desteği**: `<html>` elementine dinamik `dir="rtl"` verilmesi ve CSS flexbox/grid yönlerinin Arapça diline göre aynalanması.
8. **📦 4 Eksik Servisin Taşınması**:
   - `arService.ts` (Firebase Storage 3D model yükleme)
   - `emailService.ts` (E-posta bildirim şablonları)
   - `storageService.ts` (Canvas ile görsel resize ve upload)
   - `swRegistration.ts` (PWA Service Worker desteği)

#### P3: Yönetici (Admin) Modülleri ve İyileştirmeler (Orta Öncelik)
9. **🖼️ Admin Kategoriler Sayfası (`Categories`)**: 12 satırlık boş stub yerine tam işlevsel bir kategori CRUD yönetim panelinin yazılması.
10. **🗑️ Yetim Kütüphanelerin Temizlenmesi**: `csvTemplate.ts` ve `taxEngine.ts` dosyalarının projeye dahil edilmesi ya da silinmesi.
11. **📊 Admin Raporları ve Finans Paneli**: Dashboard ve finans sayfalarındaki recharts grafiklerinin dinamik hale getirilmesi, CSV/Excel export özelliklerinin eklenmesi.
12. **📋 Toplu İşlemler ve Güvenlik**: Toplu ürün güncelleme (batch operations) ekranı, audit log geçmişi ve rol tabanlı yetkilendirme (RBAC) arayüzü.

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
