# Phase 5: Shipping & Fulfillment - Context

**Gathered:** 2026-06-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire carrier shipping into the existing order lifecycle: sellers create shipments + labels via a carrier abstraction (Entegi for TR, EasyPost for EU), buyers see live tracking status, the system confirms delivery and flags delays, and buyers can request and track returns. Built on top of the existing `cargoService.ts` provider abstraction and Phase 2 order/refund infrastructure — **not** a greenfield build.

Requirements covered: SHP-01 (Entegi/TR carriers), SHP-02 (EasyPost/EU carriers), SHP-03 (tracking number + live status), SHP-04 (delivery confirmation + delay notification), SHP-05 (return request + tracking flow).

**Out of scope (own phases / later):** multi-currency shipping cost display (Phase 6), reviews on delivery (Phase 7), cross-border customs/HS codes/landed cost (Phase 8). Real carrier accounts/contracts are deferred (see D-01).

</domain>

<decisions>
## Implementation Decisions

### Carrier Integration Depth (SHP-01, SHP-02)

- **D-01:** **Mock-first behind the existing abstraction.** Add `Entegi` (TR) and `EasyPost` (EU) providers implementing the existing `cargoService.ts` `CargoProvider` interface, but return realistic **mock** responses for now. Real API keys/accounts are deferred and swapped in via env vars later (mirrors the Typesense-deferral cost decision — see [[phase4-search-typesense-deferred]]). All UI and order/return flows must work end-to-end against the mocks. Keep mock providers permanently as a fallback layer (resilience pattern, like the Firestore→MOCK search fallback).
- **D-02b:** **Region-based provider routing.** Select carrier by the shipping address country: TR → Entegi, EU/other → EasyPost. Routing lives behind the abstraction so callers don't branch on region.

### Live Tracking Mechanism (SHP-03, SHP-04)

- **D-02:** **Hybrid status updates** — webhook (push) where the provider supports it (EasyPost), cron **polling** (pull) fallback otherwise (Entegi). In mock mode these are simulated. Updates drive both live status display (SHP-03) and delivery confirmation + delay notification (SHP-04).
- **D-02c:** Delivery confirmation transitions the SubOrder to `Delivered` (reusing the Phase 2 transition engine) and fires the existing delivery email; **delay notification** triggers when current time passes `estimatedDelivery` without a Delivered status (threshold + channel = Claude's discretion, default: email via existing `emailService`).

### Shipment Creation Flow

- **D-03:** **Seller-initiated, manual.** Seller clicks "Kargola + etiket al" on the seller order page when ready → the carrier provider returns `trackingNumber` + `labelUrl`, these are written to the SubOrder, and status transitions to `Shipped` via the existing Phase 2 order transition engine. Matches real packing workflow; no auto-label-on-payment.

### Returns Workflow (SHP-05)

- **D-04:** **Buyer request → seller/admin approval → refund.** Buyer opens a return request (within a **14-day window** from delivery); seller or admin approves/rejects with reason; on approval the system generates a return shipping label and triggers the **existing Phase 2 refund + commission-reversal engine (02-05)**. Controlled, abuse-resistant, reuses existing money-movement infrastructure rather than re-implementing it.

### Claude's Discretion

- Region detection precision for carrier routing (country code from `ShippingAddress`).
- Shipping-cost-bearer mechanics: buyer already pays `SubOrder.shippingCost` at checkout; how/whether platform vs seller "pays" the carrier for the label (no real cost in mock mode — planner decides the data model so it's ready for real keys).
- Delay-notification threshold and exact trigger (default: past `estimatedDelivery`, notify via `emailService`).
- Returns data model (new `returns` collection vs SubOrder status extension), return-reason enum, and return-label provider call.
- EasyPost webhook endpoint security (signature verification) and idempotency (reuse Phase 2 webhook idempotency pattern).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements

- `.planning/ROADMAP.md` § "Phase 5: Shipping & Fulfillment" — goal + 5 success criteria.
- `.planning/REQUIREMENTS.md` — SHP-01..SHP-05 definitions (Turkish).

### Existing shipping abstraction (primary reuse target)

- `src/services/cargoService.ts` — `CargoProvider` interface, mock providers (PTT/Yurtiçi/Aras/MNG/Sürat/UPS/DHL), `ShipmentRequest`/`ShipmentResponse` types. Add Entegi + EasyPost providers here (D-01).

### Order model & lifecycle (Phase 2)

- `src/types/order.ts` — `SubOrder`/`OrderSet` already carry `trackingNumber`, `carrier`, `shippedAt`, `deliveredAt`; `SubOrderStatus` includes shipped/delivered/returned.
- `.planning/phases/02-payment-order-lifecycle/02-02-*` — order transition engine + idempotent webhook pattern (reuse for status updates).
- `.planning/phases/02-payment-order-lifecycle/02-05-*` — refund + commission-reversal engine (returns plug into this, D-04).

### Notifications (Phase 2)

- `src/services/emailService.ts` — existing transactional email templates (delivery/shipping/return notices; NOT-\* requirements).

### Codebase maps

- `.planning/codebase/INTEGRATIONS.md`, `.planning/codebase/ARCHITECTURE.md` — existing integration + DI patterns for new carrier/webhook routes.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `cargoService.ts`: provider-pattern abstraction already built for exactly this — extend with Entegi/EasyPost providers; mock-first swap to real via env.
- `order.ts` SubOrder/OrderSet: shipping fields (`trackingNumber`, `carrier`, `shippedAt`, `deliveredAt`) already exist — no schema migration needed for the happy path.
- Phase 2 order transition engine + `SubOrderStatus` (shipped/delivered/returned): reuse for shipment + delivery + return transitions.
- Phase 2 refund + commission reversal (02-05): the money-movement backend for approved returns.
- `emailService.ts`: delivery/delay/return notification channel.

### Established Patterns

- Express route registration with DI `deps` object; webhook (raw body) routes registered before JSON routes (reuse for EasyPost webhook).
- Phase 2 webhook idempotency (dedup) pattern — apply to carrier status webhooks.
- Service-layer `try/catch` + graceful-degradation fallback (mock provider as permanent fallback, D-01).

### Integration Points

- New carrier providers inside `cargoService.ts` (Entegi, EasyPost) + region routing.
- New Express routes: seller "create shipment/label", carrier status webhook (EasyPost), cron polling job (Entegi), return-request + approve endpoints.
- Seller order page: "Kargola + etiket al" action → shipment creation → Shipped transition.
- Buyer order detail page: live tracking status display (SHP-03).
- Buyer + seller/admin return UI (SHP-05) wired to the Phase 2 refund engine.

</code_context>

<specifics>
## Specific Ideas

- Cost-lean stance is explicit and consistent: build the full flow now, defer paid carrier accounts/keys (D-01) — same reasoning that deferred Typesense.
- 14-day return window from delivery (D-04).
- Region routing: TR → Entegi, EU/other → EasyPost (D-02b).

</specifics>

<deferred>
## Deferred Ideas

- **Real Entegi / EasyPost API keys + live carrier accounts** — swap behind the abstraction when business contracts/budget are ready (D-01).
- **Multi-package / partial shipments per SubOrder** — single shipment per SubOrder for now unless trivial.
- **Automatic restocking on return completion** — keep returns minimal (request → approve → refund); inventory restock automation is a later refinement.
- **Multi-currency shipping cost display** — Phase 6.

None of the above are in Phase 5 scope.

</deferred>

---

_Phase: 5-shipping-fulfillment_
_Context gathered: 2026-06-04_
