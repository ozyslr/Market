import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, TrendingUp, Clock, CheckCircle2, ArrowUpRight,
  Loader2, ChevronRight, DollarSign, Percent, Package, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getOrdersBySeller } from '@/services/orderService';
import { Order } from '@/types/order';
import { cn } from '@/lib/utils';
import {
  getSellerFinanceSummary,
  getSellerTransactions,
  FinanceSummary,
  Transaction,
} from '@/services/financeService';
import {
  getSellerBalance,
  requestPayout,
  getPayoutHistory,
  getPayoutSchedule,
  updatePayoutSchedule,
  PayoutRequest,
  PayoutMethod,
  PayoutSchedule,
} from '@/services/sellerPayoutService';

function formatCurrency(amount: number) {
  return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

function getOrderRevenue(order: Order, sellerId: string): number {
  const sellerItems = order.items?.filter(i => i.sellerId === sellerId) ?? [];
  if (sellerItems.length > 0) {
    return sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }
  return order.total ?? 0;
}

export function SellerFinance() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawRequested, setWithdrawRequested] = useState(false);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Payout integration state
  const [balance, setBalance] = useState<any>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('bank_transfer');
  const [payoutDest, setPayoutDest] = useState('');
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [requestingPayout, setRequestingPayout] = useState(false);

  // Auto-payout state
  const [payoutSchedule, setPayoutSchedule] = useState<PayoutSchedule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getOrdersBySeller(user.id)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      getSellerFinanceSummary(user.id),
      getSellerTransactions(user.id),
    ]).then(([sum, txs]) => {
      setSummary(sum);
      setTransactions(txs);
    });
  }, [user?.id]);

  // Load payout data
  useEffect(() => {
    if (!user?.id) return;
    getSellerBalance(user.id).then(setBalance);
    getPayoutHistory(user.id).then(setPayouts);
    getPayoutSchedule(user.id).then(setPayoutSchedule);
  }, [user?.id]);

  const toggleAutoPayout = async () => {
    if (!user?.id || !payoutSchedule) return;
    setScheduleLoading(true);
    const updated = { ...payoutSchedule, autoPayoutEnabled: !payoutSchedule.autoPayoutEnabled };
    await updatePayoutSchedule(user.id, updated);
    setPayoutSchedule(updated);
    setScheduleLoading(false);
  };

  const nextPayoutDate = payoutSchedule?.nextAutoPayout
    ? new Date(payoutSchedule.nextAutoPayout)
    : null;
  const daysUntilPayout = nextPayoutDate
    ? Math.ceil((nextPayoutDate.getTime() - Date.now()) / 86_400_000)
    : null;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) {
    return (
      <div className="flex justify-center py-24">
        <p className="text-sm text-gray-500">Giriş yapmanız gerekiyor.</p>
      </div>
    );
  }

  const commissionRate = summary?.commissionRate ?? 0;
  const COMMISSION_RATE = commissionRate / 100;

  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const pendingOrders = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status));

  const totalGross = summary?.totalRevenue
    ?? deliveredOrders.reduce((sum, o) => sum + getOrderRevenue(o, user.id), 0);
  const totalCommission = totalGross * COMMISSION_RATE;
  const totalNet = totalGross - totalCommission;

  const pendingGross = pendingOrders.reduce((sum, o) => sum + getOrderRevenue(o, user.id), 0);
  const pendingNet = summary?.pendingPayout ?? pendingGross * (1 - COMMISSION_RATE);

  const paidOut = summary?.lastPayout?.amount ?? 0;
  const availableBalance = totalNet - paidOut;

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const STATUS_LABEL: Record<string, string> = {
    pending: 'Bekliyor',
    processing: 'İşlemde',
    shipped: 'Kargoda',
    delivered: 'Teslim Edildi',
    cancelled: 'İptal',
  };

  const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <div className="min-h-screen bg-[#F8F8FA] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">
              Finans Paneli
            </h1>
            <p className="text-xs text-[#1A1033]/40 mt-1 font-bold uppercase tracking-widest">
              Komisyon oranı: %{(commissionRate).toFixed(0)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/seller/dashboard"
              className="flex items-center gap-2 text-xs font-bold text-[#1A1033]/60 hover:text-accent transition-colors"
            >
              Dashboard <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#1A1033] text-white rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Wallet size={18} className="text-accent" />
                  <ArrowUpRight size={14} className="opacity-40" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Kullanılabilir Bakiye</p>
                  <p className="text-xl font-display font-black">{formatCurrency(availableBalance)}</p>
                </div>
                <button
                  onClick={() => { setShowPayoutModal(true); setPayoutAmount(availableBalance); }}
                  disabled={availableBalance <= 0}
                  className={cn(
                    "mt-auto text-[10px] font-black uppercase tracking-widest py-2 rounded-xl transition-all",
                    availableBalance > 0
                      ? "bg-accent text-white hover:bg-accent/90"
                      : "bg-white/10 text-white/40 cursor-not-allowed"
                  )}
                >
                  {'Çekim Talebi'}
                </button>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#1A1033]/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <TrendingUp size={18} className="text-green-500" />
                  <span className="text-[9px] font-black uppercase text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Kazanılan</span>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1">Toplam Net Kazanç</p>
                  <p className="text-xl font-display font-black text-[#1A1033]">{formatCurrency(totalNet)}</p>
                  <p className="text-[9px] text-[#1A1033]/30 mt-1">Brüt: {formatCurrency(totalGross)}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#1A1033]/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Clock size={18} className="text-orange-400" />
                  <span className="text-[9px] font-black uppercase text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Bekleyen</span>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1">Bekleyen Tutar</p>
                  <p className="text-xl font-display font-black text-[#1A1033]">{formatCurrency(pendingNet)}</p>
                  <p className="text-[9px] text-[#1A1033]/30 mt-1">{pendingOrders.length} aktif sipariş</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#1A1033]/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Percent size={18} className="text-purple-500" />
                  <span className="text-[9px] font-black uppercase text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">Komisyon</span>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1">Toplam Komisyon</p>
                  <p className="text-xl font-display font-black text-[#1A1033]">{formatCurrency(totalCommission)}</p>
                  <p className="text-[9px] text-[#1A1033]/30 mt-1">%{(commissionRate).toFixed(0)} platform payı</p>
                </div>
              </div>
            </div>

            {/* Summary Bar */}
            <div className="bg-white rounded-2xl border border-[#1A1033]/5 p-5 mb-8 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40">Ödenen</p>
                  <p className="text-sm font-black text-[#1A1033]">{formatCurrency(paidOut)}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-[#1A1033]/5" />
              <div className="flex items-center gap-2">
                <Package size={16} className="text-blue-400" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40">Teslim Edilen Sipariş</p>
                  <p className="text-sm font-black text-[#1A1033]">{deliveredOrders.length}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-[#1A1033]/5" />
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-accent" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40">Ort. Sipariş Değeri</p>
                  <p className="text-sm font-black text-[#1A1033]">
                    {deliveredOrders.length > 0 ? formatCurrency(totalGross / deliveredOrders.length) : '—'}
                  </p>
                </div>
              </div>
              {payouts.filter(p => p.status === 'pending').length > 0 && (
                <>
                  <div className="w-px h-8 bg-[#1A1033]/5" />
                  <div className="flex items-center gap-2 text-green-600">
                    <AlertCircle size={14} />
                    <p className="text-[10px] font-bold">{payouts.filter(p => p.status === 'pending').length} bekleyen çekim talebi</p>
                  </div>
                </>
              )}
            </div>

            {/* ── Auto-Payout Section ── */}
            {payoutSchedule && (
              <div className="bg-white rounded-2xl border border-[#1A1033]/5 p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#1A1033] flex items-center gap-2">
                    <Clock size={16} className="text-accent" /> Otomatik Ödeme
                  </h2>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={payoutSchedule.autoPayoutEnabled}
                      onChange={toggleAutoPayout} disabled={scheduleLoading}
                      className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-accent/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-accent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  </label>
                </div>

                {payoutSchedule.autoPayoutEnabled ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-[9px] font-black uppercase tracking-widest text-green-600 mb-1">Sonraki Ödeme</p>
                      <p className="text-lg font-display font-black text-green-700">
                        {nextPayoutDate?.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <p className="text-[10px] font-bold text-green-600/60 mt-0.5">
                        {daysUntilPayout != null && daysUntilPayout > 0
                          ? `${daysUntilPayout} gün sonra (saat 03:00)`
                          : daysUntilPayout === 0 ? 'Bugün!' : 'Planlanıyor...'}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-600 mb-1">Minimum Bakiye</p>
                      <p className="text-lg font-display font-black text-blue-700">
                        {payoutSchedule.minBalanceThreshold.toLocaleString('tr-TR')} ₺
                      </p>
                      <p className="text-[10px] font-bold text-blue-600/60 mt-0.5">Bu tutarın altında ödeme yapılmaz</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-[9px] font-black uppercase tracking-widest text-purple-600 mb-1">Periyot</p>
                      <p className="text-lg font-display font-black text-purple-700">
                        {payoutSchedule.frequency === 'weekly' ? 'Haftalık' :
                         payoutSchedule.frequency === 'biweekly' ? '2 Haftada Bir' : 'Aylık'}
                      </p>
                      <p className="text-[10px] font-bold text-purple-600/60 mt-0.5">
                        {payoutSchedule.lastAutoPayout
                          ? `Son: ${new Date(payoutSchedule.lastAutoPayout).toLocaleDateString('tr-TR')}`
                          : 'Henüz otomatik ödeme yapılmadı'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#F8F8FA] rounded-xl p-4 text-center">
                    <p className="text-xs font-bold text-[#1A1033]/40">
                      Otomatik ödeme kapalı. Aktif ettiğinizde bakiyeniz her hafta otomatik olarak hesabınıza aktarılır.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Transactions / Orders Table */}
            <div className="bg-white rounded-2xl border border-[#1A1033]/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1A1033]/5 flex items-center justify-between">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/60">Son İşlemler</h2>
                <Link to="/seller/orders" className="text-[10px] font-black text-accent hover:underline flex items-center gap-1">
                  Tümü <ChevronRight size={12} />
                </Link>
              </div>

              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#1A1033]/5">
                        {['Tür', 'Açıklama', 'Tarih', 'Durum', 'Tutar'].map(h => (
                          <th key={h} className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-[#1A1033]/30">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => {
                        const TX_TYPE_LABEL: Record<string, string> = {
                          sale: 'Satış',
                          payout: 'Ödeme',
                          refund: 'İade',
                          commission: 'Komisyon',
                        };
                        const TX_STATUS_COLOR: Record<string, string> = {
                          completed: 'bg-green-100 text-green-700',
                          pending: 'bg-yellow-100 text-yellow-700',
                          failed: 'bg-red-100 text-red-600',
                        };
                        const isDebit = tx.type === 'commission' || tx.type === 'refund';
                        return (
                          <tr key={tx.id} className="border-b border-[#1A1033]/5 hover:bg-[#F8F8FA] transition-colors">
                            <td className="px-5 py-3 text-[11px] font-black text-[#1A1033]">
                              {TX_TYPE_LABEL[tx.type] ?? tx.type}
                            </td>
                            <td className="px-5 py-3 text-[11px] text-[#1A1033]/60">{tx.description}</td>
                            <td className="px-5 py-3 text-[11px] text-[#1A1033]/60">
                              {new Date(tx.date).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="px-5 py-3">
                              <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-black uppercase', TX_STATUS_COLOR[tx.status] ?? 'bg-gray-100 text-gray-600')}>
                                {tx.status === 'completed' ? 'Tamamlandı' : tx.status === 'pending' ? 'Bekliyor' : 'Başarısız'}
                              </span>
                            </td>
                            <td className={cn('px-5 py-3 text-[11px] font-black', isDebit ? 'text-red-400' : 'text-green-600')}>
                              {isDebit ? '−' : '+'}{formatCurrency(tx.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="py-16 text-center">
                  <Package size={32} className="mx-auto mb-3 text-[#1A1033]/20" />
                  <p className="text-xs text-[#1A1033]/40 font-bold">Henüz sipariş yok</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#1A1033]/5">
                        {['Sipariş No', 'Tarih', 'Durum', 'Brüt', 'Komisyon', 'Net'].map(h => (
                          <th key={h} className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-[#1A1033]/30">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(order => {
                        const gross = getOrderRevenue(order, user.id);
                        const commission = gross * COMMISSION_RATE;
                        const net = gross - commission;
                        return (
                          <tr key={order.id} className="border-b border-[#1A1033]/5 hover:bg-[#F8F8FA] transition-colors">
                            <td className="px-5 py-3">
                              <Link to={`/orders/${order.id}`} className="text-[11px] font-black text-accent hover:underline font-mono">
                                #{order.id.slice(0, 8)}
                              </Link>
                            </td>
                            <td className="px-5 py-3 text-[11px] text-[#1A1033]/60">
                              {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="px-5 py-3">
                              <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-black uppercase', STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-600')}>
                                {STATUS_LABEL[order.status] ?? order.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-[11px] font-bold text-[#1A1033]">{formatCurrency(gross)}</td>
                            <td className="px-5 py-3 text-[11px] font-bold text-red-400">−{formatCurrency(commission)}</td>
                            <td className="px-5 py-3 text-[11px] font-black text-green-600">{formatCurrency(net)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── PAYOUT HISTORY ── */}
            {payouts.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#1A1033]/5 overflow-hidden mt-8">
                <div className="px-6 py-4 border-b border-[#1A1033]/5">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/60">Çekim Geçmişi</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#1A1033]/5">
                        {['Tutar', 'Ücret', 'Net', 'Yöntem', 'Durum', 'Tarih'].map(h => (
                          <th key={h} className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-[#1A1033]/30">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.slice(0, 10).map(p => (
                        <tr key={p.id} className="border-b border-[#1A1033]/5 hover:bg-[#F8F8FA] transition-colors">
                          <td className="px-5 py-3 text-[11px] font-black text-[#1A1033]">{formatCurrency(p.amount)}</td>
                          <td className="px-5 py-3 text-[11px] text-red-400">−{formatCurrency(p.fee)}</td>
                          <td className="px-5 py-3 text-[11px] font-black text-green-600">{formatCurrency(p.netAmount)}</td>
                          <td className="px-5 py-3 text-[11px] text-[#1A1033]/60">{p.method}</td>
                          <td className="px-5 py-3">
                            <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-black uppercase',
                              p.status === 'completed' ? 'bg-green-100 text-green-700' :
                              p.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                              p.status === 'failed' ? 'bg-red-100 text-red-600' :
                              'bg-yellow-100 text-yellow-700'
                            )}>{p.status}</span>
                          </td>
                          <td className="px-5 py-3 text-[11px] text-[#1A1033]/60">
                            {new Date(p.createdAt).toLocaleDateString('tr-TR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── PAYOUT MODAL ── */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPayoutModal(false)} />
          <div className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-5">
            <h3 className="text-lg font-black uppercase italic text-[#1A1033]">Çekim Talebi</h3>
            <p className="text-[10px] font-bold text-[#1A1033]/40 uppercase tracking-widest">
              Kullanılabilir Bakiye: {formatCurrency(availableBalance)}
            </p>
            <div>
              <label className="block text-xs font-bold text-[#1A1033]/60 mb-1.5">Tutar</label>
              <input type="number" min="0" max={availableBalance}
                value={payoutAmount} onChange={e => setPayoutAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl border border-[#1A1033]/10 text-sm font-bold outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1033]/60 mb-1.5">Yöntem</label>
              <select value={payoutMethod} onChange={e => setPayoutMethod(e.target.value as PayoutMethod)}
                className="w-full px-4 py-3 rounded-xl border border-[#1A1033]/10 text-sm font-bold outline-none focus:ring-2 focus:ring-accent">
                <option value="bank_transfer">Banka Havalesi</option>
                <option value="iyzico">iyzico</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1A1033]/60 mb-1.5">Hesap / Destinasyon</label>
              <input value={payoutDest} onChange={e => setPayoutDest(e.target.value)}
                placeholder="IBAN veya hesap no"
                className="w-full px-4 py-3 rounded-xl border border-[#1A1033]/10 text-sm font-bold outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowPayoutModal(false)}
                className="flex-1 py-3 border border-[#1A1033]/10 text-[#1A1033] font-black text-xs rounded-xl hover:bg-[#F8F8FA] transition-all uppercase tracking-widest">
                İptal
              </button>
              <button
                onClick={async () => {
                  if (!user?.id || payoutAmount <= 0 || !payoutDest) return;
                  setRequestingPayout(true);
                  try {
                    await requestPayout(user.id, payoutAmount, payoutMethod, payoutDest);
                    setShowPayoutModal(false);
                    setPayoutDest('');
                    // Refresh balance & payouts
                    getSellerBalance(user.id).then(setBalance);
                    getPayoutHistory(user.id).then(setPayouts);
                  } finally {
                    setRequestingPayout(false);
                  }
                }}
                disabled={requestingPayout || payoutAmount <= 0 || !payoutDest}
                className="flex-1 py-3 bg-accent text-white font-black text-xs rounded-xl hover:opacity-90 transition-all disabled:opacity-50 uppercase tracking-widest flex items-center justify-center gap-2"
              >
                {requestingPayout ? <Loader2 size={14} className="animate-spin" /> : null}
                {requestingPayout ? 'Gönderiliyor...' : 'Talep Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
