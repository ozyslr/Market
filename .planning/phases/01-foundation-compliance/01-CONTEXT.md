# Phase 1: Foundation & Compliance - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Bu faz pazar yerinin omurgasını kurar: OrderSet/SubOrder sipariş veri modeli, server-side durum makinesi (transition matrix), kategori bazlı değişken komisyon motoru (specificity priority), append-only hash-chain immutable ledger, KVKK/GDPR uyum altyapısı (3-tier consent, veri silme akışı, 5 hukuki sayfa), ve strict per-collection Firestore security rules (3 rol: admin/seller/buyer + sellerId custom claims). Kullanıcıya görünen UI değil, sistemin teknik temelidir.
</domain>

<decisions>
## Implementation Decisions

### Order Data Model & State Machine

- **D-01:** OrderSet + SubOrder yapısı — tek siparişte birden fazla satıcı varsa otomatik seller başına SubOrder oluşturulur. OrderSet: userId, totalAmount, currency, paymentMethod, paymentStatus. SubOrder: sellerId, items[], subtotal, commission, status, tracking, carrier. İlk aşamada per-seller checkout (tek sepette tek satıcı), multi-seller checkout P2'ye ertelendi.
- **D-02:** Durum makinesi server-side enforced — Express route seviyesinde transition matrix ile. İzinli geçişler: pending → paid → processing → shipped → delivered. İptal sadece shipped öncesi. İade sadece delivered sonrası. Optimistic concurrency (version field) ile race condition koruması.
- **D-03:** Immutable ledger — Firestore'da append-only collection. Her kayıt: transaction ID, önceki kaydın hash'i (SHA-256), timestamp, işlem tipi (commission/payout/refund), tutar. Firestore security rules: sadece create (okuma serbest), update/delete yok. Hash zinciri ile bütünlük doğrulaması.

### Commission Engine

- **D-04:** Specificity priority sıralaması: 1) Satıcıya özel oran (varsa), 2) Kategori varsayılanı, 3) Global varsayılan (%10). Her zaman en spesifik olan kazanır.
- **D-05:** Önerilen kategori oranları: Elektronik %5, Giyim %10, Ev & Yaşam %12, Kozmetik %15, Mücevher %8. Min komisyon: 5 TL, Max: 500 TL. Tüm oranlar ve limitler admin panelden düzenlenebilir.
- **D-06:** Satıcı payout T+7 — teslimattan 7 gün sonra otomatik. Cloud Function (Firestore onWrite trigger) ile tetiklenir. İade penceresi kapandıktan sonra. Manuel override admin panelden mümkün.

### KVKK/GDPR Compliance

- **D-07:** 3-tier granular cookie consent: Zorunlu (her zaman açık), Analitik (opsiyonel), Pazarlama (opsiyonel). Tercihler localStorage'da 6 ay geçerli. GDPR: EU kullanıcıları için ret = default (opt-in). KVKK: TR kullanıcıları için implicit consent + opt-out.
- **D-08:** Veri silme talebi: Kullanıcı profilinden "Verilerimi Sil" butonu → admin onay kuyruğu → onaylanınca Firestore'dan PII silinir, siparişler anonimleştirilir (userId kaldırılır, sipariş verisi korunur).
- **D-09:** 5 hukuki sayfa oluşturulacak: Gizlilik Politikası, Kullanıcı Sözleşmesi, KVKK Aydınlatma Metni, Çerez Politikası, VERBIS bilgisi. Tüm içerikler admin CMS'den düzenlenebilir olacak.

### Security Rules

- **D-10:** Strict per-collection Firestore security rules. Her koleksiyon için explicit allow/deny. Auth kontrolü her okuma/yazmada. Satıcı sadece kendi verisine (sellerId eşleşmesi) erişir. Admin her şeye erişir.
- **D-11:** 3 rol custom claims: `{ role: 'admin' | 'seller' | 'buyer', sellerId?: string }`. Seller rolünde sellerId varsa sadece kendi ürün/sipariş/komisyon verilerine yazar. Admin rolü tüm koleksiyonlara tam erişim. Buyer rolü sadece kendi profil ve sipariş verilerine okuma/yazma.
- **D-12:** Mevcut hardcoded admin kontrolü (`ozyslr@gmail.com`) custom claims'e taşınacak. Admin kullanıcıları Firebase Admin SDK ile claim atanır.

### Claude's Discretion

- Hash zinciri için SHA-256 algoritma seçimi
- Firestore security rules'un tam syntax'ı ve test kapsamı
- Cookie consent banner'ın UI tasarımı ve animasyonu
- Hukuki sayfaların tam metin içeriği (şablonlar kullanılacak, hukukçu onayı gerekecek)
- Transition matrix'in implementasyon detayı (TypeScript enum + guard fonksiyonları)
  </decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Stack

- `.planning/codebase/ARCHITECTURE.md` — Mevcut mimari, provider hierarchy, data flow
- `.planning/codebase/STACK.md` — Kullanılan teknolojiler, versiyonlar, Firebase/Firestore detayları
- `.planning/codebase/INTEGRATIONS.md` — Stripe, Iyzico, Firebase Auth entegrasyon detayları
- `.planning/codebase/CONCERNS.md` — Bilinen güvenlik açıkları, eksik test kapsamı, mimari sorunlar

### Project & Requirements

- `.planning/PROJECT.md` — Proje context, constraints, key decisions
- `.planning/REQUIREMENTS.md` — ORD-01,02,06 / COM-01,02,03 / CMP-01→06 gereksinim detayları
- `.planning/ROADMAP.md` §Phase 1 — Faz hedefi ve başarı kriterleri

### Research

- `.planning/research/ARCHITECTURE.md` — OrderSet/SubOrder pattern, state machine, commission engine
- `.planning/research/PITFALLS.md` — Firestore cost explosion, commission math, KVKK criminal liability
- `.planning/research/FEATURES.md` — Table stakes vs differentiators

### Existing Code

- `src/types/order.ts` — Mevcut Order tipi (flat yapı, geliştirilecek)
- `src/services/orderService.ts` — Mevcut sipariş servisi (real-time subscription pattern)
- `src/services/commissionService.ts` — Mevcut komisyon yapısı (CommissionRule, CommissionTransaction)
- `src/lib/authMiddleware.ts` — Auth middleware pattern (verifyFirebaseToken, verifyAdmin)
- `src/lib/firebase.ts` — Firestore client init ve hata yönetimi (FirestoreError)
  </canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`src/services/orderService.ts`**: Firestore onSnapshot + unsubscribe pattern — SubOrder subscription'ları aynı pattern ile yazılabilir
- **`src/services/commissionService.ts`**: `CommissionRule` ve `CommissionTransaction` tipleri mevcut — specificity logic ve immutable ledger için genişletilecek
- **`src/lib/authMiddleware.ts`**: `verifyFirebaseToken` + `verifyAdmin` Express middleware'leri — custom claims kontrolü için genişletilecek (`verifySeller` middleware eklenecek)
- **`src/types/order.ts`**: `OrderStatus`, `OrderItem`, `ShippingAddress` tipleri — `OrderSet` ve `SubOrder` için genişletilecek
- **`src/lib/firebase.ts`**: `FirestoreError` class + `handleFirestoreError` — commission/ledger servislerinde kullanılacak

### Established Patterns

- **Co-located `__tests__/` directories**: `src/services/__tests__/` — tüm yeni servisler aynı pattern ile test edilecek
- **React Context state management**: Provider + useXxx() hook pattern — yeni veri gerekiyorsa mevcut context'lere eklenir
- **Server-side Zod validation (`server/lib/`)**: `validate(schema)` middleware — transition matrix validation için kullanılacak

### Integration Points

- **Firebase Admin SDK** (`src/lib/firebase-admin.ts`): Custom claims ataması admin panelden/admin route'tan yapılacak
- **Express route mount** (`server.ts`): Yeni commission/ledger route'ları mevcut route yapısına eklenecek
- **App.tsx providers**: CookieConsent provider en dış katmana (AuthProvider öncesi) eklenecek
- **Admin CMS**: Hukuki sayfalar mevcut CMS altyapısına (`src/pages/AdminCMS.tsx`) eklenecek
  </code_context>

<specifics>
## Specific Ideas

- OrderSet/SubOrder yapısı için referans: commercetools Order + LineItem pattern, MercurJS OrderGroup
- Commission engine: Stripe Connect application_fee_amount + transfer benzeri, ama Iyzico marketplace API ile uyumlu olmalı
- KVKK/GDPR çift akış: EU kullanıcıları GDPR (opt-in default), TR kullanıcıları KVKK (opt-out default). IP/teslimat adresi bazlı otomatik tespit.
- Transition matrix: Standart FSM pattern — her state'ten hangi state'lere geçilebileceğini tanımlayan bir map + optimistic lock (Firestore `version` field)
  </specifics>

<deferred>
## Deferred Ideas

- Multi-seller checkout (tek sepet, çok satıcı) — P2, OrderSet/SubOrder modeli buna hazır olacak
- Veriff otomatik KYC entegrasyonu — Şimdilik manuel KYC (faz 3'te), Veriff scale aşamasında
- KVKK VERBIS kayıt süreci — Teknik değil hukuki süreç, hukuk danışmanı ile yürütülecek
- CSP (Content-Security-Policy) header customization — Faz 1 security hardening kapsamında değerlendirilebilir
- Rate limiting genişletme — Webhook ve static serving endpoint'leri için, şimdilik mevcut `/api/` rate-limit yeterli

None — discussion stayed within phase scope
</deferred>

---

_Phase: 1-Foundation & Compliance_
_Context gathered: 2026-06-02_
