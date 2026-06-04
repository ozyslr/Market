---
phase: 05-shipping-fulfillment
reviewed: 2026-06-04T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/services/cargoService.ts
  - src/types/order.ts
  - src/types/returns.ts
  - server/routes/shipping.ts
  - server/routes/carrierWebhook.ts
  - server/routes/carrierPoll.ts
  - server/routes/returns.ts
  - server/services/emailService.ts
  - firestore.rules (returns collection rule)
  - server/services/__tests__/shipping.test.ts
  - server/services/__tests__/returns.test.ts
findings:
  critical: 4
  warning: 6
  info: 3
  total: 13
status: critical_resolved
---

# Phase 05: Code Review Report

**Reviewed:** 2026-06-04T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Phase 05 delivers the shipping-fulfillment pipeline: carrier abstraction (cargoService), Express routes for ship/webhook/poll/returns, a Resend email service, Firestore rules for the `returns` collection, and two test suites. The auth wiring and 14-day window guard are structurally sound. However, four blockers were found: the webhook endpoint silently accepts unauthenticated calls when `EASYPOST_WEBHOOK_SECRET` is absent; the approve route has a non-atomic double-write that can leave a return in `approved` state with no refund; the return label is generated with empty seller receiver fields; and `require('resend')` breaks the ESM module contract. Six warnings cover authorization gaps (approve/reject missing `verifySeller` middleware), the unbounded `check-delays` Firestore scan, type drift between `returns.ts` and emailService field names, and others.

---

## Critical Issues

### CR-01: Webhook bypassed when `EASYPOST_WEBHOOK_SECRET` is unset — RESOLVED (7ebe3eb)

**File:** `server/routes/carrierWebhook.ts:46`

**Issue:** The guard is `if (secret && !validateHmac(...))`. When `EASYPOST_WEBHOOK_SECRET` is empty (the "mock/dev" case the comment describes), the entire signature check is skipped and ANY caller can POST to `/api/carrier/easypost/webhook` and mark orders as delivered, transition SubOrder state, and fire confirmation emails — with no authentication whatsoever. In production the env var may not be set for the first deploy window, creating an exploitable gap.

**Fix:**

```typescript
// Replace the lenient skip with a hard fail when no secret is configured.
const secret = process.env.EASYPOST_WEBHOOK_SECRET ?? '';
if (!secret) {
  logger.error('carrier', 'EASYPOST_WEBHOOK_SECRET not configured — webhook rejected');
  return res.status(500).json({ error: 'webhook not configured' });
}
if (!validateEasyPostHmac(secret, signature, req.body as Buffer)) {
  logger.warn('carrier', 'EasyPost webhook: invalid HMAC signature');
  return res.status(403).json({ error: 'invalid signature' });
}
```

If dev/mock mode is intentional, gate on `NODE_ENV !== 'production'` explicitly rather than treating a missing secret as permission to skip.

---

### CR-02: Non-atomic approve flow — refund failure leaves `returns` doc in `approved` state — RESOLVED (e1aa8dc)

**File:** `server/routes/returns.ts:199-225`

**Issue:** The approve handler performs two sequential Firestore writes:

1. `returns/{id}` updated to `status: 'approved'` (line 199–209)
2. `processRefund(...)` called — if this throws, the doc stays `approved`
3. `returns/{id}` updated again to `status: 'refunded'` (line 219–225)

If `processRefund` throws (Stripe/Iyzico error, network timeout, etc.), the return is permanently stuck in `approved` with no refund recorded and no retry path. A subsequent call to approve the same returnId is blocked by the `status !== 'pending'` guard (line 171), so the refund can never be retried through normal flow.

**Fix:** Do not write `approved` to Firestore until the refund has succeeded. Write atomically or adopt a two-phase pattern:

```typescript
// 1. Generate label (can fail — no side effects yet)
const shipmentResp = await createCargoShipment(...);

// 2. Process refund (can fail — no side effects yet)
const refundResult = await processRefund(...);

// 3. Only now write a single terminal update
await db.collection('returns').doc(returnId).update({
  status: 'refunded',
  approvedBy: req.uid,
  returnTrackingNumber: shipmentResp.trackingNumber,
  returnLabelUrl: shipmentResp.labelUrl ?? '',
  refundId: refundResult.refundId,
  ledgerEntryIds: refundResult.ledgerEntryIds,
  updatedAt: new Date().toISOString(),
});
```

---

### CR-03: Return label created with empty seller receiver address — RESOLVED (e1aa8dc)

**File:** `server/routes/returns.ts:182-195`

**Issue:** When generating the return label (buyer ships back to seller), the `receiverName`, `receiverAddress`, `receiverCity`, and `receiverPhone` fields are all set to empty strings:

```typescript
receiverName: returnData.sellerId,  // sellerId is a UID, not a name
receiverAddress: '',
receiverCity: '',
receiverPhone: '',
```

The seller's store address is never fetched. `receiverName` is set to the raw Firebase UID string. With a real carrier API these empty fields would cause label creation to fail or produce an undeliverable label.

**Fix:** Fetch the seller document before building the shipment request:

```typescript
const sellerSnap = await db.collection('sellers').doc(returnData.sellerId).get();
const sellerData = sellerSnap.exists ? sellerSnap.data()! : {};

// then in shipment request:
receiverName: sellerData.storeName || sellerData.name || 'Satıcı',
receiverAddress: sellerData.address || sellerData.storeAddress || '',
receiverCity: sellerData.city || '',
receiverPhone: sellerData.phone || sellerData.phoneNumber || '',
```

---

### CR-04: `require('resend')` breaks ESM module contract — RESOLVED (0ae385c)

**File:** `server/services/emailService.ts:35`

**Issue:** The project's `package.json` declares `"type": "module"` (pure ESM). Using `require()` inside an `.ts` file compiled to ESM will throw `ReferenceError: require is not defined` at runtime when `RESEND_API_KEY` is set and the code path is actually exercised. Emails will never be sent in production, and the failure is silently swallowed by the surrounding `try/catch`.

**Fix:**

```typescript
// Replace synchronous require() with a dynamic ESM import
const { Resend } = await import('resend');
resendClient = new Resend(apiKey);
```

Because `getResendClient()` is already used inside `async sendEmail()`, the lazy import can be `await`ed by making `getResendClient` async or by initialising at module load via a top-level `await` in an init function.

---

## Warnings

### WR-01: Approve/reject routes lack `verifySeller` middleware — `req.isAdmin` is untrusted

**File:** `server/routes/returns.ts:149, 263`

**Issue:** Both `/api/returns/:returnId/approve` and `/api/returns/:returnId/reject` apply only `verifyFirebaseToken`, not `verifySeller`. The ownership check then reads `req.isAdmin` (line 166, 280). Unless `verifyFirebaseToken` sets `req.isAdmin`, this property will be `undefined` (falsy), so any authenticated non-seller, non-admin user who knows a `returnId` would be blocked correctly by the `sellerId !== req.uid` check — but the `isAdmin` bypass path is silently inoperative. If an admin legitimately needs to approve returns, the admin bypass never works.

**Fix:** Add `verifySeller` (or `verifyAdmin` in the middleware chain) so `req.isAdmin` and `req.isSeller` are reliably set, or verify admin status directly from the Firebase token claim in-handler:

```typescript
const isAdmin = req.token?.role === 'admin'; // if token is attached by verifyFirebaseToken
if (returnData.sellerId !== req.uid && !isAdmin) { ... }
```

---

### WR-02: SubOrder ownership not verified against `orderSetId` URL param

**File:** `server/routes/shipping.ts:44-53` and `server/routes/returns.ts:67-80`

**Issue:** In both the ship route and return-request route, the SubOrder is fetched by `subOrderId` alone without verifying that it belongs to the `orderSetId` from the URL. A seller who knows a valid `subOrderId` from a different order could potentially ship it or request returns under a spoofed `orderSetId`.

**Fix:** Add a `subOrder.orderSetId === orderSetId` check immediately after loading the SubOrder:

```typescript
if (subOrder.orderSetId !== orderSetId) {
  return res.status(404).json({ error: 'SubOrder not found' });
}
```

---

### WR-03: Unbounded Firestore full-collection scan in `check-delays`

**File:** `server/routes/carrierPoll.ts:155-165`

**Issue:** `POST /api/carrier/check-delays` fetches ALL SubOrders with `status == 'shipped'` with no date range filter, then filters in-memory for overdue ones. As the platform grows this reads an unbounded number of documents on every cron run.

**Fix:** Add an upper-bound time filter. Since `estimatedDelivery` is stored as an ISO string, Firestore can query it directly:

```typescript
const subOrdersSnap = await adminDb
  .collection('subOrders')
  .where('status', '==', 'shipped')
  .where('estimatedDelivery', '<=', now)
  .where('shippedAt', '>=', thirtyDaysAgo) // bound the scan
  .get();
// Then filter out docs where deliveredAt is already set
```

This requires a composite index on `(status, estimatedDelivery, shippedAt)`.

---

### WR-04: `sendRefundNotificationEmail` reads `orderSetDoc.customerEmail` — field does not exist on `OrderSet`

**File:** `server/routes/returns.ts:233`

**Issue:** The non-blocking email block reads `orderSetDoc?.customerEmail` and `orderSetDoc.customerName`, but the `OrderSet` type (and Firestore document) stores `userEmail` and `userName` (see `src/types/order.ts:85-86`). The email will silently never be sent because `customerEmail` is always `undefined`.

**Fix:**

```typescript
if (orderSetDoc?.userEmail) {
  await sendRefundNotificationEmail(
    returnData.orderSetId,
    orderSetDoc.userEmail as string,
    (orderSetDoc.userName as string) ?? '',
    refundResult.refundedAmount,
    refundResult.currency,
  );
}
```

---

### WR-05: `carrierWebhook` fires Firestore reads inside a transaction

**File:** `server/routes/carrierWebhook.ts:98-99`

**Issue:** Inside `adminDb.runTransaction()`, the handler calls `txn.get(adminDb.collection('subOrders').where(...))`. Firestore transactions require that all reads precede writes and that reads are done via the transaction handle. A collection-group query (`where`) inside a transaction is only supported by the Admin SDK in certain configurations and is generally fragile — if the query returns many documents, any concurrent write to those docs will abort the transaction. The comment says "two-phase dedup" but the actual dedup write happens in the same transaction that also queries and updates unrelated subOrders, making transaction aborts likely under concurrent webhook traffic.

**Fix:** Separate the dedup transaction from the business logic:

1. Run a short transaction that only claims the dedup slot (set `processedWebhooks` doc).
2. After the transaction commits, run the SubOrder update as a normal (non-transactional) batch write.

---

### WR-06: `delay` function defined after it is called in ESM (hoisting gap)

**File:** `src/services/cargoService.ts:500-502`

**Issue:** The `delay()` helper is defined at line 500, but it is called inside class method bodies (e.g., `MockPttProvider.createShipment` at line 186, `MockYurticiProvider` at line 249, etc.) which are defined starting at line 182. In ESM with `class` declarations this works at runtime because class bodies are not evaluated until instantiation — but the ordering is a code-quality trap: if `delay` were a plain function called at module-top-level it would fail. Keeping the helper near the top (before its first use) is the convention in this codebase.

**Fix:** Move `delay()` to before the `STATUS_CHAINS` constant at line 99.

---

## Info

### IN-01: `ReturnRequest` type duplicated — drift risk between `src/types/returns.ts` and any inline type in `returnService.ts`

**File:** `src/types/returns.ts`

**Issue:** The focus areas note a potential dual `ReturnRequest` definition. `src/types/returns.ts` is the canonical definition and is correctly imported by `server/routes/returns.ts`. If `src/services/returnService.ts` declares its own local `ReturnRequest`, the two can drift. The server route already imports from `src/types/returns.ts` (line 6), which is correct — but the client-side service file was not in scope for this review. Flag for verification.

**Fix:** Confirm `src/services/returnService.ts` re-exports or imports from `src/types/returns.ts` rather than declaring its own interface.

---

### IN-02: `getAvailableCarriers()` advertises carriers not registered in the provider registry

**File:** `src/services/cargoService.ts:556-566`

**Issue:** `getAvailableCarriers()` returns PTT, Yurtici, Aras, MNG, Surat, UPS, DHL — but `getProviders()` only registers PTT, Yurtici, Aras, Entegi, EasyPost. MNG, Surat, UPS, and DHL are not registered; calling `createCargoShipment('MNG', ...)` silently falls back to PTT (line 495: `|| getProviders().get('PTT')!`). The UI carrier selector would present options that route to PTT without any indication.

**Fix:** Either register mock providers for the missing carriers, or filter `getAvailableCarriers()` to only return registered carrier names:

```typescript
export function getAvailableCarriers() {
  const registry = getProviders();
  return [...registry.keys()].map((name) => ({ name, label: name }));
}
```

---

### IN-03: `returns.test.ts` has a skipped test for the critical refund wire-up path

**File:** `server/services/__tests__/returns.test.ts:33`

**Issue:** The test for `approval calls processRefund` is marked `it.todo(...)`. This is the exact path where CR-02 lives. There is no integration test asserting that approval atomically produces a refund.

**Fix:** Implement the todo test, mocking `processRefund` and verifying: (a) it is called with the correct `{ orderSetId, subOrderId, isFullRefund: true }`; (b) a Firestore update to `status: 'refunded'` is made; (c) if `processRefund` throws, the return doc is not left in `approved` state.

---

_Reviewed: 2026-06-04T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
