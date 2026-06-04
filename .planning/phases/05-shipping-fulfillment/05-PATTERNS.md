# Phase 5: Shipping & Fulfillment - Pattern Map

**Mapped:** 2026-06-04
**Files analyzed:** 12 new/modified files
**Analogs found:** 11 / 12

---

## File Classification

| New/Modified File                                                | Role      | Data Flow        | Closest Analog                                        | Match Quality |
| ---------------------------------------------------------------- | --------- | ---------------- | ----------------------------------------------------- | ------------- |
| `src/services/cargoService.ts` (extend)                          | service   | request-response | self — existing file                                  | exact         |
| `src/types/order.ts` (extend)                                    | model     | —                | self — existing file                                  | exact         |
| `src/types/returns.ts` (new)                                     | model     | —                | `src/types/order.ts`                                  | role-match    |
| `server/routes/shipping.ts` (new)                                | route     | request-response | `server/routes/orders.ts`                             | exact         |
| `server/routes/carrierWebhook.ts` (new)                          | route     | event-driven     | `server/routes/stripe.ts` (registerStripeWebhook)     | exact         |
| `server/routes/carrierPoll.ts` (new)                             | route     | batch            | `server/routes/payouts.ts` (verifyCronSecret cron)    | exact         |
| `server/routes/returns.ts` (new)                                 | route     | request-response | `server/routes/orders.ts` + `server/routes/stripe.ts` | role-match    |
| `server/services/emailService.ts` (extend)                       | service   | request-response | self — existing file                                  | exact         |
| `src/pages/SellerOrders.tsx` (extend)                            | component | request-response | self — existing file (handleShip pattern)             | exact         |
| `src/pages/OrderTracking.tsx` (extend)                           | component | request-response | self — existing file                                  | exact         |
| `src/components/seller/ReturnManagementSection.tsx` (extend/new) | component | request-response | `src/pages/SellerOrders.tsx`                          | role-match    |
| `server/services/__tests__/shipping.test.ts` (new)               | test      | —                | `server/services/__tests__/refundService.test.ts`     | role-match    |

---

## Pattern Assignments

### `src/services/cargoService.ts` — extend existing (service, request-response)

**Analog:** self — `src/services/cargoService.ts`

**Type union extension** (line 11 — ADD `'Entegi' | 'EasyPost'`):

```typescript
// BEFORE:
export type CargoProviderName = 'PTT' | 'Yurtici' | 'Aras' | 'MNG' | 'Surat' | 'UPS' | 'DHL';
// AFTER:
export type CargoProviderName =
  | 'PTT'
  | 'Yurtici'
  | 'Aras'
  | 'MNG'
  | 'Surat'
  | 'UPS'
  | 'DHL'
  | 'Entegi'
  | 'EasyPost';
```

**ShipmentRequest additions** (lines 13–29 — ADD three fields):

```typescript
export interface ShipmentRequest {
  // ... existing fields ...
  receiverCountry: string; // ADD — for region routing (country code e.g. 'TR', 'DE')
  isReturn?: boolean; // ADD — flags return label creation
  labelCost?: number; // ADD — real-key billing readiness
}
```

**ShipmentResponse addition** (lines 31–40 — ADD one field):

```typescript
export interface ShipmentResponse {
  // ... existing fields ...
  labelCost?: number; // ADD — carrier charge for the label
}
```

**Mock provider class pattern** (lines 119–167 MockPttProvider — COPY structure exactly):

```typescript
class MockEntegiProvider implements CargoProvider {
  name: CargoProviderName = 'Entegi';

  async createShipment(req: ShipmentRequest): Promise<ShipmentResponse> {
    await delay(350);
    const tracking = `EN${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const days = 1 + Math.floor(Math.random() * 3);
    return {
      success: true,
      trackingNumber: tracking,
      provider: 'Entegi',
      labelUrl: `/api/cargo/label/${tracking}`, // relative path — works in mock + real
      estimatedDelivery: new Date(Date.now() + days * 86400000).toISOString(),
      shippingCost: 30 + Math.random() * 20,
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
    return `/api/cargo/label/${trackingNumber}`;
  }
  async cancelShipment(_t: string): Promise<boolean> {
    return true;
  }
  async getRates(_o: string, _d: string, weight: number): Promise<ShippingRate[]> {
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

**Provider registry extension** (lines 263–278 — ADD two registrations):

```typescript
// Inside getProviders(), after existing registrations:
providerRegistry.set('Entegi', new MockEntegiProvider());
providerRegistry.set('EasyPost', new MockEasyPostProvider());
```

**Region routing function** (ADD after registry block):

```typescript
export function routeCarrierByRegion(country: string): CargoProviderName {
  return country === 'TR' ? 'Entegi' : 'EasyPost';
}
```

---

### `src/types/order.ts` — extend existing (model)

**Analog:** self — `src/types/order.ts`

**SubOrder additions** (lines 56–72 — ADD four fields):

```typescript
export interface SubOrder {
  // ... existing fields (id, sellerId, items, subtotal, shippingCost, commission,
  //     payoutAmount, status, trackingNumber, carrier, shippedAt, deliveredAt, version,
  //     createdAt, updatedAt) ...
  orderSetId: string; // ADD — back-reference needed by cron poll
  currentTrackingStatus?: string; // ADD — polling result cache
  estimatedDelivery?: string; // ADD — ISO string from ShipmentResponse
  labelCost?: number; // ADD — label billing readiness
}
```

**Note:** `ShippingAddress.country` (line 106) is already typed as `string` — no change needed. Use it as the region routing input.

---

### `src/types/returns.ts` — new file (model)

**Analog:** `src/types/order.ts` (lines 1–86 — interface + union type pattern)

**Copy pattern:** union type + interface with optional fields:

```typescript
// COPY PATTERN from src/types/order.ts (SubOrderStatus union + SubOrder interface shape)
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
  approvedBy?: string;
  rejectionReason?: string;
  refundId?: string;
  ledgerEntryIds?: string[];
  createdAt: string;
  updatedAt: string;
  windowExpiresAt: string; // deliveredAt + 14 days ISO
}
```

---

### `server/routes/shipping.ts` — new file (route, request-response)

**Analog:** `server/routes/orders.ts` (lines 56–end)

**Deps interface + registration function pattern** (orders.ts lines 40–58):

```typescript
// Copy DI pattern from orders.ts exactly:
import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';

type Middleware = (req: any, res: any, next: any) => any;

interface ShippingRouteDeps {
  adminDb: Firestore | null;
  verifyFirebaseToken: Middleware;
  verifySeller: Middleware;
}

export function registerShippingRoutes(app: Express, deps: ShippingRouteDeps): void {
  const { adminDb, verifyFirebaseToken, verifySeller } = deps;

  // POST /api/orders/:orderSetId/subOrders/:subOrderId/ship
  app.post(
    '/api/orders/:orderSetId/subOrders/:subOrderId/ship',
    verifyFirebaseToken,
    verifySeller,
    async (req, res) => {
      try {
        // 1. Load subOrder, verify sellerId === req.uid
        // 2. routeCarrierByRegion(shippingAddress.country) → providerName
        // 3. createCargoShipment(providerName, shipmentReq)
        // 4. Write trackingNumber + carrier + estimatedDelivery + labelUrl to SubOrder
        // 5. transitionOrder(subOrder, 'mark_shipped', version)
        // 6. sendShippingUpdateEmail (non-blocking)
        res.json({ trackingNumber, labelUrl });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    },
  );
}
```

**Error handling pattern** — copy from `server/routes/orders.ts` try/catch shape:

```typescript
// Every handler:
try {
  // ... logic ...
} catch (err: any) {
  logger.error('shipping', 'route failed', { error: err.message });
  res.status(err.statusCode ?? 500).json({ error: err.message });
}
```

---

### `server/routes/carrierWebhook.ts` — new file (route, event-driven)

**Analog:** `server/routes/stripe.ts` lines 44–63 (`registerStripeWebhook`)

**Raw-body webhook registration pattern** (stripe.ts lines 44–64 — COPY exactly):

```typescript
// Analog: server/routes/stripe.ts lines 44-47
// MUST register before express.json() in server.ts (same comment as Stripe)
export function registerCarrierWebhook(app: Express, deps: CarrierWebhookDeps): void {
  app.post(
    '/api/carrier/easypost/webhook',
    express.raw({ type: 'application/json' }), // ← raw body, matches Stripe pattern
    async (req, res) => {
      const secret = process.env.EASYPOST_WEBHOOK_SECRET ?? '';
      const signature = req.headers['x-hmac-signature'] as string;
      if (secret && !validateEasyPostHmac(secret, signature, req.body)) {
        return res.status(403).json({ error: 'invalid signature' });
      }
      const event = JSON.parse(req.body.toString());
      // ... dedup + process (see Shared Patterns: Webhook Dedup below)
    },
  );
}
```

**server.ts registration** — add BEFORE `app.use(express.json())` at line 297:

```typescript
// server.ts line 297 area (after registerStripeWebhook, before express.json()):
registerCarrierWebhook(app, { adminDb });
```

---

### `server/routes/carrierPoll.ts` — new file (route, batch)

**Analog:** `server/routes/payouts.ts` lines 15–22 + `server.ts` lines 189, 406

**verifyCronSecret cron endpoint pattern** (server.ts line 189 / payouts.ts line 21):

```typescript
// Copy pattern from payouts.ts: registerPayoutRoutes(app, { adminDb, verifyAdmin, verifyCronSecret, ... })
export function registerCarrierPollRoutes(app: Express, deps: CarrierPollDeps): void {
  const { adminDb, verifyCronSecret } = deps;

  // Entegi polling — triggered by external cron every 30 min
  app.post('/api/carrier/entegi/poll', verifyCronSecret, async (req, res) => {
    // Query SubOrders: carrier='Entegi', status='shipped', shippedAt >= 30 days ago
    // For each: getTrackingStatus, if delivered → transitionOrder('confirm_delivery')
    // else update currentTrackingStatus
  });

  // Delay notification check — triggered by external cron
  app.post('/api/carrier/check-delays', verifyCronSecret, async (req, res) => {
    // Query SubOrders: status='shipped', estimatedDelivery < now, no deliveredAt
    // sendDelayNotificationEmail (non-blocking)
  });
}
```

---

### `server/routes/returns.ts` — new file (route, request-response)

**Analog:** `server/routes/orders.ts` (DI pattern) + `server/routes/stripe.ts` (auth guard pattern)

**Deps + route registration pattern** (orders.ts lines 40–58):

```typescript
interface ReturnsRouteDeps {
  adminDb: Firestore | null;
  verifyFirebaseToken: Middleware;
  verifyAdmin: Middleware;
  verifySeller: Middleware;
  getIyzico: () => Promise<unknown>;
}

export function registerReturnsRoutes(app: Express, deps: ReturnsRouteDeps): void {
  // POST /api/orders/:orderSetId/subOrders/:subOrderId/return-request
  // verifyFirebaseToken — buyer creates return
  // Guard: subOrder.status === 'delivered' && 14-day window check
  // POST /api/returns/:returnId/approve
  // verifyFirebaseToken + verifySeller (or verifyAdmin)
  // Calls: refundService.processRefund(adminDb, getIyzico, { orderSetId, subOrderId, isFullRefund: true })
  // POST /api/returns/:returnId/reject
  // verifyFirebaseToken + verifySeller (or verifyAdmin)
}
```

**14-day window server-side guard pattern** (new — no analog, derive from date math):

```typescript
// Inside return-request handler:
const deliveredAt = new Date(subOrder.deliveredAt!);
const WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
if (Date.now() - deliveredAt.getTime() > WINDOW_MS) {
  return res.status(409).json({ error: 'return_window_expired' });
}
```

**processRefund call pattern** (refundService.ts lines 61–65):

```typescript
// Copy call signature from server/services/refundService.ts line 61
const result = await processRefund(adminDb, getIyzico, {
  orderSetId,
  subOrderId,
  isFullRefund: true,
  reason: returnDoc.reason,
});
// Then: update returns/{returnId} with { status: 'refunded', refundId: result.refundId }
```

---

### `server/services/emailService.ts` — extend existing (service, request-response)

**Analog:** self — existing `sendDeliveryConfirmationEmail` (lines 136–158) and `sendShippingUpdateEmail` (lines 108–134)

**Add `sendDelayNotificationEmail`** — copy signature + try/catch + logger.error shape from lines 136–158:

```typescript
// Copy pattern from sendDeliveryConfirmationEmail (emailService.ts lines 136-158)
export async function sendDelayNotificationEmail(
  orderSetId: string,
  customerEmail: string,
  customerName: string,
  estimatedDelivery: string,
  carrier: string,
): Promise<void> {
  try {
    const html = delayNotificationHtml({
      // new HTML template function
      orderSetId,
      customerName,
      estimatedDelivery,
      carrier,
      orderUrl: `${APP_URL}/orders/${orderSetId}`,
    });
    await sendEmail({
      to: customerEmail,
      subject: `Siparişiniz Gecikmeli — #${orderSetId.slice(0, 8).toUpperCase()}`,
      html,
    });
  } catch (err: any) {
    logger.error('email', 'sendDelayNotificationEmail failed (non-blocking)', {
      orderSetId,
      error: err.message,
    });
  }
}
```

---

### `src/pages/SellerOrders.tsx` — extend existing (component, request-response)

**Analog:** self — existing `handleShip` (lines 188–236)

**Existing handleShip pattern** (lines 188–213 — EXTEND, not replace):

```typescript
// Analog: src/pages/SellerOrders.tsx lines 188-213
const handleShip = async () => {
  if (!shipTarget || !firebaseUser) return;
  setShipping(true);
  try {
    const shipmentReq: ShipmentRequest = {
      orderId: shipTarget.id,
      // ... sender/receiver fields ...
      receiverCountry: shipTarget.shippingAddress?.country || 'TR', // ADD this field
    };
    const result = await createCargoShipment(carrier as CargoProviderName, shipmentReq);
    if (result.success) {
      await updateOrderStatus(shipTarget.id, 'shipped', {
        trackingNumber: result.trackingNumber,
        carrier,
        shippedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    /* ... */
  } finally {
    setShipping(false);
  }
};
```

**Phase 5 change:** Replace direct `updateOrderStatus` call with `POST /api/orders/:orderSetId/subOrders/:subOrderId/ship` (server route). Server handles transitionEngine + label generation. Client displays returned `trackingNumber` + `labelUrl`.

---

### `src/pages/OrderTracking.tsx` — extend existing (component, request-response)

**Analog:** self — existing file (lines 1–60 show imports/structure)

**Imports pattern** (lines 1–31):

```typescript
// Copy import pattern from OrderTracking.tsx lines 1-31:
import { getTrackingStatus } from '@/services/cargoService';
import type { TrackingResponse, CargoProviderName } from '@/services/cargoService';
import type { Order, OrderSet, SubOrder } from '@/types/order';
```

**Phase 5 additions:** Add return request form section (14-day window check client-side for UX, server validates authoritatively). Add `ReturnRequest` status display from `returns/{returnId}`.

---

### `src/components/seller/ReturnManagementSection.tsx` — new/extend (component, request-response)

**Analog:** `src/pages/SellerOrders.tsx` (lines 1–60, component structure + auth pattern)

**Component structure pattern** (SellerOrders.tsx lines 47–60):

```typescript
// Copy component skeleton from SellerOrders.tsx:
export function ReturnManagementSection() {
  const { firebaseUser } = useAuth();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch returns where sellerId === firebaseUser.uid
  // Render approve/reject actions
}
```

---

### `server/services/__tests__/shipping.test.ts` — new file (test)

**Analog:** `server/services/__tests__/refundService.test.ts` (lines 142–147 show static import pattern)

**Test file structure pattern:**

```typescript
// Copy from refundService.test.ts: static import at top, vi.mock for adminDb
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCargoShipment, getTrackingStatus, routeCarrierByRegion } from '../../../src/services/cargoService.js';

describe('MockEntegiProvider', () => {
  it('createShipment returns trackingNumber and labelUrl', async () => { ... });
  it('getTracking returns delivered=true eventually', async () => { ... });
});
describe('routeCarrierByRegion', () => {
  it("'TR' routes to Entegi", () => expect(routeCarrierByRegion('TR')).toBe('Entegi'));
  it("'DE' routes to EasyPost", () => expect(routeCarrierByRegion('DE')).toBe('EasyPost'));
});
```

---

## Shared Patterns

### Auth Middleware Guards

**Source:** `server.ts` lines 182–183 + `server/routes/orders.ts` lines 40–58
**Apply to:** All new route files (`shipping.ts`, `returns.ts`)

```typescript
// From server.ts lines 182-183 — destructure from createAuthMiddlewares:
const { verifyFirebaseToken, verifyAdmin, verifySeller, verifyCronSecret } =
  createAuthMiddlewares(adminAuth);
// Pass into registerXxxRoutes(app, { adminDb, verifyFirebaseToken, verifySeller, ... })
```

### Webhook Dedup (processedWebhooks)

**Source:** `server/routes/iyzico.ts` lines 188–207
**Apply to:** `server/routes/carrierWebhook.ts` (EasyPost webhook handler)

```typescript
// Analog: iyzico.ts lines 188-207 — two-phase dedup (pre-check + inside transaction)
const eventId = event.id; // evt_...
const dedupRef = adminDb.collection('processedWebhooks').doc(eventId);
const dedupSnap = await dedupRef.get();
if (dedupSnap.exists) {
  logger.info('carrier', 'Duplicate webhook ignored', { eventId });
  return res.status(200).json({ received: true, duplicate: true });
}
// Inside transaction: re-check + set dedup marker atomically
await adminDb.runTransaction(async (txn) => {
  const snapTxn = await txn.get(dedupRef);
  if (snapTxn.exists) return;
  txn.set(dedupRef, { eventId, provider: 'easypost', processedAt: new Date().toISOString() });
  // ... update SubOrder status ...
});
```

### verifyCronSecret Endpoint Pattern

**Source:** `server.ts` line 189 (abandoned-cart) + `server/routes/payouts.ts` lines 21–22
**Apply to:** `server/routes/carrierPoll.ts` (Entegi poll + delay check)

```typescript
// Analog: payouts.ts line 21
app.post('/api/carrier/entegi/poll', verifyCronSecret, async (req, res) => { ... });
app.post('/api/carrier/check-delays', verifyCronSecret, async (req, res) => { ... });
```

### DI Deps Object for Route Modules

**Source:** `server/routes/payouts.ts` lines 14–22
**Apply to:** All new route files

```typescript
interface XxxRouteDeps {
  adminDb: Firestore | null;
  verifyFirebaseToken: Middleware;
  // + role-specific: verifySeller, verifyAdmin, verifyCronSecret, getIyzico
}
export function registerXxxRoutes(app: Express, deps: XxxRouteDeps): void { ... }
```

### Service-Layer try/catch + Non-Blocking Email

**Source:** `server/services/emailService.ts` lines 128–133 (logger.error pattern)
**Apply to:** All email calls in cron/webhook handlers

```typescript
// Fire-and-forget: wrap in void + catch internally (emailService already does this)
void sendDeliveryConfirmationEmail(orderSetId, customerEmail, customerName);
// Never await email in webhook/cron handlers — delivery is non-blocking
```

### server.ts Route Registration Order

**Source:** `server.ts` lines 295–300
**Apply to:** `server/routes/carrierWebhook.ts` registration placement

```typescript
// server.ts registration order (lines 295-300) — ADD after registerStripeWebhook:
registerStripeWebhook(app, stripe, adminDb);
registerCarrierWebhook(app, { adminDb }); // ← ADD HERE (raw body, before json)

app.use(express.json()); // ← stays here

// After express.json():
registerShippingRoutes(app, { adminDb, verifyFirebaseToken, verifySeller });
registerReturnsRoutes(app, { adminDb, verifyFirebaseToken, verifyAdmin, verifySeller, getIyzico });
registerCarrierPollRoutes(app, { adminDb, verifyCronSecret });
```

---

## No Analog Found

| File                                                              | Role    | Data Flow | Reason                                                                                                                                        |
| ----------------------------------------------------------------- | ------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/lib/validateEasyPostHmac.ts` (utility, inline or extract) | utility | —         | No HMAC webhook verification utility exists yet; `crypto.timingSafeEqual` is standard Node — copy pattern from RESEARCH.md §HMAC Verification |

---

## Key Gaps Confirmed in Codebase

| Gap                                                                                                 | Location                                   | Fix                                           |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------- |
| `CargoProviderName` missing `'Entegi'` and `'EasyPost'`                                             | `src/services/cargoService.ts` line 11     | Extend union                                  |
| `ShipmentRequest` missing `receiverCountry`, `isReturn?`, `labelCost?`                              | `src/services/cargoService.ts` lines 13–29 | Add fields                                    |
| `SubOrder` missing `orderSetId`, `currentTrackingStatus?`, `estimatedDelivery?`, `labelCost?`       | `src/types/order.ts` lines 56–72           | Add fields                                    |
| `refundService.ts` line 88 reads `subOrderData.orderSetId` — confirms field IS expected on SubOrder | `server/services/refundService.ts` line 88 | Field must exist on SubOrder docs             |
| No `sendDelayNotificationEmail`                                                                     | `server/services/emailService.ts`          | Add new function (copy lines 136–158 pattern) |
| No `routeCarrierByRegion()` export                                                                  | `src/services/cargoService.ts`             | Add pure function after registry              |

---

## Metadata

**Analog search scope:** `src/services/`, `src/types/`, `src/pages/`, `server/routes/`, `server/services/`, `server.ts`
**Files scanned:** 12 source files read + grep across routes + pages
**Pattern extraction date:** 2026-06-04
