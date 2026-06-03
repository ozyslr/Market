import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, TrendingUp, Clock, DollarSign, Download, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSellerFinanceSummary,
  getSellerTransactions,
  getSellerPayouts,
  exportSellerTransactions,
  type FinanceSummary,
  type Transaction,
  type PayoutEntry,
  type TransactionFilters,
} from '@/services/financeService';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  sellerId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  // Ledger amounts are in kurus (1/100 TL) — divide by 100
  return (
    (amount / 100).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' ₺'
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const TYPE_LABELS: Record<string, string> = {
  order_charge: 'Satış',
  commission: 'Komisyon',
  payout: 'Ödeme',
  refund: 'İade',
  adjustment: 'Düzeltme',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  collected: 'Tahsil Edildi',
  released: 'Serbest',
  reversed: 'İptal',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  collected: 'bg-blue-100 text-blue-700',
  released: 'bg-green-100 text-green-700',
  reversed: 'bg-red-100 text-red-600',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
  loading?: boolean;
}

function StatCard({ icon, label, value, accent = 'text-gray-900', loading }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-[#6418E5]/10 flex items-center justify-center text-[#6418E5] shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
          {label}
        </p>
        {loading ? (
          <div className="h-5 w-24 bg-gray-100 rounded animate-pulse mt-1" />
        ) : (
          <p className={cn('text-lg font-bold mt-0.5 truncate', accent)}>{value}</p>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {[1, 2, 3, 4].map((i) => (
        <td key={i} className="py-3 px-4">
          <div
            className="h-4 bg-gray-100 rounded animate-pulse"
            style={{ width: `${60 + i * 10}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FinanceDashboard({ sellerId }: Props) {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTx, setTotalTx] = useState(0);
  const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TransactionFilters['type'] | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filters: TransactionFilters = {
        limit: 50,
        offset: 0,
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(fromDate ? { from: new Date(fromDate).toISOString() } : {}),
        ...(toDate ? { to: new Date(toDate + 'T23:59:59').toISOString() } : {}),
      };
      const [sum, txResult, payoutList] = await Promise.all([
        getSellerFinanceSummary(sellerId),
        getSellerTransactions(sellerId, filters),
        getSellerPayouts(sellerId),
      ]);
      setSummary(sum);
      setTransactions(txResult.transactions);
      setTotalTx(txResult.total);
      setPayouts(payoutList);
    } finally {
      setLoading(false);
    }
  }, [sellerId, typeFilter, fromDate, toDate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportSellerTransactions(sellerId);
    } catch (err) {
      console.error('[finance] Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const lastPayout = payouts[0];

  return (
    <div className="space-y-6">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Wallet size={20} />}
          label="Kullanılabilir Bakiye"
          value={summary ? formatCurrency(summary.availableBalance) : '—'}
          accent="text-green-600"
          loading={loading}
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Bekleyen Kazanç"
          value={summary ? formatCurrency(summary.pendingBalance) : '—'}
          accent="text-amber-600"
          loading={loading}
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Toplam Kazanç"
          value={summary ? formatCurrency(summary.totalEarned) : '—'}
          accent="text-[#6418E5]"
          loading={loading}
        />
        <StatCard
          icon={<DollarSign size={20} />}
          label="Son Ödeme"
          value={
            lastPayout
              ? `${formatCurrency(Math.abs(lastPayout.amount))} · ${formatDate(lastPayout.createdAt)}`
              : 'Henüz yok'
          }
          loading={loading}
        />
      </div>

      {/* ── Transactions ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">İşlem Geçmişi</h2>
          <div className="flex flex-wrap items-center gap-2">
            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TransactionFilters['type'] | '')}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="">Tüm İşlemler</option>
              <option value="order_charge">Satış</option>
              <option value="commission">Komisyon</option>
              <option value="payout">Ödeme</option>
              <option value="refund">İade</option>
            </select>
            {/* Date filters */}
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
              placeholder="Başlangıç"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
              placeholder="Bitiş"
            />
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-[#6418E5] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#6418E5]/5 transition"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Yenile
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tarih
                </th>
                <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  İşlem
                </th>
                <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                  Tutar
                </th>
                <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-gray-400">
                    Henüz işlem bulunmuyor
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.entryId}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition"
                  >
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-800">
                        {TYPE_LABELS[tx.type] ?? tx.type}
                      </span>
                      {tx.reason && (
                        <span className="ml-2 text-xs text-gray-400 truncate max-w-[180px] inline-block align-middle">
                          {tx.reason}
                        </span>
                      )}
                    </td>
                    <td
                      className={cn(
                        'py-3 px-4 text-right font-semibold whitespace-nowrap',
                        tx.amount >= 0 ? 'text-green-600' : 'text-red-500',
                      )}
                    >
                      {tx.amount >= 0 ? '+' : ''}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3 px-4">
                      {tx.status && (
                        <span
                          className={cn(
                            'text-xs font-semibold px-2 py-0.5 rounded-full',
                            STATUS_COLORS[tx.status] ?? 'bg-gray-100 text-gray-600',
                          )}
                        >
                          {STATUS_LABELS[tx.status] ?? tx.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalTx > transactions.length && (
          <div className="px-5 py-3 text-xs text-gray-400 border-t border-gray-50">
            {transactions.length} / {totalTx} işlem gösteriliyor
          </div>
        )}
      </div>

      {/* ── Payout History ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Ödeme Geçmişi</h2>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#6418E5] px-3 py-1.5 rounded-lg hover:bg-[#5210C5] transition disabled:opacity-60"
          >
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            CSV İndir
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tarih
                </th>
                <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                  Tutar
                </th>
                <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Açıklama
                </th>
                <th className="py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-gray-400">
                    Henüz ödeme yapılmadı
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr
                    key={p.entryId}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition"
                  >
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600 whitespace-nowrap">
                      {formatCurrency(Math.abs(p.amount))}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{p.reason}</td>
                    <td className="py-3 px-4">
                      {p.status && (
                        <span
                          className={cn(
                            'text-xs font-semibold px-2 py-0.5 rounded-full',
                            STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600',
                          )}
                        >
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
