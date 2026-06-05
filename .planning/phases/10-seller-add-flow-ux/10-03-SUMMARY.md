---
phase: 10-seller-add-flow-ux
plan: 03
subsystem: seller-product-form
tags: [upload, images, dnd-kit, sortable, drop-zone, progress]
requires: ['10-01']
provides: ['SLR-03']
affects: [ProductForm image section]
tech-stack:
  added: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities']
  patterns: [SortableContext, useSortable, PointerSensor, rectSortingStrategy, DndContext]
key-files:
  created: []
  modified:
    - src/components/seller/ProductForm.tsx
decisions:
  - 'Both tasks committed as single commit — tightly coupled in same file'
  - 'Simulated per-file progress via setInterval (0→85% then jump to 100%) since uploadImage uses uploadBytes not uploadBytesResumable'
  - 'PointerSensor with 8px distance constraint for touch safety — matches AdminCMS.tsx pattern'
  - 'SortableImage extracted as sub-component inside ProductForm.tsx — follows AdminCMS.tsx convention'
  - 'Empty state drop zone shown when no images; DndContext grid shown when images exist'
metrics:
  duration: '~15min'
  completed_date: '2026-06-05'
---

# Phase 10 Plan 03: Bulk Image Upload + Drag-Reorder Summary

Bulk multi-file image upload with per-file progress bars, dnd-kit sortable grid with drag-to-reorder, desktop drop zone for file manager drag-and-drop, and retry for failed uploads. All within ProductForm.tsx, built on top of the 10-01 quick-add toggle.

## Completed Tasks

### Task 1: Multi-file upload with per-file progress

- **Commit:** 6fb6e42
- Replaced single boolean `uploading` state with `UploadFileState[]` tracking per-file progress
- `handleImageUpload` now accepts `FileList | File[]` (works from both file input and drop events)
- `Promise.allSettled` for parallel uploads with individual error handling
- Simulated progress bar (incremental updates to 85%, then 100% on Firebase completion)
- Failed uploads show red border, error message, and **Tekrar Dene** (retry) button
- Blob preview URLs created immediately for instant visual feedback; revoked on completion/cleanup
- `fileMapRef` stores File objects for retry capability

### Task 2: Drag-and-drop reorder + drop zone

- **Commit:** 6fb6e42
- `SortableImage` sub-component using `useSortable` with grip handle on hover
- `DndContext` + `SortableContext` with `rectSortingStrategy` wrapping completed images
- `PointerSensor` with `activationConstraint: { distance: 8 }` — touch-safe drag (prevents scroll interference)
- `arrayMove` on `DragEndEvent` to reorder `form.images`
- Desktop drop zone: entire image section wrapper accepts native `dragover`/`drop` events
- Blue glow highlight on drag-over; text changes to "Resimleri buraya bırakın"
- Clicking drop zone triggers hidden file input
- Order badge on each thumbnail (1-based index)
- All quick-add functionality preserved unchanged

## Key Implementation Details

| Feature           | Implementation                                                                     |
| ----------------- | ---------------------------------------------------------------------------------- |
| Progress tracking | `UploadFileState[]` with `progress: number`, updated via `setInterval`             |
| File retry        | `fileMapRef: Map<string, File>` stores original File objects                       |
| Blob cleanup      | `useEffect` cleanup revokes blob URLs on unmount and on uploadFiles change         |
| Sortable IDs      | `img-0`, `img-1`, … mapped from array indices                                      |
| Drag handle       | `GripVertical` icon, `opacity-0 group-hover:opacity-100`, `touch-none`             |
| Drop zone         | Native HTML5 drag events (`onDragOver`, `onDragLeave`, `onDrop`)                   |
| Error state       | Red border (`ring-2 ring-red-500`), `AlertCircle` icon, retry button               |
| Empty state       | Centered upload prompt with icon and helper text                                   |
| Mobile            | `capture="environment"` on file input; PointerSensor prevents drag-scroll conflict |

## Deviations from Plan

None — plan executed as written with both tasks implemented in a single tightly-coupled change.

## Self-Check: PASSED

- `src/components/seller/ProductForm.tsx` — EXISTS, modified with all planned changes
- Commit 6fb6e42 — EXISTS in git log
- `npx tsc --noEmit` — PASSES with zero errors
