import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Review } from '@/types';

interface ReviewInput {
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
}

interface ReviewStore {
  reviews: Review[];
  addReview: (input: ReviewInput) => void;
  getReviews: (productId: string) => Review[];
  removeReview: (id: string) => void;
}

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      reviews: [],

      addReview: (input) => {
        const review: Review = {
          id: `rev-${Date.now()}`,
          productId: input.productId,
          userId: input.userId,
          userName: input.userName,
          rating: input.rating,
          comment: input.comment,
          createdAt: new Date().toISOString(),
          verified: true,
        };
        set((state) => ({ reviews: [review, ...state.reviews] }));
      },

      getReviews: (productId) =>
        get().reviews.filter((r) => r.productId === productId),

      removeReview: (id) =>
        set((state) => ({ reviews: state.reviews.filter((r) => r.id !== id) })),
    }),
    {
      name: 'mercora-reviews-storage',
    }
  )
);
