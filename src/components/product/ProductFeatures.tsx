import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ProductFeaturesProps {
  specifications?: Record<string, string | number>;
  features?: string[];
}

export function ProductFeatures({ specifications, features }: ProductFeaturesProps) {
  const items: string[] = features ?? (
    specifications
      ? Object.entries(specifications)
          .slice(0, 6)
          .map(([k, v]) => `${k}: ${v}`)
      : []
  );

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-brand-primary/5 shadow-sm p-4">
      <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40 mb-3">Ürün Özellikleri</p>
      <ul className="space-y-2" aria-label="Ürün Özellikleri">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <CheckCircle2 size={13} className="text-green-500 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-xs font-bold text-brand-primary/70 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
