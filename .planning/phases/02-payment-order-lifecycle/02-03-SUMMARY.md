---
phase: 02-payment-order-lifecycle
plan: '03'
subsystem: email-notifications
tags: [email, resend, transactional, order-lifecycle, cart-abandonment]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [transactional-email-service, email-trigger-config-api]
  affects: [server/routes/iyzico.ts, server/routes/orders.ts, server.ts]
tech_stack:
  added: [resend@6.12.4]
  patterns: [lazy-init-provider, non-blocking-email, inline-html-templates]
key_files:
  created:
    - server/services/emailTemplates.ts
    - server/services/emailService.ts
    - server/routes/email.ts
  modified:
    - server/routes/iyzico.ts
    - server/routes/orders.ts
    - server.ts
    - src/services/emailService.ts
    - package.json
decisions:
  - 'D-03-01: Resend chosen over SendGrid (better DX, react-email native support, simpler API)'
  - 'D-03-02: Pure HTML template functions instead of React Email runtime (ESM compatibility)'
  - 'D-03-03: require() lazy-init for Resend client to allow graceful no-op without RESEND_API_KEY'
metrics:
  duration: '~45 minutes'
  completed: '2026-06-03'
  tasks_completed: 2
  files_created: 3
  files_modified: 4
requirements: [NOT-01, NOT-02, NOT-03]
---

# Phase 02 Plan 03: Transactional Email (Resend) Summary

**One-liner:** Resend-backed transactional email service with 6 HTML templates wired into Iyzico payment callback, order state machine transitions, and cart abandonment endpoint.

## Tasks Completed

| Task | Name                                                | Commit         | Key Files                                                                                                         |
| ---- | --------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| 0    | Email provider decision — Resend                    | (pre-resolved) | —                                                                                                                 |
| 1    | Install packages + create email service + templates | 238261a        | server/services/emailTemplates.ts, server/services/emailService.ts, package.json                                  |
| 2    | Wire email triggers into payment, transitions, cart | b925139        | server/routes/iyzico.ts, server/routes/orders.ts, server/routes/email.ts, server.ts, src/services/emailService.ts |

## What Was Built

### Email Templates (`server/services/emailTemplates.ts`)

Six pure HTML template functions with Mercora brand styling (#7C3AED purple, #1A1033 dark, #F8F8FA background), fully inline CSS for email client compatibility:

- `orderConfirmationHtml` — item table, totals, shipping address, CTA
- `shippingUpdateHtml` — carrier + tracking number display
- `deliveryConfirmationHtml` — delivery confirmed with review CTA
- `refundNotificationHtml` — refund amount with 3-5 day timeline
- `newSellerOrderHtml` — seller-facing new order summary + CTA
- `abandonedCartHtml` — product list with "Sepetinde N urun kaldi!" headline

### Email Service (`server/services/emailService.ts`)

- `sendEmail()` core sender using Resend SDK
- 6 typed convenience senders (all non-blocking — try/catch with logger.error)
- Graceful degradation: `RESEND_API_KEY` absence logs a warning and no-ops; server boots without it

### Email Route (`server/routes/email.ts`)

- `GET /api/email/trigger-config` — admin-only: read current email type config from Firestore `emailConfig/triggers`
- `POST /api/email/trigger-config` — admin-only (verifyAdmin): enable/disable specific email types (T-02-012 mitigated)

### Trigger Wiring

- **Iyzico callback** (`server/routes/iyzico.ts`): order confirmation email fires after successful payment; per-seller new-order email fires via best-effort Firestore user lookup
- **Order transition** (`server/routes/orders.ts`): shipping update email fires on `mark_shipped`; delivery confirmation fires on `delivered`
- **Cart abandonment** (`server.ts`): replaced inline Firestore `mail` collection write with `sendAbandonedCartEmail()`; default window changed from 2h to 1h (NOT-02)

### Client-side deprecation (`src/services/emailService.ts`)

`sendOrderConfirmationEmail` converted to no-op with deprecation notice — emails now fire server-side from payment callback.

## Verification

- `npx tsc --noEmit`: **PASS** (zero errors)
- Template functions: 6 exported from emailTemplates.ts
- Service senders: 6 typed + `sendEmail` core exported from emailService.ts
- Cart abandonment window: changed from `windowHours = 2` to `windowHours = 1` (verified in server.ts line ~191)
- All email sends guarded: non-blocking try/catch in every convenience sender + lazy-init no-op without API key

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Smart quotes inserted by Prettier/lint-staged in server.ts**

- **Found during:** Task 2 — tsc reported TS1127 "Invalid character" at lines 263, 270, 271
- **Issue:** Prettier converted straight ASCII apostrophes to Unicode curly quotes (U+2018/U+2019) in string literals within server.ts after the edit
- **Fix:** Node script to replace all U+2018/U+2019 with straight quotes in server.ts
- **Files modified:** server.ts
- **Outcome:** tsc passes cleanly

### Plan Adjustments

- **`react-email` / `@react-email/components` NOT installed**: Plan Task 1 mentioned installing these, but the decision to use pure HTML template functions (not React Email runtime) made them unnecessary. This was the correct approach for ESM compatibility and avoids a heavy runtime dependency.
- **`productNames` variable**: The abandoned cart handler had an unused `productNames` variable after the replacement — kept in place as it was pre-existing code not introduced by this plan.
- **Duplicate `lint-staged` check**: The objective noted a potential duplicate `lint-staged` key in package.json — inspected and confirmed only one config key exists (line 61); the line 97 reference is the devDependency. No fix required.

## Known Stubs

None — all email triggers are fully wired. Email sends will silently no-op if `RESEND_API_KEY` is not configured (intentional graceful degradation, not a stub).

## Threat Flags

None — no new network endpoints beyond the admin-only `/api/email/trigger-config` pair (already in plan threat model as T-02-012, mitigated by verifyAdmin).

## Self-Check: PASSED

- [x] `server/services/emailTemplates.ts` exists
- [x] `server/services/emailService.ts` exists
- [x] `server/routes/email.ts` exists
- [x] Commit 238261a exists (Task 1)
- [x] Commit b925139 exists (Task 2)
- [x] `npx tsc --noEmit` passes with zero errors
- [x] Cart abandonment window = 1h (NOT-02)
- [x] RESEND_API_KEY absence: graceful no-op (logger.warn, returns early)
