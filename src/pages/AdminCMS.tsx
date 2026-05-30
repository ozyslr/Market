import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/productService';
import { Category } from '@/types';
import { Plus, Edit, Trash2, X, CheckCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminCMS() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    const data = await getCategories();
    setCategories(data);
    setIsLoading(false);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const parentId = formData.get('parentId') as string;

    const catData = {
      name,
      description,
      parentId: parentId || undefined,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
    };

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, catData);
      } else {
        await createCategory(catData);
      }
      await fetchCategories();
      setIsFormOpen(false);
      setEditingCategory(null);
    } catch (err) {
      console.error(err);
      alert('Error saving category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this menu category?')) {
      try {
        await deleteCategory(id);
        await fetchCategories();
      } catch (err) {
        console.error(err);
        alert('Failed to delete category');
      }
    }
  };

  return (
    <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm flex flex-col min-h-[500px]">
      <div className="flex items-center justify-between mb-10">
        <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">CMS / Menu Management</h3>
        <button onClick={() => { setEditingCategory(null); setIsFormOpen(true); }} className="px-6 py-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:scale-105 transition-all flex items-center gap-2">
          <Plus size={16} /> New Menu Item
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-[#F8F8FA] rounded-3xl p-6 relative group border border-transparent hover:border-accent/10 transition-colors">
              <div className="h-32 rounded-2xl overflow-hidden mb-4 relative">
                <img src={cat.image} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/20" />
              </div>
              <h4 className="text-sm font-black text-[#1A1033] uppercase">{cat.name}</h4>
              <p className="text-[10px] text-[#1A1033]/40 uppercase tracking-wide mt-1">{cat.parentId ? `Submenu of ${cat.parentId}` : 'Main Menu'}</p>
              
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingCategory(cat); setIsFormOpen(true); }} className="p-2 bg-white rounded-lg shadow-md text-[#1A1033]/40 hover:text-accent transition-colors">
                  <Edit size={14} />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 bg-white rounded-lg shadow-md text-[#1A1033]/40 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFormOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl p-8 z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-display font-black uppercase italic tracking-tight">{editingCategory ? 'Edit Menu' : 'Add Menu'}</h3>
                <button onClick={() => setIsFormOpen(false)} className="text-[#1A1033]/30 hover:text-[#1A1033]"><X size={20} /></button>
              </div>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#1A1033] uppercase mb-2">Name</label>
                  <input type="text" name="name" required defaultValue={editingCategory?.name} className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#1A1033] uppercase mb-2">Description</label>
                  <textarea name="description" rows={3} defaultValue={editingCategory?.description} className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#1A1033] uppercase mb-2">Parent Menu (Optional)</label>
                  <select name="parentId" defaultValue={editingCategory?.parentId || ''} className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none">
                    <option value="">None (Top Level)</option>
                    {categories.filter(c => c.id !== editingCategory?.id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 flex items-center justify-end">
                  <button type="submit" disabled={isLoading} className="px-8 py-4 bg-[#1A1033] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                    {isLoading ? 'Saving...' : 'Save Menu'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
