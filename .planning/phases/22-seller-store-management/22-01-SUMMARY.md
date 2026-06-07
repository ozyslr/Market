---
phase: 22-seller-store-management
plan: 01
requirements_addressed: [STO-01, STO-02, STO-03, STO-04]
---

# Plan 22-01 Summary: Seller Store Management Dashboard

## Completed

- Created `src/services/sellerStoreService.ts`: Firestore CRUD for store config (banner, logo, name, desc, brand color, social links, contact, policies)
- Created `src/pages/SellerStoreSettings.tsx`: Full settings page in seller dashboard
  - Banner + logo upload (Firebase Storage)
  - Store name, description, contact email
  - Brand color picker (10 presets + custom)
  - Social media links (Instagram, Facebook, Twitter, YouTube, Website)
  - Live preview button
  - Save with success feedback
- Added route `/seller/store-settings` in App.tsx
- Added `/seller/store` route for seller's own store page

## Verification

- [x] tsc --noEmit passes
- [ ] Seller navigates to /seller/store-settings
- [ ] Saves config, reloads and config persists
