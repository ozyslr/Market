---
phase: 10-seller-add-flow-ux
plan: 01
type: summary
subsystem: seller-product-form
tags: [quick-add, ux, product-form, seller-onboarding]
requires: []
provides: [SLR-01]
affects:
  - src/components/seller/ProductForm.tsx
tech-stack:
  added: []
  patterns: [motion-fade-collapse, two-pill-toggle, field-gating-with-defaults]
key-files:
  modified: [src/components/seller/ProductForm.tsx]
decisions:
  - 'Quick-add defaults to 6 essential fields (title, categoryId, price, stock, images, description)'
  - 'Hidden fields inherit EMPTY_FORM defaults (visibility: public, currency: TRY, 14-day return)'
  - 'Toggle state persists in component memory (session-scoped, resets on unmount)'
  - 'AI features kept visible in detailed mode only'
metrics:
  duration: '<5min'
  completed_date: '2026-06-05'
  task_count: 1
  file_count: 1
---

# Phase 10 Plan 01: Quick-Add Mode Summary

Quick-add mode toggle integrated into existing ProductForm, reducing the 25+ field form to 6 essential fields for faster seller onboarding.

## One-Liner

Quick-add two-pill toggle with AnimatePresence field gating -- sellers publish a listing by filling only 6 essential fields.

## Tasks Completed

| Task | Name                                 | Commit  | Files           |
| ---- | ------------------------------------ | ------- | --------------- |
| 1    | Quick-add mode toggle + field gating | 5c848b0 | ProductForm.tsx |

## Changes Made

### ProductForm.tsx (originally 718 lines)

1. **Imports:** Added `Zap`, `ChevronDown` from `lucide-react`; `motion`, `AnimatePresence` from `motion/react`
2. **State:** Added `const [quickAdd, setQuickAdd] = useState(true)` -- defaults to quick mode
3. **Constants:** Added `QUICK_ADD_FIELDS` Set and `ProductFormField` type
4. **Toggle bar:** Two-pill toggle ("Hizli Ekle" | "Detayli") with contextual subtitle, placed between header and scrollable body
5. **Field gating:** Non-essential fields wrapped in `<AnimatePresence>` + `<motion.div>` with height/opacity collapse animations:
   - Section 1: brand, sku hidden (title stays)
   - Section 2: tags + AI suggest hidden (category stays)
   - Section 3: AI image generation hidden (image upload stays)
   - Section 4: oldPrice, currency hidden; price+stock grid restructured
   - Section 5: longDescription + AI desc hidden (short desc stays)
   - Section 6: specifications entirely hidden
   - Section 7: SEO entirely hidden
   - Section 8: shipping/delivery entirely hidden
   - Section 9: visibility settings entirely hidden
6. **Info bar:** Amber bar above footer when in quick-add mode: "Gelismis alanlar gizlendi" + "Detayli moda gec" link
7. **Footer buttons:** Dynamic labels -- quick-add: "Hizlica Yayinla" / "Taslak Kaydet"; detailed: "Kaydet" / "Taslak"

## Verification

- `npx tsc --noEmit` -- passed clean (no errors)
- Form submits same `ProductFormData` shape in both modes; hidden fields carry EMPTY_FORM defaults
- Toggle state persists within component session (same component instance across modal opens/closes)

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. Threat model items T-10-01 and T-10-02 were pre-mitigated: EMPTY_FORM defaults are safe (TRY, public visibility, 14-day return), and toggle state persists via component-level useState (session scope).

## Self-Check: PASSED

- [x] `src/components/seller/ProductForm.tsx` exists and modified
- [x] Commit `5c848b0` exists in git log
- [x] TypeScript compiles cleanly
- [x] No file deletions
