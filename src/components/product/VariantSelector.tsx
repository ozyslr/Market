import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ProductVariant } from '@/types';
import { VariantSwatches } from '@/components/product/VariantSwatches';

interface VariantSelectorProps {
  variants: ProductVariant[];
  variantAttributes: string[];
  selectedAttrs: Record<string, string>;
  onVariantChange: (attr: string, value: string) => void;
}

export function VariantSelector({
  variants,
  variantAttributes,
  selectedAttrs,
  onVariantChange,
}: VariantSelectorProps) {
  const selectedVariant: ProductVariant | undefined = variants.find(v =>
    variantAttributes.every(attr => v.attributes[attr] === selectedAttrs[attr])
  );
  const allSelected = variantAttributes.every(attr => selectedAttrs[attr]);

  return (
    <div className="py-4 space-y-3.5">
      {variantAttributes.map(attr => {
        const uniqueValues = [...new Set(variants.map(v => v.attributes[attr]).filter(Boolean))];
        return (
          <div key={attr}>
            <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40 mb-2">
              {attr.charAt(0).toUpperCase() + attr.slice(1)}
              {selectedAttrs[attr] && <span className="ms-2 text-brand-primary normal-case font-bold">: {selectedAttrs[attr]}</span>}
            </p>
            <VariantSwatches
              attributeName={attr}
              options={uniqueValues.map((val: string) => ({
                value: val,
                label: val,
                inStock: variants.some(v => v.attributes[attr] === val && v.stock > 0),
              }))}
              selectedValue={selectedAttrs[attr]}
              onSelect={(val) => onVariantChange(attr, val)}
            />
          </div>
        );
      })}
      {allSelected && selectedVariant && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100 mt-3">
          <CheckCircle2 size={12} className="text-green-500" />
          <span className="text-xs font-black text-green-700">
            {selectedVariant.stock} adet
          </span>
        </div>
      )}
      {allSelected && !selectedVariant && (
        <p className="text-xs font-bold text-red-500">Bu kombinasyon mevcut değil.</p>
      )}
    </div>
  );
}
