import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  RefreshCw,
  Send,
  Percent,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/DataStates';
import { getCommissionRules, type CommissionRule } from '@/services/commissionService';
import {
  getAllPayoutRequests,
  updatePayoutStatus,
  PayoutRequest,
} from '@/services/sellerPayoutService';
import { useAuth } from '@/context/AuthContext';

// ─── Types ──────────────────────────────────────────────────────────────────

interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  reason: string;
  reference?: string;
  orderSetId?: string;
  sellerId?: string;
  sellerName?: string;
  createdAt: string;
}

interface OverviewStats {
  totalPlatformRevenue: number;
  totalPayouts: number;
  pendingPayouts: number;
  activeSellers: number;
  totalCommission: number;
  completedOrders: number;
}

// ─── Labels & Colors ────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  commission: 'Komisyon',
  payout: 'Odeme',
  refund: 'Iade',
  adjustment: 'Duzeltme',
  order_charge: 'Satis',
};

const TYPE_COLORS: Record<string, string> = {
  commission: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  payout: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  refund: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  adjustment: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  order_charge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

const PAYOUT_STATUS: Record<string, { label: string; cls: string }> = {
  pending: {
    label: 'Bekliyor',
    cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  processing: {
    label: 'Isleniyor',
    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  },
  completed: {
    label: 'Tamamlandi',
    cls: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  },
  failed: {
    label: 'Basarisiz',
    cls: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  },
};

const FILTER_TYPES = [
  'all',
  'commission',
  'payout',
  'refund',
  'adjustment',
  'order_charge',
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return (
    amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL'
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Overview Card ──────────────────────────────────────────────────────────

function OverviewCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
  bg: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-brand-primary/5 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40 dark:text-white/40 mb-2">
            {label}
          </p>
          {loading ? (
            <div className="h-8 w-24 bg-brand-primary/5 dark:bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <h3 className="text-2xl font-display font-black text-brand-primary dark:text-white tracking-tighter">
              {value}
            </h3>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg',
            bg,
          )}
        >
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[10px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-widest mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminFinance() {
  const { user: actor } = useAuth();

  // Overview
  const [stats, setStats] = useState<OverviewStats>({
    totalPlatformRevenue: 0,
    totalPayouts: 0,
    pendingPayouts: 0,
    activeSellers: 0,
    totalCommission: 0,
    completedOrders: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  // Ledger entries
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerError, setLedgerError] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Payouts
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [payoutsError, setPayoutsError] = useState(false);
  const [processingPayout, setProcessingPayout] = useState<string | null>(null);
  const [manualPayoutSellerId, setManualPayoutSellerId] = useState('');
  const [manualPayoutAmount, setManualPayoutAmount] = useState('');
  const [manualPayouting, setManualPayouting] = useState(false);
  const [manualPayoutMsg, setManualPayoutMsg] = useState('');

  // Commission rules
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesError, setRulesError] = useState(false);

  // ─── Load Overview Stats ──────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(false);
    try {
      const { collection, getDocs, getCountFromServer, query, orderBy, limit } =
        await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const [ledgerSnap, payoutSnap, sellersCount] = await Promise.all([
        getDocs(query(collection(db, 'ledger'), orderBy('createdAt', 'desc'), limit(1000))),
        getDocs(query(collection(db, 'payoutRequests'), orderBy('createdAt', 'desc'), limit(500))),
        getCountFromServer(collection(db, 'sellers')),
      ]);

      let totalCommission = 0;
      let totalPayouts = 0;
      ledgerSnap.forEach((d) => {
        const data = d.data();
        if (
          data.type === 'commission' &&
          (data.status === 'collected' || data.status === 'released')
        ) {
          totalCommission += data.amount || 0;
        }
        if (data.type === 'payout' && data.status === 'released') {
          totalPayouts += data.amount || 0;
        }
      });

      let pendingPayouts = 0;
      payoutSnap.forEach((d) => {
        const data = d.data();
        if (data.status === 'pending' || data.status === 'processing') {
          pendingPayouts += data.netAmount || data.amount || 0;
        }
      });

      setStats({
        totalPlatformRevenue: totalCommission,
        totalPayouts,
        pendingPayouts,
        activeSellers: sellersCount.data().count,
        totalCommission,
        completedOrders: 0,
      });
    } catch {
      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ─── Load Ledger ──────────────────────────────────────────────────────────

  const loadLedger = useCallback(async () => {
    setLedgerLoading(true);
    setLedgerError(false);
    try {
      const {
        collection,
        getDocs,
        query,
        orderBy,
        limit,
        doc: docRef,
        getDoc,
      } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const snap = await getDocs(
        query(collection(db, 'ledger'), orderBy('createdAt', 'desc'), limit(50)),
      );

      const entries: LedgerEntry[] = [];
      const sellerNameCache: Record<string, string> = {};

      for (const d of snap.docs) {
        const data = d.data();
        let sellerName = data.sellerName || '';

        if (!sellerName && data.sellerId && sellerNameCache[data.sellerId] === undefined) {
          try {
            const sellerDoc = await getDoc(docRef(db, 'sellers', data.sellerId));
            if (sellerDoc.exists()) {
              const sdata = sellerDoc.data();
              sellerName = sdata.storeName || sdata.name || data.sellerId;
            } else {
              sellerName = data.sellerId;
            }
            sellerNameCache[data.sellerId] = sellerName;
          } catch {
            sellerNameCache[data.sellerId] = data.sellerId;
          }
        } else if (!sellerName && data.sellerId) {
          sellerName = sellerNameCache[data.sellerId];
        }

        entries.push({
          id: d.id,
          type: data.type || 'commission',
          amount: data.amount || 0,
          currency: data.currency || 'TRY',
          status: data.status || 'pending',
          reason: data.reason || '',
          reference: data.reference || '',
          orderSetId: data.orderSetId || '',
          sellerId: data.sellerId || '',
          sellerName,
          createdAt: data.createdAt || '',
        });
      }

      setLedgerEntries(entries);
    } catch {
      setLedgerError(true);
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  // ─── Load Payouts ─────────────────────────────────────────────────────────

  const loadPayouts = useCallback(async () => {
    setPayoutsLoading(true);
    setPayoutsError(false);
    try {
      const result = await getAllPayoutRequests();
      setPayouts(result);
    } catch {
      setPayoutsError(true);
    } finally {
      setPayoutsLoading(false);
    }
  }, []);

  // ─── Load Commission Rules ────────────────────────────────────────────────

  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    setRulesError(false);
    try {
      const result = await getCommissionRules();
      setRules(result);
    } catch {
      setRulesError(true);
    } finally {
      setRulesLoading(false);
    }
  }, []);

  // ─── Initial Load ─────────────────────────────────────────────────────────

  useEffect(() => {
    loadStats();
    loadLedger();
    loadPayouts();
    loadRules();
  }, [loadStats, loadLedger, loadPayouts, loadRules]);

  // ─── Manual Payout ────────────────────────────────────────────────────────

  const handleManualPayout = async () => {
    if (!manualPayoutSellerId || !manualPayoutAmount) return;
    setManualPayouting(true);
    setManualPayoutMsg('');
    try {
      const { getAuth } = await import('firebase/auth');
      const token = await getAuth().currentUser?.getIdToken();
      const res = await fetch('/api/admin/manual-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sellerId: manualPayoutSellerId,
          amount: Number(manualPayoutAmount),
          entryIds: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Odeme islenemedi');
      setManualPayoutMsg(`Odeme basarili: ${manualPayoutAmount} TL -> ${manualPayoutSellerId}`);
      setManualPayoutSellerId('');
      setManualPayoutAmount('');
      loadPayouts();
      loadStats();
    } catch (err: any) {
      setManualPayoutMsg(`Hata: ${err.message}`);
    } finally {
      setManualPayouting(false);
      setTimeout(() => setManualPayoutMsg(''), 6000);
    }
  };

  const handleApprovePayout = async (payoutId: string) => {
    setProcessingPayout(payoutId);
    try {
      await updatePayoutStatus(payoutId, 'completed', actor?.id || 'admin');
      await loadPayouts();
      await loadStats();
    } catch {
      // updatePayoutStatus handles errors internally
    } finally {
      setProcessingPayout(null);
    }
  };

  // ─── Filtered Ledger ──────────────────────────────────────────────────────

  const filteredLedger =
    typeFilter === 'all' ? ledgerEntries : ledgerEntries.filter((e) => e.type === typeFilter);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 lg:space-y-12">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
            Finans{' '}
            <span className="text-accent underline underline-offset-4 decoration-2">Takibi</span>
          </h1>
          <p className="text-[10px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-widest mt-1">
            Platform gelirleri, odemeler ve komisyon yonetimi
          </p>
        </div>
        <button
          onClick={() => {
            loadStats();
            loadLedger();
            loadPayouts();
            loadRules();
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-brand-primary/5 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-primary/60 hover:text-accent transition-colors shadow-sm"
        >
          <RefreshCw size={14} /> Yenile
        </button>
      </div>

      {/* ── Overview Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard
          label="Platform Geliri"
          value={formatCurrency(stats.totalPlatformRevenue)}
          icon={DollarSign}
          color="#F9423A"
          bg="bg-gradient-to-tr from-[#F9423A] to-orange-500"
          loading={statsLoading}
        />
        <OverviewCard
          label="Toplam Odemeler"
          value={formatCurrency(stats.totalPayouts)}
          icon={Send}
          color="#10B981"
          bg="bg-gradient-to-tr from-[#10B981] to-[#34D399]"
          loading={statsLoading}
        />
        <OverviewCard
          label="Bekleyen Odemeler"
          value={formatCurrency(stats.pendingPayouts)}
          icon={Clock}
          color="#F59E0B"
          bg="bg-gradient-to-tr from-[#F59E0B] to-[#FBBF24]"
          loading={statsLoading}
        />
        <OverviewCard
          label="Aktif Saticilar"
          value={statsLoading ? '' : stats.activeSellers.toLocaleString('tr-TR')}
          icon={TrendingUp}
          color="#3B82F6"
          bg="bg-gradient-to-tr from-[#3B82F6] to-[#60A5FA]"
          loading={statsLoading}
        />
      </div>
      {statsError && (
        <ErrorState message="Finansal ozet verileri yuklenemedi." onRetry={loadStats} />
      )}

      {/* ── Recent Transactions Table ───────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] lg:rounded-[3.5rem] border border-brand-primary/5 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 lg:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-primary/5 dark:border-white/5">
          <div>
            <h2 className="text-xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
              Son Islemler
            </h2>
            <p className="text-[10px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-widest mt-1">
              Son 50 kayit
              {typeFilter !== 'all' ? ` / ${TYPE_LABELS[typeFilter] || typeFilter}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_TYPES.map((ft) => (
              <button
                key={ft}
                onClick={() => setTypeFilter(ft)}
                className={cn(
                  'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                  typeFilter === ft
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-[#F8F8FA] dark:bg-zinc-800 text-brand-primary/40 dark:text-white/40 hover:text-brand-primary dark:hover:text-white',
                )}
              >
                {ft === 'all' ? 'Tumu' : TYPE_LABELS[ft] || ft}
              </button>
            ))}
          </div>
        </div>

        {ledgerLoading ? (
          <LoadingState label="Defter kayitlari yukleniyor..." />
        ) : ledgerError ? (
          <div className="p-10">
            <ErrorState message="Ledger kayitlari yuklenemedi." onRetry={loadLedger} />
          </div>
        ) : filteredLedger.length === 0 ? (
          <div className="p-10">
            <EmptyState title="Islem bulunamadi" description="Secilen filtreye uygun kayit yok." />
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-start">
              <thead>
                <tr className="bg-[#F8F8FA] dark:bg-zinc-950 text-[10px] font-black uppercase tracking-widest text-brand-primary/30 dark:text-white/30">
                  <th className="px-8 py-5 text-start">Tur</th>
                  <th className="px-6 py-5 text-start">Tutar</th>
                  <th className="px-6 py-5 text-start">Satici</th>
                  <th className="px-6 py-5 text-start">Aciklama</th>
                  <th className="px-6 py-5 text-start">Durum</th>
                  <th className="px-8 py-5 text-end">Tarih</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {filteredLedger.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-[#F8F8FA] dark:border-white/5 last:border-0 hover:bg-[#F8F8FA]/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-8 py-5">
                      <span
                        className={cn(
                          'px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest',
                          TYPE_COLORS[entry.type] ||
                            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                        )}
                      >
                        {TYPE_LABELS[entry.type] || entry.type}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-mono font-black text-brand-primary dark:text-white">
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-medium text-brand-primary/60 dark:text-white/60 truncate max-w-[160px]">
                        {entry.sellerName || entry.sellerId || '---'}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-brand-primary/40 dark:text-white/40 truncate max-w-[200px]">
                        {entry.reason || entry.reference || '---'}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={cn(
                          'px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest',
                          entry.status === 'released' || entry.status === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : entry.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : entry.status === 'reversed' || entry.status === 'failed'
                                ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
                        )}
                      >
                        {entry.status === 'released'
                          ? 'Tamamlandi'
                          : entry.status === 'collected'
                            ? 'Tahsil Edildi'
                            : entry.status === 'pending'
                              ? 'Bekliyor'
                              : entry.status === 'reversed'
                                ? 'Iptal'
                                : entry.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-end font-medium text-brand-primary/20 dark:text-white/20">
                      {formatDateTime(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Payout Management + Commission Rules ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Payout List */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 rounded-[2rem] lg:rounded-[3.5rem] border border-brand-primary/5 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="p-6 lg:p-10 border-b border-brand-primary/5 dark:border-white/5">
            <h2 className="text-xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
              Odeme Yonetimi
            </h2>
            <p className="text-[10px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-widest mt-1">
              {payouts.length} odeme talebi
            </p>
          </div>

          {payoutsLoading ? (
            <LoadingState label="Odeme talepleri yukleniyor..." />
          ) : payoutsError ? (
            <div className="p-10">
              <ErrorState message="Odeme talepleri yuklenemedi." onRetry={loadPayouts} />
            </div>
          ) : payouts.length === 0 ? (
            <div className="p-10">
              <EmptyState
                title="Odeme talebi yok"
                description="Henuz bir odeme talebi bulunmuyor."
              />
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar max-h-[500px] overflow-y-auto">
              <table className="w-full text-start">
                <thead className="sticky top-0 bg-[#F8F8FA] dark:bg-zinc-950 z-10">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30 dark:text-white/30">
                    <th className="px-8 py-5 text-start">Satici</th>
                    <th className="px-6 py-5 text-start">Tutar</th>
                    <th className="px-6 py-5 text-start">Net</th>
                    <th className="px-6 py-5 text-start">Yontem</th>
                    <th className="px-6 py-5 text-center">Durum</th>
                    <th className="px-6 py-5 text-end">Islem</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {payouts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-[#F8F8FA] dark:border-white/5 last:border-0 hover:bg-[#F8F8FA]/50 dark:hover:bg-white/[0.02]"
                    >
                      <td className="px-8 py-5">
                        <p className="font-bold text-brand-primary dark:text-white truncate max-w-[120px]">
                          {p.sellerId}
                        </p>
                        <p className="text-[9px] text-brand-primary/30 dark:text-white/30 mt-0.5">
                          {formatDate(p.createdAt)}
                        </p>
                      </td>
                      <td className="px-6 py-5 font-mono font-medium text-brand-primary/60 dark:text-white/60">
                        {p.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </td>
                      <td className="px-6 py-5 font-mono font-black text-brand-primary dark:text-white">
                        {p.netAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-bold text-brand-primary/40 dark:text-white/40 uppercase">
                          {p.method === 'bank_transfer'
                            ? 'Banka'
                            : p.method === 'iyzico'
                              ? 'Iyzico'
                              : p.method === 'stripe'
                                ? 'Stripe'
                                : p.method}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={cn(
                            'px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest',
                            PAYOUT_STATUS[p.status]?.cls ||
                              'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                          )}
                        >
                          {PAYOUT_STATUS[p.status]?.label || p.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-end">
                        {(p.status === 'pending' || p.status === 'processing') && (
                          <button
                            onClick={() => handleApprovePayout(p.id)}
                            disabled={processingPayout === p.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-accent/90 transition-colors disabled:opacity-50"
                          >
                            {processingPayout === p.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={12} />
                            )}
                            Onayla
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Manual Payout + Commission Rules */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Manual Payout Form */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] lg:rounded-[3.5rem] p-6 lg:p-10 border border-brand-primary/5 dark:border-white/5 shadow-sm">
            <h2 className="text-xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white mb-6">
              Manuel Odeme
            </h2>
            <p className="text-[10px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-widest mb-4">
              Admin yetkisiyle odeme baslat
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-white/40 block mb-2">
                  Satici ID
                </label>
                <input
                  type="text"
                  value={manualPayoutSellerId}
                  onChange={(e) => setManualPayoutSellerId(e.target.value)}
                  placeholder="seller-id..."
                  className="w-full px-4 py-3 bg-[#F8F8FA] dark:bg-zinc-800 border border-brand-primary/5 dark:border-white/5 rounded-2xl text-sm font-medium text-brand-primary dark:text-white placeholder:text-brand-primary/20 outline-none focus:ring-2 ring-accent/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-white/40 block mb-2">
                  Tutar (TL)
                </label>
                <input
                  type="number"
                  value={manualPayoutAmount}
                  onChange={(e) => setManualPayoutAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-[#F8F8FA] dark:bg-zinc-800 border border-brand-primary/5 dark:border-white/5 rounded-2xl text-sm font-medium text-brand-primary dark:text-white placeholder:text-brand-primary/20 outline-none focus:ring-2 ring-accent/20 transition-all"
                />
              </div>
              <button
                onClick={handleManualPayout}
                disabled={manualPayouting || !manualPayoutSellerId || !manualPayoutAmount}
                className="w-full py-3.5 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {manualPayouting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Odeme Gonder
              </button>
              {manualPayoutMsg && (
                <p
                  className={cn(
                    'text-[10px] font-bold text-center px-3 py-2 rounded-xl',
                    manualPayoutMsg.startsWith('Hata')
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
                  )}
                >
                  {manualPayoutMsg}
                </p>
              )}
            </div>
          </div>

          {/* Commission Rules Summary */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] lg:rounded-[3.5rem] p-6 lg:p-10 border border-brand-primary/5 dark:border-white/5 shadow-sm flex-1">
            <h2 className="text-xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white mb-6">
              Komisyon Kurallari
            </h2>
            <p className="text-[10px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-widest mb-4">
              Guncel oranlar ve override'lar
            </p>
            {rulesLoading ? (
              <LoadingState label="Komisyon kurallari yukleniyor..." />
            ) : rulesError ? (
              <ErrorState message="Komisyon kurallari yuklenemedi." onRetry={loadRules} />
            ) : rules.length === 0 ? (
              <EmptyState
                title="Kural bulunamadi"
                description="Henuz bir komisyon kurali tanimlanmamis."
              />
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 bg-[#F8F8FA] dark:bg-zinc-800 rounded-2xl border border-brand-primary/5 dark:border-white/5 gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                        <Percent size={16} className="text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-brand-primary dark:text-white truncate">
                          {rule.name || 'Komisyon Kurali'}
                        </p>
                        <p className="text-[9px] font-bold text-brand-primary/30 dark:text-white/30 uppercase tracking-widest truncate">
                          Global
                          {rule.categoryOverrides && Object.keys(rule.categoryOverrides).length > 0
                            ? ` / ${Object.keys(rule.categoryOverrides).length} kategori`
                            : ''}
                          {rule.sellerOverrides && Object.keys(rule.sellerOverrides).length > 0
                            ? ` / ${Object.keys(rule.sellerOverrides).length} satici`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-lg font-display font-black text-brand-primary dark:text-white tracking-tighter">
                        %{rule.rate}
                      </p>
                      <p className="text-[9px] font-bold text-brand-primary/30 dark:text-white/30 uppercase">
                        {rule.minAmount != null && rule.maxAmount != null
                          ? `${rule.minAmount}-${rule.maxAmount} TL`
                          : 'Limitsiz'}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0',
                        rule.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
                      )}
                    >
                      {rule.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="py-12 flex flex-col items-center justify-center text-center opacity-20 hover:opacity-100 transition-opacity">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white mb-4">
          <ShieldCheck size={18} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary dark:text-white">
          Finans Takip Modulu
        </p>
        <p className="text-[8px] font-bold text-brand-primary/30 dark:text-white/30 uppercase tracking-widest mt-1">
          Benim Olan Admin / 2026
        </p>
      </div>
    </div>
  );
}
