# Implementation Plan: Marketplace Fixes & Features Batch

**Date:** 2026-05-30
**Brand:** Benim Olan (benimolan.com)
**Stack:** React 19 + TS + Vite + Tailwind v4 + Firebase/Firestore + Express + Stripe/iyzico

---

## Requirements Restatement (10 items)

1. **Deal products admin/seller-controlled** — "Fırsat" products must be chosen by admin OR flagged by the seller, not auto/hardcoded.
2. **Free shipping conditional** — "Ücretsiz kargo" must only show when the seller opts in (per product/seller), and when active, shipping cost = 0.
3. **"FIRSATI YAKALA" enrichment** — image-rich, admin/moderator-managed deal entries; clicking a deal navigates to the product page.
4. **Profile avatar** — user image still not visible in "Hesabım"; profile settings too plain → make richer.
5. **Payment cards** — `profile?tab=payment` "Kayıtlı Ödeme Yöntemi" add-card flow doesn't work; fix Stripe SetupIntent flow + error surfacing.
6. **Address management** — in "konum seç", add new address, save to delivery addresses, set default, **max 6 per user**.
7. **Logo → plain text** — Trendyol-style plain wordmark "Benim Olan" (drop italic/uppercase/icon styling, unify).
8. **Cart English garbage text** — "Shopping Global Artifacts" / "N Items in Bay" must be Turkish/i18n.
9. **Overview cart widget** — `profile?tab=overview` shows a mini-cart (items, +/- qty, remove, total, link to /cart).
10. **Footer company name** — "TrendAl E-Ticaret A.Ş." → "Benim Olan"; purge all stale "TrendAl".

---

## Current State (verified, file:line)

| # | Where | Current behavior |
|---|---|---|
| 1/3 | `src/pages/Home.tsx:316-346` | "FIRSATI YAKALA" hero is **hardcoded** (static AirPods). "Günün Fırsatları" row filters `product.isFlashDeal`. No admin UI for featured deals. `AdminCampaigns.tsx` = discount campaigns only. |
| 2 | `src/components/commerce/ProductCard.tsx:166-170` | Free-shipping badge rendered **unconditionally**. `Product` type (`src/types.ts:164-215`) has **no** `freeShipping` field. |
| 2 | `src/services/cargoService.ts:319` | `calculateShippingRates()` always returns paid carrier rates; no free-shipping short-circuit. |
| 4 | `src/pages/UserProfile.tsx:227-239` | Header avatar uses `authUser.photoURL` + DiceBear fallback. Account menu (Navbar) likely uses stale Firestore `user` → blank. |
| 4 | `src/components/profile/ProfileSettings.tsx:169-350` | Already has Profile / Addresses / Security / Notifications collapsibles. |
| 5 | `src/components/profile/SavedPaymentMethod.tsx:1-136` | Stripe `<PaymentElement>` + `confirmSetup` wired; `createSetupIntent()` failure leaves `clientSecret` null → blank, no error shown. |
| 6 | `src/services/userService.ts:93-139` | `addAddress / replaceAddress / deleteAddress / setDefaultAddress` exist. No MAX cap. `LocationModal.tsx` = region/market picker (not address mgr). `Address` type `src/types.ts:7-18`. |
| 8 | `src/pages/Cart.tsx:125-127` | Hardcoded JSX: `Shopping Global Artifacts`, `{items.length} Items in Bay`. |
| 9 | `src/pages/UserProfile.tsx:305-372` | Overview = recent orders + AI insights + wishlist. No cart widget. `CartContext` exposes `items, itemCount, addItem, removeItem, updateQuantity, clearCart`. |
| 10 | `src/components/layout/Footer.tsx:55,80,85,93,135` + `src/pages/AdminDashboard.tsx:234` | Stale "TrendAl". |
| 7 | `Navbar.tsx:107`, `MobileMenu.tsx:54`, `AuthModal.tsx:85`, `InvoiceModal.tsx:57` | Wordmark uses `font-display ... uppercase italic`. |

---

## Implementation Phases

### Phase A — Branding & quick text fixes (LOW risk, do first)
- **A1 (item 10):** Replace all "TrendAl" → "Benim Olan" in `Footer.tsx` (lines 55, 80, 85, 93, 135) and `AdminDashboard.tsx:234`. Grep repo-wide for `TrendAl` to confirm zero remain.
- **A2 (item 8):** Replace `Cart.tsx:125-127` hardcoded English with i18n keys (`cart.title`, `cart.itemCount`). Add keys to all 4 langs in `LanguageContext.tsx` (tr/en/de/ar). Use pluralized count string.
- **A3 (item 7):** Unify the wordmark to plain text. Decide final style (see Open Questions). Apply to Navbar, MobileMenu, AuthModal, InvoiceModal. Optionally extract a tiny `<Wordmark>` component for consistency.

### Phase B — Free shipping opt-in (MEDIUM)
- **B1 (item 2):** Add `freeShipping?: boolean` to `Product` type (`src/types.ts`) and to the seller product form (`src/components/seller/ProductForm.tsx`).
- **B2:** Gate the `ProductCard.tsx:166-170` badge behind `product.freeShipping`. Also surface in `DeliveryBox.tsx` on the detail page when true.
- **B3:** In checkout shipping calc, when **all** items in a seller group are `freeShipping`, set that group's shipping to 0 (interact with `cargoService.calculateShippingRates` / Checkout shipping aggregation).

### Phase C — Deal management (admin/seller) + FIRSATI YAKALA (HIGH)
- **C1 (items 1,3):** New Firestore collection `featuredDeals` (fields: `productId`, `image`, `title`, `badge`, `endsAt`, `order`, `active`, `createdBy`). Admin/moderator-managed.
- **C2:** New admin page `AdminDeals.tsx` (or extend `AdminCMS`) — CRUD with image upload (reuse Storage upload util), product picker, sort order, active toggle. Route + nav link, gated to admin/moderator.
- **C3:** Add `dealService.ts` (getActiveDeals, create, update, delete, reorder).
- **C4 (item 1 seller path):** Add a seller-facing "Bu ürünü fırsata ekle" request flag on the product (e.g. `dealRequested`) that admins approve into `featuredDeals` — OR allow seller `isFlashDeal` to auto-populate "Günün Fırsatları" (keep existing) while admin curates the hero. (Decide in Open Questions.)
- **C5:** Replace hardcoded `Home.tsx:316-346` hero with data from `getActiveDeals()`; render image, countdown from `endsAt`, and wrap each in a `<Link to={/product/:id}>`.

### Phase D — Profile enhancements (MEDIUM)
- **D1 (item 4 avatar):** Fix account menu to read `authUser.photoURL` (or call `refreshUser()` post-login) so avatar shows everywhere. Verify CSP allows the avatar host (DiceBear / Firebase Storage / Google).
- **D2 (item 4 settings):** Enrich ProfileSettings — add profile completeness, phone, account stats, clearer section cards; keep existing collapsibles.
- **D3 (item 9 overview cart widget):** Add a "Sepetim" card to the overview tab: list cart items (image, name, price), +/- via `updateQuantity`, remove via `removeItem`, show total, and a button linking to `/cart`. Resolve product data via product service/cache.

### Phase E — Payments & addresses (MEDIUM/HIGH)
- **E1 (item 5):** Harden `SavedPaymentMethod.tsx` — surface `createSetupIntent()` errors (loading/error/empty states), verify the server route `create-setup-intent` returns a usable `clientSecret`, confirm `stripePromise` publishable key is set, test add-card end-to-end. Show saved card (brand/last4) + remove.
- **E2 (item 6):** Address manager — reuse `userService` CRUD. Enforce **MAX 6** (block add + message when reached) in both ProfileSettings and any "konum seç"/checkout add flow. Add "set default" UI + default badge. Add an "Add address" entry point in the location/checkout flow (distinct from the region picker `LocationModal`).

### Phase F — SEO pass (/ecommerce-seo) (LOW, after branding)
- Ensure brand consistency in `<title>`/meta/OpenGraph/`manifest.json` (already "Benim Olan" — verify). Add/verify Product structured data (JSON-LD) on product detail, breadcrumb schema, and that deal pages link with crawlable `<a href>`. Confirm sitemap regen (`scripts/generate-sitemap.mjs`) covers product routes. (Detailed SEO checklist run after Phase C lands product/deal links.)

---

## Dependencies
- C depends on Storage upload util (exists, used by ProfileSettings photo upload) and admin/moderator role gating (exists via `verifyAdmin`).
- E1 depends on Stripe publishable key + server `create-setup-intent` (exists in `server/routes/stripe.ts`).
- B3 interacts with existing checkout shipping aggregation.

## Risks
- **HIGH:** Deal hero data migration — hardcoded → dynamic; empty state must be handled when no active deals.
- **MEDIUM:** Stripe add-card "broken" root cause unknown until E1 diagnosis (could be missing publishable key, CSP, or server token). Needs live test.
- **MEDIUM:** Free-shipping at seller-group level in multi-vendor carts — must not zero the wrong group.
- **LOW:** i18n keys must be added to all 4 languages (incl. Arabic/RTL) or fallback shows blank.

## Estimated Complexity: MEDIUM-HIGH (10 items)
Suggested order: **A → B → D → E → C → F** (ship quick wins first; C is the largest).

---

## Decisions (confirmed 2026-05-30)
1. **Logo (item 7):** Plain text **"Benim Olan"**, `font-bold` + `text-current` (neutral black/white per theme). Drop italic/uppercase/icon. Apply to Navbar, MobileMenu, AuthModal, InvoiceModal (Invoice keeps dark text for print).
2. **Deals (item 1/3):** **Seller-direct + admin curator.** Sellers populate "Günün Fırsatları" via existing `isFlashDeal`. The **FIRSATI YAKALA hero is admin-only** (`featuredDeals` collection, managed in `AdminDeals`). → C4 simplified: no seller→admin approval queue; seller path = `isFlashDeal` only.
3. **Moderator role:** Deal hero management gated to **admin** (reuse `verifyAdmin`); add moderator later if a role exists. (Confirm during C2 whether a moderator role exists; default admin-only.)
4. **Free shipping (item 2):** **Per-product exemption.** `freeShipping` items contribute **0** to shipping; paid items still incur cost. Shipping computed per-item then summed per seller group (B3 adjusts aggregation to skip free items).
5. **Address (item 6):** Add "Yeni adres ekle" + saved-address management (max 6, set default) **inside the existing `LocationModal`**. ProfileSettings keeps its address section; both enforce MAX 6 via a shared guard in `userService`.
