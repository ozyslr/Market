import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getSellers, updateSeller } from '@/services/userService';
import { createNotification } from '@/services/notificationService';
import { getProducts } from '@/services/productService';
import { getApplications, reviewApplication } from '@/services/sellerApplicationService';
import {
  getCommissionRules,
  saveCommissionRule,
  CommissionRule,
} from '@/services/commissionService';
import { calcSellerPerformance, SellerPerformanceScore } from '@/services/sellerRatingService';
import { getPayoutHistory, PayoutRequest } from '@/services/sellerPayoutService';
import { Seller, Product } from '@/types';
import {
  Store,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  ShieldCheck,
  ShieldOff,
  Edit2,
  Check,
  X,
  Package,
  ChevronRight,
  FileText,
  DollarSign,
  TrendingUp,
  Plus,
  Save,
  Medal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { audit } from '@/services/auditLogService';
import { useAuth } from '@/context/AuthContext';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/DataStates';

const KYC_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Bekliyor', cls: 'bg-yellow-100 text-yellow-700' },
  verified: { label: 'Onaylı', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Reddedildi', cls: 'bg-red-100 text-red-600' },
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active: { label: 'Aktif', cls: 'bg-green-100 text-green-700' },
  suspended: { label: 'Askıda', cls: 'bg-orange-100 text-orange-700' },
  banned: { label: 'Banlı', cls: 'bg-red-100 text-red-600' },
};

export function AdminSellers() {
  const { user: actor } = useAuth();
  const [adminTab, setAdminTab] = useState<'sellers' | 'applications' | 'rules'>('sellers');
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [commissionValue, setCommissionValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [errorProducts, setErrorProducts] = useState(false);

  // Application state
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [errorApps, setErrorApps] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Commission rules state
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [errorRules, setErrorRules] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [savingRule, setSavingRule] = useState(false);

  // Performance scores cache
  const [perfScores, setPerfScores] = useState<Record<string, SellerPerformanceScore>>({});

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setSellers(await getSellers());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedSeller) return;
    setLoadingProducts(true);
    setErrorProducts(false);
    getProducts({ sellerId: selectedSeller.userId, includeNonApproved: true })
      .then(setSellerProducts)
      .catch(() => setErrorProducts(true))
      .finally(() => setLoadingProducts(false));
  }, [selectedSeller]);

  // Load applications
  useEffect(() => {
    if (adminTab !== 'applications') return;
    setLoadingApps(true);
    setErrorApps(false);
    getApplications()
      .then(setApplications)
      .catch(() => setErrorApps(true))
      .finally(() => setLoadingApps(false));
  }, [adminTab]);

  // Load commission rules
  useEffect(() => {
    if (adminTab !== 'rules') return;
    setLoadingRules(true);
    setErrorRules(false);
    getCommissionRules()
      .then(setRules)
      .catch(() => setErrorRules(true))
      .finally(() => setLoadingRules(false));
  }, [adminTab]);

  // Preload performance scores for visible sellers
  useEffect(() => {
    if (adminTab !== 'sellers') return;
    filtered.slice(0, 20).forEach((s) => {
      if (!perfScores[s.id]) {
        calcSellerPerformance(s.userId || s.id).then((score) => {
          setPerfScores((prev) => ({ ...prev, [s.id]: score }));
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellers, search, kycFilter, adminTab]);

  const filtered = useMemo(() => {
    let list = sellers;
    if (kycFilter !== 'all') list = list.filter((s) => s.kycStatus === kycFilter);
    if (search)
      list = list.filter(
        (s) =>
          s.storeName.toLowerCase().includes(search.toLowerCase()) ||
          s.slug.includes(search.toLowerCase()),
      );
    return list;
  }, [sellers, search, kycFilter]);

  const update = async (id: string, data: Partial<Seller>) => {
    setSavingId(id);
    try {
      await updateSeller(id, data);
      setSellers((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
      if (selectedSeller?.id === id)
        setSelectedSeller((prev) => (prev ? { ...prev, ...data } : null));
    } finally {
      setSavingId(null);
    }
  };

  const saveCommission = async (seller: Seller) => {
    const val = parseFloat(commissionValue);
    if (isNaN(val) || val < 0 || val > 100) return;
    await update(seller.id, { commissionRate: val });
    setEditingCommission(null);
  };

  const toggleSuspend = (seller: Seller) => {
    const next = (seller.status ?? 'active') === 'active' ? 'suspended' : 'active';
    update(seller.id, { status: next });
    audit(
      actor?.uid ?? '',
      actor?.email ?? '',
      actor?.role ?? 'admin',
      next === 'suspended' ? 'seller.suspend' : 'seller.activate',
      'seller',
      seller.id,
      seller.storeName ?? seller.slug,
    );
  };

  const handleReview = async (app: any, status: 'approved' | 'rejected') => {
    setReviewingId(app.id);
    try {
      await reviewApplication(
        app.id,
        status,
        status === 'approved' ? 'Onaylandı' : 'Reddedildi',
        'admin',
      );
      audit(
        actor?.uid ?? '',
        actor?.email ?? '',
        actor?.role ?? 'admin',
        status === 'approved' ? 'seller.approve' : 'seller.reject',
        'seller',
        app.id,
        app.storeName ?? app.id,
      );
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status } : a)));
    } finally {
      setReviewingId(null);
    }
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;
    setSavingRule(true);
    try {
      await saveCommissionRule(editingRule);
      setRules((prev) => {
        const exists = prev.find((r) => r.id === editingRule.id);
        if (exists) return prev.map((r) => (r.id === editingRule.id ? editingRule : r));
        return [...prev, editingRule];
      });
      setEditingRule(null);
    } finally {
      setSavingRule(false);
    }
  };

  const newRule = () => {
    setEditingRule({
      id: `rule-${Date.now()}`,
      name: '',
      rate: 10,
      isActive: true,
    });
  };

  const setKyc = async (seller: Seller, status: 'verified' | 'rejected') => {
    await update(seller.id, { kycStatus: status, isVerified: status === 'verified' });
    audit(
      actor?.uid ?? '',
      actor?.email ?? '',
      actor?.role ?? 'admin',
      status === 'verified' ? 'seller.approve' : 'seller.reject',
      'seller',
      seller.id,
      seller.storeName ?? seller.slug,
    );
    if (status === 'verified') {
      await createNotification(
        seller.userId,
        'moderation',
        'Başvurunuz Onaylandı',
        'Tebrikler! Satıcı başvurunuz onaylandı. Artık ürün ekleyebilir ve satış yapabilirsiniz.',
        '/seller/dashboard',
      );
    } else {
      await createNotification(
        seller.userId,
        'moderation',
        'Başvurunuz Reddedildi',
        'Üzgünüz, satıcı başvurunuz onaylanmadı. Bilgilerinizi güncelleyerek tekrar başvurabilirsiniz.',
        '/sell',
      );
    }
  };

  const pendingKycCount = sellers.filter((s) => s.kycStatus === 'pending').length;

  if (status === 'loading') return <LoadingState />;
  if (status === 'error') return <ErrorState message="Satıcılar yüklenemedi." onRetry={load} />;

  return (
    <div className="bg-white rounded-[3.5rem] p-8 lg:p-12 border border-[#F8F8FA] shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary">
            Satıcı Yönetimi
          </h3>
          {pendingKycCount > 0 && (
            <p className="text-xs font-bold text-yellow-600 mt-0.5">
              {pendingKycCount} satıcı KYC onayı bekliyor
            </p>
          )}
        </div>
        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-brand-primary/30"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={adminTab === 'sellers' ? 'Mağaza adı ara...' : 'Başvuru ara...'}
            className="w-full ps-9 pe-4 py-2.5 bg-[#F8F8FA] rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/20"
          />
        </div>
      </div>
      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        {(
          [
            { key: 'sellers', label: 'Satıcılar', icon: Store },
            { key: 'applications', label: 'Başvurular', icon: FileText },
            { key: 'rules', label: 'Komisyon Kuralları', icon: DollarSign },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setAdminTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
              adminTab === key
                ? 'bg-brand-primary text-white'
                : 'bg-[#F8F8FA] text-brand-primary/60 hover:bg-brand-primary/10',
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
      {/* ── SELLERS TAB ── */}
      {adminTab === 'sellers' && (
        <>
          {/* KYC filter chips */}
          <div className="flex gap-2 flex-wrap mb-5">
            {(['all', 'pending', 'verified', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setKycFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                  kycFilter === f
                    ? 'bg-brand-primary text-white'
                    : 'bg-[#F8F8FA] text-brand-primary/60 hover:bg-brand-primary/10',
                )}
              >
                {f === 'all'
                  ? 'Tümü'
                  : f === 'pending'
                    ? `Bekleyen KYC${pendingKycCount > 0 ? ` (${pendingKycCount})` : ''}`
                    : f === 'verified'
                      ? 'Onaylı'
                      : 'Reddedildi'}
              </button>
            ))}
          </div>

          {sellers.length === 0 && status === 'ready' ? (
            <EmptyState title="Kayıtlı satıcı yok" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F8F8FA]">
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Mağaza
                    </th>
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      KYC
                    </th>
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Komisyon
                    </th>
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Durum
                    </th>
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Rating
                    </th>
                    <th className="pb-3 text-end text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Performans
                    </th>
                    <th className="pb-3 text-end text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((seller) => {
                    const status = seller.status ?? 'active';
                    const statusBadge = STATUS_BADGE[status] ?? STATUS_BADGE.active;
                    const kycBadge = KYC_BADGE[seller.kycStatus] ?? KYC_BADGE.pending;
                    const isSaving = savingId === seller.id;
                    return (
                      <tr
                        key={seller.id}
                        className="border-b border-[#F8F8FA] hover:bg-[#F8F8FA]/50 transition-colors"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#F8F8FA] flex items-center justify-center text-brand-primary/40">
                              <Store size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-brand-primary text-xs">
                                {seller.storeName}
                              </p>
                              <p className="text-[10px] text-brand-primary/40">
                                {seller.origin} · {seller.joinedDate}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest',
                                kycBadge.cls,
                              )}
                            >
                              {kycBadge.label}
                            </span>
                            {seller.kycStatus === 'pending' && (
                              <>
                                <button
                                  onClick={() => setKyc(seller, 'verified')}
                                  disabled={isSaving}
                                  className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100 transition-all disabled:opacity-50"
                                  title="Onayla"
                                >
                                  {isSaving ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <CheckCircle size={12} />
                                  )}
                                </button>
                                <button
                                  onClick={() => setKyc(seller, 'rejected')}
                                  disabled={isSaving}
                                  className="p-1 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-all disabled:opacity-50"
                                  title="Reddet"
                                >
                                  <XCircle size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          {editingCommission === seller.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={commissionValue}
                                onChange={(e) => setCommissionValue(e.target.value)}
                                className="w-14 px-2 py-1 border border-accent/30 rounded-lg text-xs font-bold outline-none"
                                autoFocus
                              />
                              <span className="text-[10px] text-brand-primary/50">%</span>
                              <button
                                onClick={() => saveCommission(seller)}
                                disabled={isSaving}
                                className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100 transition-all"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => setEditingCommission(null)}
                                className="p-1 rounded bg-[#F8F8FA] text-brand-primary/40 hover:bg-brand-primary/10 transition-all"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingCommission(seller.id);
                                setCommissionValue(String(seller.commissionRate));
                              }}
                              className="flex items-center gap-1 text-xs font-black text-brand-primary hover:text-accent transition-colors group"
                            >
                              %{seller.commissionRate}
                              <Edit2
                                size={11}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                            </button>
                          )}
                        </td>
                        <td className="py-3">
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest',
                              statusBadge.cls,
                            )}
                          >
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-brand-primary">
                              {seller.rating.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-brand-primary/40">
                              ({seller.reviewsCount})
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-end">
                          {perfScores[seller.id] ? (
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest',
                                perfScores[seller.id].level === 'platinum'
                                  ? 'bg-purple-100 text-purple-700'
                                  : perfScores[seller.id].level === 'gold'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : perfScores[seller.id].level === 'silver'
                                      ? 'bg-gray-100 text-gray-600'
                                      : 'bg-orange-100 text-orange-700',
                              )}
                            >
                              <Medal size={10} />
                              {perfScores[seller.id].level}
                              <span className="ms-0.5 opacity-60">
                                {perfScores[seller.id].overall}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[9px] text-brand-primary/30">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => toggleSuspend(seller)}
                              disabled={isSaving}
                              title={status === 'active' ? 'Askıya Al' : 'Aktifleştir'}
                              className={cn(
                                'p-1.5 rounded-lg transition-all disabled:opacity-50',
                                status === 'active'
                                  ? 'bg-orange-50 text-orange-500 hover:bg-orange-100'
                                  : 'bg-green-50 text-green-600 hover:bg-green-100',
                              )}
                            >
                              {status === 'active' ? (
                                <ShieldOff size={14} />
                              ) : (
                                <ShieldCheck size={14} />
                              )}
                            </button>
                            <Link
                              to={`/seller/dashboard?asSeller=${seller.userId || seller.id}`}
                              className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-[9px] font-black uppercase hover:bg-accent/20 transition-all"
                              title="Satıcı Panelini Gör"
                            >
                              Satıcı Paneli
                            </Link>
                            <button
                              onClick={() => setSelectedSeller(seller)}
                              className="p-1.5 rounded-lg bg-[#F8F8FA] text-brand-primary/60 hover:bg-brand-primary/10 transition-all"
                              title="Ürünleri Gör"
                            >
                              <Package size={14} />
                            </button>
                            <Link
                              to={`/admin/seller/${seller.id}`}
                              className="p-1.5 rounded-lg bg-[#F8F8FA] text-brand-primary/60 hover:bg-accent hover:text-white transition-all"
                              title="Satıcı Paneli Görünümü"
                            >
                              <ChevronRight size={14} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-brand-primary/30 text-sm font-bold"
                      >
                        Satıcı bulunamadı
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Seller Products Panel */}
          {selectedSeller && (
            <div className="fixed inset-0 z-200 flex items-end sm:items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSelectedSeller(null)}
              />
              <div className="relative bg-white rounded-4xl p-8 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h4 className="text-lg font-display font-black uppercase italic">
                      {selectedSeller.storeName}
                    </h4>
                    <p className="text-[10px] text-brand-primary/40">
                      %{selectedSeller.commissionRate} komisyon · {selectedSeller.origin}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSeller(null)}
                    className="text-brand-primary/30 hover:text-brand-primary"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Ürün', value: sellerProducts.length },
                    {
                      label: 'Onaylı',
                      value: sellerProducts.filter((p) => (p.status ?? 'approved') === 'approved')
                        .length,
                    },
                    {
                      label: 'Bekleyen',
                      value: sellerProducts.filter((p) => p.status === 'pending').length,
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#F8F8FA] rounded-2xl p-3 text-center">
                      <p className="text-xl font-black text-brand-primary">{stat.value}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="overflow-y-auto flex-1 space-y-2">
                  {errorProducts ? (
                    <ErrorState
                      message="Ürünler yüklenemedi."
                      onRetry={() => {
                        setErrorProducts(false);
                        setLoadingProducts(true);
                        getProducts({ sellerId: selectedSeller!.userId, includeNonApproved: true })
                          .then(setSellerProducts)
                          .catch(() => setErrorProducts(true))
                          .finally(() => setLoadingProducts(false));
                      }}
                    />
                  ) : loadingProducts ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-accent" />
                    </div>
                  ) : sellerProducts.length === 0 ? (
                    <p className="text-center py-8 text-brand-primary/30 text-sm font-bold">
                      Bu satıcıya ait ürün yok
                    </p>
                  ) : (
                    sellerProducts.map((p) => {
                      const st = p.status ?? 'approved';
                      const badge =
                        {
                          approved: 'bg-green-100 text-green-700',
                          pending: 'bg-yellow-100 text-yellow-700',
                          rejected: 'bg-red-100 text-red-600',
                          draft: 'bg-gray-100 text-gray-500',
                        }[st] ?? 'bg-gray-100 text-gray-500';
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 p-3 bg-[#F8F8FA] rounded-2xl"
                        >
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            className="w-10 h-10 rounded-xl object-cover shrink-0"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-brand-primary text-xs line-clamp-1">
                              {p.title}
                            </p>
                            <p className="text-[10px] text-brand-primary/40">
                              {p.price.toLocaleString('tr-TR')} ₺ · Stok: {p.stock}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0',
                              badge,
                            )}
                          >
                            {st}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}{' '}
      {/* end sellers tab */}
      {/* ── APPLICATIONS TAB ── */}
      {adminTab === 'applications' && (
        <>
          {errorApps ? (
            <ErrorState
              message="Başvurular yüklenemedi."
              onRetry={() => {
                setErrorApps(false);
                setLoadingApps(true);
                getApplications()
                  .then(setApplications)
                  .catch(() => setErrorApps(true))
                  .finally(() => setLoadingApps(false));
              }}
            />
          ) : loadingApps ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16">
              <FileText size={36} className="mx-auto text-brand-primary/20 mb-3" />
              <p className="text-sm font-bold text-brand-primary/30">Henüz başvuru yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F8F8FA]">
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Mağaza
                    </th>
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Satıcı
                    </th>
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Kategoriler
                    </th>
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Deneyim
                    </th>
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Hedef
                    </th>
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Durum
                    </th>
                    <th className="pb-3 text-end text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      className="border-b border-[#F8F8FA] hover:bg-[#F8F8FA]/50 transition-colors"
                    >
                      <td className="py-3">
                        <span className="font-bold text-brand-primary text-xs">
                          {app.storeName}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-xs text-brand-primary">{app.userName}</span>
                        <span className="text-[10px] text-brand-primary/40 block">
                          {app.userEmail}
                        </span>
                        {app.kycDocuments && app.kycDocuments.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {app.kycDocuments.map(
                              (d: { url: string; name?: string }, i: number) => (
                                <a
                                  key={d.url}
                                  href={d.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-1.5 py-0.5 rounded bg-violet-50 text-[9px] font-bold text-violet-600 hover:bg-violet-100 transition-colors"
                                  title={d.name}
                                >
                                  KYC {i + 1}
                                </a>
                              ),
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {app.productCategories?.slice(0, 3).map((c: string) => (
                            <span
                              key={c}
                              className="px-1.5 py-0.5 rounded bg-[#F8F8FA] text-[9px] font-bold text-brand-primary/60"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-xs font-bold text-brand-primary">
                        {app.experience ? `${app.experience} yıl` : '—'}
                      </td>
                      <td className="py-3 text-xs text-brand-primary/60">
                        {app.monthlySalesTarget || '—'}
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest',
                            app.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : app.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-600',
                          )}
                        >
                          {app.status === 'pending'
                            ? 'Bekliyor'
                            : app.status === 'approved'
                              ? 'Onaylı'
                              : 'Red'}
                        </span>
                      </td>
                      <td className="py-3 text-end">
                        {app.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleReview(app, 'approved')}
                              disabled={reviewingId === app.id}
                              className="p-1.5 rounded bg-green-50 text-green-600 hover:bg-green-100 transition-all disabled:opacity-50"
                              title="Onayla"
                            >
                              {reviewingId === app.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <CheckCircle size={14} />
                              )}
                            </button>
                            <button
                              onClick={() => handleReview(app, 'rejected')}
                              disabled={reviewingId === app.id}
                              className="p-1.5 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-all disabled:opacity-50"
                              title="Reddet"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {/* ── COMMISSION RULES TAB ── */}
      {adminTab === 'rules' && (
        <div className="space-y-6">
          {/* Rule list */}
          {errorRules ? (
            <ErrorState
              message="Komisyon kuralları yüklenemedi."
              onRetry={() => {
                setErrorRules(false);
                setLoadingRules(true);
                getCommissionRules()
                  .then(setRules)
                  .catch(() => setErrorRules(true))
                  .finally(() => setLoadingRules(false));
              }}
            />
          ) : loadingRules ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F8F8FA]">
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Kural Adı
                    </th>
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Oran
                    </th>
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Min/Max
                    </th>
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Kategori Override
                    </th>
                    <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      Durum
                    </th>
                    <th className="pb-3 text-end text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="border-b border-[#F8F8FA] hover:bg-[#F8F8FA]/50 transition-colors"
                    >
                      <td className="py-3 font-bold text-brand-primary text-xs">{rule.name}</td>
                      <td className="py-3 text-xs font-black text-brand-primary">%{rule.rate}</td>
                      <td className="py-3 text-xs text-brand-primary/60">
                        {rule.minAmount != null ? `Min: ${rule.minAmount}₺` : '—'}
                        {rule.maxAmount != null ? ` / Max: ${rule.maxAmount}₺` : ''}
                      </td>
                      <td className="py-3">
                        {rule.categoryOverrides ? (
                          <div className="flex flex-wrap gap-1">
                            {rule.categoryOverrides &&
                              Object.entries(rule.categoryOverrides)
                                .slice(0, 3)
                                .map(([cat, r]) => (
                                  <span
                                    key={cat}
                                    className="px-1.5 py-0.5 rounded bg-[#F8F8FA] text-[9px] font-bold text-brand-primary/60"
                                  >
                                    {cat}: %{r as number}
                                  </span>
                                ))}
                          </div>
                        ) : (
                          <span className="text-xs text-brand-primary/30">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest',
                            rule.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500',
                          )}
                        >
                          {rule.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="py-3 text-end">
                        <button
                          onClick={() => setEditingRule(rule)}
                          className="p-1.5 rounded-lg bg-[#F8F8FA] text-brand-primary/60 hover:bg-brand-primary/10 transition-all"
                        >
                          <Edit2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rules.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-brand-primary/30 text-sm font-bold"
                      >
                        Henüz komisyon kuralı yok
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Yeni kural / Düzenleme formu */}
          {editingRule && (
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 space-y-4">
              <h4 className="text-sm font-black uppercase italic text-brand-primary">
                {rules.find((r) => r.id === editingRule.id) ? 'Kuralı Düzenle' : 'Yeni Kural'}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-brand-primary/60 mb-1">
                    Kural Adı
                  </label>
                  <input
                    value={editingRule.name}
                    onChange={(e) =>
                      setEditingRule((p) => (p ? { ...p, name: e.target.value } : null))
                    }
                    placeholder="Örn: Varsayılan Komisyon"
                    className="w-full px-3 py-2 bg-white border border-brand-primary/10 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-primary/60 mb-1">
                    Komisyon Oranı (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={editingRule.rate}
                    onChange={(e) =>
                      setEditingRule((p) =>
                        p ? { ...p, rate: parseFloat(e.target.value) || 0 } : null,
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-brand-primary/10 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-primary/60 mb-1">
                    Platform Hizmet Bedeli (%)
                  </label>
                  <input
                    type="number"
                    disabled
                    value="3.5"
                    className="w-full px-3 py-2 bg-gray-50 border border-brand-primary/10 rounded-xl text-sm font-bold text-brand-primary/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-primary/60 mb-1">
                    Minimum Komisyon (₺)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingRule.minAmount ?? ''}
                    onChange={(e) =>
                      setEditingRule((p) =>
                        p
                          ? {
                              ...p,
                              minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                            }
                          : null,
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-brand-primary/10 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-primary/60 mb-1">
                    Maksimum Komisyon (₺)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingRule.maxAmount ?? ''}
                    onChange={(e) =>
                      setEditingRule((p) =>
                        p
                          ? {
                              ...p,
                              maxAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                            }
                          : null,
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-brand-primary/10 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingRule.isActive}
                  onChange={(e) =>
                    setEditingRule((p) => (p ? { ...p, isActive: e.target.checked } : null))
                  }
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-xs font-bold text-brand-primary/60">Aktif</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingRule(null)}
                  className="px-5 py-2 border border-brand-primary/10 text-brand-primary text-xs font-black rounded-xl hover:bg-white transition-all"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveRule}
                  disabled={savingRule || !editingRule.name}
                  className="px-5 py-2 bg-brand-primary text-white text-xs font-black rounded-xl hover:bg-amber-800 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {savingRule ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Kaydet
                </button>
              </div>
            </div>
          )}

          <button
            onClick={newRule}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
          >
            <Plus size={14} /> Yeni Kural Ekle
          </button>
        </div>
      )}
    </div>
  );
}
