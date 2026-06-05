---
phase: 08-admin-access-control
plan: 01
type: execute
subsystem: authz
tags: [admin, rbac, middleware, custom-claims]
requires: []
provides: [AdminRole type, requireAdminRole middleware]
affects: [authMiddleware.ts, server.ts, payout routes, refund routes]
tech-stack:
  added: []
  patterns: [express-middleware-factory, firebase-custom-claims-rbac]
key-files:
  created:
    - src/lib/authMiddleware.test.ts
  modified:
    - src/types.ts
    - src/lib/authMiddleware.ts
    - server.ts
    - server/routes/payouts.ts
    - server/routes/refund.ts
decisions:
  - AdminRole enum (super-admin | support | finance) stored in Firebase custom claims
  - requireAdminRole middleware enforces sub-role with super-admin superset
  - set-claims validates adminRole at persistence time (server-side only)
  - Finance endpoints (payout, refund, cancel-order) now require requireAdminRole('finance')
metrics:
  duration: 12min
  completed-date: 2026-06-05
---

# Phase 8 Plan 1: Admin Role Type + RBAC Middleware + Authz Audit Summary

**One-liner:** Backend admin RBAC foundation: AdminRole enum, requireAdminRole sub-role middleware with super-admin superset, set-claims adminRole persistence, and finance-endpoint hardening.

## Tasks Executed

| #   | Task                                                          | Type       | Commit                         | Verification                            |
| --- | ------------------------------------------------------------- | ---------- | ------------------------------ | --------------------------------------- |
| 1   | AdminRole type + requireAdminRole middleware                  | TDD (auto) | 0189c11 (RED), 255b33e (GREEN) | 5/5 tests pass, tsc clean               |
| 2   | set-claims adminRole persistence + admin endpoint authz audit | auto       | 27aca15                        | tsc clean, all admin endpoints verified |

## Admin Endpoint Audit Coverage

| Route Group | Endpoint                       |       verifyAdmin        |      requireAdminRole      | Status         |
| ----------- | ------------------------------ | :----------------------: | :------------------------: | -------------- |
| set-claims  | POST /api/admin/set-claims     |      YES (existing)      | N/A (super-admin managed)  | Covered        |
| get-claims  | GET /api/admin/get-claims/:uid |      YES (existing)      |      N/A (read-only)       | Covered        |
| commission  | /api/commission-rules/\*       |      YES (existing)      |     N/A (super-admin)      | Covered        |
| compliance  | /api/compliance/\*             |      YES (existing)      |     N/A (super-admin)      | Covered        |
| payout      | POST /api/admin/manual-payout  |      YES (existing)      |    YES (finance) — NEW     | Covered        |
| refund      | POST /api/admin/refund         |      YES (existing)      |    YES (finance) — NEW     | Covered        |
| refund      | POST /api/admin/cancel-order   |      YES (existing)      |    YES (finance) — NEW     | Covered        |
| email       | /api/email/\*                  |      YES (existing)      |     N/A (super-admin)      | Covered        |
| returns     | /api/returns/\*                |      YES (existing)      | N/A (dual finance/support) | Covered        |
| finance     | /api/finance/seller/\*         | Seller-facing (T-02-014) |            N/A             | Not admin-only |

**Result:** No verifyAdmin gaps found. All admin-only endpoints were already gated. Finance-scoped endpoints now additionally require the `finance` sub-role.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Coverage

| Threat ID                               | Mitigation                                       | Status            |
| --------------------------------------- | ------------------------------------------------ | ----------------- |
| T-08-01 (non-admin calling admin API)   | verifyAdmin on every admin endpoint              | Confirmed audited |
| T-08-02 (admin acting outside sub-role) | requireAdminRole('finance') on finance endpoints | Implemented       |
| T-08-03 (client-forged adminRole)       | adminRole lives in server-set custom claims      | Confirmed         |

## TDD Gate Compliance

- RED gate: 0189c11 (`test(08-01): add failing tests for requireAdminRole middleware`)
- GREEN gate: 255b33e (`feat(08-01): add AdminRole type and requireAdminRole middleware`)
- Both gates present and in correct order.

## Self-Check: PASSED

- [x] src/types.ts: AdminRole exported
- [x] src/lib/authMiddleware.ts: requireAdminRole exported
- [x] src/lib/authMiddleware.test.ts: 5 tests pass
- [x] server.ts: set-claims validates adminRole
- [x] server/routes/payouts.ts: requireAdminRole('finance') applied
- [x] server/routes/refund.ts: requireAdminRole('finance') applied
- [x] tsc --noEmit: clean
- [x] Commits: 0189c11, 255b33e, 27aca15 all present
