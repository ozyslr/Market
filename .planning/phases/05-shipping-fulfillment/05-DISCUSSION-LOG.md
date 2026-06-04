# Phase 5: Shipping & Fulfillment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-04
**Phase:** 5-shipping-fulfillment
**Areas discussed:** Carrier integration depth, Live tracking mechanism, Shipment creation flow, Returns workflow & approval

---

## Carrier Integration Depth (Entegi TR + EasyPost EU)

| Option                                 | Description                                                                                                                               | Selected |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Mock-first behind existing abstraction | Add Entegi+EasyPost providers to cargoService CargoProvider iface, mock responses; real keys deferred (swap via env). Zero external cost. | ✓        |
| EasyPost real, Entegi mock             | EU real (account + per-label cost); TR mock until contract.                                                                               |          |
| Both real now                          | Full production; carrier accounts/contracts + per-label cost now.                                                                         |          |

**User's choice:** Mock-first behind existing abstraction
**Notes:** Consistent with the cost-lean Typesense-deferral decision; build full flow now, swap real keys later.

---

## Live Tracking Mechanism (SHP-03/04)

| Option                                             | Description                                                         | Selected |
| -------------------------------------------------- | ------------------------------------------------------------------- | -------- |
| Hybrid (webhook where supported, polling fallback) | EasyPost webhook push; Entegi cron polling pull; simulated in mock. | ✓        |
| Polling only (cron)                                | Single mechanism, simpler; status/delay can lag minutes.            |          |
| Webhook only                                       | Push only; gaps if Entegi lacks webhooks.                           |          |

**User's choice:** Hybrid (webhook where available, polling fallback)
**Notes:** Mirrors Phase 4 sync resilience pattern.

---

## Shipment Creation Flow

| Option                                              | Description                                                                                    | Selected |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| Manual "Kargola + etiket al" from seller order page | Seller triggers label fetch → trackingNumber+label, SubOrder → Shipped via Phase 2 transition. | ✓        |
| Auto label on payment                               | Label bought at payment confirmation; misaligned with real packing.                            |          |
| You decide                                          | Claude's discretion.                                                                           |          |

**User's choice:** Manual seller-initiated label creation
**Notes:** Matches real packing workflow; reuses existing order transition engine.

---

## Returns Workflow & Approval (SHP-05)

| Option                                                                | Description                                                                                     | Selected |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------- |
| Buyer request → seller/admin approval → Phase 2 refund, 14-day window | On approval, existing refund + commission-reversal engine (02-05) runs; return label generated. | ✓        |
| Auto-approval (request = instant label + refund)                      | Fast but abuse-prone.                                                                           |          |
| Request + track only (refund manual, no automation this phase)        | Minimal scope.                                                                                  |          |

**User's choice:** Buyer request → seller/admin approval → Phase 2 refund, 14-day window
**Notes:** Reuses existing money-movement infrastructure; controlled and abuse-resistant.

## Claude's Discretion

- Region detection precision for carrier routing (country from ShippingAddress).
- Shipping-cost-bearer data model (buyer pays SubOrder.shippingCost at checkout; platform/seller label purchase — no real cost in mock mode).
- Delay-notification threshold + channel (default: past estimatedDelivery, via emailService).
- Returns data model (new `returns` collection vs SubOrder status), return-reason enum, return-label call.
- EasyPost webhook signature verification + idempotency (reuse Phase 2 pattern).

## Deferred Ideas

- Real Entegi/EasyPost API keys + live carrier accounts (swap behind abstraction when ready).
- Multi-package / partial shipments per SubOrder.
- Automatic restocking on return completion.
- Multi-currency shipping cost display (Phase 6).
