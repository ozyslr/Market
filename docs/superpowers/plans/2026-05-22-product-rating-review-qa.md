# Product Rating, Review & Q&A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trendyol / Hepsiburada / Amazon TR seviyesinde ürün değerlendirme, yıldız dağılımı, kategori puanlama, fotoğraflı yorum, yararlı oy ve soru-cevap sistemi.

**Architecture:** Mevcut inline review/QA kodu ProductDetail'dan çıkarılarak `src/components/product/` altında bağımsız bileşenlere ayrılır; Firebase servisleri yeni fonksiyonlarla genişletilir; ProductDetail sadece bu bileşenleri çağırır.

**Tech Stack:** React 18, TypeScript, Firebase Firestore, Lucide-React, TailwindCSS, motion/react

---

## File Map

| Eylem    | Dosya                                           | Sorumluluk                             |
|----------|-------------------------------------------------|----------------------------------------|
| Modify   | `src/types.ts`                                  | Review + ProductQuestion type güncellemesi |
| Modify   | `src/services/reviewService.ts`                 | getReviewStats, voteReviewHelpful, addSellerResponse |
| Modify   | `src/services/productQuestionService.ts`        | voteQuestionHelpful |
| Create   | `src/components/product/RatingSummary.tsx`      | Genel puan + yıldız dağılımı + kategori puanları |
| Create   | `src/components/product/ReviewCard.tsx`         | Tek yorum kartı: fotoğraf, yararlı oy, satıcı yanıtı |
| Create   | `src/components/product/ReviewForm.tsx`         | Gelişmiş yorum formu: kategori puanı + fotoğraf yükleme |
| Create   | `src/components/product/ReviewFilters.tsx`      | Sıralama + filtreleme çubuğu |
| Create   | `src/components/product/ReviewSection.tsx`      | Review orkestratörü |
| Create   | `src/components/product/QuestionCard.tsx`       | Tek soru-cevap kartı: yararlı oy |
| Create   | `src/components/product/QASection.tsx`          | Q&A orkestratörü: arama + sayfalama |
| Modify   | `src/pages/ProductDetail.tsx`                   | Inline kodu sil, yeni bileşenleri bağla |

---

## Task 1: Types Güncellemesi

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Mevcut Review ve ProductQuestion arayüzlerini bul**

`src/types.ts` içinde `interface Review` ve `interface ProductQuestion` satırlarını bul.

- [ ] **Step 2: Review arayüzüne yeni alanlar ekle**

```typescript
// src/types.ts — Review arayüzü (mevcut alanlara ek)
export interface Review {
  id: string;
  productId?: string;
  sellerId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  // YENİ:
  photos?: string[];
  helpfulCount?: number;
  helpfulVoters?: string[];
  categoryRatings?: { quality?: number; shipping?: number; description?: number };
  sellerResponse?: { text: string; createdAt: string; sellerName: string };
}
```

- [ ] **Step 3: ProductQuestion arayüzüne yeni alanlar ekle**

`types.ts` içindeki `ProductQuestion` arayüzünü şu şekilde güncelle:

```typescript
export interface ProductQuestion {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  // YENİ:
  helpfulCount?: number;
  helpfulVoters?: string[];
}
```

- [ ] **Step 4: TypeScript derlemesi kontrol et**

```powershell
cd "O:\AI\E-tic 2026"
npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 hata (ya da sadece önceden var olan hatalar).

- [ ] **Step 5: Commit**

```bash
git add src/types.ts
git commit -m "feat: extend Review and ProductQuestion types with helpful votes, photos, category ratings"
```

---

## Task 2: reviewService Genişletmesi

**Files:**
- Modify: `src/services/reviewService.ts`

- [ ] **Step 1: ReviewStats export type ekle ve getReviewStats fonksiyonu yaz**

`src/services/reviewService.ts` dosyasına şunları ekle (en üste interface, dosya sonuna fonksiyonlar):

```typescript
// reviewService.ts dosyasının başına (import'lardan sonra)
export interface ReviewStats {
  total: number;
  distribution: Record<number, number>;
  avgCategoryRatings: { quality: number; shipping: number; description: number };
}
```

```typescript
// dosya sonuna ekle
export async function getReviewStats(productId: string): Promise<ReviewStats> {
  const reviews = await getReviewsByProduct(productId);
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let qualitySum = 0, shippingSum = 0, descSum = 0, catCount = 0;

  reviews.forEach(r => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    if (r.categoryRatings) {
      qualitySum += r.categoryRatings.quality || 0;
      shippingSum += r.categoryRatings.shipping || 0;
      descSum += r.categoryRatings.description || 0;
      catCount++;
    }
  });

  return {
    total: reviews.length,
    distribution,
    avgCategoryRatings: {
      quality: catCount > 0 ? qualitySum / catCount : 0,
      shipping: catCount > 0 ? shippingSum / catCount : 0,
      description: catCount > 0 ? descSum / catCount : 0,
    },
  };
}
```

- [ ] **Step 2: voteReviewHelpful fonksiyonu ekle**

`reviewService.ts` dosyasının import satırında `getDoc` zaten mevcut. Dosya sonuna ekle:

```typescript
export async function voteReviewHelpful(reviewId: string, userId: string): Promise<number> {
  const ref = doc(db, REVIEWS_COLLECTION, reviewId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Review not found');

  const data = snap.data() as Review;
  const voters: string[] = data.helpfulVoters || [];
  const alreadyVoted = voters.includes(userId);
  const newVoters = alreadyVoted
    ? voters.filter(v => v !== userId)
    : [...voters, userId];

  await updateDoc(ref, { helpfulVoters: newVoters, helpfulCount: newVoters.length });
  return newVoters.length;
}
```

- [ ] **Step 3: addSellerResponse fonksiyonu ekle**

```typescript
export async function addSellerResponse(
  reviewId: string,
  text: string,
  sellerName: string,
): Promise<void> {
  await updateDoc(doc(db, REVIEWS_COLLECTION, reviewId), {
    sellerResponse: { text, sellerName, createdAt: new Date().toISOString() },
  });
}
```

- [ ] **Step 4: Derleme kontrolü**

```powershell
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/services/reviewService.ts
git commit -m "feat: add getReviewStats, voteReviewHelpful, addSellerResponse to reviewService"
```

---

## Task 3: productQuestionService Genişletmesi

**Files:**
- Modify: `src/services/productQuestionService.ts`

- [ ] **Step 1: getDoc ve doc import'larını ekle**

`productQuestionService.ts` dosyasındaki import satırını güncelle:

```typescript
import {
  collection, addDoc, getDocs, getDoc,
  query, where, orderBy, updateDoc, doc,
} from 'firebase/firestore';
```

- [ ] **Step 2: voteQuestionHelpful fonksiyonu ekle**

```typescript
export async function voteQuestionHelpful(questionId: string, userId: string): Promise<number> {
  const ref = doc(db, 'productQuestions', questionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Question not found');

  const data = snap.data();
  const voters: string[] = data.helpfulVoters || [];
  const alreadyVoted = voters.includes(userId);
  const newVoters = alreadyVoted
    ? voters.filter(v => v !== userId)
    : [...voters, userId];

  await updateDoc(ref, { helpfulVoters: newVoters, helpfulCount: newVoters.length });
  return newVoters.length;
}
```

- [ ] **Step 3: Derleme kontrolü**

```powershell
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/services/productQuestionService.ts
git commit -m "feat: add voteQuestionHelpful to productQuestionService"
```

---

## Task 4: RatingSummary Bileşeni

**Files:**
- Create: `src/components/product/RatingSummary.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
// src/components/product/RatingSummary.tsx
import React from 'react';
import { Star } from 'lucide-react';
import { ReviewStats } from '@/services/reviewService';
import { cn } from '@/lib/utils';

interface Props {
  rating: number;
  stats: ReviewStats;
  activeStarFilter: number | null;
  onStarFilter: (star: number | null) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  quality: 'Ürün Kalitesi',
  shipping: 'Kargo Hızı',
  description: 'Açıklamaya Uygunluk',
};

export function RatingSummary({ rating, stats, activeStarFilter, onStarFilter }: Props) {
  const hasCategories = Object.values(stats.avgCategoryRatings).some(v => v > 0);

  return (
    <div className="grid md:grid-cols-3 gap-8 pb-8 border-b border-brand-primary/5">
      {/* Sol: Genel skor + kategori puanları */}
      <div className="flex flex-col items-center md:items-start gap-3">
        <span className="text-7xl font-display font-black text-brand-primary italic leading-none">
          {rating.toFixed(1)}
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={20}
              fill={i < Math.round(rating) ? '#FF5200' : 'none'}
              className={i < Math.round(rating) ? 'text-accent' : 'text-brand-primary/10'}
            />
          ))}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/40">
          {stats.total} değerlendirme
        </span>

        {hasCategories && (
          <div className="w-full space-y-2 mt-2">
            {Object.entries(stats.avgCategoryRatings).map(([key, val]) =>
              val > 0 ? (
                <div key={key}>
                  <div className="flex justify-between text-[10px] font-bold text-brand-primary/50 mb-1">
                    <span>{CATEGORY_LABELS[key] ?? key}</span>
                    <span>{val.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 bg-brand-secondary rounded-full">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${(val / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>

      {/* Sağ: Yıldız dağılımı */}
      <div className="md:col-span-2 space-y-2 self-center">
        {[5, 4, 3, 2, 1].map(star => {
          const count = stats.distribution[star] || 0;
          const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
          const isActive = activeStarFilter === star;
          return (
            <button
              key={star}
              onClick={() => onStarFilter(isActive ? null : star)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors',
                isActive ? 'bg-accent/10' : 'hover:bg-brand-secondary/50',
              )}
            >
              <span className="text-[10px] font-black w-4 text-brand-primary/60 text-right">{star}</span>
              <Star size={11} fill="#FF5200" className="text-accent shrink-0" />
              <div className="flex-1 h-2.5 bg-brand-secondary rounded-full overflow-hidden border border-brand-primary/5">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold w-8 text-brand-primary/40 text-right">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Derleme kontrolü**

```powershell
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/product/RatingSummary.tsx
git commit -m "feat: add RatingSummary component with real star distribution and category ratings"
```

---

## Task 5: ReviewCard Bileşeni

**Files:**
- Create: `src/components/product/ReviewCard.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
// src/components/product/ReviewCard.tsx
import React, { useState } from 'react';
import { Star, ThumbsUp, ChevronDown, ChevronUp, X, Store } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';
import { Review } from '@/types';
import { voteReviewHelpful, addSellerResponse } from '@/services/reviewService';
import { cn } from '@/lib/utils';

interface Props {
  review: Review;
  currentUserId?: string;
  isSeller: boolean;
  currentUserName?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  quality: 'Kalite',
  shipping: 'Kargo',
  description: 'Uygunluk',
};

export function ReviewCard({ review, currentUserId, isSeller, currentUserName }: Props) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0);
  const [hasVoted, setHasVoted] = useState(
    currentUserId ? (review.helpfulVoters || []).includes(currentUserId) : false,
  );
  const [voting, setVoting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [localResponse, setLocalResponse] = useState(review.sellerResponse);
  const [showFullComment, setShowFullComment] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const isLongComment = review.comment.length > 300;
  const displayedComment =
    isLongComment && !showFullComment ? review.comment.slice(0, 300) + '...' : review.comment;

  async function handleVote() {
    if (!currentUserId || voting) return;
    setVoting(true);
    try {
      const newCount = await voteReviewHelpful(review.id, currentUserId);
      setHelpfulCount(newCount);
      setHasVoted(v => !v);
    } finally {
      setVoting(false);
    }
  }

  async function handleReply() {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await addSellerResponse(review.id, replyText.trim(), currentUserName || 'Satıcı');
      setLocalResponse({
        text: replyText.trim(),
        createdAt: new Date().toISOString(),
        sellerName: currentUserName || 'Satıcı',
      });
      setShowReplyForm(false);
      setReplyText('');
    } finally {
      setSubmittingReply(false);
    }
  }

  return (
    <div className="pb-8 border-b border-brand-primary/5 last:border-0">
      {/* Başlık */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center font-black text-accent uppercase text-sm shrink-0">
            {review.userName.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-black text-brand-primary">{review.userName}</p>
            <p className="text-[10px] text-brand-primary/30 font-bold">
              {review.createdAt.split('T')[0]}
            </p>
          </div>
        </div>
        {review.verified && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-full border border-green-200">
            <CheckCircle2 size={11} />
            <span className="text-[9px] font-black uppercase tracking-widest">Onaylı Alıcı</span>
          </div>
        )}
      </div>

      {/* Yıldızlar + kategori puanları */}
      <div className="flex flex-wrap items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            fill={i < review.rating ? '#FF5200' : 'none'}
            className={i < review.rating ? 'text-accent' : 'text-brand-primary/10'}
          />
        ))}
        {review.categoryRatings &&
          Object.entries(review.categoryRatings).map(([key, val]) =>
            val && val > 0 ? (
              <span key={key} className="ml-2 text-[9px] font-bold text-brand-primary/40 bg-brand-secondary/50 px-2 py-0.5 rounded-lg">
                {CATEGORY_LABELS[key] ?? key}: {val}/5
              </span>
            ) : null,
          )}
      </div>

      {/* Yorum metni */}
      <p className="text-sm text-brand-primary/70 leading-relaxed font-medium mb-2">
        {displayedComment}
      </p>
      {isLongComment && (
        <button
          onClick={() => setShowFullComment(v => !v)}
          className="flex items-center gap-1 text-[10px] font-black text-accent mb-3"
        >
          {showFullComment ? (
            <><ChevronUp size={12} /> Daha az göster</>
          ) : (
            <><ChevronDown size={12} /> Devamını oku</>
          )}
        </button>
      )}

      {/* Fotoğraflar */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {review.photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setLightboxPhoto(photo)}
              className="w-20 h-20 rounded-xl overflow-hidden border border-brand-primary/10 hover:border-accent transition-colors"
            >
              <img src={photo} alt="Yorum fotoğrafı" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Aksiyonlar */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleVote}
          disabled={!currentUserId || voting}
          className={cn(
            'flex items-center gap-2 text-[10px] font-black uppercase transition-colors',
            hasVoted ? 'text-accent' : 'text-brand-primary/40 hover:text-accent',
            (!currentUserId || voting) && 'opacity-50 cursor-not-allowed',
          )}
        >
          <ThumbsUp size={13} fill={hasVoted ? 'currentColor' : 'none'} />
          Yararlı ({helpfulCount})
        </button>
        {isSeller && !localResponse && (
          <button
            onClick={() => setShowReplyForm(v => !v)}
            className="text-[10px] font-black uppercase text-brand-primary/40 hover:text-accent transition-colors"
          >
            Yanıtla
          </button>
        )}
      </div>

      {/* Satıcı yanıt formu */}
      {showReplyForm && (
        <div className="mt-3 ml-4 flex gap-2">
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Satıcı yanıtı..."
            className="flex-1 px-3 py-2 bg-white border border-brand-primary/10 rounded-xl text-xs outline-none focus:border-accent"
          />
          <button
            onClick={handleReply}
            disabled={submittingReply || !replyText.trim()}
            className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-black disabled:opacity-50"
          >
            Gönder
          </button>
          <button
            onClick={() => setShowReplyForm(false)}
            className="px-3 py-2 bg-white border border-brand-primary/10 rounded-xl text-xs font-black"
          >
            İptal
          </button>
        </div>
      )}

      {/* Satıcı yanıtı */}
      {localResponse && (
        <div className="mt-3 ml-4 pl-3 border-l-2 border-accent/30 bg-accent/5 rounded-r-xl py-2 pr-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Store size={11} className="text-accent" />
            <span className="text-[9px] font-black uppercase text-accent tracking-widest">Satıcı Yanıtı</span>
            <span className="text-[9px] text-brand-primary/30 font-bold">
              · {localResponse.createdAt.split('T')[0]}
            </span>
          </div>
          <p className="text-xs font-bold text-brand-primary/70">{localResponse.text}</p>
        </div>
      )}

      {/* Fotoğraf lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxPhoto(null)}
          >
            <X size={18} />
          </button>
          <img
            src={lightboxPhoto}
            alt="Büyük görünüm"
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Derleme kontrolü**

```powershell
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/product/ReviewCard.tsx
git commit -m "feat: add ReviewCard with photos, helpful vote, seller response, lightbox"
```

---

## Task 6: ReviewForm Bileşeni

**Files:**
- Create: `src/components/product/ReviewForm.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
// src/components/product/ReviewForm.tsx
import React, { useRef, useState } from 'react';
import { Star, X, Upload } from 'lucide-react';

export interface ReviewFormData {
  rating: number;
  comment: string;
  photos: string[];
  categoryRatings: { quality: number; shipping: number; description: number };
}

interface Props {
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel: () => void;
}

const CATEGORY_LABELS = {
  quality: 'Ürün Kalitesi',
  shipping: 'Kargo Hızı',
  description: 'Açıklamaya Uygunluk',
} as const;

const RATING_LABELS = ['', 'Çok Kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];

export function ReviewForm({ onSubmit, onCancel }: Props) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [categoryRatings, setCategoryRatings] = useState({ quality: 0, shipping: 0, description: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      setPhotoError('En fazla 3 fotoğraf ekleyebilirsiniz.');
      return;
    }
    setPhotoError('');
    files.forEach(file => {
      if (file.size > 500 * 1024) {
        setPhotoError('Her fotoğraf en fazla 500KB olabilir.');
        return;
      }
      const reader = new FileReader();
      reader.onload = ev => setPhotos(prev => [...prev, ev.target!.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ rating, comment: comment.trim(), photos, categoryRatings });
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hoverRating || rating;

  return (
    <form onSubmit={handleSubmit} className="bg-brand-secondary/30 rounded-[2rem] p-8 border border-brand-primary/5 space-y-6">
      <h4 className="text-sm font-black uppercase tracking-widest text-brand-primary">Değerlendirmenizi Yazın</h4>

      {/* Genel puan */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-2">Genel Puan</p>
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(i + 1)}
            >
              <Star
                size={32}
                fill={i < displayRating ? '#FF5200' : 'none'}
                className={i < displayRating ? 'text-accent' : 'text-brand-primary/20'}
              />
            </button>
          ))}
          <span className="text-xs font-bold text-brand-primary/40 ml-2">
            {RATING_LABELS[displayRating]}
          </span>
        </div>
      </div>

      {/* Kategori puanları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map(key => (
          <div key={key}>
            <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40 mb-1.5">
              {CATEGORY_LABELS[key]}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCategoryRatings(prev => ({ ...prev, [key]: i + 1 }))}
                >
                  <Star
                    size={18}
                    fill={i < categoryRatings[key] ? '#FF5200' : 'none'}
                    className={i < categoryRatings[key] ? 'text-accent' : 'text-brand-primary/20'}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Yorum */}
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Ürün hakkındaki deneyiminizi paylaşın..."
        rows={4}
        required
        className="w-full p-4 bg-white rounded-2xl border border-brand-primary/5 outline-none focus:ring-4 ring-accent/10 text-sm font-medium resize-none"
      />

      {/* Fotoğraf yükleme */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-2">
          Fotoğraf Ekle (maks. 3, her biri maks. 500KB)
        </p>
        <div className="flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <div key={i} className="relative w-20 h-20">
              <img
                src={p}
                alt=""
                className="w-full h-full object-cover rounded-xl border border-brand-primary/10"
              />
              <button
                type="button"
                onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-brand-primary/20 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-accent transition-colors"
            >
              <Upload size={16} className="text-brand-primary/30" />
              <span className="text-[9px] font-black text-brand-primary/30">Ekle</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        {photoError && <p className="text-[10px] text-red-500 font-bold mt-1">{photoError}</p>}
      </div>

      {/* Butonlar */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !comment.trim()}
          className="px-8 py-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:bg-brand-primary transition-all flex items-center gap-2"
        >
          {submitting && (
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          )}
          Gönder
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-brand-primary/5 hover:border-brand-primary/20 transition-all"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Derleme kontrolü**

```powershell
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/product/ReviewForm.tsx
git commit -m "feat: add ReviewForm with category ratings and photo upload"
```

---

## Task 7: ReviewFilters Bileşeni

**Files:**
- Create: `src/components/product/ReviewFilters.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
// src/components/product/ReviewFilters.tsx
import React from 'react';
import { cn } from '@/lib/utils';

export type SortOption = 'newest' | 'helpful' | 'highest' | 'lowest';
export type FilterOption = 'all' | 'photos' | 'verified';

interface Props {
  sort: SortOption;
  filter: FilterOption;
  starFilter: number | null;
  onSort: (s: SortOption) => void;
  onFilter: (f: FilterOption) => void;
  onStarFilter: (star: number | null) => void;
  total: number;
  filtered: number;
}

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'En Yeni',
  helpful: 'En Yararlı',
  highest: 'En Yüksek',
  lowest: 'En Düşük',
};

const FILTER_LABELS: Record<FilterOption, string> = {
  all: 'Tümü',
  photos: 'Fotoğraflı',
  verified: 'Onaylı Alıcı',
};

export function ReviewFilters({ sort, filter, starFilter, onSort, onFilter, onStarFilter, total, filtered }: Props) {
  return (
    <div className="space-y-3 py-4 border-y border-brand-primary/5">
      {/* Sıralama */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary/30 w-12">Sırala:</span>
        {(Object.keys(SORT_LABELS) as SortOption[]).map(s => (
          <button
            key={s}
            onClick={() => onSort(s)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all',
              sort === s
                ? 'bg-accent text-white shadow-sm shadow-accent/20'
                : 'bg-brand-secondary/50 text-brand-primary/50 hover:bg-brand-secondary',
            )}
          >
            {SORT_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Filtrele */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary/30 w-12">Filtre:</span>
        {(Object.keys(FILTER_LABELS) as FilterOption[]).map(f => (
          <button
            key={f}
            onClick={() => onFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all',
              filter === f
                ? 'bg-brand-primary text-white'
                : 'bg-brand-secondary/50 text-brand-primary/50 hover:bg-brand-secondary',
            )}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
        {[5, 4, 3, 2, 1].map(star => (
          <button
            key={star}
            onClick={() => onStarFilter(starFilter === star ? null : star)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all',
              starFilter === star
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'bg-brand-secondary/50 text-brand-primary/50 hover:bg-brand-secondary',
            )}
          >
            {star}★
          </button>
        ))}
      </div>

      {(filter !== 'all' || starFilter !== null) && (
        <p className="text-[10px] font-bold text-brand-primary/40">
          {filtered} / {total} yorum gösteriliyor
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Derleme kontrolü**

```powershell
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/product/ReviewFilters.tsx
git commit -m "feat: add ReviewFilters with sort and multi-filter support"
```

---

## Task 8: ReviewSection Orkestratörü

**Files:**
- Create: `src/components/product/ReviewSection.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
// src/components/product/ReviewSection.tsx
import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Review } from '@/types';
import {
  getReviewsByProduct,
  getReviewStats,
  ReviewStats,
  addReview,
  checkUserReview,
} from '@/services/reviewService';
import { RatingSummary } from './RatingSummary';
import { ReviewFilters, SortOption, FilterOption } from './ReviewFilters';
import { ReviewCard } from './ReviewCard';
import { ReviewForm, ReviewFormData } from './ReviewForm';

const PAGE_SIZE = 5;

const EMPTY_STATS: ReviewStats = {
  total: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  avgCategoryRatings: { quality: 0, shipping: 0, description: 0 },
};

interface Props {
  productId: string;
  sellerId?: string;
  productRating: number;
  currentUserId?: string;
  currentUserName?: string;
  isSeller: boolean;
  isLoggedIn: boolean;
}

export function ReviewSection({
  productId,
  sellerId,
  productRating,
  currentUserId,
  currentUserName,
  isSeller,
  isLoggedIn,
}: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>('newest');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getReviewsByProduct(productId), getReviewStats(productId)]).then(
      ([r, s]) => {
        setReviews(r);
        setStats(s);
        setLoading(false);
      },
    );
  }, [productId]);

  useEffect(() => {
    if (currentUserId) checkUserReview(productId, currentUserId).then(setHasReviewed);
  }, [productId, currentUserId]);

  async function handleSubmitReview(data: ReviewFormData) {
    if (!currentUserId || !currentUserName) return;
    await addReview({
      productId,
      sellerId,
      userId: currentUserId,
      userName: currentUserName,
      rating: data.rating,
      comment: data.comment,
      createdAt: new Date().toISOString(),
      verified: false,
      photos: data.photos,
      categoryRatings: data.categoryRatings,
      helpfulCount: 0,
      helpfulVoters: [],
    });
    setReviewSubmitted(true);
    setHasReviewed(true);
    setShowReviewForm(false);
  }

  const filtered = reviews
    .filter(r => {
      if (filter === 'photos') return (r.photos?.length ?? 0) > 0;
      if (filter === 'verified') return r.verified;
      return true;
    })
    .filter(r => starFilter === null || r.rating === starFilter)
    .sort((a, b) => {
      if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
      if (sort === 'helpful') return (b.helpfulCount || 0) - (a.helpfulCount || 0);
      if (sort === 'highest') return b.rating - a.rating;
      if (sort === 'lowest') return a.rating - b.rating;
      return 0;
    });

  const paginated = filtered.slice(0, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-brand-secondary/50 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <RatingSummary
        rating={productRating}
        stats={stats}
        activeStarFilter={starFilter}
        onStarFilter={star => { setStarFilter(star); setPage(1); }}
      />

      {/* Yorum yaz */}
      <div>
        {reviewSubmitted && (
          <div className="mb-4 px-5 py-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
            <CheckCircle2 size={16} className="text-green-500 shrink-0" />
            <p className="text-xs font-bold text-green-700">
              Yorumunuz alındı. Admin onayından sonra yayınlanacak.
            </p>
          </div>
        )}
        {!isLoggedIn ? (
          <p className="text-xs font-bold text-brand-primary/40 px-4 py-3 bg-brand-secondary/50 rounded-xl">
            Yorum yazmak için <Link to="/auth" className="text-accent underline">giriş yapın</Link>.
          </p>
        ) : hasReviewed ? (
          <div className="flex items-center gap-2 px-4 py-3 bg-accent/5 border border-accent/20 rounded-xl w-fit">
            <CheckCircle2 size={14} className="text-accent" />
            <span className="text-[10px] font-black uppercase tracking-widest text-accent">
              Bu ürüne zaten yorum yaptınız
            </span>
          </div>
        ) : !showReviewForm ? (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-8 py-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:bg-brand-primary transition-all"
          >
            Yorum Yaz
          </button>
        ) : (
          <ReviewForm
            onSubmit={handleSubmitReview}
            onCancel={() => setShowReviewForm(false)}
          />
        )}
      </div>

      {/* Filtreler */}
      {reviews.length > 0 && (
        <ReviewFilters
          sort={sort}
          filter={filter}
          starFilter={starFilter}
          onSort={s => { setSort(s); setPage(1); }}
          onFilter={f => { setFilter(f); setPage(1); }}
          onStarFilter={s => { setStarFilter(s); setPage(1); }}
          total={reviews.length}
          filtered={filtered.length}
        />
      )}

      {/* Yorum listesi */}
      <div className="space-y-0">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-sm text-brand-primary/30 font-bold">
            Bu filtreye uygun yorum bulunamadı.
          </p>
        ) : (
          paginated.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isSeller={isSeller}
            />
          ))
        )}
      </div>

      {/* Daha fazla */}
      {paginated.length < filtered.length && (
        <button
          onClick={() => setPage(p => p + 1)}
          className="w-full py-4 border border-brand-primary/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-secondary/50 transition-colors"
        >
          Daha Fazla Göster ({filtered.length - paginated.length} yorum)
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Derleme kontrolü**

```powershell
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/product/ReviewSection.tsx
git commit -m "feat: add ReviewSection orchestrator with sort, filter, pagination"
```

---

## Task 9: QuestionCard Bileşeni

**Files:**
- Create: `src/components/product/QuestionCard.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
// src/components/product/QuestionCard.tsx
import React, { useState } from 'react';
import { HelpCircle, ThumbsUp } from 'lucide-react';
import { ProductQuestion } from '@/types';
import { voteQuestionHelpful } from '@/services/productQuestionService';
import { cn } from '@/lib/utils';

interface Props {
  question: ProductQuestion;
  currentUserId?: string;
  isSeller: boolean;
  onAnswer?: (questionId: string, answer: string) => Promise<void>;
}

export function QuestionCard({ question, currentUserId, isSeller, onAnswer }: Props) {
  const [helpfulCount, setHelpfulCount] = useState(question.helpfulCount || 0);
  const [hasVoted, setHasVoted] = useState(
    currentUserId ? (question.helpfulVoters || []).includes(currentUserId) : false,
  );
  const [voting, setVoting] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localAnswer, setLocalAnswer] = useState(
    question.answer
      ? { text: question.answer, by: question.answeredBy || 'Satıcı', at: question.answeredAt || '' }
      : null,
  );

  async function handleVote() {
    if (!currentUserId || voting) return;
    setVoting(true);
    try {
      const newCount = await voteQuestionHelpful(question.id, currentUserId);
      setHelpfulCount(newCount);
      setHasVoted(v => !v);
    } finally {
      setVoting(false);
    }
  }

  async function handleAnswer() {
    if (!answerText.trim() || !onAnswer) return;
    setSubmitting(true);
    try {
      await onAnswer(question.id, answerText.trim());
      setLocalAnswer({
        text: answerText.trim(),
        by: 'Satıcı',
        at: new Date().toISOString(),
      });
      setShowAnswerForm(false);
      setAnswerText('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-[#F8F8FA] rounded-2xl p-4">
      {/* Soru */}
      <div className="flex items-start gap-2 mb-2">
        <HelpCircle size={14} className="text-accent mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-brand-primary">{question.text}</p>
          <p className="text-[10px] text-brand-primary/30 mt-0.5">
            {question.userName} · {new Date(question.createdAt).toLocaleDateString('tr-TR')}
          </p>
        </div>
        <button
          onClick={handleVote}
          disabled={!currentUserId || voting}
          className={cn(
            'flex items-center gap-1 text-[9px] font-black uppercase transition-colors shrink-0',
            hasVoted ? 'text-accent' : 'text-brand-primary/30 hover:text-accent',
            (!currentUserId || voting) && 'opacity-50 cursor-not-allowed',
          )}
          title="Faydalı"
        >
          <ThumbsUp size={11} fill={hasVoted ? 'currentColor' : 'none'} />
          {helpfulCount > 0 && <span>{helpfulCount}</span>}
        </button>
      </div>

      {/* Cevap */}
      {localAnswer ? (
        <div className="ml-5 pl-3 border-l-2 border-accent/30">
          <p className="text-xs font-bold text-brand-primary/70">{localAnswer.text}</p>
          <p className="text-[10px] text-accent font-bold mt-0.5">
            {localAnswer.by}
            {localAnswer.at && ` · ${new Date(localAnswer.at).toLocaleDateString('tr-TR')}`}
          </p>
        </div>
      ) : isSeller ? (
        <>
          {!showAnswerForm ? (
            <button
              onClick={() => setShowAnswerForm(true)}
              className="ml-5 text-[10px] font-black text-accent hover:underline mt-1"
            >
              Yanıtla
            </button>
          ) : (
            <div className="ml-5 mt-2 flex gap-2">
              <input
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                placeholder="Cevabınızı yazın..."
                className="flex-1 px-3 py-1.5 bg-white border border-brand-primary/10 rounded-xl text-xs outline-none focus:border-accent"
              />
              <button
                onClick={handleAnswer}
                disabled={submitting || !answerText.trim()}
                className="px-3 py-1.5 bg-accent text-white rounded-xl text-xs font-black disabled:opacity-50"
              >
                Gönder
              </button>
              <button
                onClick={() => setShowAnswerForm(false)}
                className="px-3 py-1.5 bg-white border border-brand-primary/10 rounded-xl text-xs font-black"
              >
                İptal
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="ml-5 text-[10px] text-brand-primary/20 font-bold italic mt-1">
          Henüz cevaplanmadı
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Derleme kontrolü**

```powershell
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/product/QuestionCard.tsx
git commit -m "feat: add QuestionCard with helpful vote and inline seller answer"
```

---

## Task 10: QASection Orkestratörü

**Files:**
- Create: `src/components/product/QASection.tsx`

- [ ] **Step 1: Bileşeni oluştur**

```tsx
// src/components/product/QASection.tsx
import React, { useEffect, useState } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductQuestion } from '@/types';
import { getQuestions, askQuestion, answerQuestion } from '@/services/productQuestionService';
import { QuestionCard } from './QuestionCard';

const QA_PAGE_SIZE = 5;

interface Props {
  productId: string;
  currentUserId?: string;
  currentUserName?: string;
  isSeller: boolean;
  isLoggedIn: boolean;
}

export function QASection({ productId, currentUserId, currentUserName, isSeller, isLoggedIn }: Props) {
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getQuestions(productId)
      .then(setQuestions)
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleAskQuestion() {
    if (!questionText.trim() || !currentUserId || !currentUserName) return;
    setSubmitting(true);
    try {
      const newQ = await askQuestion(productId, currentUserId, currentUserName, questionText.trim());
      setQuestions(prev => [newQ, ...prev]);
      setQuestionText('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAnswer(questionId: string, answer: string) {
    await answerQuestion(questionId, answer, currentUserName || 'Satıcı');
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? { ...q, answer, answeredBy: currentUserName || 'Satıcı', answeredAt: new Date().toISOString() }
          : q,
      ),
    );
  }

  const filtered = questions.filter(q => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return q.text.toLowerCase().includes(s) || (q.answer || '').toLowerCase().includes(s);
  });

  const paginated = filtered.slice(0, page * QA_PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Soru sor */}
      {isLoggedIn ? (
        <div className="flex gap-2">
          <input
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !submitting && handleAskQuestion()}
            placeholder="Ürün hakkında bir soru sorun..."
            className="flex-1 px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm outline-none focus:ring-2 ring-accent/20 border border-transparent focus:border-accent/30"
          />
          <button
            onClick={handleAskQuestion}
            disabled={submitting || !questionText.trim()}
            className="px-6 py-3 bg-accent text-white rounded-xl text-xs font-black disabled:opacity-50 hover:bg-accent/90 transition-colors whitespace-nowrap"
          >
            {submitting ? '...' : 'Soru Sor'}
          </button>
        </div>
      ) : (
        <p className="text-xs text-brand-primary/40 font-bold py-2">
          Soru sormak için <Link to="/auth" className="text-accent underline">giriş yapın</Link>.
        </p>
      )}

      {/* Arama */}
      {questions.length > 3 && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary/30" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Sorular içinde ara..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#F8F8FA] rounded-xl text-sm outline-none focus:ring-2 ring-accent/20"
          />
        </div>
      )}

      {/* Sayaç */}
      {filtered.length > 0 && (
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
          {filtered.length} Soru-Cevap
        </p>
      )}

      {/* Liste */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-brand-secondary/50 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle size={32} className="mx-auto text-brand-primary/10 mb-2" />
          <p className="text-xs font-bold text-brand-primary/30">
            {search
              ? 'Aramanıza uygun soru bulunamadı.'
              : 'Henüz soru sorulmamış. İlk soran sen ol!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map(q => (
            <QuestionCard
              key={q.id}
              question={q}
              currentUserId={currentUserId}
              isSeller={isSeller}
              onAnswer={isSeller ? handleAnswer : undefined}
            />
          ))}
        </div>
      )}

      {/* Daha fazla */}
      {paginated.length < filtered.length && (
        <button
          onClick={() => setPage(p => p + 1)}
          className="w-full py-3 border border-brand-primary/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-secondary/50 transition-colors"
        >
          Daha Fazla Göster ({filtered.length - paginated.length} soru)
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Derleme kontrolü**

```powershell
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/product/QASection.tsx
git commit -m "feat: add QASection with search, pagination, helpful vote"
```

---

## Task 11: ProductDetail Entegrasyonu

**Files:**
- Modify: `src/pages/ProductDetail.tsx`

- [ ] **Step 1: Silinecek import'ları kaldır**

`ProductDetail.tsx` dosyasında şu import satırlarını sil:

```typescript
// SİL — bu fonksiyonlar artık ReviewSection/QASection içinde kullanılıyor
import { addReview, getReviewsByProduct, checkUserReview } from '@/services/reviewService';
import { getQuestions, askQuestion, answerQuestion } from '@/services/productQuestionService';
```

- [ ] **Step 2: Yeni bileşen import'larını ekle**

Dosyanın import bölümüne ekle:

```typescript
import { ReviewSection } from '@/components/product/ReviewSection';
import { QASection } from '@/components/product/QASection';
```

- [ ] **Step 3: Silinecek state ve effect'leri kaldır**

ProductDetail içinde şu state satırlarını sil:
```typescript
// SİL:
const [firestoreReviews, setFirestoreReviews] = useState<Review[]>([]);
const [showReviewForm, setShowReviewForm] = useState(false);
const [reviewRating, setReviewRating] = useState(5);
const [reviewComment, setReviewComment] = useState('');
const [submitting, setSubmitting] = useState(false);
const [hasReviewed, setHasReviewed] = useState(false);
const [reviewSubmitted, setReviewSubmitted] = useState(false);
const [questions, setQuestions] = useState<ProductQuestion[]>([]);
const [questionText, setQuestionText] = useState('');
const [submittingQ, setSubmittingQ] = useState(false);
```

Şu useEffect'leri sil:
```typescript
// SİL — checkUserReview effect (product?.id && firebaseUser?.uid için olan):
useEffect(() => {
  if (product?.id && firebaseUser?.uid) {
    checkUserReview(product.id, firebaseUser.uid).then(setHasReviewed);
  }
}, [product?.id, firebaseUser?.uid]);

// SİL — getQuestions effect:
useEffect(() => {
  if (product?.id) getQuestions(product.id).then(setQuestions);
}, [product?.id]);
```

Ayrıca loadProduct içindeki şu satırı sil:
```typescript
// SİL — bu satırı loadProduct fonksiyonundan kaldır:
if (data) {
  getReviewsByProduct(data.id).then(setFirestoreReviews);
}
```

- [ ] **Step 4: Silinecek fonksiyonları kaldır**

```typescript
// SİL — tüm bu fonksiyonu sil:
async function handleSubmitReview(e: React.FormEvent, productId: string) { ... }

// SİL — tüm bu fonksiyonu sil:
async function handleAskQuestion() { ... }
```

`SellerAnswerForm` fonksiyon bileşenini de sil (dosyanın başındaki):
```typescript
// SİL:
function SellerAnswerForm({ onAnswer }: { onAnswer: (ans: string) => void }) { ... }
```

- [ ] **Step 5: reviews tab'ını ReviewSection ile değiştir**

ProductDetail'daki `{activeTab === 'reviews' && (...)}` bloğunu şu ile değiştir:

```tsx
{activeTab === 'reviews' && (
  <motion.div
    key="reviews"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
  >
    <ReviewSection
      productId={product.id}
      sellerId={product.sellerId}
      productRating={product.rating}
      currentUserId={firebaseUser?.uid}
      currentUserName={user?.name || firebaseUser?.displayName || undefined}
      isSeller={user?.id === product.sellerId || (user as any)?.role === 'admin'}
      isLoggedIn={!!firebaseUser}
    />
  </motion.div>
)}
```

- [ ] **Step 6: qa tab'ını QASection ile değiştir**

`{activeTab === 'qa' && (...)}` bloğunu şu ile değiştir:

```tsx
{activeTab === 'qa' && (
  <motion.div
    key="qa"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <QASection
      productId={product.id}
      currentUserId={firebaseUser?.uid}
      currentUserName={user?.name || firebaseUser?.displayName || undefined}
      isSeller={user?.id === product.sellerId || (user as any)?.role === 'admin'}
      isLoggedIn={!!firebaseUser}
    />
  </motion.div>
)}
```

- [ ] **Step 7: Derleme kontrolü**

```powershell
npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 hata.

- [ ] **Step 8: Geliştirme sunucusunu çalıştır ve test et**

```powershell
cd "O:\AI\E-tic 2026"
npm run dev
```

Tarayıcıda herhangi bir ürün sayfasını aç (örn. `http://localhost:5173/product/[herhangi-bir-slug]`) ve şunları kontrol et:
- Reviews tab: Yıldız dağılımı görünüyor, yorum yazma butonu var
- Giriş yapılıysa "Yorum Yaz" formu açılıyor, kategori puanları + fotoğraf yükleme çalışıyor
- Q&A tab: Soru sor kutusu görünüyor, mevcut sorular listeleniyor
- Star filter butonları çalışıyor (tıklayınca filtreli yorum sayısı değişiyor)

- [ ] **Step 9: Commit**

```bash
git add src/pages/ProductDetail.tsx
git commit -m "feat: replace inline review/QA code with ReviewSection and QASection components"
```

---

## Son Derleme ve Bütünleşik Test

- [ ] **Tam derleme kontrolü**

```powershell
npx tsc --noEmit
```

- [ ] **Lint kontrolü**

```powershell
npm run lint 2>&1 | head -30
```

- [ ] **Manuel test senaryoları**

| Senaryo | Beklenti |
|---------|----------|
| Giriş yapılmamış → Reviews tab | "Giriş yapın" mesajı görünür |
| Giriş yapılmış, yorum yazılmamış → Reviews tab | "Yorum Yaz" butonu görünür |
| "Yorum Yaz" tıkla | Form açılır: genel puan + 3 kategori + textarea + fotoğraf |
| 3★ filtre tıkla | Sadece 3 yıldızlı yorumlar gösterilir |
| "En Yararlı" sırala | helpfulCount'a göre sıralar |
| Q&A tab → 3+ soru varsa | Arama kutusu görünür |
| Arama kutusuna yaz | Sorular filtreler |
| Daha Fazla Göster | Sayfa artırır, ek yorumlar yüklenir |

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: complete product page rating, review & Q&A system — competitive with Trendyol/Hepsiburada"
```
