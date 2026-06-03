// ─── Finance Service (client-side) ───────────────────────────────────────────
// All financial data is fetched from the server API — no direct Firestore reads.
// This implements Anti-Pattern 4 (T-02-014): ledger is server-only.

import { auth } from '@/lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FinanceSummary {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  currency?: string;
}

export interface Transaction {
  entryId: string;
  type: 'order_charge' | 'commission' | 'payout' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  status?: string;
  reason: string;
  reference?: string;
  orderSetId?: string;
  subOrderId?: string;
  createdAt: string;
}

export interface PayoutEntry {
  entryId: string;
  amount: number;
  currency: string;
  status?: string;
  reason: string;
  createdAt: string;
}

export interface TransactionFilters {
  type?: 'order_charge' | 'commission' | 'payout' | 'refund' | 'adjustment';
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface CommissionBreakdown {
  orderSetId: string;
  subtotal: number;
  commissionAmount: number;
  rate: number;
  netToSeller: number;
  currency: string;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getIdToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Get seller finance summary (available, pending, totalEarned).
 * Replaces old direct Firestore call to sellerFinance collection.
 */
export async function getSellerFinanceSummary(sellerId: string): Promise<FinanceSummary | null> {
  try {
    return await apiFetch<FinanceSummary>(`/api/finance/seller/${sellerId}/summary`);
  } catch {
    return null;
  }
}

/**
 * Get paginated seller transactions from the ledger.
 * Replaces old direct Firestore call to sellerFinance/transactions.
 */
export async function getSellerTransactions(
  sellerId: string,
  filters?: TransactionFilters,
): Promise<{ transactions: Transaction[]; total: number }> {
  try {
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    if (filters?.limit != null) params.set('limit', String(filters.limit));
    if (filters?.offset != null) params.set('offset', String(filters.offset));
    const qs = params.toString();
    return await apiFetch<{ transactions: Transaction[]; total: number }>(
      `/api/finance/seller/${sellerId}/transactions${qs ? `?${qs}` : ''}`,
    );
  } catch {
    return { transactions: [], total: 0 };
  }
}

/**
 * Get seller payout entries from the ledger.
 */
export async function getSellerPayouts(sellerId: string): Promise<PayoutEntry[]> {
  try {
    const data = await apiFetch<{ payouts: PayoutEntry[] }>(
      `/api/finance/seller/${sellerId}/payouts`,
    );
    return data.payouts;
  } catch {
    return [];
  }
}

/**
 * Trigger CSV download of seller transactions.
 * Sets Content-Disposition header on server — browser will download the file.
 */
export async function exportSellerTransactions(sellerId: string): Promise<void> {
  const token = await getIdToken();
  const res = await fetch(`/api/finance/seller/${sellerId}/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Export failed');

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const cd = res.headers.get('Content-Disposition') ?? '';
  const match = cd.match(/filename="([^"]+)"/);
  a.download = match?.[1] ?? `islemler-${sellerId}.csv`;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get commission breakdown for a specific order.
 */
export async function getCommissionBreakdown(
  sellerId: string,
  orderSetId: string,
): Promise<CommissionBreakdown | null> {
  try {
    return await apiFetch<CommissionBreakdown>(
      `/api/finance/seller/${sellerId}/commission-breakdown/${orderSetId}`,
    );
  } catch {
    return null;
  }
}
