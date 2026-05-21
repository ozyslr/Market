'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  isActive?: boolean;
}

interface CategorySelectProps {
  value: string;
  onChange: (categoryId: string) => void;
  error?: string;
  className?: string;
}

export function CategorySelect({ value, onChange, error, className = '' }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'categories'));
        const cats = snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
        setCategories(cats.filter(c => c.isActive !== false));
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Category
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <option value="">Select a category</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {loading && <p className="text-xs text-gray-400 mt-1">Loading categories...</p>}
    </div>
  );
}
