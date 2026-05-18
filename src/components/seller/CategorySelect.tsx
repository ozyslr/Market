import { useState, useEffect } from 'react';
import { getCategories } from '../../services/productService';
import { Category } from '../../types';

interface CategorySelectProps {
  value: string;
  onChange: (id: string) => void;
}

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedL1, setSelectedL1] = useState('');

  useEffect(() => { getCategories().then(setCategories); }, []);

  useEffect(() => {
    if (!value || !categories.length) return;
    const cat = categories.find(c => c.id === value);
    if (cat?.parentId) setSelectedL1(cat.parentId);
    else if (cat) setSelectedL1(cat.id);
  }, [value, categories]);

  const l1 = categories.filter(c => !c.parentId);
  const l2 = selectedL1 ? categories.filter(c => c.parentId === selectedL1) : [];

  return (
    <div className="space-y-2">
      <select
        value={selectedL1}
        onChange={e => { setSelectedL1(e.target.value); onChange(e.target.value); }}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
      >
        <option value="">-- Ana Kategori Seç --</option>
        {l1.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {l2.length > 0 && (
        <select
          value={l2.find(c => c.id === value) ? value : ''}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">-- Alt Kategori (İsteğe Bağlı) --</option>
          {l2.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
    </div>
  );
}
