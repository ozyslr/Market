# v1.0 Live UAT Sign-Off Checklist — Phase 11 Closure

> Generated: 2026-06-05 | Phase: 11-purchase-funnel-guest-checkout | BUY-05
> Source: .planning/v1.0-MILESTONE-AUDIT.md (tech_debt: live-UAT items)

## Prerequisites

Before starting any UAT item, ensure:

- **Deployment environment:** Staging or production (live) — UAT requires real or sandbox payment gateways
- **Test buyer account:** Email/password buyer account with at least one saved address
- **Test seller account:** Seller account with active product listings
- **Test cards (Stripe):**
  - 3DS success: `4000 0025 0000 3155` (any future expiry, any CVC)
  - Decline: `4000 0000 0000 0002`
  - Normal success: `4242 4242 4242 4242`
- **Test cards (Iyzico sandbox):** Iyzico test panel credentials + sandbox test cards
- **Browser:** Chrome (latest) or Firefox (latest), console open for error inspection
- **Network:** Stable internet connection; 3DS flows require redirect/callback handling

## Instructions

For each item: follow the test steps on the live/staging environment. Check the box when the observed behavior matches the expected result. Sign with date and initials.

Each section includes a **Known Constraints** note — read before testing.

---

## 1. PAY-01/02/03 — 3DS Payment Flows

> **Source:** Phase 2 — Payment & Order Lifecycle (code-complete, live sign-off pending)
> **Known Constraints:** Iyzico 3DS only works in sandbox (real 3DS requires production credentials). Stripe 3DS works with test cards in both test and live Stripe modes. Ensure webhook endpoint is accessible from Stripe/Iyzico servers.

### PAY-01: Stripe 3DS Payment

- [ ] 1.1 Add item to cart → proceed to checkout (`/checkout`)
- [ ] 1.2 Select "Stripe" as payment method, fill delivery address
- [ ] 1.3 Click "Ödemeye Devam Et" → Stripe Elements form appears
- [ ] 1.4 Enter 3DS test card: `4000 0025 0000 3155` (any future expiry, any CVC)
- [ ] 1.5 Click "Pay" → 3DS challenge modal appears
- [ ] 1.6 Complete authentication in the challenge modal
- [ ] 1.7 Redirect back to checkout → "Ödeme Başarılı!" confirmation displayed
- [ ] 1.8 Order confirmation email received at registered email address

### PAY-02: Iyzico 3DS Payment (Sandbox)

- [ ] 2.1 Add item to cart → proceed to checkout
- [ ] 2.2 Select "Iyzico" as payment method
- [ ] 2.3 Fill Iyzico card form with sandbox test card
- [ ] 2.4 Complete 3DS challenge (redirect to bank sandbox page)
- [ ] 2.5 Callback returns to `/checkout?iyzico_status=success`
- [ ] 2.6 Order created with payment status "succeeded"

### PAY-03: Payment Failure Recovery

- [ ] 3.1 Add item to cart → proceed to checkout, select Stripe
- [ ] 3.2 Enter decline card: `4000 0000 0000 0002`
- [ ] 3.3 Click "Pay" → decline/error message shown to user
- [ ] 3.4 Error message is clear and actionable (not a raw stack trace)
- [ ] 3.5 User can retry with a different card without leaving the page
- [ ] 3.6 Switch to successful card (`4242 4242 4242 4242`) → order created successfully

---

## 2. Phase 2 — Order Lifecycle

> **Source:** Phase 2 (code-complete, live sign-off pending)
> **Known Constraints:** Seller dashboard requires merchant account with KYC approved. Firestore `orders` collection must be populated. Email delivery depends on SendGrid/resend configuration.

### End-to-End Order Flow

- [ ] 1.1 Place an order as a buyer (any payment method)
- [ ] 1.2 Log in to seller dashboard → navigate to "Orders" tab
- [ ] 1.3 Verify the new order appears in the seller's order list
- [ ] 1.4 Click on the order → view order detail page
- [ ] 1.5 Seller updates order status: Pending → Processing
- [ ] 1.6 Verify buyer sees updated status on their "My Orders" page
- [ ] 1.7 Seller updates status: Processing → Shipped
- [ ] 1.8 Verify buyer sees "Shipped" status with tracking info (if available)
- [ ] 1.9 Seller marks order as Delivered
- [ ] 1.10 Verify buyer receives delivery notification (email/in-app)
- [ ] 1.11 Buyer navigates to order → "Write a Review" button is visible
- [ ] 1.12 Buyer submits a review → review appears on product page within 60 seconds

---

## 3. Phase 5 — Shipping (Entegi/EasyPost)

> **Source:** Phase 5 (code-complete, live sign-off pending)
> **Known Constraints:** Entegi/EasyPost integration requires live API keys and valid TR addresses. Shipping label generation may fail for addresses outside carrier coverage areas.

### Shipping Rate & Label Flow

- [ ] 1.1 Add item to cart → proceed to checkout
- [ ] 1.2 Enter valid Turkish shipping address (city: İstanbul, postal code: 34000)
- [ ] 1.3 Verify shipping rate is calculated and displayed in order summary
- [ ] 1.4 Complete order → seller dashboard → find the order
- [ ] 1.5 Seller clicks "Generate Shipping Label" (or equivalent action)
- [ ] 1.6 Verify shipping label displays correctly (carrier, tracking number, address)
- [ ] 1.7 Seller updates tracking number → verify tracking number appears in buyer order detail

---

## 4. 07-02 — Reviews Photo Upload UX

> **Source:** Phase 7, Plan 02 (blocking human-verify checkpoints deferred by user)
> **Known Constraints:** Photo upload requires Firebase Storage rules to allow authenticated writes. Max 5 photos, max 5 MB each. Upload progress indicator relies on Firebase Storage `put` task events.

### Photo Upload & Display

- [ ] 1.1 As buyer, navigate to a completed order → click "Write a Review"
- [ ] 1.2 Click "Add Photo" button in the review form
- [ ] 1.3 Select 1-5 images from device (PNG or JPEG)
- [ ] 1.4 Verify each photo shows an upload progress indicator (bar or spinner)
- [ ] 1.5 Verify photos appear as thumbnails in the review form before submission
- [ ] 1.6 Remove one photo (click X on thumbnail) → verify it is removed
- [ ] 1.7 Write review text → click "Submit Review"
- [ ] 1.8 Navigate to product page → find the submitted review
- [ ] 1.9 Verify all uploaded photos appear on the review card (grid or carousel)
- [ ] 1.10 Click a photo thumbnail → lightbox/viewer opens with full-size image
- [ ] 1.11 Verify lightbox can be closed (X button or click outside)

### Known Checkpoint: Photo Upload

> **Deferred from 07-02:** Upload progress UX and lightbox viewer were not manually verified. This section resolves that checkpoint.

---

## 5. 07-04 — Q&A Flow

> **Source:** Phase 7, Plan 04 (blocking human-verify checkpoint deferred by user)
> **Known Constraints:** Q&A requires both buyer and seller accounts. Notifications depend on Firebase Cloud Messaging or in-app notification system.

### Question & Answer Flow

- [ ] 1.1 As buyer, navigate to a product page
- [ ] 1.2 Locate "Questions & Answers" section (may be a tab or accordion)
- [ ] 1.3 Type a question in the input field → click "Submit" (or "Ask")
- [ ] 1.4 Verify question appears with a "pending answer" badge/indicator
- [ ] 1.5 Log in as the seller of that product → navigate to seller dashboard
- [ ] 1.6 Verify seller receives a notification about the new question
- [ ] 1.7 Seller navigates to Q&A section and types an answer → clicks "Submit"
- [ ] 1.8 Verify answer appears below the question on the product page
- [ ] 1.9 Log out, browse product page as another buyer → verify Q&A thread is publicly visible

### Known Checkpoint: Q&A

> **Deferred from 07-04:** End-to-end Q&A flow with seller notification was not manually verified. This section resolves that checkpoint.

---

## Phase 11 New Feature UAT

> These items cover features built in Phase 11 (BUY-01 through BUY-04). Plans 11-01 through 11-04 must be completed before these can be tested.

| Item   | Plan             | Description                                                                                                                      |
| ------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| BUY-01 | Guest Checkout   | Anonymous users can complete checkout with email-only, Stripe payment, post-purchase account creation prompt                     |
| BUY-02 | Address Book     | Checkout saved-address selection, inline new address form with "save to profile" checkbox, address type badges (Home/Work/Other) |
| BUY-03 | Express Wallets  | Apple Pay / Google Pay via Stripe Payment Request Button (requires HTTPS — verify in production only)                            |
| BUY-04 | Funnel Analytics | Purchase funnel events in Firestore + Admin Analytics funnel conversion card                                                     |

## Sign-Off Table

### Carried v1.0 UAT Debt

| Item                      | Tester | Date | Result            | Notes |
| ------------------------- | ------ | ---- | ----------------- | ----- |
| PAY-01/02/03 (3DS)        |        |      | ⬜ Pass / ⬜ Fail |       |
| Phase 2 (Order Lifecycle) |        |      | ⬜ Pass / ⬜ Fail |       |
| Phase 5 (Shipping)        |        |      | ⬜ Pass / ⬜ Fail |       |
| 07-02 (Photo UX)          |        |      | ⬜ Pass / ⬜ Fail |       |
| 07-04 (Q&A)               |        |      | ⬜ Pass / ⬜ Fail |       |

### Phase 11 New Features

| Item                      | Tester | Date | Result            | Notes                               |
| ------------------------- | ------ | ---- | ----------------- | ----------------------------------- |
| BUY-01 (Guest Checkout)   |        |      | ⬜ Pass / ⬜ Fail | Plans 11-01..04 must complete first |
| BUY-02 (Address Book)     |        |      | ⬜ Pass / ⬜ Fail |                                     |
| BUY-03 (Express Wallets)  |        |      | ⬜ Pass / ⬜ Fail | Requires HTTPS (production only)    |
| BUY-04 (Funnel Analytics) |        |      | ⬜ Pass / ⬜ Fail |                                     |
