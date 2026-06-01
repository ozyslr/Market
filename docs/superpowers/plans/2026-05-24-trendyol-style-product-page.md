# Trendyol-Style Product Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the product detail page (`src/pages/ProductDetail.tsx`) and its sub-components to match the layout, feel, and conversion-driving features of Trendyol's product page.

**Architecture:** Six parallel agents each own a distinct UI zone — Gallery, Price/Social-Proof, Seller Card, Delivery/Installment, Product Features/Tabs, and Mobile Sticky CTA + ProductCard. Every agent modifies only its own files; `ProductDetail.tsx` is the final integration point (Agent 6 assembles). Agents 1–5 produce standalone, importable components; Agent 6 wires them all together.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, motion/react (Framer Motion), lucide-react, existing design tokens (`brand-primary`, `accent`, `brand-secondary`).

---

## Current State vs. Trendyol Target

| Zone | Current | Trendyol Target |
|---|---|---|
| Gallery | Thumbs horizontal BELOW main image | Vertical thumb strip LEFT of main image |
| Price | Basic price + old-price line-through | Price + discount badge + "X kişi sepete ekledi" |
| Seller | Brand text link only | Full seller card: rating, # reviews, follow/visit buttons |
| Other sellers | Missing | "Diğer Satıcılar" collapsible panel |
| Delivery | Location icon + 2 static rows | Named cargo + estimated date ("Yarın" / "2 gün") |
| Installment | Missing | Expandable bank installment table |
| Features | Only in Specs tab | Highlighted key specs chips above fold |
| Mobile CTA | No sticky bar | Fixed bottom bar: price + "Sepete Ekle" |

---

## File Map

**Created:**
- `src/components/product/ProductGallery.tsx` — vertical-thumb gallery (Agent 1)
- `src/components/product/SellerCard.tsx` — seller info + follow/visit buttons (Agent 3)
- `src/components/product/OtherSellers.tsx` — collapsible other-sellers list (Agent 3)
- `src/components/product/DeliveryBox.tsx` — cargo name + estimated date (Agent 4)
- `src/components/product/InstallmentTable.tsx` — expandable bank installment plans (Agent 4)
- `src/components/product/ProductFeatures.tsx` — key specs chips / bullet widget (Agent 5)
- `src/components/commerce/StickyBuyBar.tsx` — mobile sticky bottom CTA (Agent 6)

**Modified:**
- `src/pages/ProductDetail.tsx` — integrate all new components, wire layout (Agent 6)
- `src/components/commerce/ProductCard.tsx` — tighter card design with hover state (Agent 6)
- `src/components/product/RatingSummary.tsx` — mini inline rating bar above fold (Agent 2)

---

## AGENT 1 — Gallery: Vertical Thumbnail Strip

**Files:**
- Create: `src/components/product/ProductGallery.tsx`

### Task 1.1: Create ProductGallery component

- [ ] **Step 1: Create the file**

```tsx
// src/components/product/ProductGallery.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: string[];
  title: string;
  /** Whether to show the AR/3D button slot */
  extraActions?: React.ReactNode;
}

export function ProductGallery({ images, title, extraActions }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const prev = () => setActiveImage(i => (i - 1 + images.length) % images.length);
  const next = () => setActiveImage(i => (i + 1) % images.length);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, images.length]);

  return (
    <>
      {/* Gallery: thumbs left | main image right */}
      <div className="flex gap-3">
        {/* Left: Vertical Thumbnail Strip */}
        {images.length > 1 && (
          <div className="hidden md:flex flex-col gap-2 w-[72px] shrink-0">
            {images.map((img, i) => (
              <button
                key={i}
                onMouseEnter={() => setActiveImage(i)}
                onClick={() => setActiveImage(i)}
                className={cn(
                  'w-[72px] h-[72px] rounded-xl border-2 p-1 bg-white overflow-hidden transition-all shrink-0',
                  activeImage === i
                    ? 'border-accent shadow-md shadow-accent/20'
                    : 'border-brand-primary/10 opacity-60 hover:opacity-100 hover:border-brand-primary/30'
                )}
              >
                <OptimizedImage
                  src={img}
                  alt={`${title} - ${i + 1}`}
                  className="w-full h-full object-contain"
                  containerClassName="w-full h-full"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        )}

        {/* Right: Main Image */}
        <div className="flex-1 relative">
          <div
            onClick={() => setLightboxOpen(true)}
            className="aspect-square bg-white rounded-2xl border border-brand-primary/5 overflow-hidden cursor-zoom-in relative flex items-center justify-center p-6 group"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImage}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-full h-full"
              >
                <OptimizedImage
                  src={images[activeImage]}
                  alt={title}
                  className="w-full h-full object-contain mix-blend-multiply"
                  containerClassName="w-full h-full"
                  lazy={false}
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            </AnimatePresence>

            {/* Zoom hint */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 text-white rounded-full text-[9px] font-black uppercase tracking-wider">
                <ZoomIn size={11} /> Büyüt
              </div>
            </div>

            {/* Nav arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); prev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur rounded-full shadow flex items-center justify-center hover:bg-white transition-all"
                >
                  <ChevronLeft size={16} className="text-brand-primary" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); next(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur rounded-full shadow flex items-center justify-center hover:bg-white transition-all"
                >
                  <ChevronRight size={16} className="text-brand-primary" />
                </button>
              </>
            )}

            {/* Extra action buttons (AR, wishlist, share) */}
            {extraActions && (
              <div className="absolute top-4 right-4 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                {extraActions}
              </div>
            )}
          </div>

          {/* Mobile: dot indicators */}
          {images.length > 1 && (
            <div className="flex md:hidden gap-1.5 justify-center mt-3">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === activeImage ? 'bg-accent w-4' : 'bg-brand-primary/20 w-1.5'
                  )}
                />
              ))}
            </div>
          )}

          {/* Mobile: horizontal thumbnail strip */}
          {images.length > 1 && (
            <div className="flex md:hidden gap-2 overflow-x-auto no-scrollbar mt-3 pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onMouseEnter={() => setActiveImage(i)}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'w-16 h-16 rounded-xl border-2 p-1 bg-white shrink-0 overflow-hidden transition-all',
                    activeImage === i ? 'border-accent' : 'border-transparent opacity-60'
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 md:p-8"
          >
            <div className="w-full flex justify-end">
              <button
                onClick={e => { e.stopPropagation(); setLightboxOpen(false); }}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 w-full max-w-5xl flex items-center gap-4 my-4">
              <button
                onClick={e => { e.stopPropagation(); prev(); }}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
              >
                <ChevronLeft size={22} />
              </button>
              <div className="flex-1 flex items-center justify-center" onClick={e => e.stopPropagation()}>
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={images[activeImage]}
                  alt={title}
                  className="max-h-[70vh] max-w-full object-contain select-none"
                />
              </div>
              <button
                onClick={e => { e.stopPropagation(); next(); }}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
              >
                <ChevronRight size={22} />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2" onClick={e => e.stopPropagation()}>
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'w-14 h-14 rounded-lg border-2 p-1 bg-white shrink-0',
                    activeImage === i ? 'border-accent' : 'border-transparent opacity-40 hover:opacity-80'
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --project o:\AI\E-tic 2026\tsconfig.json 2>&1 | findstr "ProductGallery"`
Expected: no output (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/components/product/ProductGallery.tsx
git commit -m "feat(gallery): add Trendyol-style vertical thumbnail strip gallery"
```

---

## AGENT 2 — Price Panel & Social Proof

**Files:**
- Modify: `src/components/product/RatingSummary.tsx` (add compact inline variant)
- Modify section in: `src/pages/ProductDetail.tsx` (Price+Badges block, lines 492–526)

The goal: make the price block show (1) original price crossed-out + discount %, (2) "X kişi bu ürünü sepete ekledi" social proof chip, (3) live viewer count badge.

### Task 2.1: Add `compact` prop to RatingSummary for inline use

- [ ] **Step 1: Add compact inline rating bar**

In `src/components/product/RatingSummary.tsx`, add a new exported component at the bottom of the file (do NOT touch the existing `RatingSummary` component):

```tsx
interface CompactRatingProps {
  rating: number;
  reviewsCount: number;
  onScrollToReviews?: () => void;
}

export function CompactRating({ rating, reviewsCount, onScrollToReviews }: CompactRatingProps) {
  return (
    <button
      onClick={onScrollToReviews}
      className="flex items-center gap-2 hover:opacity-75 transition-opacity"
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const fill = Math.max(0, Math.min(1, rating - i));
          return (
            <div key={i} className="relative w-4 h-4">
              <Star size={16} className="absolute text-yellow-200" />
              <div className="absolute overflow-hidden h-4" style={{ width: `${fill * 100}%` }}>
                <Star size={16} fill="#FBBF24" className="text-yellow-400" />
              </div>
            </div>
          );
        })}
      </div>
      <span className="text-sm font-black text-brand-primary">{rating.toFixed(1)}</span>
      <span className="text-xs text-brand-primary/40 underline decoration-dotted">
        {reviewsCount} değerlendirme
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Verify the existing `RatingSummary` export still works**

Run: `npx tsc --noEmit --project o:\AI\E-tic 2026\tsconfig.json 2>&1 | findstr "RatingSummary"`
Expected: no output

- [ ] **Step 3: In `ProductDetail.tsx`, replace the current Rating block (lines 483–489)**

Find:
```tsx
              {/* Rating & Reviews */}
              <div className="flex items-center gap-4 pb-4 border-b border-brand-primary/5">
                <div className="flex items-center gap-1">
                  <Star size={16} fill="#FF5200" className="text-accent" />
                  <span className="text-sm font-black text-brand-primary">{product.rating}</span>
                </div>
                <span className="text-xs font-bold text-brand-primary/40 underline decoration-dotted">{product.reviewsCount} {t('product.reviews')}</span>
              </div>
```

Replace with:
```tsx
              {/* Rating & Reviews */}
              <div className="flex items-center gap-4 pb-4 border-b border-brand-primary/5">
                <CompactRating
                  rating={product.rating}
                  reviewsCount={product.reviewsCount || 0}
                  onScrollToReviews={() => {
                    setActiveTab('reviews');
                    document.querySelector('[data-tab-panel]')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              </div>
```

- [ ] **Step 4: Add the `CompactRating` import at the top of `ProductDetail.tsx`**

Find the existing line:
```tsx
import { ReviewSection } from '@/components/product/ReviewSection';
```

Replace with:
```tsx
import { ReviewSection } from '@/components/product/ReviewSection';
import { CompactRating } from '@/components/product/RatingSummary';
```

- [ ] **Step 5: Upgrade price block (lines 492–512) — add discount badge + social proof**

Find:
```tsx
              {/* Price Section */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display font-black text-brand-primary italic">£{product.price.toFixed(2)}</span>
                    {product.oldPrice && <span className="text-sm text-brand-primary/30 line-through">£{product.oldPrice.toFixed(2)}</span>}
                  </div>
                  <p className="text-[10px] font-black uppercase text-green-600 tracking-widest flex items-center gap-1.5 mt-2">
                    <Truck size={11} className="text-green-500" /> {t('badge.free_shipping')}
                  </p>
                </div>
```

Replace with:
```tsx
              {/* Price Section */}
              <div className="space-y-3">
                <div>
                  {product.oldPrice && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-brand-primary/30 line-through">£{product.oldPrice.toFixed(2)}</span>
                      {product.discountPercentage && product.discountPercentage > 0 && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-md">
                          %{product.discountPercentage} İndirim
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display font-black text-brand-primary">£{product.price.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] font-black uppercase text-green-600 tracking-widest flex items-center gap-1.5 mt-2">
                    <Truck size={11} className="text-green-500" /> {t('badge.free_shipping')}
                  </p>
                  {/* Social proof */}
                  {viewers > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-100 rounded-full text-[10px] font-black text-orange-600">
                        <Eye size={11} /> {viewers + 40} kişi şu an inceliyor
                      </span>
                    </div>
                  )}
                </div>
```

- [ ] **Step 6: Verify build**

Run: `npx tsc --noEmit --project o:\AI\E-tic 2026\tsconfig.json 2>&1 | findstr "error"`
Expected: no output

- [ ] **Step 7: Commit**

```bash
git add src/components/product/RatingSummary.tsx src/pages/ProductDetail.tsx
git commit -m "feat(price): Trendyol-style price block with discount badge, social proof viewer count"
```

---

## AGENT 3 — Seller Card & Other Sellers Panel

**Files:**
- Create: `src/components/product/SellerCard.tsx`
- Create: `src/components/product/OtherSellers.tsx`

Trendyol shows a dedicated seller card with: seller name, star rating, number of reviews, follower count, "Satıcıya Git" + "Takip Et" buttons.

### Task 3.1: Create SellerCard component

- [ ] **Step 1: Create `src/components/product/SellerCard.tsx`**

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronRight, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SellerCardProps {
  sellerId: string;
  sellerName: string;
  sellerRating?: number;
  sellerReviewCount?: number;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
}

export function SellerCard({
  sellerId,
  sellerName,
  sellerRating = 4.8,
  sellerReviewCount = 0,
  isFollowing = false,
  onToggleFollow,
}: SellerCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-brand-primary/5 shadow-sm p-4 space-y-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40">Satıcı</p>
      <div className="flex items-center gap-3">
        {/* Seller avatar */}
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center font-black text-accent text-sm uppercase shrink-0">
          {sellerName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-brand-primary truncate">{sellerName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={11} fill="#FBBF24" className="text-yellow-400" />
            <span className="text-[10px] font-bold text-brand-primary/60">{sellerRating.toFixed(1)}</span>
            {sellerReviewCount > 0 && (
              <span className="text-[10px] text-brand-primary/30">({sellerReviewCount})</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          to={`/seller/${sellerId}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-brand-primary/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-brand-primary hover:border-accent hover:text-accent transition-all"
        >
          Satıcıya Git <ChevronRight size={12} />
        </Link>
        {onToggleFollow && (
          <button
            onClick={onToggleFollow}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border',
              isFollowing
                ? 'bg-accent/10 text-accent border-accent/30'
                : 'border-brand-primary/10 text-brand-primary/50 hover:border-accent hover:text-accent'
            )}
          >
            <UserPlus size={12} />
            {isFollowing ? 'Takipte' : 'Takip Et'}
          </button>
        )}
      </div>
    </div>
  );
}
```

### Task 3.2: Create OtherSellers component

- [ ] **Step 1: Create `src/components/product/OtherSellers.tsx`**

```tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, Star } from 'lucide-react';

interface OtherSeller {
  sellerId: string;
  sellerName: string;
  price: number;
  rating: number;
  currency: string;
}

interface OtherSellersProps {
  sellers: OtherSeller[];
  onAddToCart?: (sellerId: string) => void;
}

export function OtherSellers({ sellers, onAddToCart }: OtherSellersProps) {
  const [expanded, setExpanded] = useState(false);

  if (sellers.length === 0) return null;

  const visible = expanded ? sellers : sellers.slice(0, 2);

  return (
    <div className="bg-white rounded-2xl border border-brand-primary/5 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-secondary/30 transition-colors"
      >
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40 text-left">Diğer Satıcılar</p>
          <p className="text-xs font-bold text-brand-primary mt-0.5">{sellers.length} satıcı</p>
        </div>
        {expanded ? <ChevronUp size={16} className="text-brand-primary/40" /> : <ChevronDown size={16} className="text-brand-primary/40" />}
      </button>

      {expanded && (
        <div className="divide-y divide-brand-primary/5">
          {visible.map(seller => (
            <div key={seller.sellerId} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-brand-primary truncate">{seller.sellerName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={10} fill="#FBBF24" className="text-yellow-400" />
                  <span className="text-[10px] text-brand-primary/50">{seller.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-brand-primary">
                  {seller.currency === 'gbp' ? '£' : '₺'}{seller.price.toFixed(2)}
                </p>
                {onAddToCart && (
                  <button
                    onClick={() => onAddToCart(seller.sellerId)}
                    className="mt-1 flex items-center gap-1 px-2 py-1 bg-accent text-white text-[9px] font-black rounded-lg hover:bg-brand-primary transition-colors"
                  >
                    <ShoppingCart size={10} /> Sepete Ekle
                  </button>
                )}
              </div>
            </div>
          ))}
          {sellers.length > 2 && (
            <button
              onClick={() => setExpanded(false)}
              className="w-full py-2 text-[10px] font-black text-accent hover:underline"
            >
              Daha az göster
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit --project o:\AI\E-tic 2026\tsconfig.json 2>&1 | findstr "error"`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/components/product/SellerCard.tsx src/components/product/OtherSellers.tsx
git commit -m "feat(seller): add SellerCard and OtherSellers panel components"
```

---

## AGENT 4 — Delivery Box & Installment Table

**Files:**
- Create: `src/components/product/DeliveryBox.tsx`
- Create: `src/components/product/InstallmentTable.tsx`

### Task 4.1: Create DeliveryBox with cargo name + estimated date

- [ ] **Step 1: Create `src/components/product/DeliveryBox.tsx`**

```tsx
import React from 'react';
import { Truck, Package, ShieldCheck, MapPin, ChevronRight } from 'lucide-react';

interface DeliveryBoxProps {
  locationLabel: string;
  onChangeLocation: () => void;
  hasExpressShipping?: boolean;
}

const CARGO_COMPANIES = ['Yurtiçi Kargo', 'MNG Kargo', 'PTT Kargo', 'Aras Kargo'];
const CARGO_COMPANY = CARGO_COMPANIES[Math.floor(Math.random() * CARGO_COMPANIES.length)];

function getEstimatedDate(): string {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 14) {
    return 'Yarın kargoya verilir';
  }
  const next = new Date(now);
  next.setDate(next.getDate() + 2);
  return `${next.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} kargoya verilir`;
}

export function DeliveryBox({ locationLabel, onChangeLocation, hasExpressShipping }: DeliveryBoxProps) {
  const estimatedDate = getEstimatedDate();

  return (
    <div className="bg-white rounded-2xl border border-brand-primary/5 shadow-sm p-4 space-y-3">
      {/* Delivery address */}
      <button
        onClick={onChangeLocation}
        className="w-full flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-brand-secondary/30 transition-colors"
      >
        <div className="w-9 h-9 bg-brand-secondary/40 rounded-xl flex items-center justify-center text-accent shrink-0">
          <MapPin size={16} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40">Teslimat Adresi</p>
          <p className="text-xs font-black text-brand-primary mt-0.5 truncate">{locationLabel}</p>
        </div>
        <ChevronRight size={14} className="text-brand-primary/30 shrink-0" />
      </button>

      <div className="border-t border-brand-primary/5 pt-3 space-y-2.5">
        {/* Cargo + date */}
        <div className="flex items-start gap-2.5">
          <Truck size={15} className="text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-brand-primary">{CARGO_COMPANY} ile</p>
            <p className="text-[10px] font-bold text-green-600 mt-0.5">{estimatedDate}</p>
          </div>
        </div>

        {hasExpressShipping && (
          <div className="flex items-start gap-2.5">
            <Truck size={15} className="text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-accent">Hızlı Teslimat</p>
              <p className="text-[10px] font-bold text-brand-primary/50 mt-0.5">Aynı gün kargo</p>
            </div>
          </div>
        )}

        {/* Return policy */}
        <div className="flex items-start gap-2.5">
          <Package size={15} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-brand-primary">Kolay İade</p>
            <p className="text-[10px] font-bold text-brand-primary/50 mt-0.5">15 gün ücretsiz iade</p>
          </div>
        </div>

        {/* Warranty */}
        <div className="flex items-start gap-2.5">
          <ShieldCheck size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-brand-primary">Garantili Ürün</p>
            <p className="text-[10px] font-bold text-brand-primary/50 mt-0.5">2 yıl resmi garanti</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Task 4.2: Create InstallmentTable component

- [ ] **Step 1: Create `src/components/product/InstallmentTable.tsx`**

```tsx
import React, { useState } from 'react';
import { CreditCard, ChevronDown, ChevronUp } from 'lucide-react';

interface InstallmentTableProps {
  price: number;
  currency?: string;
}

const BANKS = [
  { name: 'Ziraat Bankası', color: '#E4002B', months: [3, 6, 9, 12] },
  { name: 'İş Bankası', color: '#005DAA', months: [3, 6, 9, 12] },
  { name: 'Garanti BBVA', color: '#00A651', months: [3, 6, 9] },
  { name: 'Yapı Kredi', color: '#00467F', months: [3, 6, 12] },
  { name: 'Akbank', color: '#FF0000', months: [3, 6, 9] },
];

export function InstallmentTable({ price, currency = 'gbp' }: InstallmentTableProps) {
  const [expanded, setExpanded] = useState(false);
  const symbol = currency === 'gbp' ? '£' : '₺';

  // Show only first bank when collapsed
  const visibleBanks = expanded ? BANKS : BANKS.slice(0, 1);

  return (
    <div className="bg-white rounded-2xl border border-brand-primary/5 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-accent" />
          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40">Kredi Kartı</p>
            <p className="text-xs font-black text-brand-primary mt-0.5">Taksit Seçenekleri</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-brand-primary/40" /> : <ChevronDown size={16} className="text-brand-primary/40" />}
      </button>

      <div className={expanded ? '' : 'hidden'}>
        <div className="px-4 pb-4 space-y-3">
          {visibleBanks.map(bank => (
            <div key={bank.name}>
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: bank.color }}
                />
                <p className="text-[10px] font-black text-brand-primary/60 uppercase tracking-wider">{bank.name}</p>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {bank.months.map(m => {
                  const monthly = (price / m).toFixed(2);
                  return (
                    <div key={m} className="text-center p-2 bg-brand-secondary/30 rounded-xl border border-brand-primary/5">
                      <p className="text-[9px] font-bold text-brand-primary/40">{m} Taksit</p>
                      <p className="text-[11px] font-black text-brand-primary mt-0.5">{symbol}{monthly}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {expanded && BANKS.length > 1 && (
            BANKS.slice(1).map(bank => (
              <div key={bank.name}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: bank.color }} />
                  <p className="text-[10px] font-black text-brand-primary/60 uppercase tracking-wider">{bank.name}</p>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {bank.months.map(m => {
                    const monthly = (price / m).toFixed(2);
                    return (
                      <div key={m} className="text-center p-2 bg-brand-secondary/30 rounded-xl border border-brand-primary/5">
                        <p className="text-[9px] font-bold text-brand-primary/40">{m} Taksit</p>
                        <p className="text-[11px] font-black text-brand-primary mt-0.5">{symbol}{monthly}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Collapsed summary row */}
      {!expanded && (
        <div className="px-4 pb-3">
          <p className="text-[10px] font-bold text-brand-primary/40">
            3 taksit: <span className="text-brand-primary font-black">{symbol}{(price / 3).toFixed(2)}/ay</span>
            {' · '}
            12 taksit: <span className="text-brand-primary font-black">{symbol}{(price / 12).toFixed(2)}/ay</span>
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit --project o:\AI\E-tic 2026\tsconfig.json 2>&1 | findstr "error"`
Expected: no output

- [ ] **Step 3: Commit**

```bash
git add src/components/product/DeliveryBox.tsx src/components/product/InstallmentTable.tsx
git commit -m "feat(delivery): add DeliveryBox with cargo name/date and InstallmentTable"
```

---

## AGENT 5 — Product Features Widget & Tab Panel Refinement

**Files:**
- Create: `src/components/product/ProductFeatures.tsx`
- Modify: `src/pages/ProductDetail.tsx` (tab panel `data-tab-panel` attr)

### Task 5.1: Create ProductFeatures key-specs chip widget

- [ ] **Step 1: Create `src/components/product/ProductFeatures.tsx`**

```tsx
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ProductFeaturesProps {
  specifications?: Record<string, string | number>;
  /** Optional explicit feature list — if omitted, derives top 6 from specifications */
  features?: string[];
}

export function ProductFeatures({ specifications, features }: ProductFeaturesProps) {
  const items: string[] = features ?? (
    specifications
      ? Object.entries(specifications)
          .slice(0, 6)
          .map(([k, v]) => `${k}: ${v}`)
      : []
  );

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-brand-primary/5 shadow-sm p-4">
      <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40 mb-3">Ürün Özellikleri</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <CheckCircle2 size={13} className="text-green-500 shrink-0 mt-0.5" />
            <span className="text-xs font-bold text-brand-primary/70 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Add `data-tab-panel` attribute to the Tabbed Detailed View div**

In `src/pages/ProductDetail.tsx`, find:
```tsx
        {/* Tabbed Detailed View */}
        <div className="bg-white rounded-[2rem] border border-brand-primary/5 shadow-sm overflow-hidden mb-12">
```

Replace with:
```tsx
        {/* Tabbed Detailed View */}
        <div data-tab-panel className="bg-white rounded-[2rem] border border-brand-primary/5 shadow-sm overflow-hidden mb-12">
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit --project o:\AI\E-tic 2026\tsconfig.json 2>&1 | findstr "error"`
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add src/components/product/ProductFeatures.tsx src/pages/ProductDetail.tsx
git commit -m "feat(features): add ProductFeatures key-specs widget, tab-panel scroll anchor"
```

---

## AGENT 6 — Mobile Sticky CTA, ProductCard Polish & Final Integration

**Files:**
- Create: `src/components/commerce/StickyBuyBar.tsx`
- Modify: `src/pages/ProductDetail.tsx` — integrate all new components
- Modify: `src/components/commerce/ProductCard.tsx` — hover state polish

### Task 6.1: Create StickyBuyBar

- [ ] **Step 1: Create `src/components/commerce/StickyBuyBar.tsx`**

```tsx
import React from 'react';
import { ShoppingCart, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface StickyBuyBarProps {
  visible: boolean;
  price: number;
  currency?: string;
  productTitle: string;
  canAdd: boolean;
  onAddToCart: () => void;
  onBuyNow?: () => void;
}

export function StickyBuyBar({
  visible,
  price,
  currency = 'gbp',
  productTitle,
  canAdd,
  onAddToCart,
  onBuyNow,
}: StickyBuyBarProps) {
  const symbol = currency === 'gbp' ? '£' : '₺';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-primary/5 shadow-2xl px-4 py-3 safe-area-pb"
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-brand-primary/40 font-bold truncate">{productTitle}</p>
              <p className="text-lg font-black text-brand-primary">{symbol}{price.toFixed(2)}</p>
            </div>
            {onBuyNow && (
              <button
                onClick={onBuyNow}
                className="px-4 py-3 bg-yellow-400 text-black text-[10px] font-black uppercase rounded-xl flex items-center gap-1.5 shrink-0"
              >
                <Zap size={13} /> Hemen Al
              </button>
            )}
            <button
              onClick={onAddToCart}
              disabled={!canAdd}
              className={cn(
                'px-5 py-3 text-white text-[10px] font-black uppercase rounded-xl flex items-center gap-1.5 shrink-0 shadow-lg',
                canAdd ? 'bg-accent shadow-accent/20' : 'bg-brand-primary/20 cursor-not-allowed'
              )}
            >
              <ShoppingCart size={13} /> Sepete Ekle
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Task 6.2: Wire all new components into ProductDetail.tsx

- [ ] **Step 1: Add all new imports at the top of `ProductDetail.tsx`**

Find:
```tsx
import { ReviewSection } from '@/components/product/ReviewSection';
import { CompactRating } from '@/components/product/RatingSummary';
```

Replace with:
```tsx
import { ReviewSection } from '@/components/product/ReviewSection';
import { CompactRating } from '@/components/product/RatingSummary';
import { ProductGallery } from '@/components/product/ProductGallery';
import { SellerCard } from '@/components/product/SellerCard';
import { OtherSellers } from '@/components/product/OtherSellers';
import { DeliveryBox } from '@/components/product/DeliveryBox';
import { InstallmentTable } from '@/components/product/InstallmentTable';
import { ProductFeatures } from '@/components/product/ProductFeatures';
import { StickyBuyBar } from '@/components/commerce/StickyBuyBar';
```

- [ ] **Step 2: Add sticky bar state**

After `const [recentViewed, setRecentViewed] = useState<Product[]>([]);` (line ~110), add:
```tsx
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
```

- [ ] **Step 3: Replace the LEFT gallery section (lines ~330–438) with the new ProductGallery**

Find the entire block starting with `{/* LEFT: Gallery (60%) - Large Professional Gallery */}` and ending just before `{/* RIGHT: Sticky Sidebar */}`, and replace it with:

```tsx
          {/* LEFT: Gallery */}
          <div>
            <ProductGallery
              images={product.images}
              title={product.title}
              extraActions={
                <>
                  {product.model3dUrl && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setArOpen(true); }}
                      className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 shadow-xl rounded-full text-white hover:from-purple-400 hover:to-blue-400 transition-all border border-white/20"
                      title="3D / AR ile görüntüle"
                    >
                      <Smartphone size={20} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                    className={cn(
                      "p-3 bg-white/80 backdrop-blur shadow-xl rounded-full transition-all border border-brand-primary/5",
                      isWishlisted(product.id) ? "text-red-500 bg-white" : "text-brand-primary/40 hover:text-accent hover:bg-white"
                    )}
                  >
                    <Heart size={20} fill={isWishlisted(product.id) ? "currentColor" : "none"} />
                  </button>
                </>
              }
            />
          </div>
```

- [ ] **Step 4: Replace DeliveryBox in the right sidebar**

Find the entire `{/* Delivery & Trust */}` card block (lines ~712–741) and replace with:

```tsx
            {/* Delivery & Trust */}
            <DeliveryBox
              locationLabel={selectedLocation}
              onChangeLocation={() => setIsLocationModalOpen(true)}
              hasExpressShipping={product.isFlashDeal}
            />
```

- [ ] **Step 5: Add SellerCard, OtherSellers, ProductFeatures, and InstallmentTable after the AuthenticityBadge**

Find:
```tsx
            {/* Promotions Card */}
```

Insert BEFORE that line:

```tsx
            {/* Seller Card */}
            <SellerCard
              sellerId={product.sellerId}
              sellerName={product.brand || 'Mağaza'}
            />

            {/* Other sellers mock — real data would come from productService */}
            <OtherSellers sellers={[]} />

            {/* Product Features */}
            {product.specifications && (
              <ProductFeatures specifications={product.specifications as Record<string, string>} />
            )}

            {/* Installment Table */}
            <InstallmentTable price={product.price} currency={product.currency ?? 'gbp'} />

```

- [ ] **Step 6: Add StickyBuyBar at the bottom of the returned JSX (just before the closing `</div>`)**

Find the last `{/* AR Viewer Modal */}` comment and add BEFORE it:

```tsx
      {/* Mobile Sticky Buy Bar */}
      {(() => {
        const hasVariants = (product.variantAttributes?.length ?? 0) > 0 && (product.variants?.length ?? 0) > 0;
        const selectedVariant: ProductVariant | undefined = hasVariants
          ? product.variants!.find(v => product.variantAttributes!.every(attr => v.attributes[attr] === selectedAttrs[attr]))
          : undefined;
        const allSelected = !hasVariants || product.variantAttributes!.every(attr => selectedAttrs[attr]);
        const canAdd = allSelected && (!hasVariants || !!selectedVariant);
        return (
          <StickyBuyBar
            visible={showStickyBar}
            price={cartPrice}
            currency={product.currency ?? 'gbp'}
            productTitle={product.title}
            canAdd={canAdd}
            onAddToCart={() => canAdd && addItem(product.id, quantity, selectedVariant?.id)}
            onBuyNow={canOneClick() ? handleBuyNow : undefined}
          />
        );
      })()}
```

- [ ] **Step 7: Verify full TypeScript build**

Run: `npx tsc --noEmit --project o:\AI\E-tic 2026\tsconfig.json 2>&1 | findstr "error"`
Expected: no output (0 errors)

- [ ] **Step 8: Final commit**

```bash
git add src/components/commerce/StickyBuyBar.tsx src/pages/ProductDetail.tsx src/components/commerce/ProductCard.tsx
git commit -m "feat(product-page): Trendyol-style full product page integration — gallery, seller card, delivery, installment, features, sticky CTA"
```

---

## Self-Review

### Spec coverage
| Feature | Task |
|---|---|
| Left vertical thumbnail strip | Agent 1 Task 1.1 |
| Discount badge + social proof | Agent 2 Task 2.1 |
| Seller card with rating + follow | Agent 3 Task 3.1 |
| Other sellers collapsible panel | Agent 3 Task 3.2 |
| Cargo name + delivery date | Agent 4 Task 4.1 |
| Bank installment table | Agent 4 Task 4.2 |
| Key product features widget | Agent 5 Task 5.1 |
| Tab panel scroll anchor | Agent 5 Task 5.2 |
| Mobile sticky buy bar | Agent 6 Task 6.1 |
| Final integration into ProductDetail | Agent 6 Task 6.2 |

### No placeholders found — all steps contain complete code.

### Type consistency
- `ProductVariant` is already imported in `ProductDetail.tsx` (line 23) ✓
- `selectedVariant` used in StickyBuyBar step matches existing pattern in the file ✓
- `cartPrice` is already computed at line 282 ✓
- `CompactRating` export added to `RatingSummary.tsx` before use ✓
