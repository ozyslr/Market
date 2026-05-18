import {
  collection, addDoc, getDocs,
  query, where, orderBy, updateDoc, doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProductQuestion } from '@/types';

export async function getQuestions(productId: string): Promise<ProductQuestion[]> {
  const q = query(
    collection(db, 'productQuestions'),
    where('productId', '==', productId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductQuestion));
}

export async function askQuestion(
  productId: string,
  userId: string,
  userName: string,
  text: string,
): Promise<ProductQuestion> {
  const data = {
    productId,
    userId,
    userName,
    text,
    createdAt: new Date().toISOString(),
  };
  const ref = await addDoc(collection(db, 'productQuestions'), data);
  return { id: ref.id, ...data };
}

export async function answerQuestion(
  questionId: string,
  answer: string,
  answeredBy: string,
): Promise<void> {
  await updateDoc(doc(db, 'productQuestions', questionId), {
    answer,
    answeredBy,
    answeredAt: new Date().toISOString(),
  });
}
