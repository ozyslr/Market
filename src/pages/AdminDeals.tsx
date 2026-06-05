import React, { useState, useEffect } from 'react';
import { FeaturedDeal, Product } from '@/types';
import { getAllDeals, createDeal, updateDeal, deleteDeal } from '@/services/dealService';
import { getProducts } from '@/services/productService';
import { uploadDealImage } from '@/services/storageService';
import { useAuth } from '@/context/AuthContext';
import { audit } from '@/services/auditLogService';
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Zap,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DealForm = Omit<FeaturedDeal, 'id' | 'createdAt' | 'updatedAt'>;

const DEFAULT_FORM: DealForm = {
  productId: '',
  title: '',
  image: '',
  badge: 'Sınırlı Stok',
  oldPrice: undefined,
  price: undefined,
  endsAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  order: 0,
  active: true,
  createdBy: '',
};

function dealStatus(d: FeaturedDeal): { label: string; cls: string } {
  const now = new Date().toISOString();
  if (!d.active) return { label: 'Pasif', cls: 'bg-red-100 text-red-600' };
  if (d.endsAt && d.endsAt < now) return { label: 'Sona Erdi', cls: 'bg-gray-100 text-gray-500' };
  return { label: 'Aktif', cls: 'bg-green-100 text-green-700' };
}

export function AdminDeals() {
  const { user, firebaseUser } = useAuth();
  const [deals, setDeals] = useState<FeaturedDeal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FeaturedDeal | null>(null);
  const [form, setForm] = useState<DealForm>(DEFAULT_FORM);
  const [productQuery, setProductQuery] = useState('');

  useEffect(() => {
    getAllDeals().then((data) => {
      setDeals(data);
      setLoading(false);
    });
    getProducts({ limit: 500 }).then(setProducts);
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...DEFAULT_FORM, order: deals.length });
    setProductQuery('');
    setShowForm(true);
  };

  const openEdit = (d: FeaturedDeal) => {
    setEditing(d);
    setForm({
      productId: d.productId,
      title: d.title,
      image: d.image,
      badge: d.badge ?? '',
      oldPrice: d.oldPrice,
      price: d.price,
      endsAt: d.endsAt ? d.endsAt.slice(0, 16) : DEFAULT_FORM.endsAt,
      order: d.order,
      active: d.active,
      createdBy: d.createdBy ?? '',
    });
    setProductQuery('');
    setShowForm(true);
  };

  const set = (field: keyof DealForm, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const selectProduct = (p: Product) => {
    setForm((prev) => ({
      ...prev,
      productId: p.id,
      title: prev.title || p.title,
      image: prev.image || p.images?.[0] || '',
      price: prev.price ?? p.price,
      oldPrice: prev.oldPrice ?? p.oldPrice,
    }));
    setProductQuery('');
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const id = editing?.id ?? `temp-${Date.now()}`;
      const url = await uploadDealImage(id, file);
      set('image', url);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.productId || !form.title.trim() || !form.image) return;
    setSaving(true);
    try {
      const payload: DealForm = {
        ...form,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : '',
        createdBy: editing ? form.createdBy : (firebaseUser?.uid ?? ''),
      };
      if (editing) {
        await updateDeal(editing.id, payload);
        audit(
          firebaseUser?.uid ?? '',
          firebaseUser?.email ?? '',
          user?.role ?? 'admin',
          'deal.update',
          'deal',
          editing.id,
          form.title,
        );
        setDeals((prev) =>
          prev
            .map((d) => (d.id === editing.id ? { ...d, ...payload } : d))
            .sort((a, b) => a.order - b.order),
        );
      } else {
        const created = await createDeal(payload);
        audit(
          firebaseUser?.uid ?? '',
          firebaseUser?.email ?? '',
          user?.role ?? 'admin',
          'deal.create',
          'deal',
          created.id,
          form.title,
        );
        setDeals((prev) => [...prev, created].sort((a, b) => a.order - b.order));
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu fırsatı silmek istediğinizden emin misiniz?')) return;
    await deleteDeal(id);
    audit(
      firebaseUser?.uid ?? '',
      firebaseUser?.email ?? '',
      user?.role ?? 'admin',
      'deal.delete',
      'deal',
      id,
    );
    setDeals((prev) => prev.filter((d) => d.id !== id));
  };

  const handleToggle = async (d: FeaturedDeal) => {
    await updateDeal(d.id, { active: !d.active });
    audit(
      firebaseUser?.uid ?? '',
      firebaseUser?.email ?? '',
      user?.role ?? 'admin',
      'deal.update',
      'deal',
      d.id,
      d.title,
      `active: ${!d.active}`,
    );
    setDeals((prev) => prev.map((x) => (x.id === d.id ? { ...x, active: !x.active } : x)));
  };

  const filteredProducts = productQuery.trim()
    ? products.filter((p) => p.title.toLowerCase().includes(productQuery.toLowerCase())).slice(0, 8)
    : [];

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );

  return (
    <div className="bg-white rounded-[3.5rem] p-8 lg:p-12 border border-[#F8F8FA] shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-accent" />
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">
            Fırsatı Yakala
          </h3>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-2xl text-xs font-black uppercase tracking-wide hover:bg-accent/90 transition-colors"
        >
          <Plus size={14} /> Yeni Fırsat
        </button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 bg-[#F8F8FA] rounded-3xl border border-[#1A1033]/10">
          <h4 className="text-sm font-black uppercase tracking-widest text-[#1A1033]/50 mb-5">
            {editing ? 'Fırsatı Düzenle' : 'Yeni Fırsat'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product picker */}
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                Ürün *
              </label>
              {form.productId ? (
                <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-accent/30">
                  <span className="text-sm font-bold text-[#1A1033] truncate">
                    {form.title || form.productId}
                  </span>
                  <button
                    onClick={() => set('productId', '')}
                    className="text-[#1A1033]/40 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-transparent focus-within:border-accent/30">
                    <Search size={14} className="text-[#1A1033]/30" />
                    <input
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      placeholder="Ürün ara..."
                      className="flex-1 text-sm font-bold outline-none bg-transparent"
                    />
                  </div>
                  {filteredProducts.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-xl border border-[#1A1033]/10 shadow-xl max-h-60 overflow-y-auto">
                      {filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => selectProduct(p)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#F8F8FA] text-start transition-colors"
                        >
                          <img
                            src={p.images?.[0]}
                            alt={p.title}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1A1033] truncate">{p.title}</p>
                            <p className="text-[10px] text-[#1A1033]/40">
                              ₺{p.price?.toLocaleString('tr-TR')}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                Başlık *
              </label>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Apple AirPods Pro 2..."
                className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                Rozet
              </label>
              <input
                value={form.badge ?? ''}
                onChange={(e) => set('badge', e.target.value)}
                placeholder="Sınırlı Stok"
                className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                Sıra
              </label>
              <input
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => set('order', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                Eski Fiyat (₺)
              </label>
              <input
                type="number"
                min={0}
                value={form.oldPrice ?? ''}
                onChange={(e) =>
                  set('oldPrice', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="Opsiyonel"
                className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                Fiyat (₺)
              </label>
              <input
                type="number"
                min={0}
                value={form.price ?? ''}
                onChange={(e) =>
                  set('price', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                Bitiş Zamanı
              </label>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => set('endsAt', e.target.value)}
                className="w-full px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <button onClick={() => set('active', !form.active)} className="text-accent">
                {form.active ? (
                  <ToggleRight size={28} />
                ) : (
                  <ToggleLeft size={28} className="text-[#1A1033]/30" />
                )}
              </button>
              <span className="text-sm font-bold text-[#1A1033]/60">
                {form.active ? 'Aktif' : 'Pasif'}
              </span>
            </div>

            {/* Image */}
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1 block">
                Görsel *
              </label>
              <div className="flex items-center gap-3">
                {form.image && (
                  <img
                    src={form.image}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover border border-[#1A1033]/10"
                  />
                )}
                <input
                  value={form.image}
                  onChange={(e) => set('image', e.target.value)}
                  placeholder="Görsel URL veya yükle"
                  className="flex-1 px-4 py-2.5 bg-white rounded-xl text-sm font-bold outline-none border border-transparent focus:border-accent/30"
                />
                <label
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 bg-[#1A1033]/10 rounded-xl text-xs font-black uppercase cursor-pointer hover:bg-[#1A1033]/20 transition-colors',
                    uploading && 'opacity-50 pointer-events-none',
                  )}
                >
                  {uploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={saving || !form.productId || !form.title.trim() || !form.image}
              className="px-5 py-2.5 bg-accent text-white rounded-2xl text-xs font-black uppercase disabled:opacity-50 hover:bg-accent/90 transition-colors"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : editing ? (
                'Güncelle'
              ) : (
                'Oluştur'
              )}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 bg-[#1A1033]/10 text-[#1A1033] rounded-2xl text-xs font-black uppercase hover:bg-[#1A1033]/20 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F8F8FA]">
              <th className="pb-3 text-start text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                Fırsat
              </th>
              <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                Fiyat
              </th>
              <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                Bitiş
              </th>
              <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                Sıra
              </th>
              <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                Durum
              </th>
              <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => {
              const { label, cls } = dealStatus(d);
              return (
                <tr
                  key={d.id}
                  className="border-b border-[#F8F8FA] hover:bg-[#F8F8FA]/50 transition-colors"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={d.image}
                        alt={d.title}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div>
                        <p className="font-bold text-[#1A1033] text-xs">{d.title}</p>
                        {d.badge && <p className="text-[10px] text-[#1A1033]/40">{d.badge}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-center font-bold text-[#1A1033] text-xs">
                    {d.price != null ? `₺${d.price.toLocaleString('tr-TR')}` : '—'}
                    {d.oldPrice != null && (
                      <span className="block text-[10px] line-through text-[#1A1033]/30">
                        ₺{d.oldPrice.toLocaleString('tr-TR')}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-center text-[10px] text-[#1A1033]/50">
                    {d.endsAt ? d.endsAt.slice(0, 16).replace('T', ' ') : '—'}
                  </td>
                  <td className="py-3 text-center text-xs font-bold text-[#1A1033]/60">
                    {d.order}
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-black uppercase',
                        cls,
                      )}
                    >
                      {label}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleToggle(d)}
                        className="p-1.5 rounded-lg hover:bg-[#F8F8FA] text-[#1A1033]/40 hover:text-accent transition-colors"
                      >
                        {d.active ? (
                          <ToggleRight size={16} className="text-accent" />
                        ) : (
                          <ToggleLeft size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(d)}
                        className="p-1.5 rounded-lg hover:bg-[#F8F8FA] text-[#1A1033]/40 hover:text-blue-500 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-[#1A1033]/40 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {deals.length === 0 && (
          <div className="text-center py-12">
            <Zap className="w-10 h-10 text-[#1A1033]/10 mx-auto mb-3" />
            <p className="text-[#1A1033]/30 text-sm font-bold">Henüz fırsat yok</p>
          </div>
        )}
      </div>
    </div>
  );
}
