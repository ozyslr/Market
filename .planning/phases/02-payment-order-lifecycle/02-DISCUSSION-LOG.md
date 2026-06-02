# Phase 2: Payment & Order Lifecycle - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-02
**Phase:** 2-Payment & Order Lifecycle
**Areas discussed:** Payment Architecture, Escrow + Commission Flow, Webhook Idempotency, Inventory Reservation, Transactional Emails, Payout Scheduling, Seller Finance Dashboard, Order Status UX

---

## Payment Architecture

### Provider Strategy
| Option | Description | Selected |
|--------|-------------|----------|
| Dual provider abstraction | Stripe Destination Charges + Iyzico Marketplace, IPaymentProvider interface | |
| Iyzico-first, Stripe later | Sadece Iyzico Marketplace, Stripe sonra | ✓ |
| Keep direct payment, manual commission | Var olan endpoint'ler, manuel komisyon | |

**User's choice:** Iyzico-first, Stripe later
**Notes:** TR pazarı öncelikli. Provider interface şimdiden kurulacak.

### Checkout Method
| Option | Description | Selected |
|--------|-------------|----------|
| Iyzico hosted checkout | Müşteri Iyzico formuna yönlendirilir, 3D Secure zorunlu, PCI-DSS yükü Iyzico'da | ✓ |
| Custom form + Iyzico API | Kart bilgileri bizim formda, PCI-DSS kapsamına girer | |
| Extend existing flow | Mevcut akışa commission logic ekle | |

**User's choice:** Iyzico hosted checkout (Recommended)

### Abstraction Layer
| Option | Description | Selected |
|--------|-------------|----------|
| Provider interface now | IPaymentProvider: initCheckout, verifyPayment, processRefund | ✓ |
| Direct Iyzico, refactor later | Sadece Iyzico implementasyonu | |
| Separate endpoints per provider | Ortak interface yok | |

**User's choice:** Provider interface now (Recommended)

---

## Escrow + Commission Flow

### Escrow Model
| Option | Description | Selected |
|--------|-------------|----------|
| Platform-held escrow | Para platform Iyzico hesabında, delivered'da komisyon kesilir, T+7 satıcıya | ✓ |
| Direct to seller + collect | Ödeme direkt satıcıya, platform sonra tahsil eder | |
| Instant split, no escrow | Komisyon anında kesilir, iade riski platformda | |

**User's choice:** Platform-held escrow (Recommended)

### Commission Timing
| Option | Description | Selected |
|--------|-------------|----------|
| Calculate at payment, collect at delivery | Payment'te hesapla (pending), delivered'da topla (collected), T+7'de öde (released) | ✓ |
| Calculate and collect at payment | Payment anında kes, iadede geri ekle | |
| Calculate at delivery | Delivered'da hesapla | |

**User's choice:** Calculate at payment, collect at delivery (Recommended)

### Refund Flow
| Option | Description | Selected |
|--------|-------------|----------|
| Full refund with commission reversal | Satıcı payı + komisyon birlikte iade, ledger'a kayıt | ✓ |
| Partial refund (keep commission) | Sadece satıcı payı iade, komisyon platformda | |
| Manual refund | Admin panelden manuel | |

**User's choice:** Full refund with commission reversal (Recommended)

---

## Webhook Idempotency

### Dedup Strategy
| Option | Description | Selected |
|--------|-------------|----------|
| Event ID dedup via Firestore | processedWebhooks koleksiyonu, işlem öncesi eventId kontrolü | ✓ |
| Status-based dedup | Order status'a bak, zaten 'paid' ise ignore | |
| Idempotency key header | Request header'dan key kontrolü | |

**User's choice:** Event ID dedup via Firestore (Recommended)

### Failure Handling
| Option | Description | Selected |
|--------|-------------|----------|
| Atomic Firestore transaction | Webhook ID + sipariş güncelleme aynı transaction'da, hata → Iyzico retry | ✓ |
| Queue + Cloud Function | Webhook event queue'ya yaz, async işle | |
| Manual failure handling | Try-catch + admin panelde görüntüle | |

**User's choice:** Atomic Firestore transaction (Recommended)

---

## Inventory Reservation

### Reserve Timing
| Option | Description | Selected |
|--------|-------------|----------|
| Reserve at checkout, timeout 15min | Checkout'ta rezerve, ödemeyle kalıcı, timeout'ta geri ekle | ✓ |
| Deduct at payment success only | Sadece ödeme başarılı olunca düş | |
| Reserve at cart add | Sepete eklemede rezerve | |

**User's choice:** Reserve at checkout, timeout 15min (Recommended)

---

## Transactional Emails

| Option | Description | Selected |
|--------|-------------|----------|
| SMTP via SendGrid/Resend | SMTP tabanlı, React Email şablonları | ✓ |
| Firebase Trigger Email | Mevcut Firestore extension | |
| Defer email sending | console.log, sonra ekle | |

**User's choice:** SMTP via SendGrid/Resend (Recommended)

---

## Payout Scheduling

| Option | Description | Selected |
|--------|-------------|----------|
| Cron endpoint + admin override | POST /api/process-scheduled-payouts güçlendirilsin, admin manual override | ✓ |
| Cloud Function trigger | Firestore onWrite trigger, serverless | |
| Manual only for now | Admin panelden manuel | |

**User's choice:** Cron endpoint + admin override (Recommended)

---

## Seller Finance Dashboard

| Option | Description | Selected |
|--------|-------------|----------|
| Full finance dashboard | Bakiye, bekleyen, toplam kazanç, payout geçmişi, CSV export | ✓ |
| Basic balance + last 5 | Sadece bakiye ve son 5 işlem | |
| Extend existing page | Mevcut SellerFinance'a sekme ekle | |

**User's choice:** Full finance dashboard (Recommended)

---

## Order Status UX

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown + timeline | Satıcı: dropdown status güncelleme. Müşteri: timeline görünümü | ✓ |
| Button + card view | Satıcı: buton. Müşteri: kart | |
| Wire existing UI to state machine | Mevcut sayfaları Faz 1 state machine'e bağla | |

**User's choice:** Dropdown + timeline (Recommended)

---

## Claude's Discretion

- SendGrid vs Resend seçimi (maliyet ve API tercihi)
- React Email şablonlarının tasarımı
- Stok timeout temizleme mekanizması (Cloud Function vs polling)
- Timeline UI bileşeninin tam tasarımı
- CSV export format detayı

## Deferred Ideas

- Stripe Connect — IPaymentProvider interface hazır, sonraki faz
- Multi-currency ödeme (EUR) — Stripe Connect ile
- Multi-vendor cart — P2
- AI analiz paneli — P2
- Admin satıcı yönetimi — Faz 3
- Kullanıcı yönetimi — Ayrı faz
- Satıcı kademeleri — Faz 3
- Site ayarları — Ayrı faz
