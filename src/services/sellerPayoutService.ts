import { collection, doc, getDocs, addDoc, updateDoc, query, where, orderBy, serverTimestamp, Timestamp, runTransaction, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PayoutMethod = 'bank_transfer' | 'iyzico' | 'stripe';

export interface PayoutRequest {
  id: string;
  sellerId: string;
  /** Available balance at time of request */
  amount: number;
  /** Platform fee deducted */
  fee: number;
  /** Net amount to transfer */
  netAmount: number;
  status: PayoutStatus;
  method: PayoutMethod;
  /** Bank account or payment identifier */
  destination: string;
  notes?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
}

export interface SellerBalance {
  sellerId: string;
  /** Total earned (all time) */
  totalEarned: number;
  /** Total commission deducted */
  totalCommission: number;
  /** Total platform fees deducted */
  totalFees: number;
  /** Amount already paid out */
  totalPaidOut: number;
  /** Amount currently pending (not yet released) */
  pendingBalance: number;
  /** Amount available for withdrawal */
  availableBalance: number;
  /** Currency */
  currency: string;
  updatedAt: string;
}

const BALANCE_COL = 'sellerBalances';
const PAYOUT_COL = 'payoutRequests';
const SCHEDULE_COL = 'payoutSchedules';

export interface PayoutSchedule {
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  minBalanceThreshold: number;
  autoPayoutEnabled: boolean;
  lastAutoPayout?: string;
  nextAutoPayout?: string;
}

export interface AutoPayoutResult {
  processed: number;
  skipped: number;
  failed: number;
  totalAmount: number;
  details: { sellerId: string; amount: number; status: 'completed' | 'skipped' | 'failed'; reason?: string }[];
}

export async function getSellerBalance(sellerId: string): Promise<SellerBalance | null> {
  try {
    const q = query(collection(db, BALANCE_COL), where('sellerId', '==', sellerId));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as unknown as SellerBalance;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BALANCE_COL);
    return null;
  }
}

export async function requestPayout(
  sellerId: string,
  amount: number,
  method: PayoutMethod,
  destination: string,
): Promise<string> {
  try {
    const fee = Math.max(5, amount * 0.01); // 1% processing fee, min 5 TRY
    const ref = await addDoc(collection(db, PAYOUT_COL), {
      sellerId,
      amount,
      fee: Math.round(fee * 100) / 100,
      netAmount: Math.round((amount - fee) * 100) / 100,
      status: 'pending',
      method,
      destination,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PAYOUT_COL);
    throw error;
  }
}

export async function getPayoutHistory(sellerId: string): Promise<PayoutRequest[]> {
  try {
    const q = query(
      collection(db, PAYOUT_COL),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PayoutRequest));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PAYOUT_COL);
    return [];
  }
}

export async function updatePayoutStatus(id: string, status: PayoutStatus, processedBy?: string): Promise<void> {
  try {
    await updateDoc(doc(db, PAYOUT_COL, id), {
      status,
      processedBy: processedBy || null,
      processedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PAYOUT_COL}/${id}`);
  }
}

export async function getAllPayoutRequests(status?: PayoutStatus): Promise<PayoutRequest[]> {
  try {
    const ref = collection(db, PAYOUT_COL);
    const q = status ? query(ref, where('status', '==', status)) : query(ref, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PayoutRequest));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PAYOUT_COL);
    return [];
  }
}

// ─── Payout Schedule ──────────────────────────────────────────────────────────

const DEFAULT_SCHEDULE: PayoutSchedule = {
  frequency: 'weekly',
  dayOfWeek: 1,
  minBalanceThreshold: 500,
  autoPayoutEnabled: false,
};

function computeNextPayout(schedule: PayoutSchedule): string {
  const now = new Date();
  const next = new Date(now);
  if (schedule.frequency === 'weekly') {
    const targetDay = schedule.dayOfWeek ?? 1;
    const daysUntil = (targetDay - now.getDay() + 7) % 7;
    next.setDate(now.getDate() + (daysUntil === 0 ? 7 : daysUntil));
  } else if (schedule.frequency === 'biweekly') {
    const targetDay = schedule.dayOfWeek ?? 1;
    const daysUntil = (targetDay - now.getDay() + 14) % 14;
    next.setDate(now.getDate() + (daysUntil === 0 ? 14 : daysUntil));
  } else {
    const targetDay = Math.min(schedule.dayOfMonth ?? 1, 28);
    next.setMonth(now.getDate() > targetDay ? now.getMonth() + 1 : now.getMonth());
    next.setDate(targetDay);
  }
  next.setHours(3, 0, 0, 0);
  return next.toISOString();
}

export async function getPayoutSchedule(sellerId: string): Promise<PayoutSchedule> {
  try {
    const snap = await getDocs(query(collection(db, SCHEDULE_COL), where('sellerId', '==', sellerId)));
    if (snap.empty) return { ...DEFAULT_SCHEDULE };
    return { ...DEFAULT_SCHEDULE, ...snap.docs[0].data() as PayoutSchedule };
  } catch { return { ...DEFAULT_SCHEDULE }; }
}

export async function updatePayoutSchedule(sellerId: string, updates: Partial<PayoutSchedule>): Promise<void> {
  try {
    const snap = await getDocs(query(collection(db, SCHEDULE_COL), where('sellerId', '==', sellerId)));
    const schedule = { ...DEFAULT_SCHEDULE, ...updates, nextAutoPayout: undefined };
    schedule.nextAutoPayout = computeNextPayout(schedule);
    if (snap.empty) {
      await addDoc(collection(db, SCHEDULE_COL), { sellerId, ...schedule });
    } else {
      await updateDoc(doc(db, SCHEDULE_COL, snap.docs[0].id), schedule as any);
    }
  } catch (error) { handleFirestoreError(error, OperationType.WRITE, SCHEDULE_COL); throw error; }
}

// ─── Automatic Payout Processing ──────────────────────────────────────────────

export async function processAutomaticPayouts(processedBy = 'auto'): Promise<AutoPayoutResult> {
  const result: AutoPayoutResult = { processed: 0, skipped: 0, failed: 0, totalAmount: 0, details: [] };
  try {
    const schedulesSnap = await getDocs(collection(db, SCHEDULE_COL));
    const schedules = new Map<string, PayoutSchedule>();
    schedulesSnap.docs.forEach(d => {
      const s = d.data() as PayoutSchedule & { sellerId: string };
      if (s.autoPayoutEnabled) schedules.set(s.sellerId, s);
    });
    if (schedules.size === 0) return result;

    const balancesSnap = await getDocs(collection(db, BALANCE_COL));
    const now = new Date().toISOString();

    for (const balanceDoc of balancesSnap.docs) {
      const balance = balanceDoc.data() as SellerBalance & { id: string };
      const schedule = schedules.get(balance.sellerId);
      if (!schedule) { result.skipped++; continue; }

      const available = balance.availableBalance ?? 0;
      if (available < schedule.minBalanceThreshold) {
        result.skipped++;
        result.details.push({ sellerId: balance.sellerId, amount: available, status: 'skipped', reason: `Minimum bakiye (${schedule.minBalanceThreshold} ₺) altında` });
        continue;
      }

      try {
        const fee = Math.round(Math.max(5, available * 0.01) * 100) / 100;
        const netAmount = Math.round((available - fee) * 100) / 100;
        await addDoc(collection(db, PAYOUT_COL), {
          sellerId: balance.sellerId, amount: available, fee, netAmount,
          status: 'completed', method: 'bank_transfer', destination: 'auto',
          autoGenerated: true, processedBy, processedAt: now, createdAt: now,
        });
        schedule.lastAutoPayout = now;
        schedule.nextAutoPayout = computeNextPayout(schedule);
        const schedSnap = await getDocs(query(collection(db, SCHEDULE_COL), where('sellerId', '==', balance.sellerId)));
        if (!schedSnap.empty) {
          await updateDoc(doc(db, SCHEDULE_COL, schedSnap.docs[0].id), {
            lastAutoPayout: now, nextAutoPayout: schedule.nextAutoPayout,
          });
        }
        await updateDoc(doc(db, BALANCE_COL, balanceDoc.id), {
          totalPaidOut: (balance.totalPaidOut ?? 0) + available,
          availableBalance: 0, pendingBalance: 0, updatedAt: now,
        });
        result.processed++;
        result.totalAmount += netAmount;
        result.details.push({ sellerId: balance.sellerId, amount: netAmount, status: 'completed' });
      } catch (err) {
        result.failed++;
        result.details.push({ sellerId: balance.sellerId, amount: available, status: 'failed', reason: String(err) });
      }
    }
  } catch (error) { console.error('[autoPayout] Error:', error); }
  return result;
}
