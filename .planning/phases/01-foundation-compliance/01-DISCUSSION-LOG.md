# Phase 1: Foundation & Compliance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-02
**Phase:** 1-Foundation & Compliance
**Areas discussed:** Order & State Machine, Commission Engine, KVKK/GDPR Compliance, Security Rules

---

## Order & State Machine

### Order Data Model

| Option                    | Description                                                                                                   | Selected |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | -------- |
| Auto-split by seller      | Tek siparişte birden fazla satıcı varsa otomatik seller başına SubOrder. Her SubOrder kendi durumunu yönetir. | ✓        |
| Per-seller checkout first | Per-seller checkout (tek sepette tek satıcı), model kur ama multi-seller P2'ye                                |          |
| Keep flat structure       | Var olan flat Order yapısını koru                                                                             |          |

**User's choice:** Auto-split by seller (Recommended)
**Notes:** OrderSet + SubOrder yapısı per-seller checkout ile başlayacak, multi-seller checkout daha sonra.

### State Machine Enforcement

| Option                   | Description                                                                   | Selected |
| ------------------------ | ----------------------------------------------------------------------------- | -------- |
| Server-side enforced     | Express route seviyesinde transition matrix, izinli geçişler explicit tanımlı | ✓        |
| Firestore rules enforced | Security rules ile yazma anında kontrol                                       |          |
| Client-side + types only | UI kontrolleri + TypeScript tip sistemi                                       |          |

**User's choice:** Server-side enforced (Recommended)
**Notes:** Optimistic concurrency (version field) ile race condition koruması eklenecek.

### Immutable Ledger Design

| Option                     | Description                                                       | Selected |
| -------------------------- | ----------------------------------------------------------------- | -------- |
| Append-only + hash chain   | Firestore'da append-only, her kayıtta önceki hash, SHA-256 zincir | ✓        |
| Append-only, no hash chain | Daha basit, hash zinciri yok                                      |          |
| Audit log approach         | Var olan commissionTransactions + audit log                       |          |

**User's choice:** Append-only + hash chain (Recommended)
**Notes:** Security rules: sadece create izni, update/delete yok.

---

## Commission Engine

### Rate Priority

| Option                         | Description                                       | Selected |
| ------------------------------ | ------------------------------------------------- | -------- |
| Specificity priority           | Satıcı override > kategori > global default (%10) | ✓        |
| Category-only, manual override | Tüm satıcılar aynı kategori oranları              |          |
| Flat per-seller rate           | Her satıcıya tek sabit oran                       |          |

**User's choice:** Specificity priority (Recommended)
**Notes:** En spesifik olan her zaman kazanır.

### Commission Ranges

| Option                        | Description                                                                                                     | Selected |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| Suggested defaults (editable) | Elektronik %5, Giyim %10, Ev %12, Kozmetik %15, Mücevher %8. Min 5TL, Max 500TL. Admin panelden düzenlenebilir. | ✓        |
| Flat 10%, adjust later        | Tüm kategoriler %10 başlangıç                                                                                   |          |
| Fully dynamic from admin      | Her kategori ve satıcı için dinamik                                                                             |          |

**User's choice:** Suggested defaults (editable)

### Payout Timing

| Option                 | Description                                                      | Selected |
| ---------------------- | ---------------------------------------------------------------- | -------- |
| T+7 after delivery     | Teslimattan 7 gün sonra otomatik payout, Cloud Function tetikler | ✓        |
| T+14 after delivery    | Daha güvenli, uzun iade penceresi                                |          |
| Manual payout approval | Admin manuel onayı                                               |          |

**User's choice:** T+7 after delivery (Recommended)

---

## KVKK/GDPR Compliance

### Cookie Consent

| Option                  | Description                                                                 | Selected |
| ----------------------- | --------------------------------------------------------------------------- | -------- |
| 3-tier granular consent | Zorunlu + Analitik + Pazarlama. EU: opt-in, TR: opt-out. 6 ay localStorage. | ✓        |
| Simple accept/reject    | Tek onay düğmesi                                                            |          |
| Notice-only banner      | Sadece bilgilendirme, tercih saklanmaz                                      |          |

**User's choice:** 3-tier granular consent (Recommended)

### Data Deletion Flow

| Option                        | Description                                                                        | Selected |
| ----------------------------- | ---------------------------------------------------------------------------------- | -------- |
| Self-service + admin approval | Kullanıcı profilden talep eder, admin onaylar, PII silinir, siparişler anonimleşir | ✓        |
| Immediate self-service        | Kullanıcı direkt siler, onay gerekmez                                              |          |
| Manual form + email           | KVKK formu doldur, eposta ile işle                                                 |          |

**User's choice:** Self-service request + admin approval

### Legal Pages

| Option                | Description                                                                                              | Selected |
| --------------------- | -------------------------------------------------------------------------------------------------------- | -------- |
| All 5 legal pages     | Gizlilik, Kullanıcı Sözleşmesi, KVKK Aydınlatma, Çerez Politikası, VERBIS. Admin CMS'den düzenlenebilir. | ✓        |
| Privacy + KVKK only   | Sadece 2 sayfa                                                                                           |          |
| Static template pages | Kodda sabit içerik                                                                                       |          |

**User's choice:** All 5 legal pages (Recommended)

---

## Security Rules

### Rules Strictness

| Option                | Description                                                          | Selected |
| --------------------- | -------------------------------------------------------------------- | -------- |
| Strict per-collection | Her koleksiyon explicit allow/deny, auth kontrolü, satıcı izolasyonu | ✓        |
| Moderate role-based   | Auth + temel rol kontrolü                                            |          |
| Basic auth-gated      | Sadece auth kontrolü                                                 |          |

**User's choice:** Strict per-collection (Recommended)

### Custom Claims Structure

| Option                     | Description                                                     | Selected |
| -------------------------- | --------------------------------------------------------------- | -------- |
| 3 roles with sellerId      | admin/seller/buyer, sellerId custom claim ile satıcı izolasyonu | ✓        |
| 2 roles (admin/user)       | Seller ayrıcalığı Firestore'dan kontrol                         |          |
| Keep current (email-based) | ozyslr@gmail.com admin                                          |          |

**User's choice:** 3 roles with sellerId (Recommended)
**Notes:** Mevcut hardcoded admin email kontrolü custom claims'e taşınacak.

---

## Claude's Discretion

- Hash zinciri için SHA-256 algoritma seçimi
- Firestore security rules'un tam syntax'ı ve test kapsamı
- Cookie consent banner'ın UI tasarımı ve animasyonu
- Hukuki sayfaların tam metin içeriği (şablonlar, hukukçu onayı gerekli)
- Transition matrix'in implementasyon detayı (TypeScript enum + guard fonksiyonları)

## Deferred Ideas

- Multi-seller checkout (tek sepet, çok satıcı) — P2
- Veriff otomatik KYC entegrasyonu — Faz 3'te manuel KYC, Veriff sonra
- KVKK VERBIS kayıt süreci — Hukuki süreç, hukuk danışmanı ile
- CSP header customization — Faz 1 security hardening kapsamında opsiyonel
- Rate limiting genişletme — Webhook/static endpoints için, şimdilik yeterli
