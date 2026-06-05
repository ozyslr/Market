---
phase: 08-admin-access-control
plan: 02
type: execute
subsystem: authz
tags: [admin, rbac, client-guard, sidebar, custom-claims]
requires: ['08-01']
provides: [AdminRoute component, adminRole in AuthContext, sub-role nav gating]
affects: [AuthContext.tsx, App.tsx, AdminDashboard.tsx, Home.tsx]
tech-stack:
  added: []
  patterns: [react-route-guard, firebase-custom-claims-client, sub-role-nav-visibility]
key-files:
  created:
    - src/components/auth/AdminRoute.tsx
  modified:
    - src/context/AuthContext.tsx
    - src/App.tsx
    - src/pages/AdminDashboard.tsx
    - src/pages/Home.tsx
decisions:
  - AdminRoute redirects to '/' with notice via location.state (no dedicated 403 page per D-ADM-02)
  - Home.tsx displays access notice as a red banner (no existing toast pattern found)
  - AdminDashboard sidebar uses isSectionVisible() with Set-based role maps per CONTEXT D-ADM-01
  - Campaigns sidebar item mapped to finance (was in CONTEXT as "Campaigns")
metrics:
  duration: TBD
  completed-date: 2026-06-05
---

# Phase 8 Plan 2: Client Access Control + Admin Nav Summary

**One-liner:** Client-side admin access control with AdminRoute guard, sub-role-gated sidebar navigation, and adminRole exposed from Firebase custom claims in AuthContext.

## Tasks Executed

| #   | Task                                        | Type | Commit  | Verification |
| --- | ------------------------------------------- | ---- | ------- | ------------ |
| 1   | Expose adminRole from claims in AuthContext | auto | b97398e | tsc clean    |
| 2   | AdminRoute guard + wrap /admin/\* routes    | auto | cb21cc8 | tsc clean    |
| 3   | Gate admin nav by sub-role                  | auto | 1bd2138 | tsc clean    |

## Sub-Role Nav Visibility Map

| Sidebar Section | super-admin | finance | support |
| --------------- | :---------: | :-----: | :-----: |
| dashboard       |     yes     |   yes   |   yes   |
| users           |     yes     |    -    |   yes   |
| sellers         |     yes     |    -    |   yes   |
| products        |     yes     |    -    |    -    |
| orders          |     yes     |   yes   |    -    |
| returns         |     yes     |   yes   |   yes   |
| campaigns       |     yes     |   yes   |    -    |
| deals           |     yes     |   yes   |    -    |
| coupons         |     yes     |   yes   |    -    |
| tiers           |     yes     |    -    |    -    |
| cms             |     yes     |    -    |    -    |
| payments        |     yes     |   yes   |    -    |
| finance         |     yes     |   yes   |    -    |
| reports         |     yes     |   yes   |    -    |
| analytics       |     yes     |   yes   |    -    |
| reviews         |     yes     |    -    |   yes   |
| livechat        |     yes     |    -    |   yes   |
| support         |     yes     |    -    |   yes   |
| languages       |     yes     |    -    |    -    |
| settings        |     yes     |    -    |    -    |
| integrations    |     yes     |    -    |    -    |
| webhooks        |     yes     |    -    |    -    |
| audit           |     yes     |    -    |   yes   |
| ai              |     yes     |    -    |    -    |

## Admin Route Wrapping (App.tsx)

| Route                               | requiredRole | Accessible By        |
| ----------------------------------- | :----------: | -------------------- |
| /admin                              |    (none)    | All admins           |
| /admin/categories                   | super-admin  | super-admin only     |
| /admin/seller/:sellerId             |   support    | super-admin, support |
| /admin/compliance/deletion-requests |   support    | super-admin, support |

## Deviations from Plan

None — plan executed as written.

## Threat Model Coverage

| Threat ID | Category                                               | Mitigation                              | Status      |
| --------- | ------------------------------------------------------ | --------------------------------------- | ----------- |
| T-08-04   | Elevation — non-admin reaching admin UI                | AdminRoute redirect on role !== 'admin' | Implemented |
| T-08-05   | Info disclosure — scoped admin seeing other-section UI | requiredRole on AdminRoute + nav gating | Implemented |
| T-08-06   | Availability — false redirect during auth load         | loading → null (no redirect)            | Implemented |

## Self-Check: PASSED

- [x] src/context/AuthContext.tsx: adminRole exposed via useAuth()
- [x] src/components/auth/AdminRoute.tsx: guard component with loading/role/requiredRole gates
- [x] src/App.tsx: all 4 admin routes wrapped with AdminRoute
- [x] src/pages/Home.tsx: access notice banner from location.state
- [x] src/pages/AdminDashboard.tsx: sidebar items gated by isSectionVisible()
- [x] tsc --noEmit: clean (all 3 tasks)
- [x] Commits: b97398e, cb21cc8, 1bd2138 all present
