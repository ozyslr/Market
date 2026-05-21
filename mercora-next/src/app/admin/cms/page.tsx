'use client';

import { useState, useEffect } from 'react';
import { Palette, Plus, Edit3, Trash2, Loader2, AlertCircle, Save, X } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/productService';
import type { Category } from '@/types';

type Tab = 'kategoriler';

export default function AdminCmsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('kategoriler');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', parentId: '', description: '' });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch {
      setError('Veriler yuklenirken bir hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: form.name, parentId: form.parentId || undefined, description: form.description });
      } else {
        await createCategory({ name: form.name, parentId: form.parentId || undefined, description: form.description });
      }
      setShowModal(false);
      setEditingCategory(null);
      setForm({ name: '', parentId: '', description: '' });
      fetchData();
    } catch {
      setError('Kategori kaydedilirken hata olustu.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediginize emin misiniz?')) return;
    try {
      await deleteCategory(id);
      fetchData();
    } catch {
      setError('Kategori silinirken hata olustu.');
    }
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setForm({ name: cat.name, parentId: cat.parentId || '', description: cat.description || '' });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-purple-700" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="text-red-500" size={48} />
        <p className="text-gray-500">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800">Tekrar Dene</button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof Palette }[] = [
    { key: 'kategoriler', label: 'Kategoriler', icon: Palette },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">CMS Yonetimi</h1>

      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === key ? 'bg-purple-700 text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'kategoriler' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-500">{categories.length} kategori</p>
            <button
              onClick={() => { setEditingCategory(null); setForm({ name: '', parentId: '', description: '' }); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 text-sm"
            >
              <Plus size={16} /> Kategori Ekle
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Palette className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-500">Henuz kategori eklenmemis.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    <Palette className="text-gray-300" size={32} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  {cat.parentId && <p className="text-xs text-gray-500 mt-1">Alt kategori</p>}
                  {cat.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cat.description}</p>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => openEdit(cat)} className="flex items-center gap-1 text-sm text-purple-700 hover:text-purple-800"><Edit3 size={14} /> Duzenle</button>
                    <button onClick={() => handleDelete(cat.id)} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"><Trash2 size={14} /> Sil</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}



      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{editingCategory ? 'Kategori Duzenle' : 'Kategori Ekle'}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Kategori adi"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Ust kategori yok</option>
                {categories.filter((c) => c.id !== editingCategory?.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <textarea
                placeholder="Aciklama"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">Iptal</button>
              <button onClick={handleSaveCategory} className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 text-sm"><Save size={14} /> Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
