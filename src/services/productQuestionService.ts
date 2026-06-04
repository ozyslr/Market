import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProductQuestion } from '@/types';
import { createNotification } from './notificationService';

export async function getQuestions(productId: string): Promise<ProductQuestion[]> {
  try {
    const q = query(
      collection(db, 'productQuestions'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProductQuestion);
  } catch {
    return [];
  }
}

export async function askQuestion(
  productId: string,
  userId: string,
  userName: string,
  text: string,
  category?: 'size' | 'shipping' | 'stock' | 'other',
): Promise<ProductQuestion> {
  // Resolve the product's seller so the question carries sellerId (the Firestore
  // rule authorises answers by matching request.auth.token.sellerId, and the
  // seller notification needs it). Denormalised at ask time, not client-chosen.
  let sellerId: string | undefined;
  try {
    const productSnap = await getDoc(doc(db, 'products', productId));
    if (productSnap.exists()) sellerId = productSnap.data().sellerId;
  } catch {
    /* product lookup is best-effort; the question still posts */
  }

  const data = {
    productId,
    sellerId: sellerId ?? null,
    userId,
    userName,
    text,
    category,
    createdAt: new Date().toISOString(),
  };
  const ref = await addDoc(collection(db, 'productQuestions'), data);

  // Notify the seller — in-app + email — fire-and-forget; failures must not block.
  if (sellerId) {
    createNotification(
      sellerId,
      'new_question',
      'Yeni Soru',
      `"${text.slice(0, 60)}" — Bir alıcı ürününüz için soru sordu.`,
      '/seller/questions',
    ).catch(() => {});

    void (async () => {
      try {
        const { getAuth } = await import('firebase/auth');
        const current = getAuth().currentUser;
        if (!current) return;
        const token = await current.getIdToken();
        await fetch('/api/reviews/notify-seller-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId, questionId: ref.id, questionText: text }),
        });
      } catch {
        /* email notification is best-effort */
      }
    })();
  }

  return { id: ref.id, ...data, sellerId: sellerId ?? undefined };
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
  const alreadyVoted = (data.helpfulVoters || []).includes(userId);
  await updateDoc(ref, {
    helpfulVoters: alreadyVoted ? arrayRemove(userId) : arrayUnion(userId),
    helpfulCount: increment(alreadyVoted ? -1 : 1),
  });
  return (data.helpfulCount ?? 0) + (alreadyVoted ? -1 : 1);
}
