import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  increment,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { Review } from '../types';
import { createNotification } from './notificationService';

const REVIEWS_COLLECTION = 'reviews';

export interface ReviewStats {
  total: number;
  distribution: Record<number, number>;
  avgCategoryRatings: { quality: number; shipping: number; description: number };
}

export interface SubmitReviewPayload {
  productId: string;
  rating: number;
  comment: string;
  userName?: string;
  photos?: string[];
  categoryRatings?: { quality?: number; shipping?: number; description?: number };
}

/**
 * Submit a review through the server endpoint (D-01). The server confirms a
 * Delivered SubOrder before writing the review via the Admin SDK and sets
 * `verified`/`status` itself — the client must never send those fields, and
 * direct client writes to the `reviews` collection are denied by firestore.rules.
 */
export async function submitReview(payload: SubmitReviewPayload): Promise<Review> {
  const { getAuth } = await import('firebase/auth');
  const current = getAuth().currentUser;
  if (!current) throw new Error('Oturum bulunamadı');
  const token = await current.getIdToken();

  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Yorum gönderilemedi');
  return data.data as Review;
}

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Review)
      .filter((r) => r.status === 'approved');
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, REVIEWS_COLLECTION);
    return [];
  }
}

export function subscribeToProductReviews(
  productId: string,
  callback: (reviews: Review[]) => void,
): () => void {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('productId', '==', productId),
    orderBy('createdAt', 'desc'),
    limit(50),
  );
  return onSnapshot(
    q,
    (snap) => {
      const reviews = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Review)
        .filter((r) => r.status === 'approved');
      callback(reviews);
    },
    () => callback([]),
  );
}

export async function checkUserReview(productId: string, userId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('productId', '==', productId),
      where('userId', '==', userId),
      where('status', '==', 'approved'),
      limit(1),
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
}

export async function updateReview(
  reviewId: string,
  data: { rating: number; comment: string },
): Promise<void> {
  try {
    await updateDoc(doc(db, REVIEWS_COLLECTION, reviewId), {
      rating: data.rating,
      comment: data.comment,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REVIEWS_COLLECTION}/${reviewId}`);
    throw error;
  }
}

export async function deleteReview(reviewId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${REVIEWS_COLLECTION}/${reviewId}`);
    throw error;
  }
}

export async function getAllReviews(): Promise<Review[]> {
  try {
    const snap = await getDocs(collection(db, REVIEWS_COLLECTION));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, REVIEWS_COLLECTION);
    return [];
  }
}

export async function approveReview(reviewId: string): Promise<void> {
  try {
    const ref = doc(db, REVIEWS_COLLECTION, reviewId);
    await updateDoc(ref, { status: 'approved' });
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const review = snap.data() as Review;
      if (review.userId) {
        await createNotification(
          review.userId,
          'review_approved',
          'Yorumunuz Onaylandı',
          'Ürün yorumunuz incelendi ve yayına alındı.',
        );
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${REVIEWS_COLLECTION}/${reviewId}`);
    throw error;
  }
}

export async function rejectReview(reviewId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${REVIEWS_COLLECTION}/${reviewId}`);
    throw error;
  }
}

export function computeReviewStats(reviews: Review[]): ReviewStats {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let qualitySum = 0,
    shippingSum = 0,
    descSum = 0,
    catCount = 0;

  reviews.forEach((r) => {
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

export async function getReviewStats(productId: string): Promise<ReviewStats> {
  const reviews = await getReviewsByProduct(productId);
  return computeReviewStats(reviews);
}

export async function voteReviewHelpful(reviewId: string, userId: string): Promise<number> {
  const ref = doc(db, REVIEWS_COLLECTION, reviewId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Review not found');

  const data = snap.data() as Review;
  const alreadyVoted = (data.helpfulVoters || []).includes(userId);
  await updateDoc(ref, {
    helpfulVoters: alreadyVoted ? arrayRemove(userId) : arrayUnion(userId),
    helpfulCount: increment(alreadyVoted ? -1 : 1),
  });
  return (data.helpfulCount ?? 0) + (alreadyVoted ? -1 : 1);
}

export async function uploadReviewPhoto(
  file: File,
  productId: string,
  userId: string,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `reviews/${productId}/${userId}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function addSellerResponse(
  reviewId: string,
  text: string,
  sellerName: string,
): Promise<void> {
  await updateDoc(doc(db, REVIEWS_COLLECTION, reviewId), {
    sellerResponse: { text, sellerName, createdAt: new Date().toISOString() },
  });
}
