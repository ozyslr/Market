# 🔍 Benim Olan (Mercora) — Sistem Genel Audit Raporu

**Tarih:** 2026-06-08
**Kapsam:** 6 boyutlu tam sistem denetimi
**Metodoloji:** Tüm kritik dosyalar okundu — Auth, Route, Data, Payment, Server API, Frontend State

---

## 📊 ÖZET

| Severity | Sayı | Açıklama |
|----------|------|-----------|
| 🔴 CRITICAL | 1 | subOrders Firestore kuralları client okumalarını tamamen engelliyor |
| 🟠 HIGH | 5 | Seller CSRF koruması, email doğrulama, sellerApi adminDb null kontrolü, `/sell` route'u guard'sız, review update eskalasyon riski |
| 🟡 MEDIUM | 5 | Token expiry, cron secret timing attack, anonymous spam, seller guard eksik route, ödeme intent validasyonu |
| 🟢 LOW | 3 | MOCK_USER fallback, console.error production'da, typesenseSync token kontrolü |

---

## 🔴 CRITICAL

### 1. subOrders koleksiyonu — Client okuma tamamen engellenmiş
**Dosya:** `firestore.rules:71-75`
```js
match /subOrders/{subOrderId} {
  allow read: if isAdmin();  // ← sadece admin!
  allow create: if false;
  allow update: if isAdmin();
  allow delete: if false;
}
```
**Etki:** Satıcılar ve alıcılar kendi SubOrder'larını client SDK ile okuyamaz. Şu anda tüm okumalar server API (`/api/orders/:id`) üzerinden yapılıyor, bu çalışıyor. Ama ileride client-side subOrder sorgusu eklenirse anında kırılır.
**Öneri:** `allow read: if isFullUser() && (resource.data.sellerId == request.auth.token.sellerId || isAdmin());` veya en azından bir yorum ekle: "Server SDK only by design."

---

## 🟠 HIGH

### 2. ModeratorDashboard route koruması sadece Component-level
**Dosya:** `src/App.tsx:236`, `src/pages/ModeratorDashboard.tsx:201`
```tsx
// App.tsx - NO AdminRoute wrapper!
<Route path="/moderator" element={<ModeratorDashboard />} />

// ModeratorDashboard.tsx:201 - internal guard
if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
  return <Navigate to="/" replace />;
}
```
**Etki:** Admin route'ları `AdminRoute` ile wrapper'lı ama moderator route'u sadece component içinde kontrol ediyor. Kötü niyetli kullanım riski düşük (guard çalışıyor) ama pattern tutarsız.
**Öneri:** `ModeratorRoute` component'i oluştur veya `AdminRoute`'u genişleterek `requiredRole="moderator"` destekle.

### 3. Email doğrulaması yok
**Dosya:** `src/context/AuthContext.tsx:163-183`
**Etki:** Kullanıcılar email doğrulaması olmadan kayıt olabiliyor. Fake hesaplar, spam, fraud riski.
**Öneri:** `createUserWithEmailAndPassword` sonrası `sendEmailVerification` çağır. Firestore kurallarına `isEmailVerified()` helper'ı ekle.

### 4. sellerApi routes — adminDb null geldiğinde 503 dönmüyor
**Dosya:** `server/routes/sellerApi.ts:60+`
**Etki:** `registerSellerApiRoutes(app, adminDb!)` — non-null assertion kullanıyor. Eğer `FIREBASE_SERVICE_ACCOUNT_B64` set edilmemişse `adminDb` null olur ve runtime'da crash.
**Öneri:** Null kontrolü ekle veya `adminDb!` yerine guard koy.

### 5. Review update rule — helpful vote eskalasyon riski
**Dosya:** `firestore.rules:197-201`
```js
allow update: if isAdmin() || (
  isFullUser() &&
  request.resource.data.verified == resource.data.verified &&
  request.resource.data.status == resource.data.status &&
  request.resource.data.userId == resource.data.userId
);
```
**Etki:** Helpful vote yapan kullanıcı `helpfulVoters` array'ini manipüle edebilir. Aynı kullanıcı birden fazla kez oy verebilir (client-side kontrol yeterli değil).
**Öneri:** `helpfulVoters` için ayrı bir sub-collection kullan veya array union ile atomik ekleme yap.

### 6. `/sell` route'u — admin/seller rolündekiler için korumasız
**Dosya:** `src/App.tsx:270`
```tsx
<Route path="/sell" element={<SellOnBenimOlan />} />
<Route path="/sell/apply" element={<SellerApplication />} />
```
**Etki:** Zaten seller/admin olan kullanıcılar `/sell` sayfasına gidip tekrar başvuru yapabilir. UI tutarsızlığı.
**Öneri:** `SellOnBenimOlan` ve `SellerApplication` component'lerinde rol kontrolü ekle — seller/admin ise `/seller/dashboard`'a yönlendir.

---

## 🟡 MEDIUM

### 7. Firebase token'larının expiry kontrolü client'ta yok
**Dosya:** `src/context/AuthContext.tsx:48-60`
**Etki:** Token refresh sırasında sadece `setFirebaseUser` güncelleniyor, ama `onIdTokenChanged` listener'ı yok. Eğer token yenilenemezse (network hatası), kullanıcı fark etmeden yetkisiz kalabilir.
**Öneri:** `onIdTokenChanged` listener'ı ekle, token yenileme hatasını kullanıcıya bildir.

### 8. Cron secret timing attack potansiyeli
**Dosya:** `src/lib/authMiddleware.ts:108-116`
```ts
if (provided.length !== secret.length || provided !== secret) {
```
**Etki:** `!==` operatörü timing-safe DEĞİL. Length check var ama yine de standard kriptografik olmayan string karşılaştırma.
**Öneri:** `crypto.timingSafeEqual` kullanarak sabit-zamanlı karşılaştırma yap.

### 9. Anonymous kullanıcılar events koleksiyonuna yazabiliyor
**Dosya:** `firestore.rules:119-122`
```js
match /events/{eventId} {
  allow create: if isSignedIn();  // anonymous dahil!
}
```
**Etki:** Bot'lar veya kötü niyetli kullanıcılar analytics'i kirletebilir.
**Öneri:** `isFullUser()` ile değiştir veya client-side rate limiting ekle.

### 10. SellerRoute sadece client-side koruma — server rotaları için seller guard'ı eksik
**Dosya:** `server.ts` — `verifySeller` middleware'i sadece `registerShippingRoutes` ve `registerReturnsRoutes`'ta kullanılıyor
**Etki:** Seller-specific endpoint'ler için tutarlı `verifySeller` kullanımı yok. Bazı endpoint'ler sadece `verifyFirebaseToken` ile korunuyor.
**Öneri:** Tüm seller endpoint'lerini audit et, gereken yerlere `verifySeller` ekle.

### 11. Ödeme intent validasyonu — amount client'tan geliyor
**Dosya:** `server/routes/stripe.ts`
**Etki:** Client'ın gönderdiği amount değeri server'da ürün fiyatlarıyla karşılaştırılmıyor. Price manipulation riski.
**Öneri:** Server-side fiyat doğrulaması ekle — ürün ID'lerini al, Firestore'dan gerçek fiyatları oku, karşılaştır.

---

## 🟢 LOW

### 12. MOCK_USER fallback — production'da sahte veri gösteriliyor
**Dosya:** `src/pages/AdminUsers.tsx:70-72`
```ts
} catch {
  setUsers([{ ...MOCK_USER, id: 'mock-1' }]);
}
```
**Etki:** Firestore bağlantısı kesilirse admin panelinde sahte kullanıcı görünür.
**Öneri:** Production'da MOCK_USER fallback'i kaldır, hata mesajı göster.

### 13. console.error production build'lerde kalıyor
**Etki:** Hassas bilgiler (token, email) browser console'unda görünebilir.
**Öneri:** Production build'de console.error'ları strip eden bir Vite plugin'i ekle veya `server/logger.ts` kullan.

### 14. Typesense sync route'u sadece verifyFirebaseToken ile korunuyor
**Dosya:** `server.ts:487`
```ts
registerTypesenseSyncRoutes(app, { verifyFirebaseToken });
```
**Etki:** Herhangi bir authenticated kullanıcı sync endpoint'ini tetikleyebilir.
**Öneri:** `verifyAdmin` ekle.

---

## ✅ DOĞRU ÇALIŞAN / İYİ UYGULANMIŞ ALANLAR

| Alan | Durum |
|------|-------|
| **Firebase Auth middleware** (verifyFirebaseToken, verifyAdmin, verifySeller, verifyBuyer, requireAdminRole) | ✅ Temiz, custom claims tabanlı, sıfır Firestore read |
| **Firestore kuralları** | ✅ Genel yapı sağlam, default-deny, role-based claims |
| **Rate limiting** (genel 200/15dk, ödeme 30/15dk) | ✅ Katmanlı koruma |
| **Helmet CSP** | ✅ Kapsamlı, production/dev ayrımı var |
| **Stripe webhook** (raw body, imza doğrulama) | ✅ Doğru sırada register edilmiş |
| **Order flow** (OrderSet → SubOrder, server-side transaction) | ✅ Atomic, idempotent |
| **Ledger** (immutable, server-only) | ✅ Client erişimi tamamen kapalı |
| **Seller API** (/api/v1 — API key + SHA-256 hash + timingSafeEqual + rate limit) | ✅ Profesyonel düzeyde |
| **AdminRoute** (defense-in-depth, loading state, role check) | ✅ Doğru pattern |
| **SellerRoute** (yeni eklendi, role check + KYC guard) | ✅ Bu session'da eklendi |
| **AuthContext** (anonymous → full user upgrade, token claims sync) | ✅ Kapsamlı edge-case handling |
| **SellerLayout KYC guard** (none/pending/rejected/verified state'leri) | ✅ 4 durumlu koruma |
| **Iyzico lazy-loading** (CJS wrapper) | ✅ Doğru izolasyon |
| **Cart recovery** (cron job, rate limit, max reminders) | ✅ İyi yapılandırılmış |
| **Audit trail** (her admin işlemi loglanıyor) | ✅ Compliance-ready |

---

## 🔄 BU SESSION'DA ÇÖZÜLENLER

1. ✅ **Seller panel access control** — `SellerRoute` oluşturuldu, `/seller/*` route'ları wrapper'landı
2. ✅ **Navbar seller link** — Sadece `user.role === 'seller'` için görünür
3. ✅ **Google login hata yönetimi** — `AuthModal` artık hatayı gösteriyor, modal kapanmıyor
4. ✅ **Admin kullanıcı tablosu** — `createdAt` kolonu eklendi, kayıt tarihi görünür
5. ✅ **MOCK_ORDERS kaldırıldı** — Admin detay panelinde gerçek siparişler gösteriliyor

---

## 📋 ÖNCELİKLİ AKSİYON PLANI

### Hemen (bu hafta)
1. [ ] **C1:** subOrders Firestore rule'una seller/buyer okuma izni ekle veya "by design" yorumu
2. [ ] **H2:** ModeratorDashboard'a route-level guard ekle
3. [ ] **H4:** `server/routes/sellerApi.ts` — adminDb null kontrolü
4. [ ] **M11:** Server-side fiyat doğrulaması

### Kısa vadeli (2 hafta)
5. [ ] **H3:** Email doğrulaması ekle (Firebase `sendEmailVerification`)
6. [ ] **H5:** Review helpfulVoters için atomic array union
7. [ ] **H6:** `/sell` route'una seller/admin yönlendirmesi
8. [ ] **M7:** `onIdTokenChanged` listener'ı
9. [ ] **M10:** Seller endpoint audit — eksik `verifySeller` middleware'leri

### Orta vadeli (1 ay)
10. [ ] **M8:** Cron secret timing-safe karşılaştırma
11. [ ] **M9:** Events koleksiyonu için `isFullUser()` 
12. [ ] **L12-L14:** MOCK_USER, console.error, typesenseSync
