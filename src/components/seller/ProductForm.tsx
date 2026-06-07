import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Sparkles,
  ImageIcon,
  Loader2,
  AlertCircle,
  Zap,
  ChevronDown,
  GripVertical,
  RotateCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CategorySelect } from './CategorySelect';
import { cn } from '../../lib/utils';
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
  freeShipping: boolean;
  visibility: 'public' | 'hidden' | 'draft' | 'unlisted';
  metaDescription: string;
}

const EMPTY_FORM: ProductFormData = {
  title: '',
  brand: '',
  sku: '',
  categoryId: '',
  tags: [],
  description: '',
  longDescription: '',
  specifications: {},
  price: 0,
  oldPrice: undefined,
  currency: 'TRY',
  stock: 0,
  images: [],
  weight: 0,
  originCountry: 'Türkiye',
  hsCode: '',
  estimatedDeliveryDays: 3,
  deliveryTerms: '3-5 iş günü içinde kargo',
  returnPolicy: '14 gün iade hakkı',
  freeShipping: false,
  visibility: 'public',
  metaDescription: '',
};

type ProductFormField = keyof ProductFormData;

const QUICK_ADD_FIELDS = new Set<ProductFormField>([
  'title',
  'categoryId',
  'price',
  'stock',
  'images',
  'description',
]);

interface ProductFormProps {
  initial?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData, action: 'draft' | 'publish') => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

interface UploadFileState {
  id: string;
  name: string;
  preview: string;
  progress: number;
  error: string | null;
}

// ── SortableImage sub-component ──────────────────────────────────────────────

function SortableImage({
  id,
  url,
  index,
  onRemove,
}: {
  id: string;
  url: string;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 group"
    >
      {/* Drag handle — visible on hover (desktop only) */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-10 cursor-grab active:cursor-grabbing p-1 rounded bg-black/50 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity touch-none"
        title="Sürükleyerek sırala"
      >
        <GripVertical size={14} />
      </div>
      <img
        src={url}
        alt={`Ürün görseli ${index + 1}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1 end-1 bg-red-600/80 hover:bg-red-600 rounded-full p-1 z-10"
        title="Görseli kaldır"
      >
        <Trash2 size={10} className="text-white" />
      </button>
      {/* Order badge */}
      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded z-10">
        {index + 1}
      </span>
    </div>
  );
}

// ── Main ProductForm component ───────────────────────────────────────────────

export function ProductForm({ initial, onSubmit, onClose, isOpen }: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [aiLoading, setAiLoading] = useState<'desc' | 'meta' | 'image' | 'tags' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [quickAdd, setQuickAdd] = useState(true);
  const [uploadFiles, setUploadFiles] = useState<UploadFileState[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileMapRef = useRef<Map<string, File>>(new Map());

  // dnd-kit sensors: PointerSensor with distance constraint for touch safety
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const isUploading = uploadFiles.length > 0;

  // Revoke blob URLs on unmount / when uploadFiles change
  useEffect(() => {
    const currentPreviews = uploadFiles.map((f) => f.preview);
    return () => {
      currentPreviews.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [uploadFiles]);

  function update<K extends keyof ProductFormData>(key: K, val: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  // ── Multi-file upload with per-file progress ──────────────────────────────

  const handleImageUpload = useCallback(
    async (filesInput: FileList | File[]) => {
      const fileArray = Array.from(filesInput) as File[];
      if (!fileArray.length) return;

      // Reset the file input value so re-selecting the same files works
      if (fileRef.current) fileRef.current.value = '';

      // Create upload entries with blob preview URLs
      const entries: UploadFileState[] = fileArray.map((file, i) => {
        const id = `upload-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
        fileMapRef.current.set(id, file);
        return {
          id,
          name: file.name,
          preview: URL.createObjectURL(file),
          progress: 0,
          error: null,
        };
      });

      setUploadFiles((prev) => [...prev, ...entries]);

      // Track which entries were completed successfully
      const completedUrls: string[] = [];

      // Upload in parallel, tracking per-file progress
      await Promise.allSettled(
        entries.map(async (entry) => {
          const file = fileMapRef.current.get(entry.id);
          if (!file) return;

          // Simulated progress: incremental updates to 90%, then jump to 100% on completion
          const progressInterval = setInterval(() => {
            setUploadFiles((prev) =>
              prev.map((f) =>
                f.id === entry.id && f.progress < 85
                  ? { ...f, progress: f.progress + Math.random() * 12 + 3 }
                  : f,
              ),
            );
          }, 250);

          try {
            const url = await uploadImage(file, 'products');
            clearInterval(progressInterval);
            setUploadFiles((prev) =>
              prev.map((f) => (f.id === entry.id ? { ...f, progress: 100 } : f)),
            );
            completedUrls.push(url);
            fileMapRef.current.delete(entry.id);
            // Revoke the blob preview since we have the real URL
            URL.revokeObjectURL(entry.preview);
          } catch (err: any) {
            clearInterval(progressInterval);
            const firebaseErrorMap: Record<string, string> = {
              'storage/unauthorized': 'Resim yükleme izniniz yok. Lütfen tekrar giriş yapın.',
              'storage/canceled': 'Yükleme iptal edildi.',
              'storage/retry-limit-exceeded':
                'Yükleme zaman aşımına uğradı. Lütfen tekrar deneyin.',
              'storage/quota-exceeded': 'Depolama kotası aşıldı. Lütfen daha sonra tekrar deneyin.',
              'storage/invalid-format':
                'Desteklenmeyen dosya formatı. Lütfen PNG, JPG veya WEBP yükleyin.',
              'storage/unknown': 'Resim yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
            };
            const friendly =
              firebaseErrorMap[err?.code] || err?.message || 'Resim yüklenirken bir hata oluştu.';
            setUploadFiles((prev) =>
              prev.map((f) => (f.id === entry.id ? { ...f, progress: 0, error: friendly } : f)),
            );
          }
        }),
      );

      // Push completed URLs to form.images
      if (completedUrls.length > 0) {
        setForm((prev) => ({ ...prev, images: [...prev.images, ...completedUrls] }));
      }

      // Remove successfully uploaded entries from the queue (keep failed ones)
      setUploadFiles((prev) => prev.filter((f) => f.error !== null));
    },
    [], // no deps: uses functional state setters
  );

  // ── Retry a failed upload ─────────────────────────────────────────────────

  function retryUpload(entryId: string) {
    const file = fileMapRef.current.get(entryId);
    if (!file) {
      // File no longer available — remove the entry
      setUploadFiles((prev) => prev.filter((f) => f.id !== entryId));
      return;
    }
    handleImageUpload([file]);
    // Remove the old failed entry
    setUploadFiles((prev) => {
      const entry = prev.find((f) => f.id === entryId);
      if (entry?.preview) URL.revokeObjectURL(entry.preview);
      return prev.filter((f) => f.id !== entryId);
    });
  }

  // ── Handle file input change ──────────────────────────────────────────────

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleImageUpload(e.target.files);
    }
  }

  // ── dnd-kit drag end handler ──────────────────────────────────────────────

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Extract indices from sortable IDs ("img-0", "img-1", …)
    const oldIndex = parseInt(String(active.id).replace('img-', ''), 10);
    const newIndex = parseInt(String(over.id).replace('img-', ''), 10);
    if (isNaN(oldIndex) || isNaN(newIndex)) return;

    setForm((prev) => ({
      ...prev,
      images: arrayMove(prev.images, oldIndex, newIndex),
    }));
  }

  // ── Drop zone handlers ────────────────────────────────────────────────────

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files);
    }
  }

  // ── Existing helpers ──────────────────────────────────────────────────────

  function addTag() {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      update('tags', [...form.tags, t]);
      setTagInput('');
    }
  }

  function addSpec() {
    if (specKey.trim()) {
      update('specifications', { ...form.specifications, [specKey.trim()]: specVal.trim() });
      setSpecKey('');
      setSpecVal('');
    }
  }

  function validateForm(): boolean {
    // Client-side validation per UI-SPEC Surface 4 (D-11)
    const next: Record<string, string> = {};
    if (!form.images || form.images.length < 1) {
      next.images = 'At least 1 product photo is required';
    }
    if (!form.categoryId) {
      next.category = 'Please select a category';
    }
    if (!form.price || form.price <= 0) {
      next.price = 'Enter a valid price';
    }
    if (form.stock < 0) {
      next.stock = 'Stock cannot be negative';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(action: 'draft' | 'publish') {
    setServerError(null);
    if (!validateForm()) {
      // Scroll to top of the scrollable body so the banner/errors are visible
      document
        .querySelector('[data-product-form-body]')
        ?.scrollTo?.({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form, action);
      setErrors({});
    } catch (err: any) {
      setServerError(err?.message || 'Ürün kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative ms-auto w-full max-w-2xl h-full bg-zinc-900 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">
            {initial?.title ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Quick-Add Toggle */}
        <div className="flex-shrink-0 px-6 py-3 bg-zinc-800/80 border-b border-zinc-700/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuickAdd(true)}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5',
                quickAdd
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10'
                  : 'bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 border border-transparent',
              )}
            >
              <Zap size={14} />
              Hızlı Ekle
            </button>
            <button
              onClick={() => setQuickAdd(false)}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5',
                !quickAdd
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-sm shadow-purple-500/10'
                  : 'bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 border border-transparent',
              )}
            >
              <ChevronDown size={14} />
              Detaylı
            </button>
          </div>
          <p className="text-center text-xs text-zinc-500 mt-2 transition-colors">
            {quickAdd
              ? 'Sadece temel bilgilerle hızlıca ürün ekle'
              : 'Tüm alanları doldurarak detaylı ürün oluştur'}
          </p>
        </div>

        {/* Scrollable body */}
        <div
          data-product-form-body
          className="flex-1 overflow-y-auto px-6 max-sm:px-4 py-6 max-sm:pb-24 space-y-8"
        >
          {/* Server validation error banner */}
          {serverError && (
            <div className="bg-red-50 border-s-4 border-red-600 rounded-lg px-4 py-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-700">{serverError}</span>
            </div>
          )}

          {/* 1 — Temel Bilgiler */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
              Temel Bilgiler
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Ürün Adı *</label>
                <input
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="Ürün adını girin"
                />
              </div>
              <AnimatePresence>
                {!quickAdd && (
                  <motion.div
                    key="brand-sku"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Marka</label>
                        <input
                          value={form.brand}
                          onChange={(e) => update('brand', e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                          placeholder="Marka adı"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">SKU</label>
                        <input
                          value={form.sku}
                          onChange={(e) => update('sku', e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                          placeholder="Stok kodu"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* 2 — Kategori & Etiketler */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
              Kategori & Etiketler
            </h3>
            <div className={errors.category ? 'rounded-lg ring-2 ring-red-300' : ''}>
              <CategorySelect
                value={form.categoryId}
                onChange={(id) => {
                  update('categoryId', id);
                  if (errors.category) setErrors((e) => ({ ...e, category: '' }));
                }}
              />
            </div>
            {errors.category && (
              <p className="text-sm text-red-600 mt-1">Please select a category</p>
            )}
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
                      const newTags = tags.filter((t) => !existing.has(t));
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
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="Etiket yaz + Enter"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                >
                  <Plus size={14} className="text-white" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 bg-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() =>
                        update(
                          'tags',
                          form.tags.filter((t) => t !== tag),
                        )
                      }
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* 3 — Görseller (with dnd-kit sortable + drop zone) */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                Görseller
              </h3>
              <AnimatePresence>
                {!quickAdd && (
                  <motion.div
                    key="ai-image-btn"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Drop zone wrapper */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'rounded-lg border-2 border-dashed transition-all cursor-pointer',
                isDragOver
                  ? 'border-blue-400 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                  : 'border-zinc-600 hover:border-emerald-500',
                errors.images ? 'border-red-300' : '',
              )}
            >
              {/* Empty state: show upload prompt when no images and no uploads in progress */}
              {form.images.length === 0 && uploadFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <Upload
                    size={32}
                    className={cn(
                      'mb-3 transition-colors',
                      isDragOver ? 'text-blue-400' : 'text-zinc-500',
                    )}
                  />
                  <p className="text-sm text-zinc-400 mb-1">
                    Resimleri sürükleyip bırakın veya seçmek için tıklayın
                  </p>
                  <p className="text-xs text-zinc-600">PNG, JPG, WEBP — en az 1 görsel gerekli</p>
                </div>
              ) : (
                /* Image grid with dnd-kit sortable */
                <DndContext
                  sensors={sensors}
                  collisionDetection={undefined}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={form.images.map((_, i) => `img-${i}`)}
                    strategy={rectSortingStrategy}
                  >
                    <div
                      className="grid grid-cols-3 max-sm:grid-cols-3 gap-3 p-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Completed images — sortable */}
                      {form.images.map((url, i) => (
                        <SortableImage
                          key={`img-${i}`}
                          id={`img-${i}`}
                          url={url}
                          index={i}
                          onRemove={() =>
                            update(
                              'images',
                              form.images.filter((_, j) => j !== i),
                            )
                          }
                        />
                      ))}

                      {/* Uploading / failed entries — not sortable, show progress */}
                      {uploadFiles.map((entry) => (
                        <div
                          key={entry.id}
                          className={cn(
                            'relative aspect-square rounded-lg overflow-hidden bg-zinc-800',
                            entry.error && 'ring-2 ring-red-500',
                          )}
                        >
                          <img
                            src={entry.preview}
                            alt={entry.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Progress bar overlay (uploading) */}
                          {!entry.error && entry.progress < 100 && (
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                              <Loader2 size={20} className="animate-spin text-blue-400" />
                              <span className="text-xs text-white">
                                {Math.round(entry.progress)}%
                              </span>
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
                                <div
                                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                                  style={{ width: `${entry.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {/* Error state */}
                          {entry.error && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5 p-2">
                              <AlertCircle size={16} className="text-red-400" />
                              <span className="text-[10px] text-red-400 text-center leading-tight">
                                {entry.error}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  retryUpload(entry.id);
                                }}
                                className="flex items-center gap-1 px-2 py-1 bg-red-600/80 hover:bg-red-600 rounded text-[10px] text-white"
                              >
                                <RotateCw size={10} />
                                Tekrar Dene
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add more button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fileRef.current?.click();
                        }}
                        disabled={isUploading}
                        className="aspect-square max-sm:min-h-[120px] rounded-lg border-2 border-dashed border-zinc-600 hover:border-emerald-500 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-emerald-400 transition-colors disabled:opacity-50 bg-zinc-800/50"
                      >
                        <Upload size={20} />
                        <span className="text-xs">
                          {isUploading ? 'Yükleniyor...' : 'Görsel Ekle'}
                        </span>
                      </button>
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Drop zone hint bar (shown when images exist but not actively dragging) */}
              {form.images.length > 0 && !isDragOver && (
                <div className="border-t border-zinc-700/50 px-3 py-2 flex items-center gap-2 text-xs text-zinc-500">
                  <Upload size={12} />
                  <span>Resimleri sürükleyip bırakın veya sıralamak için tutup sürükleyin</span>
                </div>
              )}
              {isDragOver && form.images.length > 0 && (
                <div className="border-t border-blue-400/50 px-3 py-2 flex items-center gap-2 text-xs text-blue-400 bg-blue-500/5">
                  <Upload size={12} />
                  <span>Resimleri buraya bırakın</span>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onFileInputChange}
            />
            {errors.images && (
              <p className="text-sm text-red-600 mt-1">At least 1 product photo is required</p>
            )}
          </section>

          {/* 4 — Fiyat & Stok */}
          <section>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
              Fiyat & Stok
            </h3>
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Satış Fiyatı *</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) => update('price', parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                />
                {errors.price && <p className="text-sm text-red-600 mt-1">Enter a valid price</p>}
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Stok Adedi *</label>
                <input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => update('stock', parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                />
                {errors.stock && (
                  <p className="text-sm text-red-600 mt-1">Stock cannot be negative</p>
                )}
              </div>
            </div>
            <AnimatePresence>
              {!quickAdd && (
                <motion.div
                  key="advanced-pricing"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3 mt-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">
                        Eski Fiyat (indirim için)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={form.oldPrice ?? ''}
                        onChange={(e) =>
                          update(
                            'oldPrice',
                            e.target.value ? parseFloat(e.target.value) : undefined,
                          )
                        }
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Para Birimi</label>
                      <select
                        value={form.currency}
                        onChange={(e) => update('currency', e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                      >
                        <option value="TRY">TRY — Türk Lirası</option>
                        <option value="USD">USD — Dolar</option>
                        <option value="EUR">EUR — Euro</option>
                        <option value="GBP">GBP — Sterlin</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* 5 — Açıklamalar */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                Açıklamalar
              </h3>
              <AnimatePresence>
                {!quickAdd && (
                  <motion.div
                    key="ai-desc-btn"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <button
                      onClick={async () => {
                        setAiLoading('desc');
                        const result = await generateProductDescription(form);
                        if (result) {
                          if (!form.description) update('description', result.description);
                          if (!form.longDescription)
                            update('longDescription', result.longDescription);
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Kısa Açıklama *</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                  placeholder="Ürün özeti (AI ile oluşturmak için 'AI ile Oluştur' butonunu kullanın)"
                />
              </div>
              <AnimatePresence>
                {!quickAdd && (
                  <motion.div
                    key="long-desc"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Detaylı Açıklama</label>
                      <textarea
                        rows={5}
                        value={form.longDescription}
                        onChange={(e) => update('longDescription', e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                        placeholder="Tam ürün açıklaması, özellikler, kullanım talimatları..."
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* 6 — Teknik Özellikler */}
          <AnimatePresence>
            {!quickAdd && (
              <motion.section
                key="specs-section"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                  Teknik Özellikler
                </h3>
                <div className="flex gap-2 mb-2">
                  <input
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                    placeholder="Özellik (ör. Renk)"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                  <input
                    value={specVal}
                    onChange={(e) => setSpecVal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpec())}
                    placeholder="Değer (ör. Siyah)"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                  <button
                    onClick={addSpec}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                  >
                    <Plus size={14} className="text-white" />
                  </button>
                </div>
                {Object.entries(form.specifications).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between bg-zinc-800 px-3 py-2 rounded-lg mb-1 text-sm"
                  >
                    <span className="text-zinc-300">
                      <span className="text-zinc-500">{k}:</span> {v as string}
                    </span>
                    <button
                      onClick={() => {
                        const s = { ...form.specifications };
                        delete s[k];
                        update('specifications', s);
                      }}
                    >
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </motion.section>
            )}
          </AnimatePresence>

          {/* 7 — SEO */}
          <AnimatePresence>
            {!quickAdd && (
              <motion.section
                key="seo-section"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                    SEO
                  </h3>
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
                    <span
                      className={`ms-2 ${form.metaDescription.length > 160 ? 'text-red-400' : 'text-zinc-600'}`}
                    >
                      {form.metaDescription.length}/160
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={form.metaDescription}
                    onChange={(e) => update('metaDescription', e.target.value)}
                    maxLength={170}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white resize-none"
                    placeholder="Arama sonuçlarında görünen özet"
                  />
                  <p className="text-xs text-zinc-600 mt-1">
                    Boş bırakılırsa kısa açıklama kullanılır.
                  </p>
                </div>
                <div className="mt-3 p-3 bg-zinc-800 rounded-lg space-y-0.5">
                  <p className="text-xs text-blue-400 font-medium truncate">
                    {form.title || 'Ürün Adı'}
                  </p>
                  <p className="text-xs text-green-500 truncate">
                    benimolan.com/product/
                    {(form.title || 'urun')
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '')
                      .slice(0, 50)}
                  </p>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {form.metaDescription || form.description || 'Meta açıklama önizlemesi...'}
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* 8 — Kargo & Teslimat */}
          <AnimatePresence>
            {!quickAdd && (
              <motion.section
                key="shipping-section"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                  Kargo & Teslimat
                </h3>
                <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Ağırlık (kg)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.weight}
                      onChange={(e) => update('weight', parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Tahmini Teslimat (gün)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={form.estimatedDeliveryDays}
                      onChange={(e) =>
                        update('estimatedDeliveryDays', parseInt(e.target.value) || 3)
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Menşei Ülke</label>
                    <input
                      value={form.originCountry}
                      onChange={(e) => update('originCountry', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">HS Kodu</label>
                    <input
                      value={form.hsCode}
                      onChange={(e) => update('hsCode', e.target.value)}
                      placeholder="Gümrük tarifesi kodu"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
                <div className="space-y-3 mt-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Teslimat Koşulları</label>
                    <input
                      value={form.deliveryTerms}
                      onChange={(e) => update('deliveryTerms', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">İade Politikası</label>
                    <input
                      value={form.returnPolicy}
                      onChange={(e) => update('returnPolicy', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={form.freeShipping}
                      onChange={(e) => update('freeShipping', e.target.checked)}
                      className="w-4 h-4 accent-green-500"
                    />
                    <span className="text-sm text-white">
                      Ücretsiz kargo (bu üründe kargo ücreti alınmaz)
                    </span>
                  </label>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* 9 — Yayın Ayarları */}
          <AnimatePresence>
            {!quickAdd && (
              <motion.section
                key="publish-section"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                  Yayın Ayarları
                </h3>
                <select
                  value={form.visibility}
                  onChange={(e) =>
                    update('visibility', e.target.value as ProductFormData['visibility'])
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="public">Herkese Açık</option>
                  <option value="hidden">Gizli (Linki olanlar görür)</option>
                  <option value="draft">Taslak (Yalnızca ben)</option>
                </select>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Quick-add info bar */}
        {quickAdd && (
          <div className="flex-shrink-0 px-6 py-2.5 bg-amber-500/10 border-t border-amber-500/20">
            <div className="flex items-center justify-between">
              <p className="text-xs text-amber-400/80">
                Gelişmiş alanlar gizlendi — marka, SKU, etiketler, teknik özellikler, SEO, kargo ve
                yayın ayarları varsayılan değerlerle kaydedilecek.
              </p>
              <button
                onClick={() => setQuickAdd(false)}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex-shrink-0 ms-3 underline underline-offset-2"
              >
                Detaylı moda geç
              </button>
            </div>
          </div>
        )}

        {/* Footer (desktop only — hidden on mobile, sticky bar replaces it) */}
        <div className="max-sm:hidden border-t border-zinc-700 px-6 py-4 flex gap-3 flex-shrink-0">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={saving}
            className="flex-1 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg disabled:opacity-50"
          >
            {quickAdd ? 'Taslak Kaydet' : 'Taslak'}
          </button>
          <button
            onClick={() => handleSubmit('publish')}
            disabled={saving || !form.title || !form.price || !form.categoryId}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : quickAdd ? 'Hızlıca Yayınla' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
