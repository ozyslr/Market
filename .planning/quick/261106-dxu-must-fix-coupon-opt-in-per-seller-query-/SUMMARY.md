---
status: complete
date: 2026-11-06
---

# 261106-dxu — Review "Must fix" items (f2a81fe)

## Done

- **Private coupon codes no longer advertised (1):** new `Coupon.showOnProduct` (default false). `/api/coupons/active` → `productPageCoupons()` in `server/services/checkoutQuote.ts` returns only opted-in, active, unexpired, not-used-up coupons. Opt-in checkbox + "Ürün sayfasında / Gizli kod" toggle in `SellerCoupons` and `AdminCoupons`.
- **Per-seller query (3):** two equality queries (this seller's, then platform `sellerId == null`), limit 10 each — no more "first 100 of all sellers". Admin coupons now store `sellerId: null`; older platform coupons get it when the admin turns "show" on. Tests in `checkoutQuote.test.ts`.
- **price_history owner check (2):** create needs `recordedAt == request.time` and the product's `sellerId == token.sellerId` (admin bypass). Rules tests 48/48 incl. competitor + backdated cases.
- **Found while fixing:** `/seller/coupons` was declared twice; the first (`SellerCouponManager`) wrote to `sellerCoupons`, which checkout never reads — seller coupons could not be redeemed. Removed the duplicate route and the dead `SellerCouponManager.tsx` + `sellerCouponService.ts` (`sellerCoupons` was empty in prod).

## Live state

- 3 existing platform coupons are hidden until the admin turns "Ürün sayfasında" on.
- `/api/coupons/active` needs a Cloud Run redeploy.
