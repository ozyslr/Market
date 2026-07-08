# Sistem Denetim Raporu — Benim Olan (Mercora)

**Tarih:** 2026-07-02
**Yöntem:** 4 paralel salt-okunur denetim ajanı (Müşteri/Üyelik, Satıcı, Admin, Canlılık/Entegrasyon)
**Kapsam:** Üyelik → kontrol paneli, satıcı → satıcı özellikleri, admin → admin panel, ürün öne çıkarma → menüler

---

## Genel Değerlendirme

**Backend gerçekten canlı ve production kalitesinde.** Ödeme altyapısı (Stripe webhook imza doğrulama, iyzico marketplace split + escrow, T+7 payout cron), auth/rol koruması (client + server + firestore.rules), ve admin mutasyonları (audit log'lu) sağlam.

**Ana sistemik sorun frontend'deki `MOCK_PRODUCTS` / `MOCK_SELLERS` ağı.** Gerçek Firestore verisi yazılıyor ama birçok kritik ekran hâlâ mock katalogtan **okuyor**. Sonuç: gerçek ürünler sepet/checkout/mağaza vitrininde görünmüyor, satıcı kendi kataloğunu kendi mağazasında göremiyor, admin sahte satıcılar üzerinde işlem yapabiliyor.

**Sonuç:** Platform "teknik olarak çalışıyor" ama uçtan uca yalnızca seed edilmiş mock katalog için. Gerçek veriyle tam canlı işleyiş için mock ağının sökülmesi şart.

---

## Öncelikli Bloker'lar (Prioritized)

### 🔴 P0 — Sistemik: Mock Katalog Ağı

Gerçek veri yazılıyor ama okunmuyor. Tek kök-neden, çok ekranı etkiliyor:

| Ekran           | Dosya:Satır                                                           | Etki                                                           |
| --------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| Sepet           | `Cart.tsx:43,94`                                                      | Line item'ları MOCK_PRODUCTS'tan çözüyor                       |
| Checkout        | `Checkout.tsx:185` (order items :398-406)                             | Mock'ta olmayan gerçek ürün sessizce düşüyor                   |
| Satıcı vitrini  | `SellerStore.tsx:83` (MOCK_SELLERS[0]), `:211` (MOCK_PRODUCTS filtre) | Satıcı gerçek kataloğunu `/store/:slug`'da göremiyor           |
| Admin satıcılar | `AdminSellers.tsx:35,84,87`                                           | Boş sonuçta VE hatada sessiz mock fallback — hatayı maskeliyor |
| Profil          | `UserProfile.tsx`                                                     | Sipariş/wishlist mock'tan                                      |

### 🔴 P0 — Satıcı Mağaza Kategori Yönetimi YOK

Senin açık talebin ("satıcı sayfasındaki kategorilerini ekleme/çıkartma/düzenleme") karşılanmıyor. Kategori CRUD yalnızca Admin'de var; satıcıda sadece düz bir "store menu" mevcut. `SellerStore` / `sellerMenuService` seviyesinde satıcı-bazlı kategori yönetimi eksik.

### 🟠 P1 — Stripe Sipariş → Ledger Kopukluğu

Stripe düz `orders` koleksiyonuna yazıyor; ama payout/komisyon sistemi `orderSets`/`subOrders` üzerine kurulu. Doğrulanmazsa **Stripe siparişlerinde satıcı ödeme alamayabilir**.

### 🟠 P1 — Yarım/Stub Satıcı Özellikleri

- **Toplu yayınlama stub** — `SellerInventory.tsx:197` `handleBulkStatusUpdate` sadece `alert()` (tekli yayınlama çalışıyor).
- **Kupon silme yok** — `sellerCouponService.ts` içinde `deleteDoc`/UI yok (ekle/düzenle var).

### 🟡 P2 — Admin Eksikleri

- **Global menü/mega-menü yönetimi YOK** — admin seviyesinde navigasyon menüsü builder'ı yok.
- **Abuse/şikayet & anlaşmazlık moderasyon ekranı YOK** — `AdminReports.tsx` sipariş analitiği, şikayet kuyruğu değil.
- `AdminCMS.tsx:48,55` — parent kategori etiketi için hardcoded MOCK_CATEGORIES (kozmetik).

### 🟡 P2 — Canlıya Geçiş / Config

- **Sessiz env degradasyonu:** `STRIPE_SECRET_KEY` yoksa sahte secret; `STRIPE_WEBHOOK_SECRET` yoksa doğrulanmamış webhook kabul; `IYZICO_BASE_URL` default'u sandbox. Go-live için prod başlangıç assertion'ı önerilir.
- **Sadakat puanı hardcoded 0** — `UserProfile.tsx:432`, backend yok.
- **Sipariş composite index'leri eksik** — `orderService.ts:36` (userId+createdAt, sellerIds+createdAt); index yoksa sipariş geçmişi sessizce boş dönüyor.
- **Analitik `Math.random()` varyansı** — `sellerAnalyticsService.ts:108` gerçek sorgulara rağmen.

---

## Sağlam Çalışan Alanlar ✅

- **Auth & üyelik:** email/şifre, Google OAuth, anonim/guest + upgrade (`AuthContext.tsx`)
- **Hesap:** adresler (CRUD, max 6), kayıtlı kartlar (Stripe wallet)
- **Sepet kalıcılığı, wishlist, follows, bildirimler** — gerçek Firestore
- **Checkout mekaniği:** Stripe/iyzico/manuel, 3DS, stok rezervasyonu, server-side fiyat doğrulama
- **Sipariş oluştur/geçmiş/takip/iade**
- **Ödemeler:** Stripe (webhook doğrulama, Connect, Identity KYC, refund, one-click) + iyzico (sub-merchant split, S2S callback, escrow) + T+7 payout cron
- **Satıcı ürün CRUD:** ekle/düzenle/sil (tekli+toplu)/yayınla, görsel yükleme (Firebase Storage), CSV import, KYC onboarding
- **Satıcı mağaza ayarları & içerik blokları:** gerçek yazma (`saveStoreConfig`, `storeContentService`)
- **Admin:** rol koruması, ürün moderasyon (onay/red/toplu), kullanıcı yönetimi, KYC onay, **ürün öne çıkarma (tam uçtan uca)**, Featured Deals, CMS/banner, kategori taksonomisi, yorum moderasyonu
- **Kod temizliği:** shipped kaynak kodunda 0 TODO/FIXME; router temiz (placeholder/coming-soon route yok)

---

## Roadmap İçin Not

Mevcut v6.0 Phase 30 (ACC-03) yalnızca **admin** MOCK_SELLERS'ı kaldırmayı hedefliyor. Ancak bu denetim, mock ağının **sepet/checkout/satıcı vitrini** dahil çok daha geniş olduğunu gösteriyor. Öneri: mock sökme işini tüm katalog-okuma yollarını kapsayacak şekilde genişletmek + satıcı kategori yönetimini yeni bir gereksinim olarak eklemek.
