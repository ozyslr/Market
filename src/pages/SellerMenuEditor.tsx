import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ChevronRight,
  ChevronDown,
  Upload,
  FolderPlus,
  ArrowLeft,
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
import { getSellerMenu, saveSellerMenu, type MenuItem } from '../services/sellerMenuService';
import { useAuth } from '../context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

/* ── helpers ──────────────────────────────────── */

function cn(...args: any[]) {
  return args.filter(Boolean).join(' ');
}

async function resizeImage(file: File, maxSize = 200): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
    };
    img.src = url;
  });
}

/* ── tree utils ───────────────────────────────── */

function findInTree(items: MenuItem[], id: string): MenuItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const f = findInTree(item.children, id);
      if (f) return f;
    }
  }
  return null;
}

function updateInTree(items: MenuItem[], id: string, patch: Partial<MenuItem>): MenuItem[] {
  return items.map((item) => {
    if (item.id === id) return { ...item, ...patch };
    if (item.children) return { ...item, children: updateInTree(item.children, id, patch) };
    return item;
  });
}

function addChildInTree(items: MenuItem[], parentId: string, child: MenuItem): MenuItem[] {
  return items.map((item) => {
    if (item.id === parentId) {
      const children = [...(item.children || []), child];
      return { ...item, children };
    }
    if (item.children) return { ...item, children: addChildInTree(item.children, parentId, child) };
    return item;
  });
}

function removeFromTree(items: MenuItem[], id: string): MenuItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) => {
      if (item.children) return { ...item, children: removeFromTree(item.children, id) };
      return item;
    });
}

function replaceChildren(items: MenuItem[], parentId: string, children: MenuItem[]): MenuItem[] {
  return items.map((item) => {
    if (item.id === parentId) return { ...item, children };
    if (item.children)
      return { ...item, children: replaceChildren(item.children, parentId, children) };
    return item;
  });
}

function getChildrenOf(items: MenuItem[], parentId: string | null): MenuItem[] {
  if (parentId === null) return items;
  const parent = findInTree(items, parentId);
  return parent?.children || [];
}

function buildBreadcrumb(items: MenuItem[], parentId: string): { id: string; label: string }[] {
  const crumbs: { id: string; label: string }[] = [];
  function walk(list: MenuItem[], target: string, path: { id: string; label: string }[]): boolean {
    for (const item of list) {
      if (item.id === target) {
        crumbs.push(...path, { id: item.id, label: item.label });
        return true;
      }
      if (
        item.children &&
        walk(item.children, target, [...path, { id: item.id, label: item.label }])
      ) {
        return true;
      }
    }
    return false;
  }
  walk(items, parentId, []);
  return crumbs;
}

/* ── sortable item ────────────────────────────── */

interface SortableMenuItemProps {
  item: MenuItem;
  index: number;
  total: number;
  isExpanded: boolean;
  isChildrenExpanded: boolean;
  uploading: boolean;
  onToggleExpand: () => void;
  onToggleChildrenExpand: () => void;
  onToggleEnabled: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdateLabel: (v: string) => void;
  onUpdateLink: (v: string) => void;
  onUploadImage: (file: File) => void;
  onRemoveImage: () => void;
  onAddChild: () => void;
  onEditChildren: () => void;
  onRemove: () => void;
  childCount: number;
}

function SortableMenuItem({
  item,
  index,
  total,
  isExpanded,
  isChildrenExpanded,
  uploading,
  onToggleExpand,
  onToggleChildrenExpand,
  onToggleEnabled,
  onMoveUp,
  onMoveDown,
  onUpdateLabel,
  onUpdateLink,
  onUploadImage,
  onRemoveImage,
  onAddChild,
  onEditChildren,
  onRemove,
  childCount,
}: SortableMenuItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : undefined,
  };

  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          'flex items-center gap-2 p-3 rounded-xl border transition-all',
          'bg-gray-900 border-gray-700',
          !item.enabled && 'opacity-50',
        )}
      >
        {/* arrow buttons (a11y fallback) */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-0.5 hover:bg-gray-700 rounded disabled:opacity-20 text-gray-400"
            aria-label="Yukarı taşı"
          >
            <ArrowUp size={11} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-0.5 hover:bg-gray-700 rounded disabled:opacity-20 text-gray-400"
            aria-label="Aşağı taşı"
          >
            <ArrowDown size={11} />
          </button>
        </div>

        {/* drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 shrink-0 touch-none"
          aria-label="Sürükle"
        >
          <GripVertical size={16} />
        </button>

        {/* image */}
        <div className="relative shrink-0">
          {item.imageUrl ? (
            <div className="relative group">
              <img
                src={item.imageUrl}
                alt=""
                className="w-9 h-9 rounded-lg object-cover border border-gray-600"
              />
              <button
                onClick={onRemoveImage}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-[9px]"
                title="Görseli kaldır"
              >
                x
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-9 h-9 rounded-lg border border-dashed border-gray-600 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-300 transition-all"
              title="Görsel yükle"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadImage(f);
              if (fileRef.current) fileRef.current.value = '';
            }}
          />
        </div>

        {/* label */}
        <input
          type="text"
          value={item.label}
          onChange={(e) => onUpdateLabel(e.target.value)}
          className="flex-1 min-w-0 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm font-bold text-gray-100 outline-none focus:border-brand-primary/50"
        />

        {/* link */}
        <div className="relative w-36 shrink-0">
          <Link2 size={11} className="absolute start-2 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={item.link}
            onChange={(e) => onUpdateLink(e.target.value)}
            className="w-full ps-7 pe-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-[11px] text-gray-300 outline-none focus:border-brand-primary/50"
          />
        </div>

        {/* add child */}
        <button
          onClick={onAddChild}
          className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-brand-primary transition-all shrink-0"
          title="Alt menü ekle"
        >
          <FolderPlus size={14} />
        </button>

        {/* expand children toggle */}
        {childCount > 0 && (
          <button
            onClick={onToggleChildrenExpand}
            className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 shrink-0"
            title={isChildrenExpanded ? 'Daralt' : 'Genişlet'}
          >
            {isChildrenExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}

        {/* edit children link */}
        {childCount > 0 && (
          <button
            onClick={onEditChildren}
            className="text-[10px] font-bold text-brand-primary hover:underline shrink-0"
          >
            {childCount} alt
          </button>
        )}

        {/* enabled toggle */}
        <button
          onClick={onToggleEnabled}
          className={cn(
            'px-2 py-1 rounded text-[10px] font-bold shrink-0',
            item.enabled
              ? 'bg-green-900/40 text-green-400 border border-green-800/50'
              : 'bg-gray-800 text-gray-500 border border-gray-700',
          )}
        >
          {item.enabled ? 'Aktif' : 'Pasif'}
        </button>

        {/* delete */}
        <button
          onClick={onRemove}
          className="p-1.5 hover:bg-red-900/30 rounded-lg text-red-400 shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* expanded children (inline preview) */}
      {isChildrenExpanded && childCount > 0 && item.children && (
        <div className="ml-8 mt-1 space-y-1 border-l-2 border-gray-700 pl-4 py-1">
          {item.children.map((child) => (
            <div
              key={child.id}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs',
                'bg-gray-800/50 border border-gray-700/50',
                !child.enabled && 'opacity-40',
              )}
            >
              {child.imageUrl && (
                <img src={child.imageUrl} alt="" className="w-5 h-5 rounded object-cover" />
              )}
              <span className="font-bold text-gray-300">{child.label}</span>
              <span className="text-gray-500 truncate">{child.link}</span>
              {child.children && child.children.length > 0 && (
                <span className="text-[10px] text-brand-primary ml-auto">
                  +{child.children.length}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── main editor ──────────────────────────────── */

export function SellerMenuEditor() {
  const { user } = useAuth();
  const sellerId = (user as any)?.sellerId || user?.id || '';
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  /* "editingParentId" = null -> root items; string -> children of that item */
  const [editingParentId, setEditingParentId] = useState<string | null>(null);

  /* dnd-kit */
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  /* load */
  useEffect(() => {
    getSellerMenu(sellerId).then((m) => {
      setItems(m);
      setLoading(false);
    });
  }, [sellerId]);

  /* derived: items at current editing level */
  const currentItems = getChildrenOf(items, editingParentId);

  /* breadcrumb */
  const breadcrumb = editingParentId
    ? [{ id: '__root', label: 'Ana Menü' }, ...buildBreadcrumb(items, editingParentId)]
    : [{ id: '__root', label: 'Ana Menü' }];

  /* ── actions on current level ───────────────── */

  const addItem = useCallback(() => {
    const id = crypto.randomUUID();
    const newItem: MenuItem = {
      id,
      label: 'Yeni Menü',
      link: '/store/' + sellerId,
      order: currentItems.length + 1,
      enabled: true,
    };
    if (editingParentId === null) {
      setItems((prev) => [...prev, newItem]);
    } else {
      setItems((prev) => addChildInTree(prev, editingParentId, newItem));
    }
  }, [currentItems.length, editingParentId, sellerId]);

  /* drag end */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const list = currentItems;
      const oldIdx = list.findIndex((i) => i.id === active.id);
      const newIdx = list.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(list, oldIdx, newIdx).map((it, i) => ({ ...it, order: i + 1 }));

      if (editingParentId === null) {
        setItems(reordered);
      } else {
        setItems((prev) => replaceChildren(prev, editingParentId, reordered));
      }
    },
    [currentItems, editingParentId],
  );

  /* arrow fallback move */
  const moveItem = useCallback(
    (idx: number, dir: -1 | 1) => {
      const list = [...currentItems];
      const target = idx + dir;
      if (target < 0 || target >= list.length) return;
      const reordered = arrayMove(list, idx, target).map((it, i) => ({ ...it, order: i + 1 }));
      if (editingParentId === null) {
        setItems(reordered);
      } else {
        setItems((prev) => replaceChildren(prev, editingParentId, reordered));
      }
    },
    [currentItems, editingParentId],
  );

  /* update a field */
  const updateField = useCallback((id: string, field: keyof MenuItem, val: any) => {
    setItems((prev) => updateInTree(prev, id, { [field]: val }));
  }, []);

  /* toggle enabled */
  const toggleEnabled = useCallback((id: string) => {
    setItems((prev) => updateInTree(prev, id, { enabled: !findInTree(prev, id)?.enabled }));
  }, []);

  /* add child (navigate into) */
  const addChild = useCallback(
    (parentId: string) => {
      const id = crypto.randomUUID();
      const parent = findInTree(items, parentId);
      const childCount = parent?.children?.length || 0;
      const child: MenuItem = {
        id,
        label: 'Yeni Alt Menü',
        link: parent?.link || '/store/' + sellerId,
        order: childCount + 1,
        enabled: true,
      };
      setItems((prev) => addChildInTree(prev, parentId, child));
      /* navigate into parent to edit children */
      setEditingParentId(parentId);
    },
    [items, sellerId],
  );

  /* navigate to children editing */
  const editChildren = useCallback((parentId: string) => {
    setEditingParentId(parentId);
  }, []);

  /* go to root */
  const goToRoot = useCallback(() => {
    setEditingParentId(null);
  }, []);

  /* go to specific breadcrumb */
  const goToCrumb = useCallback((crumbId: string) => {
    setEditingParentId(crumbId === '__root' ? null : crumbId);
  }, []);

  /* toggle expand children */
  const toggleChildrenExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* remove */
  const removeItem = useCallback((id: string) => {
    setItems((prev) => removeFromTree(prev, id));
  }, []);

  /* image upload */
  const uploadImage = useCallback(
    async (id: string, file: File) => {
      setUploadingId(id);
      try {
        const resized = await resizeImage(file, 200);
        const storageRef = ref(storage, `menuImages/${sellerId}/${id}`);
        await uploadBytes(storageRef, resized, { contentType: 'image/jpeg' });
        const url = await getDownloadURL(storageRef);
        setItems((prev) => updateInTree(prev, id, { imageUrl: url }));
      } catch {
        /* silently fail */
      } finally {
        setUploadingId(null);
      }
    },
    [sellerId],
  );

  const removeImage = useCallback((id: string) => {
    setItems((prev) => updateInTree(prev, id, { imageUrl: '' }));
  }, []);

  /* save */
  const handleSave = useCallback(async () => {
    setSaving(true);
    await saveSellerMenu(sellerId, items);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [items, sellerId]);

  /* ── render ──────────────────────────────────── */

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 size={28} className="animate-spin text-accent" />
      </div>
    );

  const currentIds = currentItems.map((i) => i.id);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-100 uppercase">Menü Yönetimi</h1>
          <p className="text-xs text-gray-500 mt-1">
            Sürükle-bırak ile sıralayın, alt menüler ekleyin
          </p>
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

      {/* Breadcrumb */}
      {editingParentId && (
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={goToRoot}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-all"
          >
            <ArrowLeft size={14} />
          </button>
          {breadcrumb.map((crumb, i) => (
            <React.Fragment key={crumb.id}>
              {i > 0 && <ChevronRight size={12} className="text-gray-600" />}
              <button
                onClick={() => goToCrumb(crumb.id)}
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-bold transition-all',
                  i === breadcrumb.length - 1
                    ? 'text-brand-primary bg-brand-primary/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800',
                )}
              >
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
          <span className="text-[10px] text-gray-600 ml-2">{currentItems.length} öğe</span>
        </div>
      )}

      {/* Sortable list */}
      {currentItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">Henüz menü öğesi yok.</p>
          <button
            onClick={addItem}
            className="mt-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-700 transition-all"
          >
            İlk öğeyi ekle
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={currentIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {currentItems.map((item, idx) => (
                <SortableMenuItem
                  key={item.id}
                  item={item}
                  index={idx}
                  total={currentItems.length}
                  isExpanded={false}
                  isChildrenExpanded={expandedIds.has(item.id)}
                  uploading={uploadingId === item.id}
                  onToggleExpand={() => {}}
                  onToggleChildrenExpand={() => toggleChildrenExpand(item.id)}
                  onToggleEnabled={() => toggleEnabled(item.id)}
                  onMoveUp={() => moveItem(idx, -1)}
                  onMoveDown={() => moveItem(idx, 1)}
                  onUpdateLabel={(v) => updateField(item.id, 'label', v)}
                  onUpdateLink={(v) => updateField(item.id, 'link', v)}
                  onUploadImage={(file) => uploadImage(item.id, file)}
                  onRemoveImage={() => removeImage(item.id)}
                  onAddChild={() => addChild(item.id)}
                  onEditChildren={() => editChildren(item.id)}
                  onRemove={() => removeItem(item.id)}
                  childCount={item.children?.length || 0}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
