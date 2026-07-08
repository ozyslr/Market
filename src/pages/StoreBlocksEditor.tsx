import React, { useState, useEffect, useCallback } from 'react';
import {
  Save,
  GripVertical,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Loader2,
  Check,
  ChevronDown,
  ChevronRight,
  Zap,
  Award,
  Megaphone,
  Grid,
  Image,
  Package,
  Monitor,
  MonitorOff,
  ExternalLink,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getContentBlocks,
  saveContentBlocks,
  type ContentBlock,
} from '../services/storeContentService';
import { useAuth } from '../context/AuthContext';

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  flash_products: <Zap size={16} />,
  trending_products: <Award size={16} />,
  campaign_banner: <Megaphone size={16} />,
  category_cards: <Grid size={16} />,
  promo_banner: <Image size={16} />,
  product_grid: <Package size={16} />,
};

/* ──────────────────────────────────────────────
   Sortable Block Item (drag handle + arrows)
   ────────────────────────────────────────────── */
interface SortableBlockItemProps {
  block: ContentBlock;
  index: number;
  total: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleEnabled: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: React.ReactNode;
}

function SortableBlockItem({
  block,
  index,
  total,
  isExpanded,
  onToggleExpand,
  onToggleEnabled,
  onMoveUp,
  onMoveDown,
  children,
}: SortableBlockItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'border transition-all rounded-xl overflow-hidden',
        block.enabled ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/50 border-gray-800 opacity-60',
      )}
    >
      {/* Header Row */}
      <div className="flex items-center gap-3 p-4">
        {/* Arrow buttons (a11y fallback) */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-0.5 hover:bg-gray-700 rounded disabled:opacity-20 text-gray-400"
            aria-label="Yukarı taşı"
          >
            <ArrowUp size={12} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-0.5 hover:bg-gray-700 rounded disabled:opacity-20 text-gray-400"
            aria-label="Aşağı taşı"
          >
            <ArrowDown size={12} />
          </button>
        </div>

        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 shrink-0 touch-none"
          aria-label="Sürükle"
        >
          <GripVertical size={18} />
        </button>

        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-300 shrink-0">
          {BLOCK_ICONS[block.type] || <Package size={16} />}
        </div>

        {/* Title + Type */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-100">{block.title}</p>
          <p className="text-[10px] text-gray-500 uppercase">
            {block.type.replace(/_/g, ' ')} &middot; Sıra {block.order}
          </p>
        </div>

        {/* Enable / Disable */}
        <button
          onClick={onToggleEnabled}
          className="p-2 rounded-lg hover:bg-gray-700 transition-all shrink-0"
          title={block.enabled ? 'Pasif yap' : 'Aktif yap'}
        >
          {block.enabled ? (
            <Eye size={16} className="text-green-400" />
          ) : (
            <EyeOff size={16} className="text-gray-600" />
          )}
        </button>

        {/* Expand chevron */}
        <button
          onClick={onToggleExpand}
          className="p-2 rounded-lg hover:bg-gray-700 transition-all shrink-0 text-gray-400"
          title={isExpanded ? 'Daralt' : 'Düzenle'}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Expanded Config Panel */}
      {isExpanded && <div className="px-4 pb-4 border-t border-gray-800 pt-3">{children}</div>}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Block Config Editor (per type)
   ────────────────────────────────────────────── */
interface BlockConfigEditorProps {
  block: ContentBlock;
  onChange: (config: Record<string, any>) => void;
}

function BlockConfigEditor({ block, onChange }: BlockConfigEditorProps) {
  const config = block.config || {};

  function set<K extends string>(key: K, value: any) {
    onChange({ ...config, [key]: value });
  }

  const renderField = (label: string, key: string, value: any, placeholder?: string) => (
    <div key={key} className="mb-3">
      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">{label}</label>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-primary/50"
      />
    </div>
  );

  const renderNumberField = (label: string, key: string, value: any, min = 1, max = 100) => (
    <div key={key} className="mb-3">
      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">{label}</label>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => set(key, Number(e.target.value) || min)}
        min={min}
        max={max}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-primary/50"
      />
    </div>
  );

  switch (block.type) {
    case 'promo_banner':
      return (
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">
            Promosyon Banner Ayarları
          </p>
          {renderField('Sol Başlık', 'leftTitle', config.leftTitle, 'İlkbahar Koleksiyonu')}
          {renderField('Sol Açıklama', 'leftDesc', config.leftDesc, '%50 indirim')}
          {renderField('Sol Link URL', 'leftLink', config.leftLink, '/koleksiyon')}
          {renderField('Sağ Başlık', 'rightTitle', config.rightTitle, 'Premium Ürünler')}
          {renderField('Sağ Açıklama', 'rightDesc', config.rightDesc, 'Özel fiyatlar')}
          {renderField('Sağ Link URL', 'rightLink', config.rightLink, '/premium')}
          {renderField('Banner Görsel URL (Sol)', 'leftImage', config.leftImage, 'https://...')}
          {renderField('Banner Görsel URL (Sağ)', 'rightImage', config.rightImage, 'https://...')}
        </div>
      );

    case 'product_grid':
      return (
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Ürün Grid Ayarları</p>
          {renderField('Başlık', 'title', config.title, 'Daha Fazla Ürün')}
          {renderField('Kategori Filtresi (ID)', 'categoryId', config.categoryId, 'opsiyonel')}
          {renderNumberField('Maks. Ürün Sayısı', 'pageSize', config.pageSize ?? 12, 1, 50)}
        </div>
      );

    case 'flash_products':
      return (
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Flaş Ürün Ayarları</p>
          {renderField('Başlık', 'title', config.title, 'Flaş Ürünler')}
          {renderNumberField('Maks. Ürün Sayısı', 'maxItems', config.maxItems ?? 8, 1, 50)}
          {renderField('Kategori Filtresi (ID)', 'categoryId', config.categoryId, 'opsiyonel')}
        </div>
      );

    case 'campaign_banner':
      return (
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">
            Kampanya Banner Ayarları
          </p>
          {renderField('Başlık', 'title', config.title, 'Sezonun En İyi Fırsatları')}
          {renderField('Açıklama', 'description', config.description, 'Özel indirimler...')}
          {renderField('Görsel URL', 'imageUrl', config.imageUrl, 'https://...')}
          {renderField('Link URL', 'linkUrl', config.linkUrl, '/kampanyalar')}
        </div>
      );

    case 'trending_products':
      return (
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Trend Ürün Ayarları</p>
          {renderField('Başlık', 'title', config.title, 'Trend Ürünler')}
          {renderNumberField('Maks. Ürün Sayısı', 'maxItems', config.maxItems ?? 8, 1, 50)}
        </div>
      );

    case 'category_cards':
      return (
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">
            Kategori Kartları Ayarları
          </p>
          {renderField('Başlık', 'title', config.title, 'Kategoriler')}
          {renderNumberField('Maks. Kategori', 'maxCategories', config.maxCategories ?? 6, 2, 20)}
        </div>
      );

    default:
      return (
        <p className="text-xs text-gray-500 italic">
          Bu blok tipi için düzenleme paneli henüz eklenmedi.
        </p>
      );
  }
}

/* ──────────────────────────────────────────────
   Live Preview (simplified block rendering)
   ────────────────────────────────────────────── */
function BlockPreview({ blocks }: { blocks: ContentBlock[] }) {
  const enabled = blocks.filter((b) => b.enabled);

  if (enabled.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-12">Goruntulenecek aktif blok yok.</p>
    );
  }

  return (
    <div className="space-y-4">
      {enabled.map((block) => (
        <div key={block.id}>{renderPreviewBlock(block)}</div>
      ))}
    </div>
  );
}

function renderPreviewBlock(block: ContentBlock) {
  const cfg = block.config || {};

  switch (block.type) {
    case 'promo_banner':
      return (
        <div className="grid grid-cols-2 gap-3">
          {/* Left promo */}
          <div className="relative rounded-xl overflow-hidden bg-gray-800 border border-gray-700 p-4 min-h-[100px] flex flex-col justify-end">
            <p className="text-xs font-bold text-gray-100">{cfg.leftTitle || 'Koleksiyon'}</p>
            <p className="text-[10px] text-gray-400">{cfg.leftDesc || 'İndirim'}</p>
            {cfg.leftLink && (
              <span className="text-[10px] text-brand-primary mt-1 flex items-center gap-1">
                <ExternalLink size={10} /> İncele
              </span>
            )}
          </div>
          {/* Right promo */}
          <div className="relative rounded-xl overflow-hidden bg-gray-800 border border-gray-700 p-4 min-h-[100px] flex flex-col justify-end">
            <p className="text-xs font-bold text-gray-100">{cfg.rightTitle || 'Premium'}</p>
            <p className="text-[10px] text-gray-400">{cfg.rightDesc || 'Özel fiyatlar'}</p>
            {cfg.rightLink && (
              <span className="text-[10px] text-brand-primary mt-1 flex items-center gap-1">
                <ExternalLink size={10} /> İncele
              </span>
            )}
          </div>
        </div>
      );

    case 'product_grid':
      return (
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2">
            <Package size={14} className="inline mr-1" />
            {cfg.title || block.title}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: Math.min(cfg.pageSize || 6, 6) }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg bg-gray-800 border border-gray-700 p-3 aspect-square flex flex-col items-center justify-center gap-1"
              >
                <div className="w-8 h-8 rounded bg-gray-700" />
                <div className="w-12 h-2 rounded bg-gray-700" />
                <div className="w-8 h-2 rounded bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'flash_products':
      return (
        <div className="rounded-xl bg-red-950/30 border border-red-900/40 p-4">
          <h3 className="text-sm font-bold text-red-300 mb-2 flex items-center gap-1">
            <Zap size={14} /> {cfg.title || block.title}
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {Array.from({ length: Math.min(cfg.maxItems || 4, 4) }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[100px] rounded-lg bg-gray-800 border border-gray-700 p-2"
              >
                <div className="w-full aspect-square rounded bg-gray-700 mb-2" />
                <div className="w-16 h-2 rounded bg-gray-700 mb-1" />
                <div className="w-12 h-2 rounded bg-gray-700" />
                <div className="w-10 h-3 rounded bg-red-700/50 mt-1" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'campaign_banner':
      return (
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-brand-primary/20 to-accent/20 border border-brand-primary/20 p-5 min-h-[120px] flex flex-col justify-center">
          <h3 className="text-base font-black text-gray-100">{cfg.title || block.title}</h3>
          {cfg.description && <p className="text-xs text-gray-400 mt-1">{cfg.description}</p>}
          {cfg.linkUrl && (
            <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-brand-primary">
              Keşfet <ExternalLink size={10} />
            </span>
          )}
        </div>
      );

    case 'trending_products':
      return (
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1">
            <Award size={14} /> {cfg.title || block.title}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: Math.min(cfg.maxItems || 6, 6) }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg bg-gray-800 border border-gray-700 p-3 aspect-square flex flex-col items-center justify-center gap-1"
              >
                <div className="w-8 h-8 rounded bg-gray-700" />
                <div className="w-12 h-2 rounded bg-gray-700" />
                <div className="w-8 h-2 rounded bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'category_cards':
      return (
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1">
            <Grid size={14} /> {cfg.title || block.title}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: Math.min(cfg.maxCategories || 6, 6) }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg bg-gray-800 border border-gray-700 p-3 aspect-square flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-6 h-6 rounded-full bg-gray-700 mx-auto mb-2" />
                  <div className="w-10 h-2 rounded bg-gray-700 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div className="rounded-xl bg-gray-800 border border-gray-700 p-4 text-center">
          <p className="text-xs text-gray-500">{block.title}</p>
        </div>
      );
  }
}

/* ──────────────────────────────────────────────
   Main Editor Component
   ────────────────────────────────────────────── */
export function StoreBlocksEditor() {
  const { user } = useAuth();
  const sellerId = (user as any)?.sellerId || user?.id || '';
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  /* dnd-kit sensors */
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    getContentBlocks(sellerId).then((b) => {
      setBlocks(b);
      setLoading(false);
    });
  }, [sellerId]);

  /* Drag end handler */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBlocks((prev) => {
      const oldIdx = prev.findIndex((b) => b.id === active.id);
      const newIdx = prev.findIndex((b) => b.id === over.id);
      const reordered = arrayMove(prev, oldIdx, newIdx);
      return reordered.map((b, i) => ({ ...b, order: i + 1 }));
    });
  }, []);

  /* Arrow button handlers (keep for a11y) */
  const moveUp = useCallback((idx: number) => {
    if (idx === 0) return;
    setBlocks((prev) => {
      const next = arrayMove(prev, idx, idx - 1);
      return next.map((b, i) => ({ ...b, order: i + 1 }));
    });
  }, []);

  const moveDown = useCallback((idx: number) => {
    setBlocks((prev) => {
      if (idx === prev.length - 1) return prev;
      const next = arrayMove(prev, idx, idx + 1);
      return next.map((b, i) => ({ ...b, order: i + 1 }));
    });
  }, []);

  function toggleEnabled(idx: number) {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, enabled: !b.enabled } : b)));
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function updateBlockConfig(id: string, config: Record<string, any>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, config } : b)));
  }

  async function handleSave() {
    setSaving(true);
    await saveContentBlocks(sellerId, blocks);
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

  const blockIds = blocks.map((b) => b.id);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-100 uppercase">Magaza Bloklari</h1>
          <p className="text-xs text-gray-500 mt-1">
            Surukle-birak ile siralayin, blok ayarlarini duzenleyin
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Preview Toggle */}
          <button
            onClick={() => setShowPreview((p) => !p)}
            className={cn(
              'px-3 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-all border',
              showPreview
                ? 'bg-brand-primary/20 border-brand-primary/40 text-brand-primary'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200',
            )}
          >
            {showPreview ? <Monitor size={14} /> : <MonitorOff size={14} />}
            Onizleme
          </button>
          {/* Save */}
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

      {/* Preview Mode */}
      {showPreview && (
        <div className="rounded-xl border border-gray-700 bg-gray-950 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={16} className="text-brand-primary" />
            <h2 className="text-sm font-black text-gray-300 uppercase">Onizleme</h2>
            <span className="text-[10px] text-gray-600 ml-auto">
              Magaza sayfasinda bu sekilde gorunecek
            </span>
          </div>
          <BlockPreview blocks={blocks} />
        </div>
      )}

      {/* Sortable Block List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {blocks.map((block, idx) => (
              <SortableBlockItem
                key={block.id}
                block={block}
                index={idx}
                total={blocks.length}
                isExpanded={expandedId === block.id}
                onToggleExpand={() => toggleExpand(block.id)}
                onToggleEnabled={() => toggleEnabled(idx)}
                onMoveUp={() => moveUp(idx)}
                onMoveDown={() => moveDown(idx)}
              >
                <BlockConfigEditor
                  block={block}
                  onChange={(config) => updateBlockConfig(block.id, config)}
                />
              </SortableBlockItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function cn(...args: any[]) {
  return args.filter(Boolean).join(' ');
}
