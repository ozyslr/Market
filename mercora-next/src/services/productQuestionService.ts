'use client';

import {
  collection, addDoc, getDocs, updateDoc, doc, deleteDoc, getDoc,
  query, where, orderBy, arrayUnion, arrayRemove, increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';
import { createNotification } from '@/services/notificationService';
import type { ProductQuestion } from '@/types';

const COL = 'productQuestions';

export async function askQuestion(
  data: Omit<ProductQuestion, 'id' | 'createdAt'>,
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COL);
    throw error;
  }
}

export async function getProductQuestions(productId: string): Promise<ProductQuestion[]> {
  try {
    const q = query(
      collection(db, COL),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductQuestion));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function getSellerQuestions(sellerId: string): Promise<ProductQuestion[]> {
  try {
    const q = query(
      collection(db, COL),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductQuestion));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function answerQuestion(
  questionId: string,
  answer: string,
  answeredBy: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, COL, questionId), {
      answer,
      answeredBy,
      answeredAt: new Date().toISOString(),
    });

    // Notify the asker
    const ref = doc(db, COL, questionId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const question = snap.data() as ProductQuestion;
      if (question.userId) {
        await createNotification(
          question.userId,
          'question_answered',
          'Your question has been answered',
          `Seller replied: "${answer.slice(0, 100)}${answer.length > 100 ? '...' : ''}"`,
        );
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${questionId}`);
    throw error;
  }
}

export async function voteQuestionHelpful(questionId: string, userId: string): Promise<number> {
  try {
    const ref = doc(db, COL, questionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Question not found');

    const data = snap.data() as ProductQuestion;
    const alreadyVoted = (data.helpfulVoters || []).includes(userId);
    await updateDoc(ref, {
      helpfulVoters: alreadyVoted ? arrayRemove(userId) : arrayUnion(userId),
      helpfulCount: increment(alreadyVoted ? -1 : 1),
    });
    return (data.helpfulCount ?? 0) + (alreadyVoted ? -1 : 1);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${questionId}`);
    throw error;
  }
}

export async function deleteQuestion(questionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COL, questionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COL}/${questionId}`);
  }
}
