# Phase 3: Seller Onboarding & KYC - Context

**Gathered:** 2026-06-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Bu faz, satıcıların bağımsız olarak kayıt olup kimliklerini doğrulayabildiği (KYC), onaylandıklarında bölgeye göre ödeme hesabı (TR → Iyzico sub-merchant, EU → Stripe Connect) provisyonlanan, ve kendi mağaza + ürünlerini yönetebildiği tam akışı canlıya hazır hale getirir.

**Önemli:** UI scaffolding'in büyük kısmı zaten mevcut (`SellerApplication.tsx`, `AdminSellers.tsx`, `AdminSellerView.tsx`, `SellerStore.tsx`, `SellerInventory.tsx`, `SellerImportCenter.tsx`, `SellerApiKeys.tsx` + `sellerApi.ts`). Bu faz greenfield değil — **mevcut scaffolding'i tamamlama ve sertleştirme (harden)** fazıdır. Kapsam: KYC doğrulama + güvenli belge saklama, onayda ödeme hesabı oluşturma, mağaza yönetimi, ürün yönetimi (min 1 foto + zorunlu kategori), CSV içe/dışa aktarma, ve REST API güvenlik sertleştirmesi.

**Scope sınırı:** ROADMAP §Phase 3, SEL-01→06. Arama, kargo, çoklu para birimi sonraki fazlar.
</domain>

<decisions>
## Implementation Decisions

### Payment Account on KYC Approval

- **D-01:** **Region-based provisyonlama.** TR satıcılar → Iyzico sub-merchant; EU satıcılar → Stripe Connect. Roadmap kriter #1 (Stripe Connect on approval) literal olarak karşılanıyor. Bu, Faz 2'nin "Stripe deferred" kararını bu faz için genişletir — Stripe Connect onboarding artık bu fazın kapsamındadır. Tüm provisyonlama `IPaymentProvider` interface'i (Faz 2 D-02) arkasından yapılır.
- **D-02:** **EU → Stripe Express (hosted onboarding).** Onayda Express account oluşturulur, EU satıcı Stripe'ın hosted onboarding'ine yönlendirilir (banka + kimlik). EU KYC/AML yükü Stripe'ta. Bizde sadece `accountId` + `payouts_enabled` durumu `account.updated` webhook'u ile saklanır. Custom account (white-label, AML yükü bizde) reddedildi.
- **D-03:** **TR → Iyzico sub-merchant, admin onayında oluşturulur.** Manuel KYC incelemesi gate'tir; `iyzico.createSubMerchant()` yalnızca admin "approve" tıkladıktan sonra çağrılır. Mevcut approve/reject akışı korunur. Onaya kadar satıcı listeleyemez/satamaz.

### KYC Verification & Document Security

- **D-04:** **Özel bucket + signed URL.** KYC belgeleri (kimlik, vergi levhası, banka/IBAN) yalnızca adminlerin Firestore rules ile okuyabildiği özel Storage path'ine taşınır (`kyc/{sellerId}/{docId}`). Admin panel kısa ömürlü (≈5 dk) signed URL ile görüntüler. Mevcut public URL modeli terk edilir — bu PII, Faz 1 KVKK/GDPR duruşuyla uyumlu olmalı. Belgeler GDPR/KVKK silme talebinde silinebilir olmalı.
- **D-05:** **Otomatik kimlik doğrulama eklenir — Stripe Identity (tüm satıcılar, TR dahil).** Yükleme sonrası `verification_session` ile doc + selfie eşleşmesi; sonuç webhook ile alınır, ardından admin manuel olarak onaylar (otomatik check admin yargısını değiştirmez, güçlendirir). Stripe zaten EU Connect için entegre edildiğinden tek vendor, tutarlı SDK. TR-local KYC vendor karşılaştırması yapılmadı — Stripe Identity seçildi.
- **D-06:** **Zorunlu belgeler: kimlik + vergi levhası + banka/IBAN.** Üçü de yüklenmeden "approve" butonu devre dışı. Roadmap kriter #1 ile birebir.

### CSV Import Behavior

- **D-07:** **Partial import + hata raporu.** Geçerli satırlar import edilir, geçersizler atlanır; her başarısız satır için indirilebilir hata raporu (satır no, alan, sebep) döner. Satıcı sadece hatalı satırları düzeltip yeniden yükler. All-or-nothing reddedildi.
- **D-08:** **Görseller CSV'de URL olarak.** `image_url` sütunu (çoklu için pipe-separated); importer fetch edip Storage'a alır. "Minimum 1 foto" kuralı URL sütunu ile enforce edilir. SKU↔görsel ZIP eşleştirme akışı sonraki geliştirmeye ertelendi.
- **D-09:** **Kategori mevcut taksonomiye karşı valide edilir.** CSV kategori sütunu mevcut platform kategorisiyle (slug/isim) eşleşmeli; bilinmeyen kategori satırı net hatayla başarısız olur ("no such category"). Komisyon doğruluğunu korur (kategori-bazlı komisyon). Closest-match önerisi opsiyonel iyileştirme.

### Harden-Existing (best-practice, Claude's Discretion)

- **D-10:** **Seller REST API güvenlik sertleştirmesi.** Mevcut `sellerApi.ts` zayıf, kriptografik olmayan custom hash (`(h<<5)-h+charCodeAt`) kullanıyor → kriptografik güç hash'e geçilir (SHA-256, sabit-zaman karşılaştırma; key prefix `bo_` korunur). In-memory `Map` rate limiting (restart'ta sıfırlanır, ölçeklenmez) → kalıcı/paylaşımlı store (Firestore veya mevcut express-rate-limit altyapısı). Dosyadaki encoding bozulması (mojibake Türkçe karakterler) UTF-8'e düzeltilir.
- **D-11:** **Mağaza sayfası & ürün yönetimi mevcut bileşenler sertleştirilerek tamamlanır.** `SellerStore.tsx` (logo, banner, hakkında, paylaşılabilir slug URL), `SellerInventory.tsx` (ekle/düzenle/stok/fiyat). Ürün validasyonu: min 1 foto + zorunlu kategori hem client hem **server** tarafında enforce edilir.

### Claude's Discretion

- Stripe Identity verification_session UX detayları ve webhook event işleme
- API key hash algoritması detayı (SHA-256 vs HMAC) ve persistent rate-limit store seçimi
- CSV hata raporu tam format detayı, dosya boyutu limiti, export sütun seti
- Signed URL TTL süresi (≈5 dk önerildi)
- Closest-category önerisinin eklenip eklenmeyeceği
- Mağaza paylaşılabilir URL slug yapısı (custom domain ertelendi)
  </decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Seller/KYC/API Code (MUST READ — harden these)

- `src/services/sellerApplicationService.ts` — Mevcut KYC başvuru servisi; `SellerApplication` tipi, `kycDocuments`, status pending/approved/rejected, `adminNote`
- `src/pages/SellerApplication.tsx` — KYC onboarding formu (mevcut)
- `src/pages/AdminSellers.tsx` + `src/pages/AdminSellerView.tsx` — Admin KYC inceleme/onay/red paneli (mevcut)
- `src/pages/SellerStore.tsx` — Satıcı mağaza yönetimi (mevcut)
- `src/pages/SellerInventory.tsx` — Ürün yönetimi (mevcut)
- `src/pages/SellerImportCenter.tsx` — CSV içe/dışa aktarma (mevcut)
- `src/pages/SellerApiKeys.tsx` + `src/services/apiKeyService.ts` — API key yönetimi (mevcut)
- `server/routes/sellerApi.ts` — `/api/v1` REST API; **zayıf hash + in-memory rate limit + encoding bug — sertleştirilecek**
- `src/services/productService.ts` — Ürün CRUD; CSV import ve validasyon buraya bağlanır

### Payment Provider Integration (Faz 2 Deliverables)

- `.planning/phases/02-payment-order-lifecycle/02-CONTEXT.md` — Faz 2 kararları: IPaymentProvider interface (D-02), Iyzico-first, escrow
- `server/routes/iyzico.ts` — Iyzico marketplace; sub-merchant oluşturma buraya eklenir
- `server/routes/stripe.ts` — Mevcut Stripe endpoint'leri; Stripe Connect (Express) + Identity buraya eklenir
- `server/iyzico.cjs` — Iyzico SDK CJS wrapper
- `server/services/ledgerService.ts` — Faz 1 immutable ledger (payout hesabı bağlanır)

### Architecture & Stack

- `.planning/codebase/ARCHITECTURE.md` — Mimari overview
- `.planning/codebase/INTEGRATIONS.md` — Stripe, Iyzico entegrasyon detayları
- `.planning/codebase/STACK.md` — Teknoloji stack (papaparse mevcut, CSV için)
- `.planning/codebase/CONCERNS.md` — Bilinen sorunlar (server-side payment route'ları test edilmemiş)
- `.planning/codebase/CONVENTIONS.md` — Kod konvansiyonları

### Project & Requirements

- `.planning/PROJECT.md` — Proje context, constraints (solo dev, TR+EU, Stripe+Iyzico)
- `.planning/REQUIREMENTS.md` — SEL-01→06
- `.planning/ROADMAP.md` §Phase 3 — Faz hedefi ve 6 başarı kriteri

### External Vendor Docs (researcher to fetch)

- Stripe Connect (Express accounts) — hosted onboarding, account.updated webhook, payouts_enabled
- Stripe Identity — verification_session, doc+selfie, webhook events
- Iyzico subMerchant API — createSubMerchant, IBAN/taxId gereksinimleri
  </canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`sellerApplicationService.ts`**: `SellerApplication` tipi + `submitApplication` zaten `kycDocuments` modelliyor — özel bucket + signed URL'e ve zorunlu 3 belge enforcement'ına genişletilecek
- **`AdminSellerView.tsx` / `AdminSellers.tsx`**: Approve/reject + `adminNote` (rejection reason) zaten var — onayda payment account provisyonlama tetiği eklenecek
- **`sellerApi.ts`**: `/api/v1/products`, inventory, orders endpoint'leri + permission/rate-limit iskeleti mevcut — hash + rate-limit + encoding sertleştirilecek
- **`apiKeyService.ts`**: `ApiKeyPermission` scope modeli (products/orders/inventory/pricing read/write) mevcut
- **papaparse 5.5.3**: CSV parse için bağımlılık zaten kurulu
- **Faz 2 `IPaymentProvider`**: Provider abstraction — Iyzico sub-merchant ve Stripe Connect provisyonlama bunun arkasından

### Established Patterns

- **Server-side Zod validation**: `server/lib/validate.ts` + `schemas.ts` (`createProductSchema`, `bulkStockUpdateSchema`) — ürün ve CSV satır validasyonu için
- **Express route modules**: `server/routes/` pattern — sub-merchant/connect/identity route'ları burada
- **Firestore service pattern**: `try/catch` + `handleFirestoreError` re-throw — yeni servisler aynı pattern
- **notifyAdmins**: Başvuru bildirimi zaten bağlı

### Integration Points

- **KYC approval → payment provider**: `AdminSellerView` approve action → region check → Iyzico sub-merchant veya Stripe Express account creation
- **Stripe webhooks**: `account.updated` (Connect payouts_enabled) + Identity verification webhook'ları `server/routes/stripe.ts`'e eklenir
- **CSV import → productService**: Parse + validasyon + partial import + Storage görsel fetch
- **Firestore Storage rules**: KYC private path için admin-only read rule (Faz 1 rules hardening üzerine)
  </code_context>

<specifics>
## Specific Ideas

- KYC belge bucket yapısı: `kyc/{sellerId}/{docId}`, admin-only read, ≈5 dk signed URL
- Stripe Express: onayda account oluştur → satıcıyı hosted onboarding'e yönlendir → `payouts_enabled` webhook ile takip
- Stripe Identity akışı: upload → auto ID check (doc+selfie) → webhook → admin confirm
- CSV partial import çıktısı: "100 satır: 92 import, 8 atlandı" + errors.csv (row#, field, reason)
- CSV image_url sütunu pipe-separated çoklu görsel; min 1 zorunlu
- API key: `bo_` prefix korunur, kriptografik hash + sabit-zaman karşılaştırma
  </specifics>

<deferred>
## Deferred Ideas

- SKU↔görsel ZIP eşleştirme ile toplu görsel yükleme — sonraki geliştirme (CSV image_url bu fazda)
- Closest-category öneri motoru — opsiyonel iyileştirme (sadece katı validasyon bu fazda)
- TR-local KYC/MASAK vendor karşılaştırması — Stripe Identity seçildi; alternatif gerekirse ileride
- Stripe Custom Connect account (white-label) — Express seçildi; white-label gerekirse ileride
- Custom domain mağaza URL'leri — paylaşılabilir slug bu fazda, custom domain ertelendi
- Ürün varyant desteği derinliği — temel ürün yönetimi bu fazda

None — discussion stayed within Phase 3 seller-onboarding scope
</deferred>

---

_Phase: 3-Seller Onboarding & KYC_
_Context gathered: 2026-06-03_
