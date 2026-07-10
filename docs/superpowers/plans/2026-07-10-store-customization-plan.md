# Store Customization — Implementation Plan

**Goal:** 6 store customization features: corporate info, multi-banner, category showcase, campaign area, video, about enrichment

**Architecture:** Extend existing `Seller` + `StoreConfig` fields. Settings saved to Firestore via existing patterns. Store page renders new sections.

---

### Task 1: Types + Firestore Fields

**Files:** `src/types.ts` (Seller extend), `src/services/sellerStoreService.ts` (StoreConfig extend)

- [ ] Add corporate fields to Seller interface in `src/types.ts`
- [ ] Add banners, showcaseCategories, campaignBanner, videoUrl, aboutHtml, certifications, foundedYear to StoreConfig
- [ ] Commit

### Task 2: Corporate Info Settings Form

**Files:** `src/pages/SellerStoreSettings.tsx`

- [ ] Add "Kurumsal Bilgiler" section with inputs: companyName, taxOffice, taxNumber, mersisNo, tradeRegistryNo, companyType
- [ ] Save to `sellers/{sellerId}` doc (existing updateSeller pattern)
- [ ] Commit

### Task 3: Banner Management UI

**Files:** `src/pages/SellerStoreSettings.tsx`

- [ ] Add banner upload/management section (add, remove, reorder)
- [ ] Save to `storeConfigs/{sellerId}.banners`
- [ ] Commit

### Task 4: Remaining Settings (Showcase, Campaign, Video, About)

**Files:** `src/pages/SellerStoreSettings.tsx`

- [ ] Category showcase multi-select
- [ ] Campaign banner form
- [ ] Video URL input
- [ ] About rich text + certifications
- [ ] Commit

### Task 5: Store Page — Banner Carousel + Hero

**Files:** `src/pages/SellerStore.tsx`, new `src/components/seller/BannerCarousel.tsx`

- [ ] Create BannerCarousel component (swipe/auto-play, dots, responsive)
- [ ] Replace single banner with carousel in SellerStore hero
- [ ] Commit

### Task 6: Store Page — New Sections

**Files:** `src/pages/SellerStore.tsx`

- [ ] Corporate info tab (with verified badge if KYC done)
- [ ] Category showcase grid
- [ ] Campaign banner section
- [ ] Video embed section
- [ ] About tab enrichment
- [ ] Commit

### Task 7: Test + Deploy

- [ ] Build check (tsc --noEmit)
- [ ] Quick browse test on localhost
- [ ] Push, build, deploy
