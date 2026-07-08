import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCategories } from '../../services/productService';
import { Category } from '../../types';

interface CategorySelectProps {
  value: string;
  onChange: (id: string) => void;
}

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedL1, setSelectedL1] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetView, setSheetView] = useState<'l1' | 'l2'>('l1');

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (!value || !categories.length) return;
    const cat = categories.find((c) => c.id === value);
    if (cat?.parentId) setSelectedL1(cat.parentId);
    else if (cat) setSelectedL1(cat.id);
  }, [value, categories]);

  const l1 = categories.filter((c) => !c.parentId);
  const l2 = selectedL1 ? categories.filter((c) => c.parentId === selectedL1) : [];
  const selectedCategory = categories.find((c) => c.id === value);
  const displayName = selectedCategory?.name || 'Kategori Seç';

  const hasSubcategories = (cat: Category) => categories.some((c) => c.parentId === cat.id);

  function handleSelectL1(cat: Category) {
    setSelectedL1(cat.id);
    if (hasSubcategories(cat)) {
      setSheetView('l2');
    } else {
      onChange(cat.id);
      setSheetOpen(false);
    }
  }

  function handleSelectL2(cat: Category) {
    onChange(cat.id);
    setSheetOpen(false);
  }

  function openSheet() {
    setSheetView('l1');
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setSheetView('l1');
  }

  return (
    <>
      {/* ===== Desktop: two cascading selects (current behavior) ===== */}
      <div className="max-sm:hidden space-y-2">
        <select
          value={selectedL1}
          onChange={(e) => {
            setSelectedL1(e.target.value);
            onChange(e.target.value);
          }}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">-- Ana Kategori Seç --</option>
          {l1.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {l2.length > 0 && (
          <select
            value={l2.find((c) => c.id === value) ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">-- Alt Kategori (İsteğe Bağlı) --</option>
            {l2.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ===== Mobile: trigger button ===== */}
      <button
        type="button"
        onClick={openSheet}
        className="sm:hidden w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3.5 text-sm text-left flex items-center justify-between active:bg-zinc-700 transition-colors"
      >
        <span className={selectedCategory ? 'text-white' : 'text-zinc-500'}>{displayName}</span>
        <ChevronRight size={18} className="text-zinc-500 flex-shrink-0" />
      </button>

      {/* ===== Mobile: bottom sheet ===== */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-50 sm:hidden"
              onClick={closeSheet}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-2xl max-h-[60vh] flex flex-col sm:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-700 flex-shrink-0">
                {sheetView === 'l2' ? (
                  <button
                    type="button"
                    onClick={() => setSheetView('l1')}
                    className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
                  >
                    <ChevronLeft size={18} />
                    Geri
                  </button>
                ) : (
                  <h3 className="text-sm font-semibold text-white">Kategori Seç</h3>
                )}
                <button
                  type="button"
                  onClick={closeSheet}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable category list */}
              <div className="overflow-y-auto flex-1 overscroll-contain">
                {sheetView === 'l1' ? (
                  <div className="py-2">
                    {l1.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectL1(cat)}
                        className="w-full flex items-center justify-between px-4 py-3.5 min-h-[48px] text-sm text-white hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
                      >
                        <span>{cat.name}</span>
                        <span className="flex items-center gap-2">
                          {cat.id === value && !hasSubcategories(cat) && (
                            <Check size={16} className="text-emerald-400" />
                          )}
                          {hasSubcategories(cat) && (
                            <ChevronRight size={16} className="text-zinc-500" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-2">
                    {l2.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectL2(cat)}
                        className="w-full flex items-center justify-between px-4 py-3.5 min-h-[48px] text-sm text-white hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
                      >
                        <span>{cat.name}</span>
                        {cat.id === value && <Check size={16} className="text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
