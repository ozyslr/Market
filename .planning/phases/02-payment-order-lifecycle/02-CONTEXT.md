# Phase 2: Payment & Order Lifecycle - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Bu faz ödeme altyapısını ve sipariş yaşam döngüsünü canlıya hazır hale getirir: Iyzico Marketplace hosted checkout (PCI-DSS uyumlu), platform-held escrow akışı, Faz 1 commission engine ve state machine ile entegrasyon, webhook idempotency, stok rezervasyonu, SendGrid işlemsel epostalar, otomatik T+7 payout cron, ve satıcı finans dashboard'u. Stripe Connect Faz 2 kapsamında değil — IPaymentProvider interface ile sonradan eklenecek.
</domain>

<decisions>
## Implementation Decisions

### Payment Architecture
- **D-01:** Iyzico-first yaklaşımı. Stripe Connect bu fazda implemente edilmez, IPaymentProvider interface'i ile sonra eklenir. TR pazarı öncelikli.
- **D-02:** IPaymentProvider interface: `initCheckout(orderData)`, `verifyPayment(paymentId)`, `processRefund(paymentId, amount)`. İlk implementasyon: IyzicoProvider. Provider seçimi bölgeye göre otomatik (TR → Iyzico, EU → Stripe — gelecek).
- **D-03:** Iyzico hosted checkout (PCI-DSS yükü Iyzico'da). Müşteri Iyzico ödeme formuna yönlendirilir, 3D Secure zorunlu. Callback URL ile sonuç alınır.

### Escrow & Commission Flow
- **D-04:** Platform-held escrow. Ödeme alınınca para platform Iyzico hesabında tutulur. Sipariş delivered olunca komisyon kesilir, kalan T+7'de satıcıya aktarılır.
- **D-05:** Komisyon hesaplama ve tahsilat zamanlaması: Payment anında `commissionEngine.calculate()` çağrılır, tutar ledger'a 'pending' statüde yazılır. Sipariş delivered olduğunda 'collected' statüye geçer. T+7 payout'ta 'released' olur.
- **D-06:** İade akışı: Tam iade + komisyon iadesi otomatik. Satıcı payı ve komisyon birlikte müşteriye döner. Ledger'a iade kaydı (negative entry) düşülür.

### Webhook Idempotency
- **D-07:** Event ID dedup via Firestore. `processedWebhooks` koleksiyonu: `{eventId, provider, processedAt, orderId}`. Her webhook işleme öncesi eventId kontrolü — varsa 200 dön, işleme.
- **D-08:** Atomic Firestore transaction: webhook ID kaydı + OrderSet/SubOrder durum güncellemesi aynı transaction'da. Başarısız olursa Iyzico'ya 500 dön, Iyzico retry yapsın.

### Inventory Reservation
- **D-09:** Checkout başlatılınca stok rezerve edilir (15 dakika timeout). Ödeme tamamlanınca rezervasyon kalıcı olur. Timeout'ta veya iptalde stok geri eklenir. Firestore'ta atomic stock update (`stock.reserved += quantity` kontrolü ile).

### Transactional Emails
- **D-10:** SendGrid/Resend SMTP ile eposta gönderimi. React Email şablonları. Tetikleyiciler: order confirmed, shipped, delivered, refunded → müşteriye. New order → satıcıya. Cart abandonment (mevcut) geliştirilecek.

### Payout Scheduling
- **D-11:** Cron endpoint (`POST /api/process-scheduled-payouts`) — T+7 hesaplaması, batch işlem, ledger kaydı. Admin panelden manuel payout tetiklenebilir (override).

### Seller Finance Dashboard
- **D-12:** Tam kapsamlı dashboard: kullanılabilir bakiye, bekleyen (escrow'da), toplam kazanç, son payout'lar tablosu, tarih aralığı filtresi, CSV export.

### Order Status UX
- **D-13:** Satıcı: dropdown ile durum güncelleme (Processing → Shipped), kargo no zorunlu. Müşteri: timeline görünümü (pending → paid → processing → shipped → delivered) + kargo takip linki.

### Claude's Discretion
- SendGrid vs Resend seçimi (maliyet ve API tercihi)
- React Email şablonlarının tasarımı
- Stok timeout temizleme mekanizması (Cloud Function vs polling)
- Timeline UI bileşeninin tam tasarımı
- CSV export format detayı
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Deliverables (MUST READ)
- `.planning/phases/01-foundation-compliance/01-CONTEXT.md` — Locked decisions (D-01 to D-12): state machine, commission engine, ledger, security rules
- `.planning/phases/01-foundation-compliance/01-01-SUMMARY.md` — Transition engine, OrderSet/SubOrder types, Order API
- `.planning/phases/01-foundation-compliance/01-02-SUMMARY.md` — Commission engine, SHA-256 ledger, admin CRUD API
- `server/services/transitionEngine.ts` — Faz 1 state machine (TRANSITION_MATRIX, InvalidTransitionError)
- `server/services/commissionEngine.ts` — Faz 1 commission engine (specificity priority, resolveRate, calculate)
- `server/services/ledgerService.ts` — Faz 1 immutable ledger (appendEntry, verifyChain)

### Existing Payment Code
- `server/routes/stripe.ts` — Mevcut Stripe endpoint'leri (25.7KB) — referans alınacak
- `server/routes/iyzico.ts` — Mevcut Iyzico endpoint'leri (9KB) — geliştirilecek
- `server/iyzico.cjs` — Iyzico SDK CJS wrapper
- `src/services/paymentProviderService.ts` — Mevcut payment provider service (varsa)
- `src/types/payment.ts` — Mevcut payment tipleri

### Architecture & Stack
- `.planning/codebase/INTEGRATIONS.md` — Stripe, Iyzico entegrasyon detayları
- `.planning/codebase/STACK.md` — Teknoloji stack'i
- `.planning/codebase/ARCHITECTURE.md` — Mimari overview
- `.planning/codebase/CONCERNS.md` — Bilinen sorunlar (server-side payment route'ları test edilmemiş)

### Project & Requirements
- `.planning/PROJECT.md` — Proje context, constraints
- `.planning/REQUIREMENTS.md` — PAY-01→06, ORD-03,04,05, COM-04,05, NOT-01,02,03
- `.planning/ROADMAP.md` §Phase 2 — Faz hedefi ve başarı kriterleri

### Research
- `.planning/research/ARCHITECTURE.md` — Order state machine, escrow flow, payment abstraction
- `.planning/research/PITFALLS.md` — Commission math errors, dual provider complexity, webhook race conditions
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`server/services/transitionEngine.ts`**: Faz 1'de kurulan transition matrix — sipariş durum güncellemeleri bunun üzerinden yapılacak
- **`server/services/commissionEngine.ts`**: Faz 1 specificity priority motoru — payment anında `calculate()` çağrılacak
- **`server/services/ledgerService.ts`**: Faz 1 immutable ledger — komisyon ve payout kayıtları buraya yazılacak
- **`server/routes/iyzico.ts`**: Mevcut Iyzico endpoint'leri (init, callback) — marketplace sub-merchant API'sine yükseltilecek
- **`src/services/emailService.ts`**: Mevcut eposta servisi — SendGrid entegrasyonu için genişletilecek
- **`src/services/orderService.ts`**: Faz 1 createOrderSet — webhook callback'te çağrılacak

### Established Patterns
- **Server-side Zod validation**: `validate(schema)` middleware — webhook payload validation için
- **Express route modules**: `server/routes/` pattern — yeni payment ve payout route'ları burada
- **Firestore transaction**: Faz 1'de order creation'da kullanıldı — webhook atomic işlemleri için aynı pattern

### Integration Points
- **Iyzico callback**: Mevcut `POST /api/iyzico/callback` endpoint'i marketplace mantığı ile genişletilecek
- **Cron endpoint**: Mevcut `POST /api/process-scheduled-payouts` — commission engine + ledger ile entegre edilecek
- **Order state machine**: Faz 1 transitionEngine — webhook ve satıcı güncellemeleri buradan geçecek
</code_context>

<specifics>
## Specific Ideas

- IPaymentProvider interface: Strategy pattern. `IyzicoProvider` ve gelecekte `StripeProvider` aynı interface'i implemente eder
- Webhook idempotency: Iyzico callback'te `paymentId` unique key olarak kullanılır. Stripe için `event.id`
- Escrow state machine: OrderSet.status ile senkronize — paid → processing → shipped → delivered → payout_scheduled → payout_completed
- Stok rezervasyonu: Firestore'ta `stock.reserved` alanı. `reserved + quantity <= available` kontrolü. Timeout: 15 dakika sonra Cloud Function veya cron endpoint ile temizlik
- React Email: `react-email` paketi ile şablon geliştirme, preview modu ile test
</specifics>

<deferred>
## Deferred Ideas

- Stripe Connect entegrasyonu — IPaymentProvider interface'i hazır, implementasyon sonraki faz
- Multi-currency ödeme (EUR) — Stripe Connect ile birlikte gelecek
- Multi-vendor cart (tek sepet, çok satıcı) — P2
- Webhook'lar şu anda çalışmıyor (bug) — Faz 2'de fix edilecek
- AI analiz paneli — P2 deferred
- Admin satıcı yönetimi tam kapsamlı — Faz 3
- Kullanıcı yönetimi tam kapsamlı — Ayrı faz
- Satıcı kademeleri — Faz 3
- Site ayarları detaylandırma — Ayrı faz

None — discussion stayed within phase scope for payment/order lifecycle
</deferred>

---

*Phase: 2-Payment & Order Lifecycle*
*Context gathered: 2026-06-02*
