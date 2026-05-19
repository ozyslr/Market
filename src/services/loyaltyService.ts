import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, increment,
  query, where, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earned' | 'redeemed' | 'expired';
  source: 'purchase' | 'review' | 'bonus' | 'redemption';
  orderId?: string;
  description: string;
  createdAt: string;
}

export interface PointsBalance {
  userId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  updatedAt: string;
}

const BALANCE_COL = 'pointsBalances';
const TX_COL = 'pointsTransactions';

// ─── Constants ──────────────────────────────────────────────────────────────

const REWARD_RATES = {
  purchase: 0.05,        // 5% of order value as points
  review: 50,            // 50 points per verified review
  firstPurchase: 200,    // 200 points welcome bonus
  signup: 100,           // 100 points signup bonus
} as const;

export const REDEMPTION_RATE = 0.5; // 1 point = 0.50 currency discount

// ─── Balance ────────────────────────────────────────────────────────────────

async function ensureBalance(userId: string): Promise<PointsBalance> {
  const ref = doc(db, BALANCE_COL, userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as PointsBalance;
  }
  const now = new Date().toISOString();
  const newBalance: PointsBalance = {
    userId,
    balance: 0,
    lifetimeEarned: 0,
    lifetimeRedeemed: 0,
    updatedAt: now,
  };
  await setDoc(ref, newBalance);
  return newBalance;
}

export async function getPointsBalance(userId: string): Promise<PointsBalance> {
  return ensureBalance(userId);
}

export async function getPointsTransactions(
  userId: string,
  max = 20,
): Promise<PointsTransaction[]> {
  const snap = await getDocs(query(
    collection(db, TX_COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(max),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as PointsTransaction);
}

// ─── Earn ───────────────────────────────────────────────────────────────────

export async function earnPoints(params: {
  userId: string;
  amount: number;
  source: PointsTransaction['source'];
  orderId?: string;
  description: string;
}): Promise<PointsTransaction> {
  const txRef = doc(collection(db, TX_COL));
  const now = new Date().toISOString();

  const tx: PointsTransaction = {
    id: txRef.id,
    userId: params.userId,
    amount: params.amount,
    type: 'earned',
    source: params.source,
    orderId: params.orderId,
    description: params.description,
    createdAt: now,
  };

  await setDoc(txRef, tx);
  await updateDoc(doc(db, BALANCE_COL, params.userId), {
    balance: increment(params.amount),
    lifetimeEarned: increment(params.amount),
    updatedAt: now,
  });

  return tx;
}

export async function earnPurchasePoints(
  userId: string,
  orderTotal: number,
  orderId: string,
): Promise<PointsTransaction> {
  const amount = Math.floor(orderTotal * REWARD_RATES.purchase);
  return earnPoints({
    userId,
    amount,
    source: 'purchase',
    orderId,
    description: `${orderTotal} ₺ tutarındaki siparişten kazanılan puan`,
  });
}

export async function earnReviewPoints(userId: string): Promise<PointsTransaction> {
  return earnPoints({
    userId,
    amount: REWARD_RATES.review,
    source: 'review',
    description: 'Ürün değerlendirmesi için kazanılan puan',
  });
}

export async function earnFirstPurchaseBonus(userId: string, orderId: string): Promise<PointsTransaction> {
  return earnPoints({
    userId,
    amount: REWARD_RATES.firstPurchase,
    source: 'bonus',
    orderId,
    description: 'İlk alışveriş hoş geldin bonusu!',
  });
}

export async function earnSignupBonus(userId: string): Promise<PointsTransaction> {
  return earnPoints({
    userId,
    amount: REWARD_RATES.signup,
    source: 'bonus',
    description: 'Kayıt hoş geldin bonusu',
  });
}

// ─── Redeem ─────────────────────────────────────────────────────────────────

export async function redeemPoints(
  userId: string,
  amount: number,
  orderId?: string,
): Promise<PointsTransaction> {
  const balance = await ensureBalance(userId);
  if (balance.balance < amount) {
    throw new Error('Yetersiz puan bakiyesi');
  }

  const txRef = doc(collection(db, TX_COL));
  const now = new Date().toISOString();

  const tx: PointsTransaction = {
    id: txRef.id,
    userId,
    amount: -amount,
    type: 'redeemed',
    source: 'redemption',
    orderId,
    description: `Puan kullanımı (${amount} puan = ${(amount * REDEMPTION_RATE).toFixed(2)} ₺)`,
    createdAt: now,
  };

  await setDoc(txRef, tx);
  await updateDoc(doc(db, BALANCE_COL, userId), {
    balance: increment(-amount),
    lifetimeRedeemed: increment(amount),
    updatedAt: now,
  });

  return tx;
}

export function pointsToCurrency(points: number): number {
  return points * REDEMPTION_RATE;
}

export function currencyToPoints(currency: number): number {
  return Math.ceil(currency / REDEMPTION_RATE);
}
