import {
  collection, addDoc, getDocs, getDoc,
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
