---
phase: 07-reviews-trust
plan: 02
type: summary
requirements: [REV-02]
status: complete
human_verify: pending
---

# 07-02 Summary — Review Photos

## What was built

Buyers attach up to 5 photos to a review (uploaded to Firebase Storage on
selection) and view them in a product-page gallery with a navigable lightbox.

## Must-Haves — verification

| Truth                                            | Status | Evidence                                                                                                             |
| ------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------- |
| Up to 5 photos; 6th rejected client-side         | ✅     | `ReviewForm` caps at `MAX_PHOTOS=5`, shows "En fazla 5 fotoğraf ekleyebilirsiniz."; also rejects non-image and >5MB. |
| Uploaded photos appear in a product-page gallery | ✅     | `ReviewCard` renders `review.photos[]` thumbnail row.                                                                |
| Clicking a review photo opens a lightbox         | ✅     | Index-based lightbox overlay; prev/next + Escape + backdrop close.                                                   |

## Verification run

- `npx tsc --noEmit` → clean (both tasks)
- Human checkpoint (Task 3) — **PENDING** user verification in the running app.

## Key files

- Modified: `src/components/product/ReviewForm.tsx` (on-select upload via `uploadReviewPhoto`, 5-cap, progress, validation; new `productId`/`userId` props; `ReviewFormData` drops `photoFiles`), `src/components/product/ReviewSection.tsx` (no longer uploads; passes `productId`/`userId`; submits photo URLs), `src/components/product/ReviewCard.tsx` (index-based lightbox + prev/next + Escape)

## Deviations from plan (justified)

1. **Upload moved into ReviewForm** (plan Task 1 intent). Previously ReviewSection uploaded from `photoFiles`; now ReviewForm uploads on-select and emits URLs, so it needs `productId`/`userId` props. `ReviewFormData.photoFiles` removed (no longer needed) and ReviewSection updated accordingly — a coordinated contract change across the two files.
2. **Cap raised 3→5.** The pre-existing form capped photos at 3; the plan/server (07-01 Zod) bound is 5.
3. Gallery + single-photo lightbox already existed from prior work; enhanced to **index-based with prev/next and Escape** per Task 2 acceptance.

## Self-Check: PASSED (auto tasks) — human-verify pending
