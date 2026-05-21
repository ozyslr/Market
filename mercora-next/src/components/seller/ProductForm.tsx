'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Plus, Trash2, Sparkles } from 'lucide-react';
import { createProduct, updateProduct, getProducts } from '@/services/productService';
import { uploadImage } from '@/lib/storage';
import { CategorySelect } from './CategorySelect';
import { generateDescription, extractKeywords } from '@/services/aiContentService';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';

interface ProductFormProps {
  editProduct?: Product;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  comparePrice: string;
  category: string;
  stock: string;
  tags: string;
  images: string[];
}

const EMPTY_FORM: FormData = {
  name: '',
  description: '',
  price: '',
  comparePrice: '',
  category: '',
  stock: '1',
  tags: '',
  images: [],
};

export function ProductForm({ editProduct, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(() => editProduct ? {
    name: editProduct.title || '',
    description: editProduct.description || '',
    price: editProduct.price?.toString() || '',
    comparePrice: (editProduct as any).oldPrice?.toString() || '',
    category: editProduct.categoryId || '',
    stock: editProduct.stock?.toString() || '1',
    tags: (editProduct.tags as string[] | undefined)?.join(', ') || '',
    images: editProduct.images || [],
  } : EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Product name is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.price || parseFloat(form.price) <= 0) newErrors.price = 'Valid price is required';
    if (!form.category) newErrors.category = 'Category is required';
    if (!form.stock || parseInt(form.stock) < 0) newErrors.stock = 'Valid stock is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImage(file, 'products');
      updateField('images', [...form.images, url]);
    } catch {
      setErrors(prev => ({ ...prev, images: 'Upload failed' }));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    updateField('images', form.images.filter((_, i) => i !== index));
  };

  const handleGenerateDescription = async () => {
    if (!form.name.trim()) return;
    setGeneratingAI(true);
    try {
      const desc = await generateDescription(form.name, form.category || 'general', form.tags.split(',').map(t => t.trim()).filter(Boolean));
      updateField('description', desc);
      const kws = await extractKeywords(form.name, form.category || 'general');
      updateField('tags', [...new Set([...form.tags.split(',').map(t => t.trim()).filter(Boolean), ...kws])].join(', '));
    } catch {
      // fallback handled inside service
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user?.id) return;
    setSubmitting(true);

    try {
      const productData = {
        title: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        oldPrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
        categoryId: form.category,
        stock: parseInt(form.stock),
        images: form.images,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        isActive: true,
        sellerId: user.id,
        slug: form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        brand: '',
        currency: 'GBP',
        weight: 0,
        originCountry: '',
        rating: 0,
        reviewsCount: 0,
      };

      if (editProduct?.id) {
        await updateProduct(editProduct.id, productData);
      } else {
        await createProduct(productData);
      }

      if (onSuccess) onSuccess();
      else router.push('/seller/inventory');
    } catch {
      setErrors(prev => ({ ...prev, name: 'Failed to save product' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[{ n: 1, label: 'Details' }, { n: 2, label: 'Media' }, { n: 3, label: 'Review' }].map(s => (
          <div key={s.n} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s.n)}
              className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition-colors ${
                step === s.n ? 'bg-purple-700 text-white' :
                step > s.n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step > s.n ? '✓' : s.n}
            </button>
            <span className={`text-sm ${step === s.n ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{s.label}</span>
            {s.n < 3 && <div className="w-12 h-0.5 bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="e.g., Premium Leather Wallet"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <button
                onClick={handleGenerateDescription}
                disabled={generatingAI}
                className="text-xs text-purple-700 hover:text-purple-800 flex items-center gap-1"
              >
                <Sparkles size={12} />
                {generatingAI ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>
            <textarea
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              rows={5}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Describe your product..."
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (£)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={e => updateField('price', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="29.99"
              />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compare Price <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.comparePrice}
                onChange={e => updateField('comparePrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
                placeholder="39.99"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CategorySelect
              value={form.category}
              onChange={v => updateField('category', v)}
              error={errors.category}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={e => updateField('stock', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none ${errors.stock ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags <span className="text-gray-400 font-normal">(comma separated)</span>
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={e => updateField('tags', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
              placeholder="leather, wallet, accessories"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-purple-700 text-white rounded-lg hover:bg-purple-800 font-medium text-sm transition-colors">
              Next: Media
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Media */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {form.images.map((url, i) => (
                <div key={i} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50"
              >
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-700 border-t-transparent" />
                ) : (
                  <>
                    <Upload size={20} className="text-gray-400" />
                    <span className="text-xs text-gray-500">Upload</span>
                  </>
                )}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {errors.images && <p className="text-xs text-red-500 mt-1">{errors.images}</p>}
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(1)} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors">
              Back
            </button>
            <button onClick={() => setStep(3)} className="px-6 py-2.5 bg-purple-700 text-white rounded-lg hover:bg-purple-800 font-medium text-sm transition-colors">
              Next: Review
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-4">
              {form.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.images[0]} alt="" className="w-20 h-20 rounded-xl object-cover" />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{form.name || 'Unnamed Product'}</h3>
                <p className="text-2xl font-bold text-purple-700">£{parseFloat(form.price || '0').toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Category:</span>
                <span className="ml-2 font-medium">{form.category || 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-500">Stock:</span>
                <span className="ml-2 font-medium">{form.stock}</span>
              </div>
              {form.comparePrice && (
                <div>
                  <span className="text-gray-500">Compare at:</span>
                  <span className="ml-2 font-medium">£{form.comparePrice}</span>
                </div>
              )}
            </div>

            {form.description && (
              <div>
                <span className="text-xs text-gray-500 font-medium">Description:</span>
                <p className="text-sm text-gray-700 mt-1 line-clamp-4">{form.description}</p>
              </div>
            )}

            {form.tags && (
              <div className="flex gap-1.5 flex-wrap">
                {form.tags.split(',').map((t, i) => (
                  <span key={i} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{t.trim()}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(2)} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors">
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-sm transition-colors flex items-center gap-2"
            >
              {submitting ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
