import React, { useState, useEffect, useMemo } from 'react';
import { getProducts, updateProduct } from '@/services/productService';
import { approveProduct, rejectProduct } from '@/services/moderationService';
import { Product, ProductStatus } from '@/types';
import {
  Search,
  Star,
  Flame,
  Zap,
  Sparkles,
  Loader2,
  CheckSquare,
  Square,
  CheckCircle,
  XCircle,
  X,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { moderateProductBatch, ModerationResult } from '@/services/aiModerationService';
import { useAuth } from '@/context/AuthContext';

const FLAGS = [
  { key: 'featured' as const, label: 'Öne Çıkan', icon: Star, color: 'text-yellow-500' },
  { key: 'bestSeller' as const, label: 'Çok Satan', icon: Flame, color: 'text-orange-500' },
  { key: 'isFlashDeal' as const, label: 'Flash Deal', icon: Zap, color: 'text-blue-500' },
  { key: 'newArrival' as const, label: 'Yeni Gelen', icon: Sparkles, color: 'text-green-500' },
];

const STATUS_FILTERS: { label: string; value: ProductStatus | '' }[] = [
  { label: 'Tümü', value: '' },
  { label: 'Bekleyen', value: 'pending' },
  { label: 'Onaylı', value: 'approved' },
  { label: 'Reddedildi', value: 'rejected' },
  { label: 'Taslak', value: 'draft' },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Taslak', cls: 'bg-gray-100 text-gray-500' },
  pending: { label: 'Bekliyor', cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Onaylı', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Reddedildi', cls: 'bg-red-100 text-red-600' },
};

export function AdminProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ product: Product } | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  // AI Moderation
  const [aiScanning, setAiScanning] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiResults, setAiResults] = useState<Map<string, ModerationResult>>(new Map());

  const handleAiScan = async () => {
    const pending = products.filter((p) => p.status === 'pending');
    if (pending.length === 0) return;
    setAiScanning(true);
    setAiProgress(0);
    const results = await moderateProductBatch(
      pending.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description || '',
        brand: p.brand || '',
        category: p.categoryId || '',
        price: p.price,
      })),
      (done, total) => setAiProgress(Math.round((done / total) * 100)),
    );
    setAiResults(results);
    setAiScanning(false);
  };

  useEffect(() => {
    getProducts({ includeNonApproved: true }).then((p) => {
      setProducts(p);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (statusFilter) {
      list = list.filter((p) => (p.status ?? 'approved') === statusFilter);
    }
    const q = search.toLowerCase();
    if (q)
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q),
      );
    return list;
  }, [products, search, statusFilter]);

  const pendingCount = useMemo(
    () => products.filter((p) => p.status === 'pending').length,
    [products],
  );

  const toggleFlag = async (
    product: Product,
    flag: keyof Pick<Product, 'featured' | 'bestSeller' | 'isFlashDeal' | 'newArrival'>,
  ) => {
    const key = `${product.id}_${flag}`;
    setToggling(key);
    const newVal = !product[flag];
    try {
      await updateProduct(product.id, { [flag]: newVal });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, [flag]: newVal } : p)));
    } finally {
      setToggling(null);
    }
  };

  const handleApprove = async (product: Product) => {
    setActionLoading(product.id + '_approve');
    try {
      await approveProduct(
        product.id,
        user ? { uid: user.uid ?? user.id, email: user.email, role: user.role } : undefined,
      );
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, status: 'approved', moderationNote: '' } : p,
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.product.id + '_reject');
    try {
      await rejectProduct(
        rejectModal.product.id,
        rejectNote,
        user ? { uid: user.uid ?? user.id, email: user.email, role: user.role } : undefined,
      );
      setProducts((prev) =>
        prev.map((p) =>
          p.id === rejectModal.product.id
            ? { ...p, status: 'rejected', moderationNote: rejectNote }
            : p,
        ),
      );
      setRejectModal(null);
      setRejectNote('');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.id)));
  };

  const bulkSetFlag = async (
    flag: keyof Pick<Product, 'featured' | 'bestSeller' | 'isFlashDeal' | 'newArrival'>,
    value: boolean,
  ) => {
    const ids = [...selected];
    await Promise.all(ids.map((id) => updateProduct(id, { [flag]: value })));
    setProducts((prev) => prev.map((p) => (selected.has(p.id) ? { ...p, [flag]: value } : p)));
    setSelected(new Set());
  };

  const bulkApprove = async () => {
    const ids = [...selected].filter(
      (id) => (products.find((p) => p.id === id)?.status ?? 'approved') === 'pending',
    );
    await Promise.all(ids.map((id) => approveProduct(id)));
    setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, status: 'approved' } : p)));
    setSelected(new Set());
  };

  if (loading)
    return (
      <div className="bg-white rounded-[3.5rem] p-8 lg:p-12 border border-[#F8F8FA] shadow-sm">
        <div className="space-y-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRowSkeleton key={i} cols={8} />
          ))}
        </div>
      </div>
    );

  return (
    <div className="bg-white rounded-[3.5rem] p-8 lg:p-12 border border-[#F8F8FA] shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">
            Ürün Kataloğu
          </h3>
          {pendingCount > 0 && (
            <p className="text-xs font-bold text-yellow-600 mt-0.5">
              {pendingCount} ürün onay bekliyor
            </p>
          )}
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            size={14}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-[#1A1033]/30"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün veya marka ara..."
            className="w-full ps-9 pe-4 py-2.5 bg-[#F8F8FA] rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/20"
          />
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
              statusFilter === f.value
                ? 'bg-[#1A1033] text-white'
                : 'bg-[#F8F8FA] text-[#1A1033]/60 hover:bg-[#1A1033]/10',
            )}
          >
            {f.label}
            {f.value === 'pending' && pendingCount > 0 && (
              <span className="ms-1.5 bg-yellow-400 text-[#1A1033] rounded-full px-1.5">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
        {aiScanning && (
          <span className="ms-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-accent">
            <Loader2 size={12} className="animate-spin" /> AI tarıyor... %{aiProgress}
          </span>
        )}
        <button
          onClick={handleAiScan}
          disabled={aiScanning}
          className={cn(
            'ms-auto px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5',
            aiScanning
              ? 'bg-accent/10 text-accent/50 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90',
          )}
        >
          <Brain size={14} /> AI ile Tara ({products.filter((p) => p.status === 'pending').length})
        </button>
      </div>

      {aiResults.size > 0 && (
        <div className="mb-4 p-3 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between">
          <span className="text-xs font-bold text-purple-700">
            AI analizi tamamlandı:{' '}
            {[...aiResults.values()].filter((r) => r.verdict === 'approved').length} onaylanabilir,{' '}
            {[...aiResults.values()].filter((r) => r.verdict === 'flagged').length} şüpheli,{' '}
            {[...aiResults.values()].filter((r) => r.verdict === 'rejected').length} reddedilebilir
          </span>
          <button
            onClick={() => setAiResults(new Map())}
            className="text-[10px] text-purple-500 underline"
          >
            Kapat
          </button>
        </div>
      )}

      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-accent/5 rounded-2xl flex-wrap">
          <span className="text-xs font-bold text-[#1A1033]/60">{selected.size} ürün seçildi</span>
          <button
            onClick={bulkApprove}
            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 hover:bg-green-200 transition-all"
          >
            <CheckCircle size={10} /> Toplu Onayla
          </button>
          {FLAGS.map((f) => (
            <React.Fragment key={f.key}>
              <button
                onClick={() => bulkSetFlag(f.key, true)}
                className="px-3 py-1 bg-white rounded-lg text-[10px] font-black uppercase text-[#1A1033]/60 hover:text-accent border border-[#1A1033]/10 flex items-center gap-1"
              >
                <f.icon size={10} className={f.color} /> {f.label} Ekle
              </button>
              <button
                onClick={() => bulkSetFlag(f.key, false)}
                className="px-3 py-1 bg-white rounded-lg text-[10px] font-black uppercase text-[#1A1033]/60 hover:text-red-500 border border-[#1A1033]/10 flex items-center gap-1"
              >
                <f.icon size={10} /> {f.label} Kaldır
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F8F8FA]">
              <th className="pb-3 text-start w-8">
                <button onClick={selectAll} className="text-[#1A1033]/30 hover:text-accent">
                  {selected.size === filtered.length && filtered.length > 0 ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                Ürün
              </th>
              <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                Durum
              </th>
              <th className="pb-3 text-end text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                Fiyat
              </th>
              <th className="pb-3 text-end text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                Stok
              </th>
              {FLAGS.map((f) => (
                <th
                  key={f.key}
                  className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30"
                >
                  <f.icon size={12} className={cn('mx-auto', f.color)} />
                </th>
              ))}
              <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => {
              const status = product.status ?? 'approved';
              const badge = STATUS_BADGE[status] ?? STATUS_BADGE.approved;
              return (
                <tr
                  key={product.id}
                  className={cn(
                    'border-b border-[#F8F8FA] hover:bg-[#F8F8FA]/50 transition-colors',
                    selected.has(product.id) && 'bg-accent/5',
                  )}
                >
                  <td className="py-3">
                    <button
                      onClick={() => toggleSelect(product.id)}
                      className="text-[#1A1033]/30 hover:text-accent"
                    >
                      {selected.has(product.id) ? (
                        <CheckSquare size={16} className="text-accent" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0]}
                          className="w-10 h-10 rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                          alt={product.title}
                          loading="lazy"
                        />
                      )}
                      <div>
                        <p className="font-bold text-[#1A1033] text-xs line-clamp-1">
                          {product.title}
                        </p>
                        <p className="text-[10px] text-[#1A1033]/40">{product.brand}</p>
                        {status === 'rejected' && product.moderationNote && (
                          <p
                            className="text-[10px] text-red-500 italic mt-0.5 max-w-[180px] truncate"
                            title={product.moderationNote}
                          >
                            {product.moderationNote}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest',
                        badge.cls,
                      )}
                    >
                      {badge.label}
                    </span>
                    {aiResults.has(product.id) && (
                      <span
                        className={cn(
                          'ms-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase',
                          aiResults.get(product.id)!.verdict === 'approved'
                            ? 'bg-green-100 text-green-600'
                            : aiResults.get(product.id)!.verdict === 'rejected'
                              ? 'bg-red-100 text-red-500'
                              : 'bg-amber-100 text-amber-600',
                        )}
                        title={aiResults.get(product.id)!.reason}
                      >
                        AI:{' '}
                        {aiResults.get(product.id)!.verdict === 'approved'
                          ? 'Onay'
                          : aiResults.get(product.id)!.verdict === 'rejected'
                            ? 'Red'
                            : 'İncele'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-end font-bold text-[#1A1033] text-xs">
                    {product.price.toLocaleString('tr-TR')} ₺
                  </td>
                  <td className="py-3 text-end text-[10px] font-bold text-[#1A1033]/60">
                    {product.stock}
                  </td>
                  {FLAGS.map((f) => {
                    const key = `${product.id}_${f.key}`;
                    const active = !!product[f.key];
                    return (
                      <td key={f.key} className="py-3 text-center">
                        <button
                          onClick={() => toggleFlag(product, f.key)}
                          disabled={toggling === key}
                          className={cn(
                            'p-1.5 rounded-lg transition-all',
                            active ? 'bg-yellow-50' : 'bg-transparent hover:bg-[#F8F8FA]',
                            toggling === key && 'opacity-50',
                          )}
                        >
                          <f.icon
                            size={14}
                            className={cn(active ? f.color : 'text-[#1A1033]/20')}
                          />
                        </button>
                      </td>
                    );
                  })}
                  <td className="py-3">
                    <div className="flex items-center justify-center gap-1">
                      {status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(product)}
                            disabled={actionLoading === product.id + '_approve'}
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all disabled:opacity-50"
                            title="Onayla"
                          >
                            {actionLoading === product.id + '_approve' ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setRejectModal({ product });
                              setRejectNote('');
                            }}
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                            title="Reddet"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      {status === 'approved' && (
                        <button
                          onClick={() => {
                            setRejectModal({ product });
                            setRejectNote('');
                          }}
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                          title="Yayından Kaldır"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                      {status === 'rejected' && (
                        <button
                          onClick={() => handleApprove(product)}
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all"
                          title="Onayla"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-[#1A1033]/30 text-sm font-bold">Ürün bulunamadı</p>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setRejectModal(null)}
          />
          <div className="relative bg-white rounded-4xl p-8 w-full max-w-md shadow-2xl">
            <button
              onClick={() => setRejectModal(null)}
              className="absolute top-5 end-5 text-[#1A1033]/30 hover:text-[#1A1033]"
            >
              <X size={18} />
            </button>
            <h4 className="text-lg font-display font-black uppercase italic mb-1">Ürünü Reddet</h4>
            <p className="text-xs text-[#1A1033]/50 mb-5 line-clamp-2">
              {rejectModal.product.title}
            </p>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1033]/60 mb-2">
              Red Sebebi (Satıcıya bildirilir)
            </label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              placeholder="Ürün görselleri yetersiz, açıklama eksik..."
              className="w-full px-4 py-3 bg-[#F8F8FA] border border-[#1A1033]/10 rounded-xl text-sm outline-none focus:border-accent/30 resize-none"
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-3 bg-[#F8F8FA] text-[#1A1033] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1A1033]/10 transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectNote.trim() || !!actionLoading}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <XCircle size={14} />
                )}{' '}
                Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
