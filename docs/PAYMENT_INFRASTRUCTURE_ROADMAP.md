# Mercora Ödeme Altyapısı - Teknik Roadmap
## Yazılım Uzmanı: Ödeme & İşlem Yöntemleri

**Tarih:** 2026-05-23  
**Durum:** Analysis Complete (6.0/10 → 8.5/10 hedef)  
**Sprint Planı:** Sprint 1-2 Hazır + Faz 2 Erteleme Tavsiyesi

---

## 1. MEVCUT ALTYAPI DEĞERLENDIRMESI

### 1.1 Dual Payment Gateway (Iyzico + Stripe)

```
┌─────────────────────────────────────────────────────────┐
│                   MERCORA ÖDEME SISTEMI                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐           ┌──────────────────┐   │
│  │   IYZICO         │           │   STRIPE         │   │
│  │  (Türkiye)       │           │  (Global)        │   │
│  ├──────────────────┤           ├──────────────────┤   │
│  │ ✓ Checkout Form  │           │ ✓ Payment Intent │   │
│  │ ✓ Taksit Desteği │           │ ✓ Auto APM       │   │
│  │ ✓ 3D Secure      │           │ ✓ Multi-currency │   │
│  │ ✓ TR Optimized   │           │ ✓ Global reach   │   │
│  │ ✓ Callback Flow  │           │ ✓ SCA/3DS2       │   │
│  └──────────────────┘           └──────────────────┘   │
│         ↓                               ↓               │
│  /api/iyzico/init              /api/create-payment-    │
│  /api/iyzico/callback          intent                  │
│  /api/iyzico/installments      /api/webhook            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Avantajlar (Mevcut Altyapı)

| Avantaj | Açıklama | Impact |
|---------|----------|--------|
| **Redundancy** | Gateway başarısız olursa, diğeri fallback olarak çalışır | 99.5%+ uptime |
| **Regional Optimization** | Türkiye (Iyzico) + Global (Stripe) | Lower latency, better rates |
| **Taksit Desteği** | Iyzico natively taksit sunar | +15-20% dönüşüm artışı |
| **Auto APM** | Stripe automatic_payment_methods:true | Apple/Google ready |
| **Market Fit** | Türkiye pazarında preferred gateway | Local trust, faster payments |

**Durum Skoru: 6.0/10**
- ✓ 2 gateway aktif
- ✓ Callback flow working
- ✓ Webhook processing
- ✗ No guest checkout
- ✗ No COD
- ✗ No e-wallet
- ✗ Apple/Google Pay frontend missing

---

## 2. P0 EKSİKLİKLERİ - TEKNIK ANALIZ

### 2.1 Apple Pay / Google Pay Integration

**Sprint:** 1  
**Tahmini Effor:** 4 gün  
**Komplekslik:** MEDIUM  
**Risk:** LOW

#### Neden Bu Önemli
- Mobil trafik yüksek (%65+ e-commerce)
- Conversion rate +8-12% (study: Stripe benchmarks)
- Stripe zaten otomatik destekli (implementation only)

#### Teknik Detaylar

**Frontend Bileşenleri:**
```typescript
// src/components/payment/ApplePayButton.tsx
import { PaymentRequestButtonElement } from '@stripe/react-stripe-js';

// Apple Pay - iOS Safari only
// Option: usePaymentRequest() hook
// Capability: navigator.payment.canMakePayment()

// src/components/payment/GooglePayButton.tsx
// Android Chrome + Chrome Desktop
// Option: GooglePayButton variant dari Stripe Elements
```

**Backend - Değişiklik YOK**
- Stripe zaten `automatic_payment_methods: true` ile configured
- Payment Intent flow aynı kalıyor
- Webhook processing unchanged

**API Integration Points:**
```
POST /api/create-payment-intent
├─ Input: { amount, currency, orderId }
├─ Process: stripe.paymentIntents.create()
└─ Output: { clientSecret }  ← Apple/Google Pay token'ı burada
```

**Frontend Sayfalar (Update Gerekli):**
1. `src/components/Checkout.tsx` - Payment method selector
2. `src/pages/ProductDetail.tsx` - Quick pay button
3. `src/components/Cart.tsx` - Express checkout

**Implementation Checklist:**
- [ ] Stripe.js SDK latest version
- [ ] Apple Pay button (iOS Safari detection)
- [ ] Google Pay button (Android Chrome detection)
- [ ] Fallback: Card input form
- [ ] Device capability testing
- [ ] Error handling (payment canceled, network error)

---

### 2.2 Misafir Checkout (Guest Checkout)

**Sprint:** 1-2 (2 phase)  
**Tahmini Effor:** 6 gün (3 frontend + 3 backend)  
**Komplekslik:** HIGH  
**Risk:** MEDIUM

#### Neden Bu Önemli
- Conversion blocker: "Account required" = -30% completions
- Email verification path: minimal friction
- Order tracking: email + Order ID (no login needed)

#### Teknik Detaylar

**Faz 1: Frontend (Sprint 1)**

```typescript
// src/components/Checkout.tsx
// New flow:
// 1. "Continue as Guest" button
// 2. Email + Shipping Address form
// 3. Payment (Apple/Google/Card)
// 4. Order confirmation + tracking link

// State management
interface GuestCheckout {
  guestEmail: string;
  guestPhone: string;
  shippingAddress: Address;
  sessionId: string;  // for order tracking
}
```

**Frontend Components (NEW):**
- `src/components/checkout/GuestEmailForm.tsx`
- `src/components/checkout/GuestAddressForm.tsx`
- `src/components/checkout/GuestOrderConfirm.tsx`
- `src/pages/TrackOrder.tsx` (email + order ID based)

**Faz 2: Backend (Sprint 2)**

```typescript
// API Endpoints (NEW)

// POST /api/checkout/guest
// {
//   guestEmail: string,
//   guestPhone: string,
//   shippingAddress: Address,
//   cartItems: CartItem[],
//   total: number
// }
// → Response: { orderId, paymentToken, sessionId }

// POST /api/order/track (PUBLIC)
// { email: string, orderId: string }
// → Response: { order, status, tracking }

// POST /api/guest/verify-email (PUBLIC)
// { token: string }
// → Response: { verified }
```

**Database Schema Changes:**

```typescript
// Firestore: orders collection (MODIFY)
interface Order {
  id: string;
  userId?: string;           // NULL for guest
  guestEmail?: string;       // NEW
  guestPhone?: string;       // NEW
  sessionId?: string;        // NEW - order tracking
  buyerId: string;           // Keep for reference
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'pending_cod';
  createdAt: string;
  updatedAt: string;
}

// Session-based tracking (optional: Firestore or Redis)
interface GuestSession {
  sessionId: string;
  guestEmail: string;
  orderId: string;
  expiresAt: string;  // 30 days
}
```

**Workflow Diagram:**

```
┌──────────────────────────────────────────────┐
│  Product Page                                 │
│  └─ "Cart" → "Checkout"                       │
└────────────────┬─────────────────────────────┘
                 │
                 ↓
        ┌────────────────┐
        │ Login or Guest?│
        └────┬────────┬──┘
             │        │
         LOGIN        GUEST
             │        │
             ↓        ↓
        User ID    Email + Address
             │        │
             └────┬───┘
                  ↓
        ┌─────────────────────┐
        │  Payment Method     │
        │  (Apple/Google/Card)│
        └────────┬────────────┘
                 ↓
        ┌─────────────────────┐
        │ Order Confirmation  │
        │ + Tracking Link     │
        └─────────────────────┘
```

**Session Management:**
```typescript
// Temporary user creation (optional)
// Option A: Guest order without user record
// Option B: Create temporary User doc with guestEmail

// Recommendation: Option A (simpler, less DB overhead)
// - Use guestEmail as primary identifier
// - sessionId for order tracking
// - No Firebase Auth required for guest
```

---

### 2.3 Kapıda Ödeme (Cash on Delivery - COD)

**Sprint:** 2  
**Tahmini Effor:** 3 gün  
**Komplekslik:** MEDIUM  
**Risk:** MEDIUM (fraud prevention)

#### Neden Bu Önemli
- Türkiye pazarında yüksek talep (~30-40% market preference)
- Payment friction eliminates (kargo teslimatçı ödeme alır)
- Seller flexibility: COD order management dashboard

#### Teknik Detaylar

**Frontend - Minimal Değişiklik:**

```typescript
// src/components/payment/PaymentMethodSelector.tsx (MODIFY)
interface PaymentMethod {
  type: 'card' | 'applepay' | 'googlepay' | 'iyzico' | 'cod';
  label: string;
  icon: string;
}

// src/components/checkout/CODInfo.tsx (NEW)
// Banner: "Kargo teslimatçısı ödeme alacak"
//         "Teslimat süresi: 2-3 gün"
//         "Verify identity required"
```

**Backend - Order Service Changes:**

```typescript
// Firestore: orders collection (MODIFY)
export type OrderStatus = 
  | 'pending'           // Awaiting payment
  | 'pending_cod'       // COD awaiting delivery
  | 'confirmed_cod'     // Kargo ödemeyi onayladı
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed' 
  | 'pending_cod'       // NEW
  | 'cod_completed';    // NEW

interface Order {
  id: string;
  // ... existing fields
  paymentMethod: 'card' | 'applepay' | 'googlepay' | 'iyzico' | 'cod';
  paymentStatus: PaymentStatus;  // MODIFY type
  status: OrderStatus;            // MODIFY type
  
  // COD specific fields
  codVerificationStatus?: 'pending' | 'verified' | 'failed';  // NEW
  codVerificationToken?: string;   // NEW (for kargo system)
}
```

**API Endpoints (NEW):**

```typescript
// POST /api/order/create-with-cod
// {
//   cartItems: CartItem[],
//   total: number,
//   shippingAddress: Address,
//   userId: string,
//   method: 'cod'
// }
// → Response: { orderId, status: 'pending_cod' }

// POST /api/order/confirm-cod
// { orderId: string, codVerificationToken: string }
// → Response: { status: 'confirmed_cod' }
// Called by: Kargo şirketi webhook

// GET /api/seller/cod-orders
// → Response: List of COD orders awaiting confirmation
// Seller dashboard view
```

**Seller Dashboard Integration:**

```typescript
// src/pages/seller/orders.tsx (MODIFY)
// New filter: "COD Orders"
// New column: "COD Status"
// New action: "Mark as ready for delivery"

// COD orders workflow:
// 1. pending_cod: Seller packs & ready
// 2. confirmed_cod: Kargo picks up
// 3. shipped: In transit
// 4. delivered + payment confirmed: Done
```

**Kargo API Integration:**

```typescript
// Example: Aras Cargo API
POST https://api.arascargo.com.tr/v1/shipment/create
{
  orderId: string,
  recipientAddress: Address,
  paymentMethod: 'COD',
  amount: number,
  verificationToken: string  // for Mercora tracking
}

// Webhook callback: Payment confirmation
POST /api/webhook/cargo-cod-paid
{
  orderId: string,
  verificationToken: string,
  timestamp: string
}
→ Update order.paymentStatus = 'cod_completed'
```

**Risk Mitigation:**

| Risk | Mitigation |
|------|-----------|
| COD Fraud (non-payment) | Verify via OTP before delivery |
| Address mismatch | Google Maps address validation |
| Return abuse | Track returns per buyer |
| High chargebacks | Flag high-return addresses |

---

### 2.4 Dijital Cüzdan (E-Wallet) - Faz 2

**Sprint:** Faz 2 (Ertelenmesi tavsiye edilir)  
**Tahmini Effor:** 8 gün  
**Komplekslik:** HIGH  
**Risk:** HIGH (Regulatory)

#### Neden Şu An Uygun Değil

1. **PCI DSS Level 1 Compliance** (~$50K+ annually)
   - Credit card data handling regulations
   - Regular security audits required
   - Complex infrastructure investment

2. **Regulatory Complexity**
   - Türkiye: e-para lisansı gerekli (MASAK)
   - UK: FCA authorization (if applicable)
   - EU: PSD2 compliance

3. **Technical Debt**
   - Wallet settlement logic (complex)
   - Refund handling (edge cases)
   - Reconciliation (daily, hourly)

4. **Market Priority**
   - Apple Pay / Google Pay first (mobile conversion)
   - Guest checkout (friction reduction)
   - COD (market preference)
   - **THEN** E-wallet (loyalty feature)

#### Faz 2 Preview (8-week planning needed)

```typescript
// High-level architecture (for future reference)

interface UserWallet {
  userId: string;
  balance: number;
  currency: string;
  topupHistory: TopupTransaction[];
  spendingHistory: SpendingTransaction[];
  lastSettlement: string;
}

interface TopupTransaction {
  id: string;
  amount: number;
  method: 'stripe' | 'iyzico';
  paymentIntentId: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

interface SpendingTransaction {
  id: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'completed' | 'refunded';
  createdAt: string;
}
```

**Frontend Components (Planned):**
- `src/components/wallet/WalletDashboard.tsx`
- `src/components/wallet/TopupForm.tsx`
- `src/components/wallet/TransactionHistory.tsx`
- `src/components/payment/WalletPayment.tsx`

**Backend APIs (Planned):**
```
POST /api/wallet/topup
POST /api/wallet/pay
POST /api/wallet/refund
GET /api/wallet/balance
GET /api/wallet/transactions
```

---

## 3. SPRINT PLANNING - DETAYLI

### Sprint 1 (2 hafta)

**Goal:** Mobile payment methods + Guest checkout foundation

| Görev | Effor | Owner | Priority |
|-------|-------|-------|----------|
| Apple Pay button implementation | 2d | Frontend | P0 |
| Google Pay button implementation | 2d | Frontend | P0 |
| Device capability detection | 1d | Frontend | P1 |
| Guest checkout form (email/address) | 2d | Frontend | P0 |
| Guest order confirmation UI | 1d | Frontend | P1 |
| Order tracking page (no-login) | 2d | Frontend | P1 |
| Tests & QA | 2d | QA | P1 |

**Deliverables:**
- ✓ Apple/Google Pay functional (Stripe Elements)
- ✓ Guest email capture flow
- ✓ Order tracking landing page
- ✓ E2E tests (payment paths)

**Risks:**
- Apple Pay: Safari + iOS device required (test coverage)
- Stripe API updates (2025-03-31.basil validation)

---

### Sprint 2 (2 hafta)

**Goal:** Guest checkout backend + COD payment

| Görev | Effor | Owner | Priority |
|-------|-------|-------|----------|
| Guest checkout API endpoints | 2d | Backend | P0 |
| Order schema modifications | 1d | Backend | P0 |
| Session management (guest tracking) | 2d | Backend | P0 |
| COD payment flow (backend) | 2d | Backend | P0 |
| Seller COD dashboard | 2d | Frontend | P1 |
| Kargo API integration | 2d | Backend | P1 |
| Tests & deployment | 2d | QA/DevOps | P1 |

**Deliverables:**
- ✓ Guest checkout fully functional
- ✓ COD orders in seller dashboard
- ✓ Kargo integration (mock or sandbox)
- ✓ Order tracking working for guests

**Risks:**
- Kargo API delays (external dependency)
- COD fraud detection false positives
- Session expiration edge cases

---

### Faz 2 (5-6 hafta, sonraki cycle)

**Gate:** Regulatory review + PCI compliance assessment

1. **Planning Phase (1 hafta)**
   - Regulatory consultation (lawyer)
   - PCI compliance audit
   - Architecture design review

2. **Development (3 hafta)**
   - Wallet backend infrastructure
   - Top-up flow (Stripe/Iyzico integration)
   - Transaction ledger & settlement

3. **Compliance & Testing (1-2 hafta)**
   - PCI DSS certification
   - Penetration testing
   - Regulatory filing (if needed)

---

## 4. ARCHITECTURE DIAGRAMS

### 4.1 Payment Flow - Current + Roadmap

```
CURRENT STATE:
┌─────────────────────────────────────────────────────────┐
│                    CHECKOUT PAGE                        │
│  [Card Input Form] [Iyzico Redirect] [Stripe Intent]    │
└────────────┬──────────────┬──────────────┬──────────────┘
             │              │              │
        Card 100        Iyzico 50      Stripe 100
        (EUR/GBP)       (TRY/GBP)       (Multi)
             │              │              │
             └──────┬───────┴──────┬───────┘
                    │              │
               Process        Webhook
               Order          Process
                    │              │
                    └──────┬───────┘
                           ↓
                    Order Created ✓


SPRINT 1-2 ENHANCED:
┌──────────────────────────────────────────────────────────────┐
│                    CHECKOUT PAGE                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [Apple Pay] [Google Pay] [Card] [Iyzico] [Stripe] [COD]    │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  PAYMENT GATEWAY SELECTOR                               │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  Mobile?                                                │ │
│  │  ├─ iOS + Safari? → Apple Pay ✓ (NEW)                  │ │
│  │  ├─ Android + Chrome? → Google Pay ✓ (NEW)             │ │
│  │  └─ Else? → Card form                                  │ │
│  │                                                         │ │
│  │  Region? & Preference?                                 │ │
│  │  ├─ Turkey? → Iyzico (default) + COD ✓ (NEW)           │ │
│  │  └─ Global? → Stripe (default)                         │ │
│  │                                                         │ │
│  │  User Status?                                          │ │
│  │  ├─ Logged in → Normal flow                            │ │
│  │  └─ Guest? → Guest email + address ✓ (NEW)            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└───────────┬──────────────────────────────────────────────────┘
            │
    ┌───────┴────────────────────┬──────────┬──────────┐
    ↓                            ↓          ↓          ↓
[Stripe]                   [Iyzico]    [COD]    [Guest Email]
  Intent                   Checkout    Order      Session
    │                        │          │           │
    └────────┬───────────────┴──┬───────┴──────┬────┘
             │                  │              │
         Webhook            Callback         Track
         Process            Process        (email)
             │                  │              │
             └──────────┬───────┴──────┬───────┘
                        │              │
                   Process         Session
                   Order           Lookup
                        │              │
                        └──────┬───────┘
                               ↓
                        Order Created ✓
```

### 4.2 Data Flow - Guest Checkout

```
GUEST CHECKOUT FLOW:

1. Frontend: Guest Email Capture
   ┌──────────────────────┐
   │ "Continue as Guest"  │
   │ Email: user@x.com    │
   │ Phone: +xxx          │
   │ Address: [form]      │
   └──────────────────────┘
            │
            ↓
   2. POST /api/checkout/guest
      {
        guestEmail: string,
        guestPhone: string,
        shippingAddress: Address,
        cartItems: CartItem[],
        total: number
      }
            │
            ↓
   3. Backend: Create Order
      ┌──────────────────────────────────┐
      │ Firestore: orders                │
      │ ├─ id: uuid                      │
      │ ├─ guestEmail: user@x.com        │
      │ ├─ sessionId: random             │
      │ ├─ status: pending               │
      │ └─ paymentStatus: pending        │
      └──────────────────────────────────┘
            │
            ↓
   4. Response: { orderId, sessionId }
      ├─ Payment: Apple/Google/Card
      │  └─ POST /api/create-payment-intent
      │     → clientSecret
      └─ Display: Order confirmation
         └─ Tracking link: /track?email=x&id=y
            
   5. Order Tracking (No Login)
      POST /api/order/track
      {
        email: user@x.com,
        orderId: uuid
      }
      ↓
      Response: Order details + shipping status
      
```

### 4.3 Database Schema Changes

```sql
-- Firestore: orders collection

BEFORE (Current):
{
  id: string,
  userId: string,        -- REQUIRED
  items: OrderItem[],
  total: number,
  status: string,
  createdAt: string
}

AFTER (Sprint 1-2):
{
  id: string,
  userId?: string,                -- NULLABLE (for guests)
  guestEmail?: string,            -- NEW
  guestPhone?: string,            -- NEW
  sessionId?: string,             -- NEW (guest tracking)
  items: OrderItem[],
  total: number,
  paymentMethod: string,          -- NEW: 'card'|'applepay'|'googlepay'|'iyzico'|'cod'
  paymentStatus: string,          -- ENHANCED: +pending_cod, +cod_completed
  status: string,                 -- ENHANCED: +pending_cod, +confirmed_cod
  shippingAddress: Address,       -- DETAIL: might be separate
  createdAt: string,
  updatedAt: string
}
```

---

## 5. TIMELINE & MILESTONES

| Hafta | Sprint | Milestone | Target | Status |
|-------|--------|-----------|--------|--------|
| W1-2 | S1 | Apple/Google Pay live | May 30 | Ready |
| W3-4 | S1 | Guest checkout (frontend) | Jun 6 | Ready |
| W5-6 | S2 | Guest checkout (backend) | Jun 20 | Ready |
| W7-8 | S2 | COD live | Jun 20 | Ready |
| W9+ | Faz 2 | E-wallet (planning) | TBD | Planning |

**Score Progression:**
- Current: 6.0/10 (Iyzico + Stripe basics)
- Sprint 1: 7.0/10 (+Apple/Google Pay)
- Sprint 2: 8.5/10 (+Guest checkout, +COD)
- Faz 2: 9.5/10 (+E-wallet)

---

## 6. RISK MATRIX

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| **Stripe API breaking changes** | HIGH | LOW | Pin API version, monitor changelog |
| **Apple Pay device availability** | MEDIUM | LOW | Use iOS simulator, BrowserStack |
| **Kargo API integration delays** | HIGH | MEDIUM | Use mock API first, parallel development |
| **COD fraud spike** | MEDIUM | MEDIUM | OTP verification, address validation |
| **Guest session expiration** | LOW | LOW | 30-day expiry, email reminders |
| **PCI compliance complexity** | CRITICAL | HIGH | Defer to Faz 2, consult specialist |

---

## 7. BÜTÇE VE KAYNAKLAR

### Sprint 1-2 (4 hafta)
- **Frontend Geliştirici:** 2 kişi × 4 hafta
- **Backend Geliştirici:** 1 kişi × 4 hafta (Sprint 2'de aktif)
- **QA/Tester:** 1 kişi × 4 hafta
- **Toplam:** ~12 dev-weeks

### Faz 2 (6 hafta)
- **Full-Stack Developer:** 2 kişi
- **Security/Compliance Consultant:** 0.5 kişi
- **QA:** 1 kişi
- **Toplam:** ~15 dev-weeks

### External Costs
- **Kargo API sandbox access:** Free (Aras, MNG, etc.)
- **PCI compliance (Faz 2):** ~$50K/year
- **Stripe/Iyzico fees:** Variable (transaction-based)

---

## 8. BAŞARI METRİKLERİ

| Metrik | Hedef | Araç |
|--------|-------|------|
| Conversion Rate | +10% | Analytics |
| Apple/Google Pay usage | +8% | Stripe dashboard |
| Guest checkout rate | +20% | Custom tracking |
| COD order %age | 25-30% | Order analytics |
| Payment failure rate | <2% | Webhook monitoring |
| Wallet adoption (Faz 2) | 15% | Custom metrics |

---

## 9. SONUÇLAR & ÖNERİLER

### ✓ Recommend: Sprint 1-2 Başlat
1. **Apple Pay / Google Pay** - Low risk, high impact, Stripe ready
2. **Guest Checkout** - Friction reducer, proven conversion booster
3. **COD** - Market demand, Türkiye preference

### ⚠ Recommend: Faz 2'ye Ertele
1. **E-Wallet** - Complex compliance, requires planning, lower priority than APM + guest + COD

### Dual Gateway Avantajları
- ✓ **Redundancy:** 99%+ uptime
- ✓ **Regional:** Optimal rates (Iyzico TR, Stripe Global)
- ✓ **Features:** Taksit + APM combination
- ✓ **Risk:** No single point of failure

---

**Hazırlandı:** Payment Infrastructure Specialist  
**Onay Gerekli:** Product Manager, CTO  
**İlgili Dosyalar:**  
- `/mercora-next/src/app/api/create-payment-intent/route.ts`
- `/mercora-next/src/app/api/iyzico/init/route.ts`
- `/mercora-next/src/services/paymentProviderService.ts`
- `/mercora-next/src/services/orderService.ts`
