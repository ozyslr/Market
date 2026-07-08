import React, { useState, useEffect } from 'react';
import {
  Save,
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Loader2,
  Check,
  Image,
  Link2,
} from 'lucide-react';
import { getSellerMenu, saveSellerMenu, type MenuItem } from '../services/sellerMenuService';
import { useAuth } from '../context/AuthContext';

export function SellerMenuEditor() {
  const { user } = useAuth();
  const sellerId = (user as any)?.sellerId || user?.id || '';
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSellerMenu(sellerId).then((m) => {
      setItems(m);
      setLoading(false);
    });
  }, [sellerId]);

  function addItem() {
    const id = crypto.randomUUID();
    setItems((prev) => [
      ...prev,
      { id, label: 'Yeni Menü', link: '/store/' + sellerId, order: prev.length + 1, enabled: true },
    ]);
  }

  function updateItem(id: string, field: keyof MenuItem, val: any) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: val } : i)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }
  function moveUp(idx: number) {
    if (idx === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((b, i) => ({ ...b, order: i + 1 }));
    });
  }
  function moveDown(idx: number) {
    if (idx === items.length - 1) return;
    setItems((prev) => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((b, i) => ({ ...b, order: i + 1 }));
    });
  }
  function toggleItem(idx: number) {
    setItems((prev) => prev.map((b, i) => (i === idx ? { ...b, enabled: !b.enabled } : b)));
  }

  async function handleSave() {
    setSaving(true);
    await saveSellerMenu(sellerId, items);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-primary uppercase">Menü Yönetimi</h1>
          <p className="text-xs text-brand-primary/40 mt-1">Mağaza menüsünü düzenle</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addItem}
            className="px-3 py-2.5 bg-accent text-white rounded-xl font-black text-xs uppercase flex items-center gap-1.5 hover:opacity-90"
          >
            <Plus size={14} /> Ekle
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 bg-brand-primary text-white rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-accent transition-all disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saved ? (
              <Check size={14} />
            ) : (
              <Save size={14} />
            )}
            {saved ? 'Kaydedildi' : 'Kaydet'}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl border bg-white',
              item.enabled ? 'border-brand-primary/10' : 'border-brand-primary/5 opacity-50',
            )}
          >
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                className="p-0.5 hover:bg-brand-secondary rounded disabled:opacity-20"
              >
                <ArrowUp size={12} />
              </button>
              <button
                onClick={() => moveDown(idx)}
                disabled={idx === items.length - 1}
                className="p-0.5 hover:bg-brand-secondary rounded disabled:opacity-20"
              >
                <ArrowDown size={12} />
              </button>
            </div>
            <GripVertical size={16} className="text-brand-primary/20" />
            <input
              type="text"
              value={item.label}
              onChange={(e) => updateItem(item.id, 'label', e.target.value)}
              className="flex-1 px-3 py-2 bg-brand-secondary/30 rounded-lg border-0 text-sm font-bold outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="relative w-40">
              <Link2
                size={12}
                className="absolute start-2.5 top-1/2 -translate-y-1/2 text-brand-primary/20"
              />
              <input
                type="text"
                value={item.link}
                onChange={(e) => updateItem(item.id, 'link', e.target.value)}
                className="w-full ps-8 pe-2 py-2 bg-brand-secondary/30 rounded-lg border-0 text-xs outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <input
              type="text"
              value={item.imageUrl || ''}
              onChange={(e) => updateItem(item.id, 'imageUrl', e.target.value)}
              placeholder="Görsel URL"
              className="w-32 px-2 py-2 bg-brand-secondary/30 rounded-lg border-0 text-xs outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={() => toggleItem(idx)}
              className={cn(
                'px-2 py-1 rounded text-[10px] font-bold',
                item.enabled ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-400',
              )}
            >
              {item.enabled ? 'Aktif' : 'Pasif'}
            </button>
            <button
              onClick={() => removeItem(item.id)}
              className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
function cn(...args: any[]) {
  return args.filter(Boolean).join(' ');
}
