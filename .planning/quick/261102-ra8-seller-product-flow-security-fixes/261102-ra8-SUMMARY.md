---
quick_id: 261102-ra8
status: complete
date: 2026-11-02
commits: [c3b1e31, 1ee0fc1, 0e6349c, fcef9ed, e94c6aa]
---

# Summary — Seller product flow + security fixes

## Outcome

Approved sellers could not add products: no approval path set the custom claims
(`role: 'seller'`, `sellerId`) that firestore.rules check. Production dry run
confirmed 2 real approved sellers with `role=none`. All approval paths now go
through `grantSellerAccess` (server/lib/sellerAccess.ts).

## Fixed

| Sev      | Issue                                                                                                                 | Commit           |
| -------- | --------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Critical | `/api/kyc/admin/review` + `/admin/settings` only verified a token — any user could self-approve / enable auto-approve | c3b1e31          |
| Critical | `/api/admin/seller/:id/approve-tr` unauthenticated (verifyAdmin never passed to iyzico routes)                        | c3b1e31          |
| Critical | `/api/v1/keys` let any user (incl. anonymous) mint API keys → Admin-SDK product writes                                | 0e6349c          |
| High     | KYC submit/kvkk/contract/status had no ownership check (IDOR)                                                         | c3b1e31          |
| High     | products rules: no sellerId binding, self-approval, rating/featured writable                                          | fcef9ed          |
| High     | Connectors mapped source 'active' → 'approved'; missing status treated as approved                                    | fcef9ed          |
| High     | storage products/\*\* writable by any signed-in user                                                                  | fcef9ed          |
| High     | users create allowed role 'admin'; commission.ts trusted users.role                                                   | fcef9ed, 0e6349c |
| High     | sellers owner could self-set kycStatus/isVerified; applications creatable pre-approved                                | fcef9ed          |
| Medium   | approve-tr/eu + AdminSellerView used uid as application id → approvals 404'd                                          | c3b1e31, 1ee0fc1 |
| Medium   | API product PUT content edits skipped re-moderation; BulkEditBar wrote 'Active'                                       | 0e6349c, fcef9ed |

## Verification

- `tsc --noEmit`: no errors in touched files
- vitest src/services, src/components/seller, server: 249 passed; 1 pre-existing empty suite (priceValidator.test.ts, untouched)
- `firebase deploy --only firestore:rules,storage --dry-run`: both compile
- scripts/verify-07-01-rules.mjs, verify-07-04-rules.mjs: OK
- Backfill dry run: 2 to update, 7 seed docs skipped, 0 failed

## Manual steps remaining (not done — need user go-ahead)

1. `firebase deploy --only firestore:rules,storage`
2. Deploy server (new endpoints + route auth)
3. `npx tsx scripts/backfill-seller-claims.mjs --apply`
4. UAT: approve a test seller → add product → verify it lands as pending

## Deviations

- Executed inline instead of spawning gsd-planner/gsd-executor (orchestrator already held full audit context).
- Did not change `isApproved` (status undefined ⇒ approved): fixed at the source instead
  (createProduct default + rules) to avoid hiding legacy products without a status.
- SellerProductUpload.tsx ('temp-seller-id') is not routed anywhere — left as dead code.

## Pre-existing issues found, out of scope

- Checkout calls `decreaseProductStock` client-side as the buyer — rules deny buyer product writes, so stock likely never decrements from checkout.
- FollowsContext updates `sellers` follower counts as a non-owner — denied by rules (before and after).
- storage.rules only covers `kyc/` and `products/`; uploads to store-assets/, menuImages/, profilePhotos/, categoryImages/, dealImages/, reviews, AR models are denied by default.
- `authenticateApiKey` scans all active API keys on every request (O(n) + hash per key).
