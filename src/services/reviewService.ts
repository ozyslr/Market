import { collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Review } from '../types';
import { createNotification } from './notificationService';

const REVIEWS_COLLECTION = 'reviews';

export async function addReview(review: Omit<Review, 'id' | 'status'>): Promise<Review> {
  try {
    const fullReview = { ...review, status: 'pending' as const };
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), fullReview);
    return { ...fullReview, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, REVIEWS_COLLECTION);
    throw error;
  }
}

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }) as Review)
      .filter(r => r.status === 'approved');
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, REVIEWS_COLLECTION);
    return [];
  }
}

export async function checkUserReview(productId: string, userId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('productId', '==', productId),
      where('userId', '==', userId),
      limit(1)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
}

export async function getAllReviews(): Promise<Review[]> {
  try {
    const snap = await getDocs(collection(db, REVIEWS_COLLECTION));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Review);
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
