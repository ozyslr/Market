'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Loader2, AlertCircle, Check, X, Save, GripVertical, Layers } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/productService';
import type { Category } from '@/types';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formParentId, setFormParentId] = useState('');
  const [formMenuOrder, setFormMenuOrder] = useState(0);
  const [formDescription, setFormDescription] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      setError('Kategoriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName('');
    setFormSlug('');
    setFormParentId('');
    setFormMenuOrder(0);
    setFormDescription('');
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormParentId(cat.parentId || '');
    setFormMenuOrder(cat.menuOrder || 0);
    setFormDescription(cat.description || '');
    setIsCreating(false);
  }

  function startCreate() {
    setIsCreating(true);
    setEditingId(null);
    resetForm();
  }

  function cancelEdit() {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  }

  async function handleSave() {
    if (!formName.trim() || !formSlug.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (isCreating) {
        await createCategory({
          name: formName.trim(),
          slug: formSlug.trim(),
          parentId: formParentId || undefined,
          menuOrder: formMenuOrder,
          description: formDescription.trim() || undefined,
        } as Partial<Category>);
        setSuccessMsg('Kategori oluşturuldu.');
      } else if (editingId) {
        await updateCategory(editingId, {
          name: formName.trim(),
          slug: formSlug.trim(),
          parentId: formParentId || undefined,
          menuOrder: formMenuOrder,
          description: formDescription.trim() || undefined,
        } as Partial<Category>);
        setSuccessMsg('Kategori güncellendi.');
      }
      cancelEdit();
      await loadCategories();
    } catch (err) {
      setError(isCreating ? 'Kategori oluşturulamadı.' : 'Kategori güncellenemedi.');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
    setSaving(true);
    try {
      await deleteCategory(id);
      setSuccessMsg('Kategori silindi.');
      await loadCategories();
    } catch {
      setError('Kategori silinemedi.');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  }

  // loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Kategoriler yükleniyor...</span>
        </div>
      </div>
    );
  }

  // error state (with no data)
  if (error && categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Hata</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={loadCategories} className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition">Tekrar Dene</button>
        </div>
      </div>
    );
  }

  const mainCategories = categories.filter(c => !c.parentId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Layers className="w-7 h-7 text-purple-700" />
            <h1 className="text-2xl font-bold text-gray-900">Kategori Yönetimi</h1>
          </div>
          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition"
          >
            <Plus className="w-4 h-4" /> Yeni Kategori
          </button>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
            <Check className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {/* Inline error */}
        {error && categories.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {isCreating ? 'Yeni Kategori' : 'Kategori Düzenle'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
                <input
                  type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Kategori adı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text" value={formSlug} onChange={e => setFormSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="kategori-slugu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Üst Kategori</label>
                <select
                  value={formParentId} onChange={e => setFormParentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">— Ana Kategori —</option>
                  {categories.filter(c => !c.parentId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sıralama</label>
                <input
                  type="number" value={formMenuOrder} onChange={e => setFormMenuOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Kategori açıklaması"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleSave} disabled={saving || !formName.trim() || !formSlug.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50 transition"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition">
                <X className="w-4 h-4" /> İptal
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {categories.length === 0 && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz kategori yok</h3>
            <p className="text-gray-500 mb-6">İlk kategoriyi oluşturarak başlayın.</p>
            <button
              onClick={startCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition"
            >
              <Plus className="w-4 h-4" /> Kategori Oluştur
            </button>
          </div>
        )}

        {/* Category Tree */}
        {categories.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sıra</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Alt Kategoriler</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mainCategories.map(cat => (
                  <CategoryRow
                    key={cat.id} cat={cat} categories={categories} depth={0}
                    onEdit={startEdit} onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  cat, categories, depth, onEdit, onDelete,
}: {
  cat: Category; categories: Category[]; depth: number;
  onEdit: (cat: Category) => void; onDelete: (id: string) => void;
}) {
  const subCats = categories.filter(c => c.parentId === cat.id);
  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors group">
        <td className="px-6 py-4">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
            <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
            <span className="font-medium text-gray-900">{cat.name}</span>
            {!cat.parentId && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Ana</span>}
          </div>
        </td>
        <td className="px-6 py-4">
          <code className="text-sm text-gray-500">{cat.slug}</code>
        </td>
        <td className="px-6 py-4 text-center text-sm text-gray-500">{cat.menuOrder || 0}</td>
        <td className="px-6 py-4 text-center">
          {subCats.length > 0 ? (
            <span className="text-sm bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">{subCats.length}</span>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
            <button onClick={() => onEdit(cat)} className="p-1.5 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition" title="Düzenle">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Sil">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
      {subCats.map(sub => (
        <CategoryRow key={sub.id} cat={sub} categories={categories} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
}
