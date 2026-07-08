import React, { useState, useRef } from 'react';
import { Upload, Download } from 'lucide-react';
import { motion } from 'motion/react';
import Papa from 'papaparse';
import { Product } from '@/types';
import { createProduct, getProducts } from '@/services/productService';
import { CSV_COLUMNS, downloadCsvTemplate } from '../../lib/csvTemplate';

export interface CSVImportPanelProps {
  sellerId: string;
  onImportComplete: (refreshedProducts: Product[]) => void;
}

export function CSVImportPanel({ sellerId, onImportComplete }: CSVImportPanelProps) {
  const [bulkPreview, setBulkPreview] = useState<Partial<Product>[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  function parseCsvFile(file: File): Promise<{ rows: Partial<Product>[]; errors: string[] }> {
    return new Promise(resolve => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const errors: string[] = [];
          const rows: Partial<Product>[] = (result.data as Record<string, string>[]).map((raw, i) => {
            const rowNum = i + 2;
            if (!raw.title?.trim())       errors.push(`Satır ${rowNum}: Ürün adı zorunludur`);
            if (!raw.price || isNaN(parseFloat(raw.price))) errors.push(`Satır ${rowNum}: Geçerli fiyat zorunludur`);
            if (!raw.stock || isNaN(parseInt(raw.stock)))   errors.push(`Satır ${rowNum}: Geçerli stok zorunludur`);
            if (!raw.categoryId?.trim())  errors.push(`Satır ${rowNum}: Kategori ID zorunludur`);
            if (!raw.description?.trim()) errors.push(`Satır ${rowNum}: Kısa açıklama zorunludur`);
            return {
              title:                 raw.title?.trim() ?? '',
              brand:                 raw.brand?.trim() ?? '',
              categoryId:            raw.categoryId?.trim() ?? '',
              sku:                   raw.sku?.trim() ?? '',
              price:                 parseFloat(raw.price) || 0,
              oldPrice:              raw.oldPrice ? parseFloat(raw.oldPrice) : undefined,
              currency:              raw.currency?.trim() || 'TRY',
              stock:                 parseInt(raw.stock) || 0,
              description:           raw.description?.trim() ?? '',
              images:                raw.images ? raw.images.split('|').map((u: string) => u.trim()).filter(Boolean) : [],
              tags:                  raw.tags ? raw.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
              weight:                parseFloat(raw.weight) || 0,
              originCountry:         raw.originCountry?.trim() || 'Türkiye',
              hsCode:                raw.hsCode?.trim() ?? '',
              estimatedDeliveryDays: parseInt(raw.estimatedDeliveryDays) || 3,
              deliveryTerms:         raw.deliveryTerms?.trim() ?? '',
              returnPolicy:          raw.returnPolicy?.trim() ?? '',
              visibility:            (['public','hidden','draft'].includes(raw.visibility) ? raw.visibility : 'public') as any,
            };
          });
          resolve({ rows, errors });
        },
        error: (err: Error) => resolve({ rows: [], errors: [err.message] }),
      });
    });
  }

  async function handleBulkFileSelect(file: File) {
    const { rows, errors } = await parseCsvFile(file);
    setBulkErrors(errors);
    setBulkPreview(rows);
  }

  async function confirmBulkUpload() {
    setIsUploading(true);
    setBulkProgress(0);
    const BATCH = 5;
    for (let i = 0; i < bulkPreview.length; i += BATCH) {
      const chunk = bulkPreview.slice(i, i + BATCH);
      await Promise.all(chunk.map(p => {
        const slug = (p.title ?? '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return createProduct({ ...p, sellerId, slug, rating: 0, reviewsCount: 0, status: 'pending' } as Omit<Product, 'id'>);
      }));
      setBulkProgress(Math.min(i + BATCH, bulkPreview.length));
    }
    const refreshed = await getProducts({ sellerId, includeNonApproved: true });
    onImportComplete(refreshed);
    setBulkPreview([]);
    setBulkErrors([]);
    setIsUploading(false);
  }

  return (
    <motion.div
      key="bulk"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Şablon */}
      <div className="bg-white rounded-2xl p-6 border border-brand-primary/5 shadow-sm">
        <h3 className="text-sm font-semibold text-brand-primary mb-1">CSV Şablonu</h3>
        <p className="text-xs text-brand-primary/40 mb-4">Şablonu indirin, doldurun ve yükleyin. BOM ekli — Excel/Numbers ile açılır.</p>
        <button onClick={downloadCsvTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors">
          <Download size={14} /> Şablonu İndir (.csv)
        </button>
      </div>

      {/* Alan referansı */}
      <div className="bg-white rounded-2xl p-6 border border-brand-primary/5 shadow-sm overflow-x-auto">
        <h3 className="text-sm font-semibold text-brand-primary mb-3">Alan Referansı</h3>
        <table className="text-xs w-full">
          <thead>
            <tr className="text-brand-primary/30 border-b border-brand-primary/5">
              <th className="text-start pb-2 pe-4">Kolon</th>
              <th className="text-start pb-2 pe-4">Zorunlu</th>
              <th className="text-start pb-2">Açıklama</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-primary/5">
            {CSV_COLUMNS.map(col => (
              <tr key={col.key}>
                <td className="py-1.5 pe-4 font-mono text-emerald-600">{col.key}</td>
                <td className="py-1.5 pe-4 text-center">{col.required ? '\u2713' : '\u2014'}</td>
                <td className="py-1.5 text-brand-primary/40">{col.hint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload alanı */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={async e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.name.endsWith('.csv')) handleBulkFileSelect(f); }}
        onClick={() => bulkFileRef.current?.click()}
        className="bg-white border-2 border-dashed border-brand-primary/10 hover:border-emerald-500 rounded-2xl p-10 text-center cursor-pointer transition-colors"
      >
        <Upload size={28} className="mx-auto text-brand-primary/20 mb-3" />
        <p className="text-sm text-brand-primary/40">CSV dosyasını sürükleyin veya tıklayın</p>
        <p className="text-xs text-brand-primary/20 mt-1">Maks 500 ürün önerilir</p>
      </div>
      <input ref={bulkFileRef} type="file" accept=".csv" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleBulkFileSelect(f); }} />

      {/* Hata listesi */}
      {bulkErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-red-600 mb-2">{bulkErrors.length} Hata</h4>
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {bulkErrors.map((e, i) => <li key={i} className="text-xs text-red-500">{e}</li>)}
          </ul>
        </div>
      )}

      {/* Önizleme + Yükle */}
      {bulkPreview.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-brand-primary/5 shadow-sm">
          <p className="text-sm text-brand-primary mb-4">
            <span className="text-emerald-600 font-semibold">{bulkPreview.length} ürün</span> yüklenmeye hazır
          </p>
          {isUploading && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-brand-primary/40 mb-1">
                <span>Yükleniyor...</span><span>{bulkProgress}/{bulkPreview.length}</span>
              </div>
              <div className="h-2 bg-brand-secondary rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${(bulkProgress / bulkPreview.length) * 100}%` }} />
              </div>
            </div>
          )}
          <button onClick={confirmBulkUpload} disabled={isUploading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg disabled:opacity-50 transition-colors">
            {isUploading ? 'Yükleniyor...' : 'Ürünleri Yükle'}
          </button>
        </div>
      )}
    </motion.div>
  );
}
