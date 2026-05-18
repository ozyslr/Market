import {
  doc, getDoc, collection, getDocs,
  query, orderBy, limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface FinanceSummary {
  totalRevenue: number;
  pendingPayout: number;
  lastPayout?: { amount: number; date: string };
  commissionRate: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'payout' | 'refund' | 'commission';
  amount: number;
  description: string;
  orderId?: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export async function getSellerFinanceSummary(sellerId: string): Promise<FinanceSummary | null> {
  try {
    const snap = await getDoc(doc(db, 'sellerFinance', sellerId));
    return snap.exists() ? (snap.data() as FinanceSummary) : null;
  } catch {
    return null;
  }
}

export async function getSellerTransactions(sellerId: string, count = 50): Promise<Transaction[]> {
  try {
    const q = query(
      collection(db, 'sellerFinance', sellerId, 'transactions'),
      orderBy('date', 'desc'),
      limit(count)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
  } catch {
    return [];
  }
}
