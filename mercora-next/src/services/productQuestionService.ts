'use client';

import {
  collection, addDoc, getDocs, updateDoc, doc, deleteDoc,
  query, where, orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';
import { createNotification } from '@/services/notificationService';

export interface ProductQuestion {
  id: string;
  productId: string;
  sellerId: string;
  userId: string;
  userName: string;
  question: string;
  answer?: string;
  answeredAt?: string;
  createdAt: string;
  isActive: boolean;
}

const COL = 'productQuestions';

export async function askQuestion(
  data: Omit<ProductQuestion, 'id' | 'createdAt' | 'isActive'>,
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      isActive: true,
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
      where('isActive', '==', true),
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
  userId: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, COL, questionId), {
      answer,
      answeredAt: new Date().toISOString(),
    });

    // Notify the asker
    const qSnap = await getDocs(query(
      collection(db, COL),
      where('__name__', '==', questionId),
    ));
    if (!qSnap.empty) {
      const question = qSnap.docs[0].data() as ProductQuestion;
      await createNotification(
        question.userId,
        'question_answered',
        'Your question has been answered',
        `Seller replied: "${answer.slice(0, 100)}${answer.length > 100 ? '...' : ''}"`,
      );
    }
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

export async function hideQuestion(questionId: string): Promise<void> {
  try {
    await updateDoc(doc(db, COL, questionId), { isActive: false });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${questionId}`);
  }
}
