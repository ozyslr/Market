# Firebase Image Processing — Setup Guide

## Overview

Firebase's [Image Processing extension](https://firebase.google.com/products/extensions/image-processing-resize-images) automatically resizes and converts images uploaded to Cloud Storage. Once enabled, optimized variants are served on-demand via URL query parameters — no separate build step, no CDN subscription required.

**Status for Benim Olan:** The `OptimizedImage` component (`src/components/common/OptimizedImage.tsx`) already emits `srcSet` with `?width=N` query parameters (Task 1 of PERF-03). This makes the frontend forward-compatible: once the extension is enabled, browsers automatically download the correct size. Until then, the query params are silently ignored and the full-size image is served — no broken images.

## How It Works

1. A seller uploads a product image to `products/{productId}/original.jpg` (2MB, 2048x2048).
2. The extension listens for new uploads and generates resized variants in a sibling path (e.g., `products/{productId}/resized/`).
3. When the frontend requests `{downloadUrl}?width=768`, the extension serves the pre-generated 768px variant instead of the original.
4. The browser selects the best `srcSet` candidate based on viewport width.

## URL Pattern

```
https://firebasestorage.googleapis.com/v0/b/{project}/o/{encodedPath}?alt=media&token={token}&width={N}
```

| Parameter | Value               | Purpose                    |
| --------- | ------------------- | -------------------------- |
| `width`   | 320, 768, 1200      | Serve variant at N px wide |
| `height`  | N                   | Optional — constrain both  |
| `format`  | `webp`, `avif`      | Convert to modern format   |
| `quality` | 1–100 (default: 80) | JPEG/WebP compression      |

**Example:** A product image URL becomes:

```
Original:   https://firebasestorage.googleapis.com/.../products%2Fabc%2Fphoto.jpg?alt=media&token=xxx
320px:      https://firebasestorage.googleapis.com/.../products%2Fabc%2Fphoto.jpg?alt=media&token=xxx&width=320
768px+WebP: https://firebasestorage.googleapis.com/.../products%2Fabc%2Fphoto.jpg?alt=media&token=xxx&width=768&format=webp
```

## How OptimizedImage Uses It

```tsx
// Default: responsive srcSet for 3 breakpoints
<OptimizedImage src={firebaseUrl} widths={[320, 768, 1200]} />

// Renders:
// <img src="...photo.jpg?alt=media&token=xxx"
//      srcSet="...photo.jpg?alt=media&token=xxx&width=320 320w,
//              ...photo.jpg?alt=media&token=xxx&width=768 768w,
//              ...photo.jpg?alt=media&token=xxx&width=1200 1200w"
//      sizes="(max-width: 320px) 320px, (max-width: 768px) 768px, 1200px" />

// Backward compatible: omit widths → single src only
<OptimizedImage src={firebaseUrl} />
```

## One-Time Setup (Firebase Console)

> **Requires:** Firebase Blaze (pay-as-you-go) plan. The extension itself is free; you pay only for Cloud Functions invocations and Storage bytes processed.

### Step 1: Ensure Blaze Plan

1. Go to [Firebase Console](https://console.firebase.google.com/) → your project.
2. Bottom-left → **Upgrade** → select **Blaze** (pay-as-you-go).

### Step 2: Install the Extension

1. Firebase Console → **Extensions** (left sidebar).
2. Search for **"Image Processing"** (or go directly: [Image Processing extension](https://extensions.dev/extensions/firebase/image-processing-resize-images)).
3. Click **Install in Firebase Console**.
4. Configure:
   - **Cloud Storage bucket:** your project's default bucket (`{project}.appspot.com`)
   - **Image sizes:** `320x320,768x768,1200x1200` (match OptimizedImage defaults)
   - **Image format:** leave as-is (original format) or set to `webp` for automatic WebP conversion on upload
   - **Delete original:** **disabled** (keep originals for admin/seller use)
   - **Cache-Control header:** `max-age=31536000` (1 year — images are immutable once uploaded)
   - **Cloud Functions location:** `europe-west1` (closest to Turkey/Europe)
5. Click **Install extension**. Wait ~3–5 minutes for deployment.

### Step 3: Verify

Upload a test image, then request it with `?width=320`. The response should be a resized variant (check Content-Length header — should be smaller).

## Cost Estimate

| Tier                       | Free allowance / month    | Cost beyond free |
| -------------------------- | ------------------------- | ---------------- |
| Cloud Functions (v2)       | 2M invocations            | $0.40/million    |
| Cloud Storage operations   | 50K Class B ops           | $0.004/10K       |
| Cloud Storage bandwidth    | 1GB egress                | $0.12/GB         |
| Image Processing extension | Free (no separate charge) | —                |

**For a marketplace with ~500 products and moderate traffic:**

- ~5,000 image uploads/month → ~10K Cloud Function invocations (well within free tier)
- ~50K image views/month (resized variants served from Storage cache) → minimal cost
- **Estimated monthly cost: $0–2/month** for typical usage

## Static Assets (Build-Time)

For images in `public/` (favicon, logo, OG image, PWA icons), use the `optimize:images` audit script:

```bash
npm run optimize:images
```

This script:

- Scans `public/` and `src/assets/` for PNG/JPEG images
- Flags any >50KB that lack a `.webp` sibling
- Prints `cwebp` CLI commands for one-time manual conversion

See `scripts/optimize-images.mjs` for details.

## Fallback Behavior

If the Image Processing extension is **not** enabled:

- `?width=N` query params are **silently ignored** by Firebase Storage
- The original full-size image is served (correct, no broken images)
- The `<img>` tag's `srcSet` attribute degrades gracefully — browsers fall back to `src`
- This is by design: the frontend is forward-compatible and works today

## References

- [Firebase Image Processing Extension Docs](https://firebase.google.com/products/extensions/image-processing-resize-images)
- [Extension source on GitHub](https://github.com/firebase/extensions/tree/main/firestore-image-processing-resize-images)
- [MDN: Responsive images with srcSet](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [web.dev: Serve responsive images](https://web.dev/serve-responsive-images/)
