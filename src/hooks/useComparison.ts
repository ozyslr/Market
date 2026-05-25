import { useEffect, useState } from 'react';

export interface ComparisonItem {
  id: string;
  title: string;
  price: number;
  image: string;
  specifications?: Record<string, string>;
}

// Module-level state — shared across all hook instances without a Context Provider
let items: ComparisonItem[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(cb => cb());
}

export function useComparison() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const cb = () => forceUpdate(n => n + 1);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  return {
    items,
    addItem(item: ComparisonItem) {
      if (items.length >= 3) return;
      if (items.some(i => i.id === item.id)) return;
      items = [...items, item];
      notify();
    },
    removeItem(id: string) {
      items = items.filter(i => i.id !== id);
      notify();
    },
    clearAll() {
      items = [];
      notify();
    },
    isAdded(id: string): boolean {
      return items.some(i => i.id === id);
    },
    isFull: items.length >= 3,
  };
}
