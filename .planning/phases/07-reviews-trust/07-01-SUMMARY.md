---
phase: 07-reviews-trust
plan: 01
type: summary
requirements: [REV-01]
status: complete
---

# 07-01 Summary — Verified-Purchase Reviews

## What was built

Closed the verified-purchase gap (REV-01). Review creation now runs entirely
server-side through a new gated Express endpoint; the client can no longer write
to the `reviews` collection or forge the `verified`/`status` trust fields.

## Must-Haves — verification

| Truth                                                                    | Status | Evidence                                                                                                                               |
| ------------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Only a buyer with a Delivered SubOrder containing the product can review | ✅     | `server/routes/reviews.ts` traverses the buyer's OrderSets → delivered SubOrders → `items[].productId`; returns 403 otherwise. Test 1. |
| verified + 'approved' are server-set, not client                         | ✅     | Endpoint sets `verified:true`, `status:'approved'` literally; never reads them from `req.body`. Test 2 (client forgery ignored).       |
| Verified review shows "Doğrulanmış Alıcı" badge                          | ✅     | `ReviewCard.tsx` badge gated on `review.verified`. `verify-07-01-rules.mjs`.                                                           |
| Client direct writes to reviews denied by rules                          | ✅     | `firestore.rules` reviews → `allow create: if false`. `verify-07-01-rules.mjs`.                                                        |
| D-01 server-side enforcement via Express + Admin SDK                     | ✅     | `POST /api/reviews`.                                                                                                                   |
| D-02 hybrid moderation (verified auto-approve)                           | ✅     | Verified purchases write `status:'approved'`; AdminReviews moderation path (admin update) preserved.                                   |

## Verification run

- `npx vitest run server/routes/reviews.test.ts` → 5/5 pass (403 / 201 verified / 409 dedup / photos>5 400 / rating-range 400)
- `npx tsc --noEmit` → clean
- `node scripts/verify-07-01-rules.mjs` → OK

## Key files

- Created: `server/routes/reviews.ts`, `server/routes/reviews.test.ts`, `scripts/verify-07-01-rules.mjs`
- Modified: `server.ts` (route registration), `src/services/reviewService.ts` (`addReview`→`submitReview` fetch wrapper), `src/components/product/ReviewSection.tsx` (wire endpoint + error UI), `src/components/product/ReviewCard.tsx` (badge text), `firestore.rules`

## Deviations from plan (justified)

1. **SubOrder query.** Plan specified `subOrders.where('productIds','array-contains',productId).where('userId',...)`. The actual SubOrder document has **no `userId` and no `productIds`** — the buyer lives on the parent OrderSet and products are objects inside `items[]`. Implemented the correct traversal: OrderSets(userId) → their SubOrders → match `status=='delivered'` and `items[].productId`. (The plan's `<read_first>` explicitly flagged confirming these field names.)
2. **Write-path file.** Plan listed `ReviewForm.tsx` as the addReview caller; the real caller is `ReviewSection.tsx` (ReviewForm only raises an `onSubmit` callback). Rerouted `ReviewSection` instead.
3. **Firestore update/delete rules.** Plan said `update: if isAdmin()` / `delete: if isAdmin()`. Implemented literally would break existing client features (helpful-votes, seller responses, owner edit/delete, all client `updateDoc`/`deleteDoc`). Instead: kept `create: if false` (the actual security fix) and made `update` **field-guarded** — any full user may update **except** the trust fields `verified`/`status`/`userId`, which must stay unchanged — and `delete` is owner-or-admin. Read kept public (`if true`) because the read queries fetch without a `status` filter; an approved-only read rule would have rejected `getReviewsByProduct`/`subscribeToProductReviews` list queries.
4. **createdAt** uses `new Date().toISOString()` to match the existing OrderSet/SubOrder convention (ISO strings, not Firestore serverTimestamp).

## Follow-ups for later plans

- 07-02 (photo gallery) builds on the `photos[]` field already validated (max 5) by this endpoint.

## Self-Check: PASSED
