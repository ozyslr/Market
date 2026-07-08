# P0 Mock Katalog Ağının Sökülmesi — Tasarım

**Tarih:** 2026-07-02
**Milestone/Faz:** v6.0 Phase 30 (Foundation & Shared) kapsamının genişletilmesi
**İlgili gereksinimler:** ACC-02 (paylaşılan bileşenler), ACC-03 (mock/fallback yok; hata → açık hata + retry)
**Kaynak denetim:** `.planning/SYSTEM-AUDIT-2026-07-02.md`

## Problem

Gerçek Firestore verisi yazılıyor ama birçok kritik ekran hâlâ `MOCK_PRODUCTS` / `MOCK_SELLERS`'tan **okuyor**. Sonuç: gerçek ürünler sepet/checkout/mağaza vitrininde görünmüyor, satıcı kendi kataloğunu kendi mağazasında göremiyor, admin sahte satıcılar üzerinde işlem yapabiliyor. Ayrıca `productService.getProducts` hata durumunda sessizce mock'a düşerek Firestore hatalarını maskeliyor (ACC-03 ihlali).

Bu tasarım, mock ağını **5 transaksiyonel yüzeyden** ve onları besleyen servis fallback'lerinden söküp gerçek Firestore verisine bağlar.

## Kapsam

**Dahil (bu pass):**

- Cart, Checkout, SellerStore, AdminSellers, UserProfile (5 yüzey)
- Bu yüzeyleri besleyen servis katmanı fallback'leri
- Paylaşılan loading/error/empty durum bileşenleri

**Hariç (ayrı fazlar):**

- Home / ProductDetail / SearchResults öneri karüselleri
- searchService / moderationService / campaignService / botService mock'ları
- Stripe → ledger (`orders` vs `orderSets`/`subOrders`) kopukluğu
- Satıcı mağaza kategori yönetimi (yeni özellik)
- Admin global menü/mega-menü yönetimi (yeni özellik)

## Mimari — Üç Katman

### Katman 1 — Servis (gerçek okuma + sessiz fallback sökme)

**`src/services/productService.ts`**

- **Yeni** `getProductsByIds(ids: string[]): Promise<Product[]>`
  - Firestore `where(documentId(), 'in', chunk)` ile 10'lu chunk'larda toplu okuma; sonuçlar birleştirilir.
  - Yalnızca bulunan ürünleri döndürür. Eksik/geçersiz tespiti çağırana aittir: `missing = requestedIds − foundIds`.
  - Hata durumunda **fırlatır** (mock fallback yok).
- **Yeni** `getProductById(id: string): Promise<Product | null>` — tekil `getDoc`; bulunamazsa `null`.
- **Sök** `getProducts` içindeki `catch → MOCK_PRODUCTS` fallback (`productService.ts:101`) — hata artık fırlatılır; UI error+retry gösterir.

**Satıcı lookup (`src/services/userService.ts` — mevcut `sellers` okumaları burada, `:55/65/78/91`; yeni fonksiyonlar da buraya)**

- **Yeni** `getSellerBySlug(slug: string): Promise<Seller | null>` — `sellers` koleksiyonunda `where('slug','==',slug)`, `limit(1)`.
- **Teyit/yeni** `getSellerById(id: string): Promise<Seller | null>` — mevcut `doc(db,'sellers',id)` okumasını tekil, `null`-döndüren bir fonksiyona sar.

### Katman 2 — Paylaşılan Durum Bileşenleri (ACC-02 + ACC-03)

Phase 30 paylaşılan bileşen setine eklenir; 5 yüzeyde de aynı kullanılır:

- `<LoadingState />` — skeleton/spinner.
- `<ErrorState message onRetry />` — açık hata mesajı + "Yeniden dene" butonu. Retry, veri çekme fonksiyonunu yeniden çağırır.
- `<EmptyState title description />` — "henüz ürün yok" gibi boş sonuç; bu bir **hata değildir**, ayrı görünür.

Üç durum her yüzeyde net ayrılır: `loading` → `error` (fetch throw) → `empty` (fetch ok, 0 kayıt) → `data`.

### Katman 3 — 5 Yüzeyin Yeniden Bağlanması

**`src/pages/Cart.tsx`**

- `MOCK_PRODUCTS.find` → `getProductsByIds(items.map(i => i.productId))`.
- Dönmeyen `productId`'ler **geçersiz** işaretlenir: satırda "artık mevcut değil" rozeti, ara toplam/toplamdan çıkarılır, kullanıcı uyarılır (toast/banner).
- Loading/error/empty durumları paylaşılan bileşenlerle.
- `:276` öneri karüseli: `getProducts({ limit: 2 })` ile hızlı değiştirilir ki dosyadan `MOCK_PRODUCTS` import'u tamamen kalksın. _(Karar: kapsam dışı bırakmak yerine aynı dosyadaki son mock import'unu temizlemek için hızlı-swap yapılır.)_

**`src/pages/Checkout.tsx`**

- `MOCK_PRODUCTS.find` (`:185`) → `getProductsByIds`.
- Sepette geçersiz ürün varsa checkout **bloklanır**; kullanıcı sepete yönlendirilip düzeltmesi istenir.
- Sipariş kalemleri (`:398-406`) çözülen gerçek ürünlerden kurulur. Sunucu tarafı fiyat/stok doğrulaması (`validateCartStock`) zaten var; değişmez.

**`src/pages/SellerStore.tsx`**

- Satıcı: `getSellerBySlug(routeKey) ?? getSellerById(routeKey)`; `MOCK_SELLERS[0]` fallback (`:83`) **silinir**. Bulunamazsa 404/error state.
- Ürünler: `MOCK_PRODUCTS.filter` (`:211`) → `getProducts({ sellerId: sellerData.id })` (gerçek fonksiyon mevcut).
- Loading/error/empty durumları.

**`src/pages/AdminSellers.tsx`**

- `MOCK_SELLERS` fallback (`:35,84,87`) — boş sonuçta VE hatada — **silinir**.
- Boş → `<EmptyState>`; hata → `<ErrorState onRetry>`. (ACC-03 çekirdeği.)

**`src/pages/UserProfile.tsx`**

- Mock sipariş/wishlist okumaları gerçek servislere bağlanır (`orderService`, wishlist servisi zaten canlı — yalnızca profil bunları mock'tan alıyor).
- Not: Sadakat puanı hardcoded `0` (`:432`) bu pass'te **kapsam dışı** (backend gerektirir); değiştirilmez, ama takip için not düşülür.

**Mock dosyalarının karantinası**

- `src/data/mockProducts.ts`, `src/data/mockSellers.ts` **kalır** ama yalnızca `seedService` ve testler import edebilir.
- 5 yüzey + servis fallback'lerinden tüm `MOCK_PRODUCTS`/`MOCK_SELLERS` import'ları kaldırılır.
- (Opsiyonel guard) Bir ESLint no-restricted-imports kuralı veya yorum başlığı ile "runtime'dan import etme" niyeti belgelenebilir — zorunlu değil.

## Veri Akışı (örnek: Cart)

```
Cart mount
  → items (CartContext, sadece {productId, variantId, quantity})
  → getProductsByIds(productIds)         [Katman 1]
      ├─ throw  → <ErrorState onRetry>    [Katman 2]
      ├─ []     → <EmptyState>            [Katman 2]
      └─ found  → line items kurulur
                  missing = requested − found → "mevcut değil" işareti + toplamdan çıkar
  → render                                [Katman 3]
```

## Hata / Boş / Yükleniyor Sözleşmesi

| Durum        | Tetik                          | UI                                             |
| ------------ | ------------------------------ | ---------------------------------------------- |
| loading      | fetch beklemede                | `<LoadingState>`                               |
| error        | fetch throw (Firestore hatası) | `<ErrorState message onRetry>`                 |
| empty        | fetch ok, 0 kayıt              | `<EmptyState>`                                 |
| invalid item | sepette istenen ID dönmedi     | satır "mevcut değil" + toplamdan çıkar + uyarı |
| data         | fetch ok, ≥1 kayıt             | normal render                                  |

## Test Stratejisi

- **Servis birim testleri:** `getProductsByIds` (chunk>10, kısmi eksik, hata fırlatma), `getSellerBySlug` (bulunan/bulunamayan), `getProducts` fallback'inin kaldırıldığı (hata artık fırlatıyor) regresyon.
- **Bileşen testleri:** Cart/Checkout/SellerStore/AdminSellers — loading/error/empty/invalid-item dallarının her biri (RTL + jsdom, mevcut Vitest kurulumu).
- **Regresyon:** `grep -r "MOCK_PRODUCTS\|MOCK_SELLERS" src/pages src/services` — yalnızca seedService/test dışında sonuç kalmamalı (5 yüzey + fallback temiz).
- Testler mock veriyi karantinadaki dosyalardan import edebilir (kaldırılmıyor).

## Başarı Kriterleri (bu pass TRUE olmalı)

1. Sepete eklenen **gerçek** bir ürün Cart ve Checkout'ta doğru ad/fiyat/görselle görünür; sipariş gerçek üründen kurulur.
2. Satıcı kendi `/store/:slug` vitrininde envanterine eklediği gerçek ürünleri görür; `MOCK_SELLERS[0]` fallback yok.
3. AdminSellers gerçek satıcıları listeler; Firestore boşsa empty state, hata varsa error+retry gösterir — sahte satıcı yok.
4. `productService.getProducts` hata durumunda mock döndürmez; UI error+retry gösterir.
5. `src/pages` ve `src/services` içinde (seedService hariç) `MOCK_PRODUCTS`/`MOCK_SELLERS` runtime okuması kalmaz.
6. Loading/error/empty üç durumu paylaşılan bileşenlerle 5 yüzeyde tutarlı.
