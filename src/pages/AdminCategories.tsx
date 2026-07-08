import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/productService';
import { audit } from '@/services/auditLogService';
import { Category } from '@/types';
import {
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Loader2,
  X,
  FolderOpen,
  Folder,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LEVEL_BADGE: Record<number, string> = {
  1: 'bg-purple-100 text-purple-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-green-100 text-green-700',
};

interface CategoryFormData {
  name: string;
  slug: string;
  parentId: string;
  icon: string;
  level: 1 | 2 | 3;
  menuOrder: number;
  description: string;
}

const EMPTY_FORM: CategoryFormData = {
  name: '',
  slug: '',
  parentId: '',
  icon: '',
  level: 1,
  menuOrder: 0,
  description: '',
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function AdminCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'moderator')) {
      getCategories().then((cats) => {
        setCategories(cats);
        setLoading(false);
      });
    }
  }, [user]);

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return <Navigate to="/" replace />;
  }

  const openCreate = (parentId = '') => {
    const parentCat = categories.find((c) => c.id === parentId);
    const parentLevel = parentCat?.level ?? 1;
    const childLevel = Math.min(3, parentLevel + (parentId ? 1 : 0)) as 1 | 2 | 3;
    setEditingCat(null);
    setForm({ ...EMPTY_FORM, parentId, level: childLevel });
    setIsFormOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parentId ?? '',
      icon: cat.icon ?? '',
      level: cat.level ?? 1,
      menuOrder: cat.menuOrder ?? 0,
      description: cat.description ?? '',
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const data: Partial<Category> = {
      name: form.name.trim(),
      slug: form.slug || slugify(form.name),
      parentId: form.parentId || undefined,
      icon: form.icon || undefined,
      level: form.level,
      menuOrder: form.menuOrder,
      description: form.description || undefined,
    };
    try {
      if (editingCat) {
        await updateCategory(editingCat.id, data);
        audit(
          user.uid ?? '',
          user.email ?? '',
          user.role ?? 'admin',
          'category.update',
          'category',
          editingCat.id,
          editingCat.name,
        );
        setCategories((prev) => prev.map((c) => (c.id === editingCat.id ? { ...c, ...data } : c)));
      } else {
        const newId = await createCategory(data);
        audit(
          user.uid ?? '',
          user.email ?? '',
          user.role ?? 'admin',
          'category.create',
          'category',
          newId,
          form.name.trim(),
        );
        setCategories((prev) => [...prev, { id: newId, ...data } as Category]);
      }
      setIsFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`"${cat.name}" kategorisini silmek istiyor musunuz?`)) return;
    await deleteCategory(cat.id);
    audit(
      user.uid ?? '',
      user.email ?? '',
      user.role ?? 'admin',
      'category.delete',
      'category',
      cat.id,
      cat.name,
    );
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const topLevel = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0));
  const childrenOf = (id: string) =>
    categories
      .filter((c) => c.parentId === id)
      .sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0));

  const CategoryRow: React.FC<{ cat: Category; depth?: number }> = ({ cat, depth = 0 }) => {
    const children = childrenOf(cat.id);
    const isOpen = expanded.has(cat.id);
    return (
      <>
        <tr className="border-b border-[#F8F8FA] hover:bg-purple-50/30 transition-colors group">
          <td className="px-6 py-4">
            <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
              {children.length > 0 ? (
                <button
                  onClick={() => toggleExpand(cat.id)}
                  className="text-[#1A1033]/30 hover:text-purple-600 transition-colors"
                >
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <span className="w-[14px]" />
              )}
              {children.length > 0 ? (
                <FolderOpen size={14} className="text-purple-400 shrink-0" />
              ) : (
                <Folder size={14} className="text-[#1A1033]/20 shrink-0" />
              )}
              <span className="font-bold text-sm text-[#1A1033]">
                {cat.icon && <span className="me-1">{cat.icon}</span>}
                {cat.name}
              </span>
            </div>
          </td>
          <td className="px-6 py-4">
            <code className="text-[10px] text-[#1A1033]/40 font-mono">{cat.slug}</code>
          </td>
          <td className="px-6 py-4">
            <span
              className={cn(
                'px-2 py-0.5 rounded-lg text-[9px] font-black uppercase',
                LEVEL_BADGE[cat.level ?? 1],
              )}
            >
              Seviye {cat.level ?? 1}
            </span>
          </td>
          <td className="px-6 py-4">
            <span className="text-[10px] text-[#1A1033]/40">{cat.menuOrder ?? 0}</span>
          </td>
          <td className="px-6 py-4">
            <span className="text-[10px] text-[#1A1033]/40">{childrenOf(cat.id).length}</span>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openCreate(cat.id)}
                title="Alt kategori ekle"
                className="p-1.5 hover:bg-purple-100 rounded-lg text-[#1A1033]/30 hover:text-purple-600 transition-colors"
              >
                <Plus size={13} />
              </button>
              <button
                onClick={() => openEdit(cat)}
                className="p-1.5 hover:bg-blue-100 rounded-lg text-[#1A1033]/30 hover:text-blue-600 transition-colors"
              >
                <Edit size={13} />
              </button>
              <button
                onClick={() => handleDelete(cat)}
                className="p-1.5 hover:bg-red-100 rounded-lg text-[#1A1033]/30 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </td>
        </tr>
        {isOpen &&
          children.map((child) => <CategoryRow key={child.id} cat={child} depth={depth + 1} />)}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F8FA] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-1">
              Admin Panel
            </p>
            <h1 className="text-3xl font-display font-black uppercase italic text-[#1A1033]">
              Kategori Yönetimi
            </h1>
          </div>
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg"
          >
            <Plus size={14} /> Yeni Kategori
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Toplam Kategori', value: categories.length },
            { label: 'Ana Kategori', value: topLevel.length },
            { label: 'Alt Kategori', value: categories.filter((c) => c.parentId).length },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-3xl p-6 border border-[#F8F8FA] shadow-sm"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40 mb-2">
                {s.label}
              </p>
              <p className="text-3xl font-display font-black text-[#1A1033]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-4xl border border-[#F8F8FA] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <thead>
                  <tr className="bg-[#F8F8FA] text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4">Seviye</th>
                    <th className="px-6 py-4">Sıra</th>
                    <th className="px-6 py-4">Alt Kategori</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {topLevel.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <Tag size={32} className="mx-auto mb-4 text-[#1A1033]/20" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                          Henüz kategori yok
                        </p>
                        <button
                          onClick={() => openCreate()}
                          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all"
                        >
                          İlk Kategoriyi Ekle
                        </button>
                      </td>
                    </tr>
                  ) : (
                    topLevel.map((cat) => <CategoryRow key={cat.id} cat={cat} />)
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsFormOpen(false)}
          />
          <div className="relative bg-white rounded-4xl p-8 w-full max-w-lg shadow-2xl">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 end-5 text-[#1A1033]/30 hover:text-[#1A1033]"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-display font-black uppercase italic mb-6">
              {editingCat ? 'Kategori Düzenle' : 'Yeni Kategori'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1033]/50 mb-1">
                    Ad *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        name: e.target.value,
                        slug: p.slug || slugify(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-3 bg-[#F8F8FA] border border-[#1A1033]/10 rounded-xl text-sm outline-none focus:border-purple-300"
                    placeholder="Elektronik"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1033]/50 mb-1">
                    Slug
                  </label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                    className="w-full px-4 py-3 bg-[#F8F8FA] border border-[#1A1033]/10 rounded-xl text-sm font-mono outline-none focus:border-purple-300"
                    placeholder="elektronik"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1033]/50 mb-1">
                    Seviye
                  </label>
                  <select
                    value={form.level}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, level: parseInt(e.target.value) as 1 | 2 | 3 }))
                    }
                    className="w-full px-4 py-3 bg-[#F8F8FA] border border-[#1A1033]/10 rounded-xl text-sm outline-none focus:border-purple-300"
                  >
                    <option value={1}>Seviye 1</option>
                    <option value={2}>Seviye 2</option>
                    <option value={3}>Seviye 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1033]/50 mb-1">
                    Sıra
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.menuOrder}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, menuOrder: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full px-4 py-3 bg-[#F8F8FA] border border-[#1A1033]/10 rounded-xl text-sm outline-none focus:border-purple-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1033]/50 mb-1">
                    İkon
                  </label>
                  <input
                    value={form.icon}
                    onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#F8F8FA] border border-[#1A1033]/10 rounded-xl text-sm outline-none focus:border-purple-300"
                    placeholder="📱"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1033]/50 mb-1">
                  Üst Kategori
                </label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm((p) => ({ ...p, parentId: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#F8F8FA] border border-[#1A1033]/10 rounded-xl text-sm outline-none focus:border-purple-300"
                >
                  <option value="">— Ana Kategori —</option>
                  {categories
                    .filter((c) => c.id !== editingCat?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {' '.repeat((c.level ?? 1) - 1)}
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1033]/50 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 bg-[#F8F8FA] border border-[#1A1033]/10 rounded-xl text-sm outline-none focus:border-purple-300 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsFormOpen(false)}
                className="flex-1 py-3 bg-[#F8F8FA] text-[#1A1033] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1A1033]/10 transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || saving}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                {editingCat ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
