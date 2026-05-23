import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Review } from '@/types';
import {
  getReviewsByProduct,
  computeReviewStats,
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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    setLoading(true);
    getReviewsByProduct(productId)
      .then(r => {
        setReviews(r);
        setStats(computeReviewStats(r));
      })
      .catch(() => setStats(EMPTY_STATS))
      .finally(() => setLoading(false));
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
    .filter(r => {
      if (!search.trim()) return true;
      return r.comment.toLowerCase().includes(search.toLowerCase());
    })
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
          <div key={i} className="h-24 bg-brand-secondary/50 dark:bg-zinc-800/50 rounded-2xl" />
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
        reviews={reviews}
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
          <p className="text-xs font-bold text-brand-primary/40 px-4 py-3 bg-brand-secondary/50 dark:bg-zinc-900 rounded-xl">
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
          search={search}
          onSearch={s => { setSearch(s); setPage(1); }}
        />
      )}

      {/* Yorum listesi */}
      <div className="space-y-0">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-sm text-brand-primary/30 dark:text-zinc-500 font-bold">
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
          className="w-full py-4 border border-brand-primary/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors text-brand-primary dark:text-white"
        >
          Daha Fazla Göster ({filtered.length - paginated.length} yorum)
        </button>
      )}
    </div>
  );
}
