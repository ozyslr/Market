import React, { useState, useEffect } from 'react';
import { Save, GripVertical, Eye, EyeOff, ArrowUp, ArrowDown, Loader2, Check, Zap, Award, Megaphone, Grid, Image, Package } from 'lucide-react';
import { getContentBlocks, saveContentBlocks, type ContentBlock } from '../services/storeContentService';
import { useAuth } from '../context/AuthContext';

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  flash_products: <Zap size={16} />,
  trending_products: <Award size={16} />,
  campaign_banner: <Megaphone size={16} />,
  category_cards: <Grid size={16} />,
  promo_banner: <Image size={16} />,
  product_grid: <Package size={16} />,
};

export function StoreBlocksEditor() {
  const { user } = useAuth();
  const sellerId = (user as any)?.sellerId || user?.id || '';
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { getContentBlocks(sellerId).then((b) => { setBlocks(b); setLoading(false); }); }, [sellerId]);

  function moveUp(idx: number) { if (idx === 0) return; setBlocks((prev) => { const next = [...prev]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; return next.map((b, i) => ({ ...b, order: i + 1 })); }); }
  function moveDown(idx: number) { if (idx === blocks.length - 1) return; setBlocks((prev) => { const next = [...prev]; [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]; return next.map((b, i) => ({ ...b, order: i + 1 })); }); }
  function toggleBlock(idx: number) { setBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, enabled: !b.enabled } : b)); }

  async function handleSave() {
    setSaving(true);
    await saveContentBlocks(sellerId, blocks);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 size={28} className="animate-spin text-accent" /></div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-primary uppercase">Mağaza Blokları</h1>
          <p className="text-xs text-brand-primary/40 mt-1">Sayfa bloklarını sırala, aktif/pasif yap</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2.5 bg-brand-primary text-white rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-accent transition-all disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? 'Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      <div className="space-y-2">
        {blocks.map((block, idx) => (
          <div key={block.id} className={cn('flex items-center gap-3 p-4 rounded-xl border transition-all', block.enabled ? 'bg-white border-brand-primary/10' : 'bg-brand-secondary/30 border-brand-primary/5 opacity-50')}>
            <div className="flex flex-col gap-1">
              <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-0.5 hover:bg-brand-secondary rounded disabled:opacity-20"><ArrowUp size={12} /></button>
              <button onClick={() => moveDown(idx)} disabled={idx === blocks.length - 1} className="p-0.5 hover:bg-brand-secondary rounded disabled:opacity-20"><ArrowDown size={12} /></button>
            </div>
            <GripVertical size={18} className="text-brand-primary/20 shrink-0" />
            <div className="w-8 h-8 rounded-lg bg-brand-secondary flex items-center justify-center text-brand-primary shrink-0">
              {BLOCK_ICONS[block.type] || <Package size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-brand-primary">{block.title}</p>
              <p className="text-[10px] text-brand-primary/40 uppercase">{block.type.replace(/_/g, ' ')} · Sıra {block.order}</p>
            </div>
            <button onClick={() => toggleBlock(idx)} className="p-2 rounded-lg hover:bg-brand-secondary transition-all" title={block.enabled ? 'Pasif yap' : 'Aktif yap'}>
              {block.enabled ? <Eye size={16} className="text-green-500" /> : <EyeOff size={16} className="text-brand-primary/20" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function cn(...args: any[]) { return args.filter(Boolean).join(' '); }
