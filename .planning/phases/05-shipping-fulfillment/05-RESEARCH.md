# Phase 5: Shipping & Fulfillment — Research

**Researched:** 2026-06-04
**Domain:** Carrier API integration (EasyPost EU, Entegi TR mock), order lifecycle, webhook/cron hybrid tracking, returns
**Confidence:** HIGH (EasyPost — verified via official docs/GitHub/npm); MEDIUM (Entegi — no public API docs found, mock contract designed from TR carrier aggregator patterns)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Mock-first behind existing `cargoService.ts` CargoProvider interface. Add Entegi (TR) and EasyPost (EU) providers returning realistic mock responses. Real API keys deferred. Mocks are permanent fallback layer.
- **D-02:** Hybrid live tracking — EasyPost webhook (push) + cron polling (pull) for Entegi. Reuse Phase 2 webhook idempotency pattern.
- **D-02b:** Region routing — TR address (country === 'TR') → Entegi, EU/other → EasyPost. Routing inside abstraction.
- **D-02c:** Delivery confirmation transitions SubOrder → Delivered via Phase 2 transition engine; delay notification when `now > estimatedDelivery` without Delivered status.
- **D-03:** Seller-initiated manual shipment. "Kargola + etiket al" on seller order page → carrier provider → trackingNumber + labelUrl → SubOrder written → Shipped transition via Phase 2 engine.
- **D-04:** Returns — buyer request (14-day window from `deliveredAt`) → seller/admin approval → generate return label → trigger Phase 2 refund + commission reversal (02-05).

### Claude's Discretion

- Region detection precision (country code from `ShippingAddress.country`)
- Shipping-cost-bearer data model (label cost field on SubOrder for real-key readiness)
- Delay-notification threshold (default: `now > estimatedDelivery`, check via cron or scheduled job)
- Returns data model (new `returns` collection vs SubOrder status extension)
- Return-reason enum
- EasyPost webhook endpoint security (signature verification) and idempotency implementation

### Deferred Ideas (OUT OF SCOPE)

- Real Entegi / EasyPost API keys + live carrier accounts
- Multi-package / partial shipments per SubOrder
- Automatic restocking on return completion
- Multi-currency shipping cost display (Phase 6)
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                     | Research Support                                                                                                         |
| ------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| SHP-01 | Entegi API entegrasyonu — TR kargo firmaları tek endpoint'ten   | Mock Entegi provider behind CargoProvider interface; polling cron via verifyCronSecret pattern                           |
| SHP-02 | EasyPost API entegrasyonu — EU kargo firmaları tek endpoint'ten | `@easypost/api` v8.8.0, createShipment+buy flow, webhook push tracking                                                   |
| SHP-03 | Kargo takip numarası ve canlı durum görüntüleme                 | TrackingResponse already typed in cargoService.ts; SubOrder.trackingNumber/carrier exist                                 |
| SHP-04 | Teslimat onayı ve gecikme bildirimi                             | sendDeliveryConfirmationEmail exists in server/services/emailService.ts; transition engine confirm_delivery event exists |
| SHP-05 | İade talebi oluşturma ve takip akışı                            | SubOrderStatus includes return_requested/return_approved/return_rejected/refunded; Phase 2 refundService.ts reused       |

</phase_requirements>

---

## Summary

Phase 5 extends the existing `cargoService.ts` provider abstraction — it does not greenfield a shipping system. The CargoProvider interface, ShipmentRequest/Response, TrackingResponse types, and mock provider skeleton are already in place. The task is to add two new named providers (Entegi for TR, EasyPost for EU), wire region-based routing, add missing fields (labelUrl stored to Firebase Storage, `estimatedDelivery` ISO string, `labelCost` for future real-key billing), implement a webhook endpoint for EasyPost (reusing the Stripe raw-body-before-JSON-middleware pattern), a cron polling endpoint for Entegi (reusing the verifyCronSecret pattern from payout/abandoned-cart crons), and a returns sub-system that calls into the existing Phase 2 refundService.

EasyPost has a well-documented Node.js SDK (`@easypost/api` v8.8.0) with a free test mode, HMAC webhook signature verification via `X-Hmac-Signature` header, and a `tracker.updated` webhook event. Entegi has no publicly documented developer API — it is a marketplace SaaS platform, not a shipping aggregator with a public REST API. The correct interpretation for this project is that **Entegi in Phase 5 is a mock contract**, designed to match the shape a future real TR carrier aggregator (e.g., Basit Kargo, API Kargo, or direct Yurtiçi/Aras SOAP wrappers) would use. The mock must be realistic enough that swapping in a real provider is a drop-in replacement.

The biggest implementation risk is the EasyPost webhook security (raw body + HMAC) and the returns data model decision. A separate `returns` Firestore collection is recommended over SubOrder status extension — it carries the full return lifecycle (reason, evidence, approvedBy, returnTrackingNumber) without overloading SubOrder.

**Primary recommendation:** Extend cargoService.ts with Entegi mock + EasyPost mock (real-API-shaped), add region router, wire EasyPost webhook endpoint (raw body, before JSON middleware, verifyCronSecret-equivalent for HMAC), add Entegi cron polling endpoint, add return request + approval routes, reuse Phase 2 refundService.processRefund for the money-movement step.

---

## Architectural Responsibility Map

| Capability                           | Primary Tier                           | Secondary Tier            | Rationale                                                          |
| ------------------------------------ | -------------------------------------- | ------------------------- | ------------------------------------------------------------------ |
| Shipment creation (label + tracking) | API / Backend (Express)                | —                         | Carrier API keys must stay server-side; no client exposure         |
| Region routing (TR vs EU provider)   | API / Backend (cargoService.ts)        | —                         | Pure data logic on country code; no browser involvement            |
| EasyPost webhook reception           | API / Backend (Express raw-body route) | —                         | Webhook is an inbound server push; same pattern as Stripe          |
| Entegi status polling (cron)         | API / Backend (Express POST endpoint)  | —                         | Reuses verifyCronSecret pattern from payouts/abandoned-cart        |
| Live tracking display (SHP-03)       | Frontend (React)                       | API / Backend (Firestore) | SubOrder fields polled/subscribed client-side; status in Firestore |
| Delivery confirmation transition     | API / Backend (transitionEngine)       | —                         | State machine lives in server/services/transitionEngine            |
| Delay notification                   | API / Backend (cron job)               | —                         | Scheduled check against estimatedDelivery; fires emailService      |
| Return request creation              | Frontend (React) + API / Backend       | Firestore                 | Buyer submits via form; server validates 14-day window             |
| Return approval + refund trigger     | API / Backend (Express)                | Phase 2 refundService     | Admin/seller approves; processRefund called server-side            |
| Label PDF storage                    | Firebase Storage                       | —                         | labelUrl written to SubOrder after upload                          |

---

## Standard Stack

### Core (existing — no new installs for mock-only phase)

| Library                            | Version | Purpose                           | Why Standard                                                      |
| ---------------------------------- | ------- | --------------------------------- | ----------------------------------------------------------------- |
| `cargoService.ts`                  | —       | Provider abstraction              | Already built; Entegi + EasyPost are new class implementations    |
| `server/services/refundService.ts` | —       | Refund + commission reversal      | Phase 2 built; returns plug in via processRefund                  |
| `server/services/emailService.ts`  | —       | Delivery/delay/return emails      | sendDeliveryConfirmationEmail + sendRefundNotificationEmail exist |
| `firebase-admin`                   | 13.10.0 | Firestore writes, Storage uploads | Already in stack                                                  |

### New Install (real EasyPost provider — deferred but mock must match)

| Library         | Version                        | Purpose           | Why Standard                                            |
| --------------- | ------------------------------ | ----------------- | ------------------------------------------------------- |
| `@easypost/api` | 8.8.0 [VERIFIED: npm registry] | EasyPost Node SDK | Official EasyPost client; used when real keys activated |

**Note:** `@easypost/api` should be installed as a `devDependency` or behind an env-flag import for now. The mock provider does NOT need the real SDK — but the real provider class (stubbed, real-API-shaped) should import it so the swap is a one-line env change.

**Installation (deferred to real-key activation):**

```bash
npm install @easypost/api
```

### Alternatives Considered

| Instead of                            | Could Use                    | Tradeoff                                                                                                       |
| ------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `@easypost/api`                       | Raw `fetch` to EasyPost REST | SDK handles HMAC verification, rate objects, error parsing — use SDK                                           |
| New `returns` collection              | Extending SubOrder status    | SubOrder extension creates unbounded fields; separate collection is cleaner for audit trail                    |
| cron HTTP endpoint (verifyCronSecret) | `node-cron` in-process       | In-process cron won't survive server restart + can't be triggered externally; HTTP cron is the project pattern |

---

## Package Legitimacy Audit

> Only one new package recommended. slopcheck run result below.

| Package         | Registry | Age     | Downloads           | Source Repo                       | slopcheck                                     | Disposition |
| --------------- | -------- | ------- | ------------------- | --------------------------------- | --------------------------------------------- | ----------- |
| `@easypost/api` | npm      | ~10 yrs | High (official SDK) | github.com/EasyPost/easypost-node | OK [VERIFIED: npm registry + official GitHub] | Approved    |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
Seller UI ("Kargola + etiket al")
        │
        ▼
POST /api/orders/:orderSetId/subOrders/:subOrderId/ship
        │  verifyFirebaseToken + verifySeller + sellerId ownership
        │
        ▼
cargoService.createCargoShipment(provider, req)
        │
        ├── ShippingAddress.country === 'TR' ──► MockEntegiProvider (→ real EntegiProvider later)
        │                                           createShipment() → trackingNumber + labelUrl
        │
        └── EU / other ──────────────────────────► MockEasyPostProvider (→ real EasyPostProvider later)
                                                     createShipment() → trackingNumber + labelUrl
        │
        ▼
Firebase Storage: upload label PDF → store labelUrl on SubOrder
        │
        ▼
transitionOrder(subOrder, 'mark_shipped', version) → SubOrder.status = 'shipped'
        │
        ▼
sendShippingUpdateEmail (non-blocking)

─────────────────────────────────────────────────────────
TRACKING UPDATES (two paths)

EasyPost (push):
POST /api/carrier/easypost/webhook  ← raw body, before express.json()
        │  validateEasyPostWebhook(secret, headers, body)
        │  processedWebhooks dedup (reuse Phase 2 pattern)
        ▼
event.description === 'tracker.updated'
        │
        ├── status === 'delivered' → transitionOrder('confirm_delivery') → sendDeliveryConfirmationEmail
        └── status changed → update SubOrder.trackingEvents + currentStatus

Entegi (poll):
POST /api/carrier/entegi/poll  ← verifyCronSecret (external cron trigger)
        │
        ▼
For each SubOrder with carrier='Entegi' and status='shipped':
  cargoService.getTracking('Entegi', trackingNumber)
        │
        ├── delivered → transitionOrder('confirm_delivery') → sendDeliveryConfirmationEmail
        └── update SubOrder.currentTrackingStatus

─────────────────────────────────────────────────────────
DELAY NOTIFICATION

POST /api/carrier/check-delays  ← verifyCronSecret
        │
Query SubOrders: status='shipped', estimatedDelivery < now, no deliveredAt
        ▼
sendDelayNotificationEmail (new template or repurpose existing)

─────────────────────────────────────────────────────────
RETURNS (SHP-05)

Buyer: POST /api/orders/:orderSetId/subOrders/:subOrderId/return-request
        │  isFullUser() + buyerId ownership + 14-day window check
        ▼
Create returns/{returnId} doc: { status: 'pending', reason, subOrderId, buyerId, createdAt }
SubOrder status → return_requested (transitionOrder 'request_return')

Seller/Admin: POST /api/returns/:returnId/approve  (or /reject)
        ▼
Generate return label: cargoService.createCargoShipment(provider, returnReq)
        ▼
refundService.processRefund(adminDb, getIyzico, { orderSetId, subOrderId, isFullRefund: true })
        ▼
returns/{returnId}.status = 'approved', returnTrackingNumber written
SubOrder → refunded (via processRefund transition)
sendRefundNotificationEmail (non-blocking)
```

### Recommended Project Structure

```
server/
├── routes/
│   ├── shipping.ts          # POST /api/orders/.../ship (seller creates shipment)
│   ├── carrierWebhook.ts    # POST /api/carrier/easypost/webhook (raw body)
│   ├── carrierPoll.ts       # POST /api/carrier/entegi/poll + /api/carrier/check-delays (cron)
│   └── returns.ts           # POST /api/orders/.../return-request, /api/returns/:id/approve|reject
src/
├── services/
│   └── cargoService.ts      # ADD: MockEntegiProvider, MockEasyPostProvider, EntegiProvider stub,
│                            #       EasyPostProvider stub, routeCarrierByRegion()
├── types/
│   └── order.ts             # ADD: ReturnRequest interface (or new src/types/returns.ts)
```

### Pattern 1: Region Routing in cargoService.ts

**What:** `routeCarrierByRegion(country: string): CargoProviderName` exported pure function.
**When to use:** Called by all shipment creation endpoints before invoking createCargoShipment.

```typescript
// Source: cargoService.ts (extend existing file)
export type CargoProviderName =
  | 'PTT'
  | 'Yurtici'
  | 'Aras'
  | 'MNG'
  | 'Surat'
  | 'UPS'
  | 'DHL'
  | 'Entegi'
  | 'EasyPost'; // ADD these two

export function routeCarrierByRegion(country: string): CargoProviderName {
  return country === 'TR' ? 'Entegi' : 'EasyPost';
}
```

### Pattern 2: EasyPost Webhook Registration (raw body before JSON middleware)

**What:** Mirrors exact Stripe webhook pattern from server.ts line 295-297.
**When to use:** EasyPost webhook endpoint MUST be registered before `express.json()`.

```typescript
// Source: server.ts pattern (registerStripeWebhook equivalent)
// In carrierWebhook.ts:
export function registerCarrierWebhook(app: Express, deps: CarrierWebhookDeps): void {
  // Raw body parser — must be before express.json() in server.ts
  app.post(
    '/api/carrier/easypost/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const secret = process.env.EASYPOST_WEBHOOK_SECRET ?? '';
      const signature = req.headers['x-hmac-signature'] as string;
      // In mock mode: skip verification; in real mode: validate HMAC
      if (secret && !validateEasyPostHmac(secret, signature, req.body)) {
        return res.status(403).json({ error: 'invalid signature' });
      }
      const event = JSON.parse(req.body.toString());
      // Idempotency: reuse processedWebhooks collection (Phase 2 pattern)
      const eventId = event.id; // evt_...
      const dedupRef = deps.adminDb.collection('processedWebhooks').doc(eventId);
      const existing = await dedupRef.get();
      if (existing.exists) return res.status(200).json({ received: true });
      // Process event
      if (event.description === 'tracker.updated') {
        await handleTrackerUpdated(event.result, deps);
      }
      await dedupRef.set({ processedAt: FieldValue.serverTimestamp() });
      res.status(200).json({ received: true });
    },
  );
}
```

### Pattern 3: Entegi Cron Polling (verifyCronSecret pattern)

**What:** HTTP POST endpoint protected by `verifyCronSecret`, triggered by external cron.
**When to use:** Matches abandoned-cart and payout cron patterns in server.ts.

```typescript
// Source: server.ts lines 189, 406 (verifyCronSecret pattern)
app.post('/api/carrier/entegi/poll', verifyCronSecret, async (req, res) => {
  const shippedSnap = await adminDb
    .collection('subOrders')
    .where('carrier', '==', 'Entegi')
    .where('status', '==', 'shipped')
    .get();
  const results = [];
  for (const doc of shippedSnap.docs) {
    const sub = doc.data() as SubOrder;
    try {
      const tracking = await getTrackingStatus('Entegi', sub.trackingNumber!);
      if (tracking.delivered) {
        await transitionSubOrder(adminDb, sub.orderSetId, doc.id, 'confirm_delivery');
        await sendDeliveryConfirmationEmail(
          sub.orderSetId,
          sub.buyerEmail,
          sub.buyerName,
          sub.carrier!,
        );
      } else {
        await doc.ref.update({ currentTrackingStatus: tracking.currentStatus });
      }
      results.push({ id: doc.id, status: tracking.currentStatus });
    } catch (err) {
      /* skip failed, log */
    }
  }
  res.json({ polled: results.length, results });
});
```

### Pattern 4: Returns Data Model

**Recommendation:** New `returns` Firestore collection (NOT SubOrder extension).

```typescript
// src/types/returns.ts (new file)
export type ReturnStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'label_sent'
  | 'received'
  | 'refunded';
export type ReturnReason = 'wrong_item' | 'damaged' | 'not_as_described' | 'changed_mind' | 'other';

export interface ReturnRequest {
  id: string;
  orderSetId: string;
  subOrderId: string;
  buyerId: string;
  sellerId: string;
  reason: ReturnReason;
  notes?: string;
  status: ReturnStatus;
  returnTrackingNumber?: string;
  returnLabelUrl?: string;
  approvedBy?: string; // uid of seller or admin
  rejectionReason?: string;
  refundId?: string; // from refundService response
  ledgerEntryIds?: string[];
  createdAt: string;
  updatedAt: string;
  windowExpiresAt: string; // deliveredAt + 14 days ISO string
}
```

**Firestore path:** `returns/{returnId}` — separate collection.

**Why not SubOrder extension:** SubOrder already has status fields covering return_requested/return_approved/return_rejected/refunded (from order.ts). The SubOrder status reflects the shipping lifecycle. The `returns` document holds the richer return data (reason, evidence, approvedBy, return label) without polluting SubOrder. The SubOrder transitions still happen in parallel (transitionOrder('request_return'), then transitionOrder('approve_return'/'reject_return'), then transitionOrder('refund')).

### Pattern 5: EasyPost Mock Provider (real-API-shaped)

The mock must return fields matching the real EasyPost API so the swap is trivial:

```typescript
// In cargoService.ts — ADD after existing mocks
class MockEasyPostProvider implements CargoProvider {
  name: CargoProviderName = 'EasyPost';

  async createShipment(req: ShipmentRequest): Promise<ShipmentResponse> {
    await delay(400);
    // Real EasyPost tracking codes start with 'EZ' in test mode
    const tracking = `EZ${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    const days = 3 + Math.floor(Math.random() * 5);
    const eta = new Date(Date.now() + days * 86400000).toISOString();
    return {
      success: true,
      trackingNumber: tracking,
      provider: 'EasyPost',
      labelUrl: `https://mock-easypost.com/labels/${tracking}.pdf`,
      estimatedDelivery: eta,
      shippingCost: 8.99 + Math.random() * 15, // EUR range
      // Real EasyPost response also has: shipment_id (shp_...), rate_id (rate_...), tracker_id (trk_...)
      // Add these as extended fields when real provider is activated
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingResponse> {
    await delay(300);
    // Simulate EasyPost status enum: pre_transit → in_transit → out_for_delivery → delivered
    const statuses = ['pre_transit', 'in_transit', 'out_for_delivery', 'delivered'];
    const idx = Math.min(Math.floor(Math.random() * statuses.length), statuses.length - 1);
    const currentStatus = statuses[idx];
    return {
      success: true,
      trackingNumber,
      provider: 'EasyPost',
      currentStatus,
      delivered: currentStatus === 'delivered',
      estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(),
      events: [],
      labelUrl: `https://mock-easypost.com/labels/${trackingNumber}.pdf`,
    };
  }

  async generateLabel(trackingNumber: string): Promise<string> {
    return `https://mock-easypost.com/labels/${trackingNumber}.pdf`;
  }

  async cancelShipment(_trackingNumber: string): Promise<boolean> {
    return true;
  }

  async getRates(origin: string, dest: string, weight: number): Promise<ShippingRate[]> {
    return [
      {
        provider: 'EasyPost',
        serviceLevel: 'Priority',
        cost: 9.99 + weight * 1.5,
        estimatedDays: 3 + Math.ceil(Math.random() * 4),
        pickupAvailable: false,
      },
    ];
  }
}
```

### Pattern 6: Entegi Mock Provider (designed mock contract)

No public API docs exist for Entegi. The mock contract is designed to match what a typical TR carrier aggregator REST API would return:

```typescript
class MockEntegiProvider implements CargoProvider {
  name: CargoProviderName = 'Entegi';
  // Auth model (assumed for real): Bearer token in Authorization header
  // Shipment create endpoint (assumed): POST /api/v1/shipments
  // Tracking query (assumed): GET /api/v1/shipments/{trackingNumber}/status
  // Webhook: NOT SUPPORTED — polling only [ASSUMED based on TR carrier aggregator patterns]

  async createShipment(req: ShipmentRequest): Promise<ShipmentResponse> {
    await delay(350);
    const tracking = `EN${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const days = 1 + Math.floor(Math.random() * 3);
    return {
      success: true,
      trackingNumber: tracking,
      provider: 'Entegi',
      labelUrl: `https://mock-entegi.com/labels/${tracking}.pdf`,
      estimatedDelivery: new Date(Date.now() + days * 86400000).toISOString(),
      shippingCost: 30 + Math.random() * 20, // TRY range
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingResponse> {
    await delay(250);
    const statuses = ['Kabul Edildi', 'Yolda', 'Dağıtımda', 'Teslim Edildi'];
    const idx = Math.min(Math.floor(Math.random() * statuses.length), statuses.length - 1);
    return {
      success: true,
      trackingNumber,
      provider: 'Entegi',
      currentStatus: statuses[idx],
      delivered: statuses[idx] === 'Teslim Edildi',
      estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
      events: [],
    };
  }

  async generateLabel(trackingNumber: string): Promise<string> {
    return `https://mock-entegi.com/labels/${trackingNumber}.pdf`;
  }

  async cancelShipment(_trackingNumber: string): Promise<boolean> {
    return true;
  }

  async getRates(origin: string, _dest: string, weight: number): Promise<ShippingRate[]> {
    return [
      {
        provider: 'Entegi',
        serviceLevel: 'Standart',
        cost: 29 + weight * 2,
        estimatedDays: 2 + Math.ceil(Math.random() * 2),
        pickupAvailable: true,
      },
    ];
  }
}
```

### Anti-Patterns to Avoid

- **Registering EasyPost webhook AFTER express.json():** Body will be parsed before raw buffer is captured — signature verification fails. Must mirror Stripe pattern: raw route registered first in server.ts.
- **Storing labelUrl as a mock URL directly in Firestore:** Use Firebase Storage for the actual PDF bytes in real mode. For mock mode, a `/api/cargo/label/:trackingNumber` Express route returning a placeholder PDF is fine. Store the URL path that will work in both modes.
- **Using SubOrder status alone for return data:** SubOrder.status drives the state machine (return_requested → return_approved → refunded) but does not store return reason, evidence, or return label. Always write to `returns` collection as the source of truth.
- **Running Entegi polling in-process with setInterval:** Will not survive server restarts. Use the `verifyCronSecret` HTTP endpoint pattern — same as payouts and abandoned-cart.
- **Calling processRefund without checking SubOrder is in return_approved state:** The transition engine enforces state, but add a guard in the returns approval route.

---

## Don't Hand-Roll

| Problem                                          | Don't Build          | Use Instead                                                                                                                                                 | Why                                                                              |
| ------------------------------------------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| EasyPost webhook HMAC verification               | Custom HMAC logic    | `@easypost/api` client's `validateWebhook()` or manual: `crypto.createHmac('sha256', secret).update(body).digest('hex')` then compare to `X-Hmac-Signature` | Edge cases in timing-safe comparison; use `crypto.timingSafeEqual`               |
| Order state machine (Shipped/Delivered/Returned) | Custom status update | Existing `transitionOrder()` from Phase 2 (server/services/transitionEngine.ts)                                                                             | Concurrency control, version checks, valid transition enforcement already built  |
| Refund + commission reversal on return approval  | New refund logic     | Existing `refundService.processRefund()` from Phase 2 (02-05)                                                                                               | Dual negative ledger entries, iyzico refundV2, OrderSet reconciliation all built |
| Delivery email                                   | New email template   | Existing `sendDeliveryConfirmationEmail()` in server/services/emailService.ts                                                                               | Already imports deliveryConfirmationHtml template                                |
| Webhook deduplication                            | Custom dedup store   | Existing `processedWebhooks` Firestore collection pattern (Phase 2 02-02)                                                                                   | Two-phase check (pre-transaction + inside transaction) already proven            |

---

## EasyPost API — Real Shape (for mock contract fidelity)

### Shipment Create + Buy (two-step)

```typescript
// Source: github.com/EasyPost/easypost-node [VERIFIED: official GitHub]
// Step 1: Create (gets rates)
const shipment = await client.Shipment.create({
  from_address: { street1, city, state, zip, country, phone, company },
  to_address: { name, street1, city, state, zip, country, phone },
  parcel: { length, width, height, weight }, // weight in oz
});

// Step 2: Buy (purchases label, generates tracking_code)
const bought = await client.Shipment.buy(shipment.id, shipment.lowestRate());
// bought.tracking_code — the tracking number
// bought.postage_label.label_url — PDF label URL
// bought.tracker.id — trk_... for webhook updates
```

### Tracker Webhook Event Shape

```json
{
  "id": "evt_abc123",
  "object": "Event",
  "description": "tracker.updated",
  "mode": "test",
  "result": {
    "id": "trk_xyz",
    "object": "Tracker",
    "tracking_code": "EZ1000000003",
    "status": "out_for_delivery",
    "status_detail": "out_for_delivery",
    "carrier": "USPS",
    "tracking_details": [
      {
        "message": "Departed Facility",
        "status": "in_transit",
        "datetime": "...",
        "source": "USPS"
      }
    ],
    "carrier_detail": {
      "service": "FirstClassPackageInternationalService",
      "estimated_delivery_date": "..."
    },
    "shipment_id": "shp_...",
    "public_url": "https://track.easypost.com/..."
  }
}
```

**Status values:** `pre_transit` | `in_transit` | `out_for_delivery` | `delivered` | `available_for_pickup` | `return_to_sender` | `failure` | `cancelled` | `error` | `unknown`

### HMAC Verification

```typescript
// Source: docs.easypost.com/guides/webhooks-guide [CITED: docs.easypost.com]
// Header: X-Hmac-Signature
import crypto from 'crypto';

function validateEasyPostHmac(secret: string, signature: string, body: Buffer): boolean {
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const sigBuf = Buffer.from(signature.replace('hmac-sha256-hex=', ''), 'hex');
  if (expectedBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, sigBuf);
}
```

### Return Shipment (EasyPost)

EasyPost creates return labels by setting `is_return: true` on shipment creation:

```typescript
// Source: docs.easypost.com (inferred from API structure) [ASSUMED]
const returnShipment = await client.Shipment.create({
  from_address: buyerAddress, // buyer sends package back
  to_address: sellerAddress, // seller receives
  parcel: originalParcel,
  is_return: true, // flags as return label
});
const boughtReturn = await client.Shipment.buy(returnShipment.id, returnShipment.lowestRate());
```

**For mock mode:** MockEasyPostProvider.createShipment ignores `is_return` but should accept it in the ShipmentRequest (add optional field).

### Test Mode Keys

EasyPost test mode uses a separate API key (`EZTK...` prefix vs `EZAK...` for production). [CITED: docs.easypost.com/docs/trackers] Test tracking codes: `EZ1000000001` (pre_transit) through `EZ4000000004` (delivered).

---

## Entegi API — Mock Contract (no public API docs)

**Finding:** Entegi (entegi.com) is a marketplace integration platform (Trendyol/Hepsiburada connector), not a shipping aggregator with a public developer API. It does not expose a documented REST API for creating cargo shipments. [ASSUMED based on research — verified entegi.com pages show no developer/API section]

**Resolution for Phase 5:** "Entegi" in this codebase means "TR carrier aggregator endpoint" — the mock contract is designed to match what Basit Kargo, API Kargo, or a future direct Yurtiçi/Aras integration would look like:

| Field           | Assumed Value                                                           |
| --------------- | ----------------------------------------------------------------------- |
| Auth            | Bearer token, `Authorization: Bearer ${ENTEGI_API_KEY}`                 |
| Create shipment | `POST /api/v1/shipments` with JSON body                                 |
| Get tracking    | `GET /api/v1/tracking/{trackingNumber}`                                 |
| Webhook support | **Not supported** — polling only                                        |
| Response format | JSON, similar to ShipmentResponse                                       |
| Polling cadence | Every 30 min for active shipments < 3 days old; every 6 hours for older |

**When real TR carrier is contracted:** Update `MockEntegiProvider` → `EntegiProvider` (or rename to match actual service), swap base URL via `ENTEGI_API_BASE_URL` env var.

---

## Existing Code Gaps to Fill

### cargoService.ts gaps

| Gap                                                             | Fix                                  |
| --------------------------------------------------------------- | ------------------------------------ |
| `CargoProviderName` does not include `'Entegi'` or `'EasyPost'` | Add to union type                    |
| `ShipmentRequest` has no `country` field for region routing     | Add `receiverCountry: string`        |
| `ShipmentRequest` has no `isReturn?: boolean`                   | Add optional field                   |
| `ShipmentResponse` has no `labelCost?: number`                  | Add for real-key billing readiness   |
| `providerRegistry` only registers PTT/Yurtici/Aras              | Register `'Entegi'` and `'EasyPost'` |
| No `routeCarrierByRegion()` export                              | Add pure function                    |

### SubOrder (order.ts) gaps

| Gap                                                | Fix                                                                   |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| `SubOrder` has no `currentTrackingStatus?: string` | Add for polling result cache                                          |
| `SubOrder` has no `estimatedDelivery?: string`     | Add ISO string from ShipmentResponse                                  |
| `SubOrder` has no `labelCost?: number`             | Add for future real-key cost tracking                                 |
| `SubOrder` has no `orderSetId` back-reference      | Check if present; add if missing (needed by cron poll query)          |
| `SubOrder` has no `buyerEmail` / `buyerName`       | These live on OrderSet (userId/userEmail) — join at notification time |

### server.ts registration needed

```typescript
// In server.ts (after registerStripeWebhook, before express.json() — same comment block):
registerCarrierWebhook(app, { adminDb });

// After express.json():
registerShippingRoutes(app, { adminDb, verifyFirebaseToken, verifySeller, verifyCronSecret });
registerReturnsRoutes(app, { adminDb, verifyFirebaseToken, verifyAdmin, verifySeller, getIyzico });
```

---

## Common Pitfalls

### Pitfall 1: EasyPost Webhook Raw Body Registration Order

**What goes wrong:** EasyPost HMAC verification fails because `express.json()` consumed the body before the raw buffer was captured.
**Why it happens:** `express.json()` replaces `req.body` with a parsed object; HMAC needs the original bytes.
**How to avoid:** Register carrier webhook route with `express.raw({ type: 'application/json' })` BEFORE `express.json()` in server.ts. Follow exact Stripe pattern (line 297 in server.ts: `registerStripeWebhook` called before `app.use(express.json())`).
**Warning signs:** `crypto.timingSafeEqual` throws `RangeError: Input buffers must have the same byte length` — means body is already a string or object.

### Pitfall 2: processedWebhooks Dedup Race Condition

**What goes wrong:** Two identical `tracker.updated` events arrive within milliseconds; both pass the pre-transaction check, both write the same SubOrder status.
**Why it happens:** Pre-transaction read is not atomic with the write.
**How to avoid:** Use the Phase 2 two-phase pattern: pre-transaction get (early exit) + inside-transaction re-check before writing the dedup marker. Already proven in iyzico.ts callback handler.

### Pitfall 3: Return Window Enforcement Bypass

**What goes wrong:** Buyer submits return request more than 14 days after delivery.
**Why it happens:** Client-side window check only; server doesn't validate.
**How to avoid:** Server-side validation: `const deliveredAt = new Date(subOrder.deliveredAt); const window = 14 * 86400 * 1000; if (Date.now() - deliveredAt.getTime() > window) return res.status(409).json({ error: 'return_window_expired' })`. Firestore rules alone cannot enforce time-based windows.

### Pitfall 4: Entegi Polling Hammering Firestore

**What goes wrong:** Polling cron queries ALL shipped SubOrders every 30 minutes regardless of age.
**Why it happens:** Simple `where('status', '==', 'shipped')` query on growing collection.
**How to avoid:** Add `where('shippedAt', '>=', thirtyDaysAgo)` filter. Add Firestore composite index on `(carrier, status, shippedAt)`.

### Pitfall 5: labelUrl Hardcoded Mock Domain in Production

**What goes wrong:** Real EasyPost label URLs are temporary S3 presigned URLs; mock URLs are non-functional.
**Why it happens:** Mock stores `https://mock-easypost.com/labels/...` directly in Firestore.
**How to avoid:** In mock mode store `/api/cargo/label/:trackingNumber` (Express route returns placeholder). In real mode, either store EasyPost's presigned URL (they expire) or download + re-upload to Firebase Storage immediately after buy. Plan for Firebase Storage re-upload in the real-key activation task.

### Pitfall 6: SubOrder Missing orderSetId Back-Reference

**What goes wrong:** Cron polling finds SubOrder docs but cannot call `transitionSubOrder(adminDb, orderSetId, subOrderId, ...)` without knowing the parent OrderSet ID.
**Why it happens:** SubOrder (order.ts) does not currently have an `orderSetId` field.
**How to avoid:** Add `orderSetId: string` to SubOrder interface and ensure it is written at SubOrder creation time. Verify in Phase 2 code before implementing cron.

---

## Validation Architecture

### Test Framework

| Property           | Value                                                       |
| ------------------ | ----------------------------------------------------------- |
| Framework          | Vitest 4.1.7                                                |
| Config file        | `vitest.config.ts` (inferred from package.json)             |
| Quick run command  | `npx vitest run server/services/__tests__/shipping.test.ts` |
| Full suite command | `npx vitest run`                                            |

### Phase Requirements → Test Map

| Req ID | Behavior                                                                            | Test Type   | Automated Command                                           | File Exists? |
| ------ | ----------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------- | ------------ |
| SHP-01 | MockEntegiProvider.createShipment returns trackingNumber + labelUrl                 | unit        | `npx vitest run server/services/__tests__/shipping.test.ts` | ❌ Wave 0    |
| SHP-02 | MockEasyPostProvider.createShipment + getTracking returns correct shapes            | unit        | same                                                        | ❌ Wave 0    |
| SHP-02 | routeCarrierByRegion('TR') === 'Entegi', routeCarrierByRegion('DE') === 'EasyPost'  | unit        | same                                                        | ❌ Wave 0    |
| SHP-03 | Shipment creation writes trackingNumber + carrier to SubOrder                       | integration | same                                                        | ❌ Wave 0    |
| SHP-04 | Entegi poll: when tracking.delivered=true → transitionOrder confirm_delivery called | unit        | same                                                        | ❌ Wave 0    |
| SHP-05 | Return request rejected when > 14 days from deliveredAt                             | unit        | `npx vitest run server/services/__tests__/returns.test.ts`  | ❌ Wave 0    |
| SHP-05 | Return approval calls processRefund with correct subOrderId                         | unit        | same                                                        | ❌ Wave 0    |

### Wave 0 Gaps

- [ ] `server/services/__tests__/shipping.test.ts` — covers SHP-01, SHP-02, SHP-03, SHP-04
- [ ] `server/services/__tests__/returns.test.ts` — covers SHP-05 (window enforcement + processRefund wire-up)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category       | Applies       | Standard Control                                                                                                                                                    |
| ------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication   | yes           | verifyFirebaseToken on all shipment/return endpoints                                                                                                                |
| V4 Access Control   | yes           | sellerId ownership check (seller can only ship their own SubOrders); buyer ownership check (buyer can only request return on own SubOrder); admin-only for approval |
| V5 Input Validation | yes           | zod/joi schema validation on shipment create + return request payloads                                                                                              |
| V6 Cryptography     | yes (webhook) | `crypto.timingSafeEqual` for EasyPost HMAC; never compare signatures with `===`                                                                                     |

### Known Threat Patterns

| Pattern                                       | STRIDE                 | Standard Mitigation                                                              |
| --------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| Seller ships another seller's SubOrder        | Elevation of Privilege | `subOrder.sellerId === req.uid` check (same as Phase 2 transition endpoint)      |
| Buyer submits return on another buyer's order | Elevation of Privilege | `subOrder.buyerId === req.uid` (or `orderSet.userId === req.uid`) check          |
| Replay of EasyPost webhook event              | Tampering              | `processedWebhooks` dedup on `event.id` (evt\_...)                               |
| Fake EasyPost webhook (forged POST)           | Spoofing               | HMAC verification with `X-Hmac-Signature` header + `crypto.timingSafeEqual`      |
| Return window bypass                          | Tampering              | Server-side `Date.now() - deliveredAt > 14 days` check; client cannot be trusted |
| Cron endpoint called without auth             | Elevation of Privilege | `verifyCronSecret` middleware (same as payout/abandoned-cart crons)              |

---

## Assumptions Log

| #   | Claim                                                                          | Section                       | Risk if Wrong                                                                                                      |
| --- | ------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| A1  | Entegi (entegi.com) does not have a public developer API for shipment creation | Standard Stack + Architecture | If Entegi does have a private API, the mock contract may differ from real shape — low impact since it's mock-first |
| A2  | Entegi does not support webhooks — polling only                                | Architecture Patterns         | If Entegi supports webhooks, polling cron becomes optional; low impact (polling still works)                       |
| A3  | EasyPost return shipment uses `is_return: true` flag on Shipment.create        | Code Examples                 | If return labels use a different endpoint, real EasyPostProvider needs update — mock unaffected                    |
| A4  | SubOrder does not have `orderSetId` back-reference                             | Code Gaps                     | Must verify in actual SubOrder documents; if missing, add field and backfill or join via query                     |
| A5  | Delay notification uses existing emailService (new template or repurposed)     | Architecture                  | emailService.ts does not currently have a sendDelayNotificationEmail; needs new function added                     |

---

## Environment Availability

| Dependency                  | Required By                       | Available     | Version                   | Fallback                            |
| --------------------------- | --------------------------------- | ------------- | ------------------------- | ----------------------------------- |
| Node.js                     | Server runtime                    | ✓             | >=22 (project constraint) | —                                   |
| Firebase Admin              | Firestore + Storage               | ✓             | 13.10.0                   | —                                   |
| Vitest                      | Unit tests                        | ✓             | 4.1.7                     | —                                   |
| `@easypost/api`             | Real EasyPost provider (deferred) | Not installed | —                         | Mock provider (Phase 5 default)     |
| EASYPOST_API_KEY env        | Real EasyPost calls               | Not set       | —                         | Mock mode (Phase 5 default)         |
| ENTEGI_API_KEY env          | Real Entegi calls                 | Not set       | —                         | Mock mode (Phase 5 default)         |
| EASYPOST_WEBHOOK_SECRET env | EasyPost webhook HMAC             | Not set       | —                         | Skip HMAC verification in mock mode |

**Missing dependencies with no fallback:** None — all real-key dependencies are intentionally deferred (D-01).

**Missing dependencies with fallback:** `@easypost/api` — mock provider used instead.

---

## Open Questions

1. **Does SubOrder have `orderSetId`?**
   - What we know: SubOrder interface in order.ts does not show this field; it's needed by the cron poll to call transitionSubOrder.
   - What's unclear: Whether the field exists in actual Firestore documents even if not in the TypeScript type.
   - Recommendation: Add `orderSetId: string` to SubOrder interface in Wave 0 and verify Firestore documents have it (grep Phase 2 SubOrder creation code).

2. **What should `sendDelayNotificationEmail` look like?**
   - What we know: `sendDeliveryConfirmationEmail` and `sendRefundNotificationEmail` exist; `sendShippingUpdateEmail` exists.
   - What's unclear: Whether a delay notification HTML template already exists in the email template file, or needs to be added.
   - Recommendation: Add `sendDelayNotificationEmail(orderSetId, customerEmail, customerName, estimatedDelivery, carrier)` to emailService.ts and a matching HTML template. This is Claude's discretion.

3. **Seller address for shipment creation (from_address)?**
   - What we know: ShipmentRequest has `senderName/senderAddress/senderCity/senderPhone` — but where does this come from at shipment creation time?
   - What's unclear: Whether seller profile has a stored pickup/warehouse address in Firestore.
   - Recommendation: Read seller's store address from `sellers/{sellerId}` document at shipment creation time. Add a `sellerAddress` field requirement to the shipment creation request validation.

---

## Sources

### Primary (HIGH confidence)

- [docs.easypost.com/docs/trackers](https://docs.easypost.com/docs/trackers) — tracker object fields, test mode codes, webhook event types
- [docs.easypost.com/docs/shipments](https://docs.easypost.com/docs/shipments) — shipment create, buy, return label shape
- [docs.easypost.com/guides/webhooks-guide](https://docs.easypost.com/guides/webhooks-guide) — X-Hmac-Signature header, HMAC verification, idempotency recommendation
- [github.com/EasyPost/easypost-node](https://github.com/EasyPost/easypost-node) — Node SDK install, client init, Shipment.create + buy pattern
- npm registry (`npm view @easypost/api version`) — confirmed v8.8.0 [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)

- Phase 2 SUMMARY files (02-02, 02-05) — processedWebhooks pattern, refundService API, transitionEngine usage
- `src/services/cargoService.ts` — existing CargoProvider interface, gap analysis
- `src/types/order.ts` — SubOrder/OrderSet fields, status unions
- `server/services/emailService.ts` — existing email functions (sendDeliveryConfirmationEmail confirmed)
- `server.ts` — cron pattern (verifyCronSecret), webhook registration order pattern

### Tertiary (LOW confidence / ASSUMED)

- Entegi API shape — no public docs found; mock contract is designed assumption [ASSUMED]
- EasyPost `is_return: true` shipment flag — inferred from API structure, not directly verified [ASSUMED]

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — EasyPost SDK verified via npm + official GitHub; existing cargoService.ts verified in codebase
- Architecture: HIGH — patterns derived from existing Phase 2 code (Stripe webhook, verifyCronSecret cron, processedWebhooks dedup, refundService)
- Pitfalls: HIGH — raw body ordering pitfall is a known Express gotcha; confirmed by Stripe pattern in this codebase
- Entegi API: LOW — no public docs; mock contract is designed assumption

**Research date:** 2026-06-04
**Valid until:** 2026-07-04 (EasyPost SDK stable; Entegi assumption indefinite until contracted)
