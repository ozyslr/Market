import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AdminOrders } from './AdminOrders';
import { AdminReturns } from './AdminReturns';
import { AdminReviews } from './AdminReviews';
import { AdminSupport } from './AdminSupport';
import {
  ShoppingBag,
  RotateCcw,
  Star,
  MessageSquare,
  Shield,
  LogOut,
  Package,
  CheckCircle,
  XCircle,
  Edit3,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  getPendingProducts,
  approveProduct,
  rejectProduct,
  requestChanges,
} from '@/services/moderationService';
import { Product } from '@/types';

type ModTab = 'queue' | 'orders' | 'returns' | 'reviews' | 'support';

const TABS: { key: ModTab; label: string; icon: typeof ShoppingBag }[] = [
  { key: 'queue', label: 'Ürün Kuyruğu', icon: Package },
  { key: 'orders', label: 'Siparişler', icon: ShoppingBag },
  { key: 'returns', label: 'İade Talepleri', icon: RotateCcw },
  { key: 'reviews', label: 'Değerlendirmeler', icon: Star },
  { key: 'support', label: 'Destek', icon: MessageSquare },
];

function ModerationQueue() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ type: 'reject' | 'changes' } | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    getPendingProducts().then((p) => {
      setProducts(p);
      setLoading(false);
    });
  }, []);

  const remove = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleApprove = async (product: Product) => {
    setActionLoading('approve');
    try {
      await approveProduct(product.id);
      remove(product.id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoteConfirm = async () => {
    if (!selected || !noteModal) return;
    setActionLoading(noteModal.type);
    try {
      if (noteModal.type === 'reject') await rejectProduct(selected.id, note);
      else await requestChanges(selected.id, note);
      remove(selected.id);
      setNoteModal(null);
      setNote('');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );

  if (products.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-24 text-brand-primary/30">
        <CheckCircle size={48} className="mb-4 text-green-400" />
        <p className="font-black text-sm uppercase tracking-widest">Bekleyen ürün yok</p>
      </div>
    );

  return (
    <div className="flex gap-6 h-full">
      {/* List */}
      <div className="w-80 shrink-0 space-y-2 overflow-y-auto pe-1">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-2xl border text-start transition-all',
              selected?.id === p.id
                ? 'border-purple-400 bg-purple-50'
                : 'border-transparent bg-white hover:border-purple-200 hover:bg-purple-50/30',
            )}
          >
            <img
              src={p.images[0]}
              alt={p.title}
              className="w-12 h-12 rounded-xl object-cover shrink-0"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            <div className="min-w-0">
              <p className="font-bold text-brand-primary text-xs line-clamp-1">{p.title}</p>
              <p className="text-[10px] text-brand-primary/40">
                {p.brand} · {p.price.toLocaleString('tr-TR')} ₺
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Preview Panel */}
      {selected ? (
        <div className="flex-1 bg-white rounded-4xl p-8 overflow-y-auto shadow-sm border border-[#F8F8FA]">
          <div className="flex gap-6 mb-6">
            <img
              src={selected.images[0]}
              alt={selected.title}
              className="w-40 h-40 rounded-2xl object-cover shrink-0"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-1">
                {selected.brand}
              </p>
              <h3 className="text-xl font-display font-black text-brand-primary mb-2">
                {selected.title}
              </h3>
              <p className="text-lg font-black text-brand-primary">
                {selected.price.toLocaleString('tr-TR')} ₺
              </p>
              <p className="text-[10px] text-brand-primary/40 mt-1">
                Stok: {selected.stock} · Kategori: {selected.categoryId}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-2">
              Açıklama
            </p>
            <p className="text-sm text-brand-primary/70 leading-relaxed">{selected.description}</p>
          </div>

          {selected.images.length > 1 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {selected.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={selected.title}
                  className="w-16 h-16 rounded-xl object-cover"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-[#F8F8FA]">
            <button
              onClick={() => handleApprove(selected)}
              disabled={!!actionLoading}
              className="flex-1 py-3 bg-green-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading === 'approve' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle size={14} />
              )}{' '}
              Onayla
            </button>
            <button
              onClick={() => {
                setNoteModal({ type: 'changes' });
                setNote('');
              }}
              disabled={!!actionLoading}
              className="flex-1 py-3 bg-yellow-100 text-yellow-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Edit3 size={14} /> Düzenleme İste
            </button>
            <button
              onClick={() => {
                setNoteModal({ type: 'reject' });
                setNote('');
              }}
              disabled={!!actionLoading}
              className="flex-1 py-3 bg-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <XCircle size={14} /> Reddet
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-brand-primary/20">
          <p className="font-black text-sm uppercase tracking-widest">Bir ürün seçin</p>
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setNoteModal(null)}
          />
          <div className="relative bg-white rounded-4xl p-8 w-full max-w-md shadow-2xl">
            <button
              onClick={() => setNoteModal(null)}
              className="absolute top-5 end-5 text-brand-primary/30 hover:text-brand-primary"
            >
              <X size={18} />
            </button>
            <h4 className="text-lg font-display font-black uppercase italic mb-1">
              {noteModal.type === 'reject' ? 'Ürünü Reddet' : 'Düzenleme İste'}
            </h4>
            <p className="text-xs text-brand-primary/50 mb-5 line-clamp-1">{selected?.title}</p>
            <label className="block text-[10px] font-black uppercase tracking-widest text-brand-primary/60 mb-2">
              {noteModal.type === 'reject' ? 'Red Sebebi' : 'Düzeltilmesi Gerekenler'}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={
                noteModal.type === 'reject'
                  ? 'Görseller yetersiz...'
                  : 'Açıklama eksik, fiyat uygunsuz...'
              }
              className="w-full px-4 py-3 bg-[#F8F8FA] border border-brand-primary/10 rounded-xl text-sm outline-none focus:border-purple-300 resize-none"
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setNoteModal(null)}
                className="flex-1 py-3 bg-[#F8F8FA] text-brand-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/10 transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleNoteConfirm}
                disabled={!note.trim() || !!actionLoading}
                className={cn(
                  'flex-1 py-3 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2',
                  noteModal.type === 'reject'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-yellow-500 hover:bg-yellow-600',
                )}
              >
                {actionLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : noteModal.type === 'reject' ? (
                  <XCircle size={14} />
                ) : (
                  <Edit3 size={14} />
                )}
                {noteModal.type === 'reject' ? 'Reddet' : 'Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ModeratorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ModTab>('queue');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    getPendingProducts().then((p) => setPendingCount(p.length));
  }, []);

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return <Navigate to="/" replace />;
  }

  const handleSignOut = () => signOut(auth);

  const renderTab = () => {
    switch (activeTab) {
      case 'queue':
        return <ModerationQueue />;
      case 'orders':
        return <AdminOrders />;
      case 'returns':
        return <AdminReturns />;
      case 'reviews':
        return <AdminReviews />;
      case 'support':
        return <AdminSupport />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8FA] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-e border-[#F8F8FA] flex flex-col py-8 px-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
            <Shield size={16} className="text-purple-600" />
          </div>
          <div>
            <p className="font-black text-brand-primary text-sm uppercase tracking-tight">
              Moderatör
            </p>
            <p className="text-[10px] text-brand-primary/40 truncate max-w-[120px]">{user.name}</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black transition-colors',
                activeTab === key
                  ? 'bg-purple-600 text-white'
                  : 'text-brand-primary/60 hover:bg-purple-50 hover:text-purple-600',
              )}
            >
              <Icon size={14} /> {label}
              {key === 'queue' && pendingCount > 0 && (
                <span className="ms-auto bg-yellow-400 text-brand-primary text-[9px] font-black rounded-full px-1.5 py-0.5">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-brand-primary/40 hover:text-red-500 transition-colors mt-4"
        >
          <LogOut size={14} /> Çıkış Yap
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">{renderTab()}</main>
    </div>
  );
}
