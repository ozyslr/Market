import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '@/types';
import { ProductForm, ProductFormData } from './ProductForm';

export interface ProductFormModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  onSave: (data: ProductFormData, action: 'draft' | 'publish') => Promise<void>;
  onClose: () => void;
}

export function ProductFormModal({ isOpen, editingProduct, onSave, onClose }: ProductFormModalProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  useEffect(() => {
    if (isOpen) {
      setVariants(editingProduct?.variants ?? []);
    }
  }, [isOpen, editingProduct]);

  function addVariant() {
    setVariants(prev => [...prev, {
      id: `var_${Date.now()}`,
      sku: '',
      price: 0,
      stock: 0,
      attributes: { 'Özellik': '' },
    }]);
  }

  function removeVariant(idx: number) {
    setVariants(prev => prev.filter((_, i) => i !== idx));
  }

  function updateVariant(idx: number, patch: Partial<ProductVariant>) {
    setVariants(prev => prev.map((v, i) => i === idx ? { ...v, ...patch } : v));
  }

  function updateVariantAttr(idx: number, key: string, value: string) {
    setVariants(prev => prev.map((v, i) => i === idx ? { ...v, attributes: { ...v.attributes, [key]: value } } : v));
  }

  return (
    <ProductForm
      isOpen={isOpen}
      initial={editingProduct ?? undefined}
      onSubmit={onSave}
      onClose={onClose}
    />
  );
}
