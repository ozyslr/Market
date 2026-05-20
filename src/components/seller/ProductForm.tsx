import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Upload, Sparkles, ImageIcon, Loader2 } from 'lucide-react';
import { CategorySelect } from './CategorySelect';
import { uploadImage } from '../../lib/storage';
import {
  generateProductDescription,
  generateMetaDescription,
  generateProductImage,
  suggestTags,
} from '../../services/aiContentService';

export interface ProductFormData {
  title: string;
  brand: string;
  sku: string;
  categoryId: string;
  tags: string[];
  description: string;
  longDescription: string;
  specifications: Record<string, string>;
  price: number;
  oldPrice?: number;
  currency: string;
  stock: number;
  images: string[];
  weight: number;
  originCountry: string;
  hsCode: string;
  estimatedDeliveryDays: number;
  deliveryTerms: string;
  returnPolicy: string;
  visibility: 'public' | 'hidden' | 'draft' | 'unlisted';
  metaDescription: string;
}

const EMPTY_FORM: ProductFormData = {
  title: '', brand: '', sku: '', categoryId: '', tags: [],
  description: '', longDescription: '', specifications: {},
  price: 0, oldPrice: undefined, currency: 'TRY', stock: 0, images: [],
  weight: 0, originCountry: 'Türkiye', hsCode: '',
  estimatedDeliveryDays: 3,
  deliveryTerms: '3-5 iş günü içinde kargo',
  returnPolicy: '14 gün iade hakkı',
  visibility: 'public', metaDescription: '',
};

interface ProductFormProps {
  initial?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData, action: 'draft' | 'publish') => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

export function ProductForm({ initial, onSubmit, onClose, isOpen }: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>({ ...EMPTY_FORM, ...initial });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [aiLoading, setAiLoading] = useState<'desc' | 'meta' | 'image' | 'tags' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof ProductFormData>(key: K, val: ProductFormData[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []) as File[];
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadImage(f, 'products')));
      update('images', [...form.images, ...urls]);
    } finally { setUploading(false); }
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) { update('tags', [...form.tags, t]); setTagInput(''); }
  }

  function addSpec() {
    if (specKey.trim()) {
      update('specifications', { ...form.specifications, [specKey.trim()]: specVal.trim() });
      setSpecKey(''); setSpecVal('');
    }
  }

  async function handleSubmit(action: 'draft' | 'publish') {
    setSaving(true);
    try { await onSubmit(form, action); } finally { setSaving(false); }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl h-full bg-zinc-900 flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">
            {initial?.title ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={20} /></button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* 1 — Temel Bilgiler */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Temel Bilgiler</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Ürün Adı *</label>
                <input value={form.title} onChange={e => update('title', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="Ürün adını girin" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Marka</label>
                  <input value={form.brand} onChange={e => update('brand', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="Marka adı" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">SKU</label>
                  <input value={form.sku} onChange={e => update('sku', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="Stok kodu" />
                </div>
              </div>
            </div>
          </section>

          {/* 2 — Kategori & Etiketler */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Kategori & Etiketler</h3>
            <CategorySelect value={form.categoryId} onChange={id => update('categoryId', id)} />
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-zinc-400">Etiketler</label>
                <button
                  onClick={async () => {
                    setAiLoading('tags');
                    const tags = await suggestTags({
                      title: form.title,
                      brand: form.brand,
                      categoryId: form.categoryId,
                      description: form.description || form.title,
                    });
                    if (tags.length > 0) {
                      const existing = new Set(form.tags);
                      const newTags = tags.filter(t => !existing.has(t));
                      update('tags', [...form.tags, ...newTags]);
                    }
                    setAiLoading(null);
                  }}
                  disabled={aiLoading === 'tags' || !form.title}
                  className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 disabled:opacity-40"
                >
                  {aiLoading === 'tags' ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  AI Öner
                </button>
              </div>
              <div className="flex gap-2">
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="Etiket yaz + Enter" />
                <button onClick={addTag} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg">
                  <Plus size={14} className="text-white" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded-full">
                    {tag}
                    <button onClick={() => update('tags', form.tags.filter(t => t !== tag))}><X size={10} /></button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* 3 — Görseller */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Görseller</h3>
              <button
                onClick={async () => {
                  setAiLoading('image');
                  const imagePrompt = `${form.title}, ${form.brand}, ${form.tags.slice(0, 3).join(', ')}, ürün görseli, profesyonel fotoğraf, beyaz arka plan, yüksek kalite`;
                  const dataUrl = await generateProductImage(imagePrompt);
                  if (dataUrl) {
                    update('images', [...form.images, dataUrl]);
                  }
                  setAiLoading(null);
                }}
                disabled={aiLoading === 'image' || !form.title}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-all"
              >
                {aiLoading === 'image' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ImageIcon size={14} />
                )}
                AI Görsel Oluştur
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {form.images.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800">
                  <img src={url} alt="Ürün görseli" className="w-full h-full object-cover" loading="lazy" />
                  <button onClick={() => update('images', form.images.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 rounded-full p-1">
                    <Trash2 size={10} className="text-white" />
                  </button>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="aspect-square rounded-lg border-2 border-dashed border-zinc-600 hover:border-emerald-500 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-emerald-400 transition-colors disabled:opacity-50">
                <Upload size={20} />
                <span className="text-xs">{uploading ? 'Yükleniyor...' : 'Görsel Ekle'}</span>
              </button>
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
          </section>

          {/* 4 — Fiyat & Stok */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Fiyat & Stok</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Satış Fiyatı *</label>
                <input type="number" min={0} step={0.01} value={form.price}
                  onChange={e => update('price', parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Eski Fiyat (indirim için)</label>
                <input type="number" min={0} step={0.01} value={form.oldPrice ?? ''}
                  onChange={e => update('oldPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Stok Adedi *</label>
                <input type="number" min={0} value={form.stock}
                  onChange={e => update('stock', parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Para Birimi</label>
                <select value={form.currency} onChange={e => update('currency', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="TRY">TRY — Türk Lirası</option>
                  <option value="USD">USD — Dolar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — Sterlin</option>
                </select>
              </div>
            </div>
          </section>

          {/* 5 — Açıklamalar */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Açıklamalar</h3>
              <button
                onClick={async () => {
                  setAiLoading('desc');
                  const result = await generateProductDescription(form);
                  if (result) {
                    if (!form.description) update('description', result.description);
                    if (!form.longDescription) update('longDescription', result.longDescription);
                  }
                  setAiLoading(null);
                }}
                disabled={aiLoading === 'desc' || !form.title}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-all"
              >
                {aiLoading === 'desc' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                AI ile Oluştur
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Kısa Açıklama *</label>
                <textarea rows={3} value={form.description} onChange={e => update('description', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                  placeholder="Ürün özeti (AI ile oluşturmak için 'AI ile Oluştur' butonunu kullanın)" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Detaylı Açıklama</label>
                <textarea rows={5} value={form.longDescription} onChange={e => update('longDescription', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                  placeholder="Tam ürün açıklaması, özellikler, kullanım talimatları..." />
              </div>
            </div>
          </section>

          {/* 6 — Teknik Özellikler */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Teknik Özellikler</h3>
            <div className="flex gap-2 mb-2">
              <input value={specKey} onChange={e => setSpecKey(e.target.value)}
                placeholder="Özellik (ör. Renk)"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              <input value={specVal} onChange={e => setSpecVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpec())}
                placeholder="Değer (ör. Siyah)"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              <button onClick={addSpec} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg">
                <Plus size={14} className="text-white" />
              </button>
            </div>
            {Object.entries(form.specifications).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between bg-zinc-800 px-3 py-2 rounded-lg mb-1 text-sm">
                <span className="text-zinc-300"><span className="text-zinc-500">{k}:</span> {v as string}</span>
                <button onClick={() => {
                  const s = { ...form.specifications }; delete s[k]; update('specifications', s);
                }}><Trash2 size={12} className="text-red-400" /></button>
              </div>
            ))}
          </section>

          {/* 7 — SEO */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">SEO</h3>
              <button
                onClick={async () => {
                  setAiLoading('meta');
                  const meta = await generateMetaDescription(form);
                  if (meta) update('metaDescription', meta);
                  setAiLoading(null);
                }}
                disabled={aiLoading === 'meta' || !form.title}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-all"
              >
                {aiLoading === 'meta' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                AI Meta Oluştur
              </button>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Meta Açıklama
                <span className={`ml-2 ${form.metaDescription.length > 160 ? 'text-red-400' : 'text-zinc-600'}`}>
                  {form.metaDescription.length}/160
                </span>
              </label>
              <textarea rows={2} value={form.metaDescription}
                onChange={e => update('metaDescription', e.target.value)} maxLength={170}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                placeholder="Arama sonuçlarında görünen özet" />
              <p className="text-xs text-zinc-600 mt-1">Boş bırakılırsa kısa açıklama kullanılır.</p>
            </div>
            <div className="mt-3 p-3 bg-zinc-800 rounded-lg space-y-0.5">
              <p className="text-xs text-blue-400 font-medium truncate">{form.title || 'Ürün Adı'}</p>
              <p className="text-xs text-green-500 truncate">
                mercora.com/product/{(form.title || 'urun').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50)}
              </p>
              <p className="text-xs text-zinc-400 line-clamp-2">
                {form.metaDescription || form.description || 'Meta açıklama önizlemesi...'}
              </p>
            </div>
          </section>

          {/* 8 — Kargo & Teslimat */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Kargo & Teslimat</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Ağırlık (kg)</label>
                <input type="number" min={0} step={0.01} value={form.weight}
                  onChange={e => update('weight', parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Tahmini Teslimat (gün)</label>
                <input type="number" min={1} max={60} value={form.estimatedDeliveryDays}
                  onChange={e => update('estimatedDeliveryDays', parseInt(e.target.value) || 3)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Menşei Ülke</label>
                <input value={form.originCountry} onChange={e => update('originCountry', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">HS Kodu</label>
                <input value={form.hsCode} onChange={e => update('hsCode', e.target.value)}
                  placeholder="Gümrük tarifesi kodu"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
            </div>
            <div className="space-y-3 mt-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Teslimat Koşulları</label>
                <input value={form.deliveryTerms} onChange={e => update('deliveryTerms', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">İade Politikası</label>
                <input value={form.returnPolicy} onChange={e => update('returnPolicy', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
            </div>
          </section>

          {/* 9 — Yayın Ayarları */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">Yayın Ayarları</h3>
            <select value={form.visibility} onChange={e => update('visibility', e.target.value as ProductFormData['visibility'])}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="public">Herkese Açık</option>
              <option value="hidden">Gizli (Linki olanlar görür)</option>
              <option value="draft">Taslak (Yalnızca ben)</option>
            </select>
          </section>

        </div>

        {/* Footer */}
        <div className="border-t border-zinc-700 px-6 py-4 flex gap-3 flex-shrink-0">
          <button onClick={() => handleSubmit('draft')} disabled={saving}
            className="flex-1 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg disabled:opacity-50">
            Taslak Kaydet
          </button>
          <button onClick={() => handleSubmit('publish')}
            disabled={saving || !form.title || !form.price || !form.categoryId}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {saving ? 'Kaydediliyor...' : 'Onaya Gönder'}
          </button>
        </div>
      </div>
    </div>
  );
}
