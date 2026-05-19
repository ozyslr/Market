import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getSellers, updateSeller } from '@/services/userService';
import { createNotification } from '@/services/notificationService';
import { getProducts } from '@/services/productService';
import { Seller, Product } from '@/types';
import {
  Store, Loader2, CheckCircle, XCircle, Search,
  ShieldCheck, ShieldOff, Edit2, Check, X, Package, ChevronRight
} from 'lucide-react';
import { MOCK_SELLERS } from '@/mockData';
import { cn } from '@/lib/utils';

const KYC_BADGE: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'Bekliyor', cls: 'bg-yellow-100 text-yellow-700' },
  verified: { label: 'Onaylı',   cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Reddedildi', cls: 'bg-red-100 text-red-600' },
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active:    { label: 'Aktif',   cls: 'bg-green-100 text-green-700' },
  suspended: { label: 'Askıda',  cls: 'bg-orange-100 text-orange-700' },
  banned:    { label: 'Banlı',   cls: 'bg-red-100 text-red-600' },
};

export function AdminSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [commissionValue, setCommissionValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        let data = await getSellers();
        if (data.length === 0) data = MOCK_SELLERS as Seller[];
        setSellers(data);
      } catch {
        setSellers(MOCK_SELLERS as Seller[]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedSeller) return;
    setLoadingProducts(true);
    getProducts({ sellerId: selectedSeller.userId, includeNonApproved: true })
      .then(setSellerProducts)
      .finally(() => setLoadingProducts(false));
  }, [selectedSeller]);

  const filtered = useMemo(() => {
    let list = sellers;
    if (kycFilter !== 'all') list = list.filter(s => s.kycStatus === kycFilter);
    if (search) list = list.filter(s => s.storeName.toLowerCase().includes(search.toLowerCase()) || s.slug.includes(search.toLowerCase()));
    return list;
  }, [sellers, search, kycFilter]);

  const update = async (id: string, data: Partial<Seller>) => {
    setSavingId(id);
    try {
      if (!id.startsWith('s')) await updateSeller(id, data);
      setSellers(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
      if (selectedSeller?.id === id) setSelectedSeller(prev => prev ? { ...prev, ...data } : null);
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
  };

  const setKyc = async (seller: Seller, status: 'verified' | 'rejected') => {
    await update(seller.id, { kycStatus: status, isVerified: status === 'verified' });
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

  const pendingKycCount = sellers.filter(s => s.kycStatus === 'pending').length;

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="bg-white rounded-[3.5rem] p-8 lg:p-12 border border-[#F8F8FA] shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Satıcı Yönetimi</h3>
          {pendingKycCount > 0 && <p className="text-xs font-bold text-yellow-600 mt-0.5">{pendingKycCount} satıcı KYC onayı bekliyor</p>}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1033]/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Mağaza adı ara..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#F8F8FA] rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/20" />
        </div>
      </div>

      {/* KYC filter chips */}
      <div className="flex gap-2 flex-wrap mb-5">
        {(['all', 'pending', 'verified', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setKycFilter(f)}
            className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
              kycFilter === f ? 'bg-[#1A1033] text-white' : 'bg-[#F8F8FA] text-[#1A1033]/60 hover:bg-[#1A1033]/10'
            )}>
            {f === 'all' ? 'Tümü' : f === 'pending' ? `Bekleyen KYC${pendingKycCount > 0 ? ` (${pendingKycCount})` : ''}` : f === 'verified' ? 'Onaylı' : 'Reddedildi'}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F8F8FA]">
              <th className="pb-3 text-left text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">Mağaza</th>
              <th className="pb-3 text-left text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">KYC</th>
              <th className="pb-3 text-left text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">Komisyon</th>
              <th className="pb-3 text-left text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">Durum</th>
              <th className="pb-3 text-left text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">Rating</th>
              <th className="pb-3 text-right text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(seller => {
              const status = seller.status ?? 'active';
              const statusBadge = STATUS_BADGE[status] ?? STATUS_BADGE.active;
              const kycBadge = KYC_BADGE[seller.kycStatus] ?? KYC_BADGE.pending;
              const isSaving = savingId === seller.id;
              return (
                <tr key={seller.id} className="border-b border-[#F8F8FA] hover:bg-[#F8F8FA]/50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#F8F8FA] flex items-center justify-center text-[#1A1033]/40">
                        <Store size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-[#1A1033] text-xs">{seller.storeName}</p>
                        <p className="text-[10px] text-[#1A1033]/40">{seller.origin} · {seller.joinedDate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest', kycBadge.cls)}>{kycBadge.label}</span>
                      {seller.kycStatus === 'pending' && (
                        <>
                          <button onClick={() => setKyc(seller, 'verified')} disabled={isSaving}
                            className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100 transition-all disabled:opacity-50" title="Onayla">
                            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                          </button>
                          <button onClick={() => setKyc(seller, 'rejected')} disabled={isSaving}
                            className="p-1 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-all disabled:opacity-50" title="Reddet">
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
                          type="number" min="0" max="100" step="0.5"
                          value={commissionValue}
                          onChange={e => setCommissionValue(e.target.value)}
                          className="w-14 px-2 py-1 border border-accent/30 rounded-lg text-xs font-bold outline-none"
                          autoFocus
                        />
                        <span className="text-[10px] text-[#1A1033]/50">%</span>
                        <button onClick={() => saveCommission(seller)} disabled={isSaving}
                          className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100 transition-all">
                          <Check size={12} />
                        </button>
                        <button onClick={() => setEditingCommission(null)} className="p-1 rounded bg-[#F8F8FA] text-[#1A1033]/40 hover:bg-[#1A1033]/10 transition-all">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingCommission(seller.id); setCommissionValue(String(seller.commissionRate)); }}
                        className="flex items-center gap-1 text-xs font-black text-[#1A1033] hover:text-accent transition-colors group">
                        %{seller.commissionRate}
                        <Edit2 size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </td>
                  <td className="py-3">
                    <span className={cn('px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest', statusBadge.cls)}>{statusBadge.label}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-[#1A1033]">{seller.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-[#1A1033]/40">({seller.reviewsCount})</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleSuspend(seller)} disabled={isSaving}
                        title={status === 'active' ? 'Askıya Al' : 'Aktifleştir'}
                        className={cn('p-1.5 rounded-lg transition-all disabled:opacity-50',
                          status === 'active' ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                        )}>
                        {status === 'active' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                      </button>
                      <button
                        onClick={() => setSelectedSeller(seller)}
                        className="p-1.5 rounded-lg bg-[#F8F8FA] text-[#1A1033]/60 hover:bg-[#1A1033]/10 transition-all"
                        title="Ürünleri Gör"
                      >
                        <Package size={14} />
                      </button>
                      <Link
                        to={`/admin/seller/${seller.id}`}
                        className="p-1.5 rounded-lg bg-[#F8F8FA] text-[#1A1033]/60 hover:bg-accent hover:text-white transition-all"
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
              <tr><td colSpan={6} className="py-10 text-center text-[#1A1033]/30 text-sm font-bold">Satıcı bulunamadı</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Seller Products Panel */}
      {selectedSeller && (
        <div className="fixed inset-0 z-200 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedSeller(null)} />
          <div className="relative bg-white rounded-4xl p-8 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h4 className="text-lg font-display font-black uppercase italic">{selectedSeller.storeName}</h4>
                <p className="text-[10px] text-[#1A1033]/40">%{selectedSeller.commissionRate} komisyon · {selectedSeller.origin}</p>
              </div>
              <button onClick={() => setSelectedSeller(null)} className="text-[#1A1033]/30 hover:text-[#1A1033]"><X size={18} /></button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Ürün', value: sellerProducts.length },
                { label: 'Onaylı', value: sellerProducts.filter(p => (p.status ?? 'approved') === 'approved').length },
                { label: 'Bekleyen', value: sellerProducts.filter(p => p.status === 'pending').length },
              ].map(stat => (
                <div key={stat.label} className="bg-[#F8F8FA] rounded-2xl p-3 text-center">
                  <p className="text-xl font-black text-[#1A1033]">{stat.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 space-y-2">
              {loadingProducts ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
              ) : sellerProducts.length === 0 ? (
                <p className="text-center py-8 text-[#1A1033]/30 text-sm font-bold">Bu satıcıya ait ürün yok</p>
              ) : sellerProducts.map(p => {
                const st = p.status ?? 'approved';
                const badge = { approved: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', rejected: 'bg-red-100 text-red-600', draft: 'bg-gray-100 text-gray-500' }[st] ?? 'bg-gray-100 text-gray-500';
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-[#F8F8FA] rounded-2xl">
                    <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded-xl object-cover shrink-0" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#1A1033] text-xs line-clamp-1">{p.title}</p>
                      <p className="text-[10px] text-[#1A1033]/40">{p.price.toLocaleString('tr-TR')} ₺ · Stok: {p.stock}</p>
                    </div>
                    <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0', badge)}>{st}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
