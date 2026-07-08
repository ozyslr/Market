import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Papa from 'papaparse';
import { CSV_COLUMNS, downloadCsvTemplate } from '@/lib/csvTemplate';
import { askShoppingAssistant } from '@/lib/gemini';
import { createProduct } from '@/services/productService';
import { Product } from '@/types';
import {
  BarChart3,
  Link2,
  Upload,
  Layers,
  List,
  FileText,
  FileUp,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Wand2,
  ArrowRight,
  Database,
  Package,
  Globe,
  ShoppingCart,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

type ImportTab = 'overview' | 'xml' | 'csv' | 'mapping' | 'logs' | 'templates' | 'platform';

interface ImportJob {
  id: string;
  feedName: string;
  type: 'xml' | 'csv' | 'api';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  total: number;
  success: number;
  failed: number;
  createdAt: string;
  errors?: { line: number; message: string }[];
}

interface FeedField {
  name: string;
  sample: string;
}

const SYSTEM_FIELDS = [
  { key: 'title', label: 'Ürün Adı', required: true },
  { key: 'brand', label: 'Marka', required: false },
  { key: 'categoryId', label: 'Kategori ID', required: true },
  { key: 'sku', label: 'SKU', required: false },
  { key: 'price', label: 'Fiyat', required: true },
  { key: 'oldPrice', label: 'Eski Fiyat', required: false },
  { key: 'currency', label: 'Para Birimi', required: false },
  { key: 'stock', label: 'Stok', required: true },
  { key: 'description', label: 'Kısa Açıklama', required: true },
  { key: 'longDescription', label: 'Detaylı Açıklama', required: false },
  { key: 'images', label: 'Görsel URL(lar)', required: false },
  { key: 'tags', label: 'Etiketler', required: false },
  { key: 'weight', label: 'Ağırlık (kg)', required: false },
  { key: 'originCountry', label: 'Menşei Ülke', required: false },
  { key: 'hsCode', label: 'HS Kodu', required: false },
  { key: 'estimatedDeliveryDays', label: 'Teslimat Süresi (G)', required: false },
  { key: 'deliveryTerms', label: 'Teslimat Koşulları', required: false },
  { key: 'returnPolicy', label: 'İade Politikası', required: false },
  { key: 'visibility', label: 'Görünürlük', required: false },
] as const;

type SystemFieldKey = (typeof SYSTEM_FIELDS)[number]['key'];

function heuristicMatch(feedFields: string[]): Record<string, string> {
  const aliases: Record<string, string[]> = {
    title: ['title', 'name', 'productname', 'product_name', 'baslik', 'urunadi', 'isim', 'ad'],
    price: ['price', 'saleprice', 'sale_price', 'fiyat', 'satısfiyat', 'birimfiyat', 'unit_price'],
    oldPrice: ['oldprice', 'old_price', 'listprice', 'list_price', 'eskifiyat'],
    stock: ['stock', 'quantity', 'qty', 'stok', 'miktar', 'adet', 'available'],
    brand: ['brand', 'marka', 'manufacturer', 'vendor', 'uretici'],
    categoryId: ['category', 'categoryid', 'cat', 'kategori', 'category_id'],
    sku: ['sku', 'code', 'productcode', 'product_code', 'kod', 'stok_kodu', 'barkod', 'barcode'],
    description: [
      'description',
      'desc',
      'summary',
      'aciklama',
      'ozet',
      'kisaciklama',
      'short_description',
    ],
    longDescription: [
      'longdescription',
      'long_description',
      'detail',
      'fulldescription',
      'detayli',
    ],
    images: [
      'image',
      'images',
      'img',
      'photo',
      'picture',
      'gorsel',
      'resim',
      'imageurl',
      'image_url',
    ],
    tags: ['tags', 'keywords', 'etiket', 'anahtar', 'label'],
    weight: ['weight', 'agirlik', 'kg', 'gram', 'gr'],
    originCountry: ['origin', 'country', 'mense', 'uretimyeri', 'mensei'],
    hsCode: ['hscode', 'hs_code', 'gtip', 'tariff', 'gtipno'],
    estimatedDeliveryDays: ['deliveryday', 'delivery_day', 'teslimat', 'kargogun'],
  };
  const result: Record<string, string> = {};
  for (const ff of feedFields) {
    const lf = ff.toLowerCase().replace(/[-_\s]/g, '');
    for (const [sysKey, list] of Object.entries(aliases)) {
      if (list.some((a) => lf === a || lf.includes(a) || a.includes(lf))) {
        result[ff] = sysKey;
        break;
      }
    }
  }
  return result;
}

function detectXmlFields(xmlText: string): FeedField[] {
  try {
    const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');
    const selectors = ['item', 'product', 'Product', 'Item', 'urun', 'Urun', 'row', 'Row', 'p'];
    let first: Element | null = null;
    for (const s of selectors) {
      first = xmlDoc.querySelector(s);
      if (first) break;
    }
    if (!first) return [];
    return Array.from(first.children).map((c) => ({
      name: c.tagName,
      sample: (c.textContent ?? '').slice(0, 60),
    }));
  } catch {
    return [];
  }
}

const MOCK_JOBS: ImportJob[] = [
  {
    id: 'm1',
    feedName: 'Örnek XML Feed',
    type: 'xml',
    status: 'completed',
    total: 1247,
    success: 1231,
    failed: 16,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'm2',
    feedName: 'CSV Toplu Yükleme',
    type: 'csv',
    status: 'completed',
    total: 48,
    success: 48,
    failed: 0,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'm3',
    feedName: 'Sezon Feed',
    type: 'xml',
    status: 'failed',
    total: 200,
    success: 87,
    failed: 113,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    errors: [
      { line: 45, message: 'Geçersiz fiyat formatı' },
      { line: 88, message: 'Eksik kategori ID' },
    ],
  },
];

export function SellerImportCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ImportTab>('overview');
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // XML tab state
  const [xmlFeedName, setXmlFeedName] = useState('');
  const [xmlUrl, setXmlUrl] = useState('');
  const [syncInterval, setSyncInterval] = useState<'manual' | '15m' | '30m' | '1h' | 'daily'>(
    'daily',
  );
  const [xmlOpts, setXmlOpts] = useState({
    updatePrice: true,
    updateStock: true,
    createNew: true,
    disableMissing: false,
    autoPublish: false,
  });
  const [savingFeed, setSavingFeed] = useState(false);
  const [feedSaved, setFeedSaved] = useState(false);

  // Field mapping state
  const [sampleType, setSampleType] = useState<'xml' | 'csv'>('xml');
  const [sampleInput, setSampleInput] = useState('');
  const [feedFields, setFeedFields] = useState<FeedField[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [aiMatching, setAiMatching] = useState(false);
  const [mappingSaved, setMappingSaved] = useState(false);

  // CSV tab state
  const [bulkPreview, setBulkPreview] = useState<Record<string, string>[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkUploading, setBulkUploading] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  // Server CSV import state (SEL-05)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: { row: number; field: string; reason: string }[];
  } | null>(null);
  const serverCsvRef = useRef<HTMLInputElement>(null);

  // ── Platform Connector State ──────────────────────────────────────────────
  const [platformType, setPlatformType] = useState<'shopify' | 'woocommerce'>('shopify');
  const [platformStoreUrl, setPlatformStoreUrl] = useState('');
  const [platformApiKey, setPlatformApiKey] = useState('');
  const [platformApiSecret, setPlatformApiSecret] = useState('');
  const [platformValidating, setPlatformValidating] = useState(false);
  const [platformValid, setPlatformValid] = useState<boolean | null>(null);
  const [platformImporting, setPlatformImporting] = useState(false);
  const [platformProgress, setPlatformProgress] = useState('');
  const [platformResult, setPlatformResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [platformCategories, setPlatformCategories] = useState<string[]>([]);
  const [platformCategoryId, setPlatformCategoryId] = useState('');
  const [platformSaving, setPlatformSaving] = useState(false);
  const [platformSaved, setPlatformSaved] = useState(false);

  function pickServerFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportResult({
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, field: 'file', reason: 'Only .csv files are accepted' }],
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImportResult({
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, field: 'file', reason: 'File exceeds 10 MB limit' }],
      });
      return;
    }
    setImportResult(null);
    setSelectedFile(file);
  }

  function formatSize(bytes: number): string {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  async function getAuthToken(): Promise<string> {
    const { getAuth } = await import('firebase/auth');
    const current = getAuth().currentUser;
    return current ? current.getIdToken() : '';
  }

  async function handleServerImport() {
    if (!selectedFile || !user) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('file', selectedFile);
      const resp = await fetch('/api/products/csv-import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await resp.json();
      if (!resp.ok) {
        setImportResult({
          imported: 0,
          skipped: 0,
          errors: [{ row: 0, field: 'server', reason: data.error || 'Import failed' }],
        });
      } else {
        setImportResult(data);
        setSelectedFile(null);
        if (serverCsvRef.current) serverCsvRef.current.value = '';
      }
    } catch (err: any) {
      setImportResult({
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, field: 'network', reason: err?.message || 'Network error' }],
      });
    } finally {
      setIsImporting(false);
    }
  }

  function downloadErrorReport() {
    if (!importResult?.errors.length) return;
    const csv =
      '\uFEFF' +
      Papa.unparse(importResult.errors, {
        header: true,
        columns: ['row', 'field', 'reason'],
      });
    const date = new Date().toISOString().split('T')[0];
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `import-errors-${date}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function handleExport() {
    if (!user) return;
    setIsExporting(true);
    try {
      const token = await getAuthToken();
      const resp = await fetch('/api/products/csv-export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error('Export failed');
      const blob = await resp.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'products-export.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      /* swallow — export is best-effort */
    } finally {
      setIsExporting(false);
    }
  }

  // ── Platform Connector Handlers ──────────────────────────────────────────

  async function handlePlatformValidate() {
    if (!platformStoreUrl || !platformApiKey || !platformApiSecret) return;
    setPlatformValidating(true);
    setPlatformValid(null);
    try {
      const { ShopifyConnector } = await import('@/services/connectors/ShopifyConnector');
      const { WooCommerceConnector } = await import('@/services/connectors/WooCommerceConnector');
      const Connector = platformType === 'shopify' ? ShopifyConnector : WooCommerceConnector;
      const connector = new Connector({
        storeUrl: platformStoreUrl,
        apiKey: platformApiKey,
        apiSecret: platformApiSecret,
      });
      const valid = await connector.validateCredentials();
      setPlatformValid(valid);
      if (valid) {
        // Pre-fetch categories on successful validation
        const cats = await connector.getCategories();
        setPlatformCategories(cats);
      }
    } catch {
      setPlatformValid(false);
    } finally {
      setPlatformValidating(false);
    }
  }

  async function handlePlatformImport() {
    if (!user?.uid) return;
    setPlatformImporting(true);
    setPlatformProgress('Connecting...');
    setPlatformResult(null);
    try {
      const { ShopifyConnector } = await import('@/services/connectors/ShopifyConnector');
      const { WooCommerceConnector } = await import('@/services/connectors/WooCommerceConnector');
      const { createProduct } = await import('@/services/productService');
      const Connector = platformType === 'shopify' ? ShopifyConnector : WooCommerceConnector;
      const connector = new Connector({
        storeUrl: platformStoreUrl,
        apiKey: platformApiKey,
        apiSecret: platformApiSecret,
      });

      const products = await connector.importAll(user.uid, platformCategoryId || undefined, (msg) =>
        setPlatformProgress(msg),
      );

      setPlatformProgress(`Saving ${products.length} products to Firestore...`);
      let imported = 0;
      const errors: string[] = [];
      for (const p of products) {
        try {
          await createProduct(p);
          imported++;
        } catch (err: any) {
          errors.push(`${p.title}: ${err?.message || 'Unknown error'}`);
        }
      }

      setPlatformResult({
        imported,
        skipped: products.length - imported,
        errors,
      });
      setPlatformProgress('');

      // Log import job
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await addDoc(collection(db, 'sellers', user.id, 'importJobs'), {
        feedName: `${platformType === 'shopify' ? 'Shopify' : 'WooCommerce'} Import`,
        type: 'api',
        status: 'completed',
        total: products.length,
        success: imported,
        failed: products.length - imported,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) {
      setPlatformResult({
        imported: 0,
        skipped: 0,
        errors: [err?.message || 'Import failed'],
      });
      setPlatformProgress('');
    } finally {
      setPlatformImporting(false);
    }
  }

  async function handlePlatformSave() {
    if (!user?.id || !platformStoreUrl || !platformApiKey) return;
    setPlatformSaving(true);
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await addDoc(collection(db, 'sellerIntegrations'), {
        sellerId: user.uid,
        userId: user.id,
        platform: platformType,
        storeUrl: platformStoreUrl,
        apiKey: platformApiKey,
        label: platformType === 'shopify' ? 'Shopify Store' : 'WooCommerce Store',
        createdAt: serverTimestamp(),
      });
      setPlatformSaved(true);
      setTimeout(() => setPlatformSaved(false), 2000);
    } catch {
      // silently fail save
    } finally {
      setPlatformSaving(false);
    }
  }

  useEffect(() => {
    if (!user?.id) return;
    getDocs(
      query(
        collection(db, 'sellers', user.id, 'importJobs'),
        orderBy('createdAt', 'desc'),
        limit(20),
      ),
    )
      .then((snap) => {
        setJobs(
          snap.empty
            ? MOCK_JOBS
            : snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ImportJob, 'id'>) })),
        );
      })
      .catch(() => {
        setJobs(MOCK_JOBS);
      })
      .finally(() => setLoadingJobs(false));
  }, [user?.id]);

  function handleDetectFields() {
    if (!sampleInput.trim()) return;
    let fields: FeedField[] = [];
    if (sampleType === 'xml') {
      fields = detectXmlFields(sampleInput);
    } else {
      const lines = sampleInput.trim().split('\n');
      if (lines.length > 0) {
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        const samples = lines[1] ? lines[1].split(',') : [];
        fields = headers.map((h, i) => ({
          name: h,
          sample: (samples[i] || '').trim().replace(/^"|"$/g, ''),
        }));
      }
    }
    setFeedFields(fields);
    setFieldMappings(heuristicMatch(fields.map((f) => f.name)));
  }

  async function handleAiMatch() {
    if (!feedFields.length) return;
    setAiMatching(true);
    try {
      const prompt = `Aşağıdaki ürün feed alanlarını Benim Olan sistem alanlarıyla eşleştir.
Feed alanları: ${feedFields.map((f) => f.name).join(', ')}
Sistem alanları: ${SYSTEM_FIELDS.map((f) => f.key).join(', ')}
Yanıtı sadece JSON olarak ver: {"feedAlanı": "sistemAlanı"} formatında. Eşleşme bulamazsan o alanı ekleme.`;
      const response = await askShoppingAssistant(prompt, {});
      const m = response.match(/\{[\s\S]*\}/);
      if (m) {
        const aiMap = JSON.parse(m[0]) as Record<string, string>;
        setFieldMappings((prev) => ({ ...prev, ...aiMap }));
      }
    } catch {
      /* keep heuristic results on Gemini failure */
    }
    setAiMatching(false);
  }

  async function handleSaveMapping() {
    if (!user?.id || !Object.keys(fieldMappings).length) return;
    await addDoc(collection(db, 'sellers', user.id, 'fieldMappings'), {
      feedType: sampleType,
      mappings: fieldMappings,
      createdAt: serverTimestamp(),
    });
    setMappingSaved(true);
    setTimeout(() => setMappingSaved(false), 2000);
  }

  async function handleSaveFeed() {
    if (!user?.id) return;
    setSavingFeed(true);
    try {
      await addDoc(collection(db, 'sellers', user.id, 'feedConfigs'), {
        name: xmlFeedName || 'XML Feed',
        type: 'xml',
        url: xmlUrl,
        syncInterval,
        options: xmlOpts,
        enabled: true,
        createdAt: serverTimestamp(),
      });
      const newJob: ImportJob = {
        id: Date.now().toString(),
        feedName: xmlFeedName || 'XML Feed',
        type: 'xml',
        status: 'queued',
        total: 0,
        success: 0,
        failed: 0,
        createdAt: new Date().toISOString(),
      };
      setJobs((prev) => [newJob, ...prev]);
      setFeedSaved(true);
      setTimeout(() => setFeedSaved(false), 2000);
      setXmlFeedName('');
      setXmlUrl('');
    } finally {
      setSavingFeed(false);
    }
  }

  function handleCsvFile(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const errors: string[] = [];
        const rows = (result.data as Record<string, string>[]).map((raw, i) => {
          const n = i + 2;
          if (!raw.title?.trim()) errors.push(`Satır ${n}: Ürün adı zorunlu`);
          if (!raw.price || isNaN(+raw.price)) errors.push(`Satır ${n}: Geçerli fiyat zorunlu`);
          if (!raw.stock || isNaN(+raw.stock)) errors.push(`Satır ${n}: Geçerli stok zorunlu`);
          if (!raw.categoryId?.trim()) errors.push(`Satır ${n}: Kategori ID zorunlu`);
          if (!raw.description?.trim()) errors.push(`Satır ${n}: Kısa açıklama zorunlu`);
          return raw;
        });
        setBulkErrors(errors);
        setBulkPreview(rows);
      },
    });
  }

  async function confirmBulkUpload() {
    if (!user?.id || !bulkPreview.length) return;
    setBulkUploading(true);
    setBulkProgress(0);
    const CHUNK = 5;
    for (let i = 0; i < bulkPreview.length; i += CHUNK) {
      const chunk = bulkPreview.slice(i, i + CHUNK);
      await Promise.all(
        chunk.map((raw) => {
          const slug = (raw.title || '')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 80);
          return createProduct({
            title: raw.title?.trim() || '',
            brand: raw.brand?.trim() || '',
            categoryId: raw.categoryId?.trim() || '',
            sku: raw.sku?.trim() || '',
            price: parseFloat(raw.price) || 0,
            oldPrice: raw.oldPrice ? parseFloat(raw.oldPrice) : undefined,
            currency: raw.currency?.trim() || 'TRY',
            stock: parseInt(raw.stock) || 0,
            description: raw.description?.trim() || '',
            longDescription: raw.longDescription?.trim() || '',
            images: raw.images
              ? raw.images
                  .split('|')
                  .map((u) => u.trim())
                  .filter(Boolean)
              : [],
            tags: raw.tags
              ? raw.tags
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
              : [],
            weight: parseFloat(raw.weight) || 0,
            originCountry: raw.originCountry?.trim() || 'Türkiye',
            hsCode: raw.hsCode?.trim() || '',
            estimatedDeliveryDays: parseInt(raw.estimatedDeliveryDays) || 3,
            deliveryTerms: raw.deliveryTerms?.trim() || '',
            returnPolicy: raw.returnPolicy?.trim() || '',
            visibility: (['public', 'hidden', 'draft'].includes(raw.visibility)
              ? raw.visibility
              : 'public') as 'public' | 'hidden',
            slug,
            sellerId: user!.uid,
            rating: 0,
            reviewsCount: 0,
            status: 'pending' as const,
          } as Omit<Product, 'id'>);
        }),
      );
      setBulkProgress(Math.min(i + CHUNK, bulkPreview.length));
    }
    setJobs((prev) => [
      {
        id: Date.now().toString(),
        feedName: 'CSV Toplu Yükleme',
        type: 'csv' as const,
        status: 'completed' as const,
        total: bulkPreview.length,
        success: bulkPreview.length,
        failed: 0,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setBulkPreview([]);
    setBulkErrors([]);
    setBulkUploading(false);
  }

  const totalImported = jobs.reduce((s, j) => s + j.success, 0);
  const syncErrors = jobs.reduce((s, j) => s + j.failed, 0);
  const activeFeeds = jobs.filter((j) => j.status === 'completed').length;

  const TABS: { key: ImportTab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Genel Bakış', icon: BarChart3 },
    { key: 'xml', label: 'XML Feed', icon: Link2 },
    { key: 'csv', label: 'CSV Yükleme', icon: Upload },
    { key: 'mapping', label: 'Alan Eşleştirme', icon: Layers },
    { key: 'logs', label: 'Geçmiş', icon: List },
    { key: 'templates', label: 'Şablonlar', icon: FileText },
    { key: 'platform', label: 'Platform Bağlantısı', icon: Globe },
  ];

  const requiredFields = SYSTEM_FIELDS.filter((sf) => sf.required);
  const coveredFields = requiredFields.filter((sf) =>
    Object.values(fieldMappings).includes(sf.key),
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileUp size={22} className="text-emerald-400" /> Import Center
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          XML, CSV ve API aracılığıyla ürünleri toplu içe aktarın
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors',
              activeTab === key
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white',
            )}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(
              [
                {
                  label: 'Toplam İçe Aktarılan',
                  value: totalImported.toLocaleString(),
                  icon: Package,
                  color: 'text-emerald-400',
                },
                {
                  label: 'Aktif Feed',
                  value: String(activeFeeds),
                  icon: RefreshCw,
                  color: 'text-blue-400',
                },
                {
                  label: 'Senkronizasyon Hatası',
                  value: String(syncErrors),
                  icon: AlertTriangle,
                  color: 'text-yellow-400',
                },
                { label: 'Onay Bekleyen', value: '—', icon: Clock, color: 'text-purple-400' },
              ] as const
            ).map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} className={color} />
                  <span className="text-xs text-zinc-400">{label}</span>
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="bg-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Hızlı İşlemler</h3>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  { label: 'XML Feed Bağla', icon: Link2, tab: 'xml' },
                  { label: 'CSV Yükle', icon: Upload, tab: 'csv' },
                  { label: 'Alan Eşleştir', icon: Layers, tab: 'mapping' },
                  { label: 'Şablon İndir', icon: Download, tab: 'templates' },
                ] as { label: string; icon: React.ElementType; tab: ImportTab }[]
              ).map(({ label, icon: Icon, tab }) => (
                <button
                  key={label}
                  onClick={() => setActiveTab(tab)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors"
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent jobs */}
          <div className="bg-zinc-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-700">
              <h3 className="text-sm font-semibold text-white">Son İçe Aktarmalar</h3>
            </div>
            {loadingJobs ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-zinc-500" />
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-center py-8 text-zinc-500 text-sm">Henüz içe aktarma yok</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-zinc-500 border-b border-zinc-700">
                    {['Feed Adı', 'Tür', 'Toplam', 'Başarılı', 'Başarısız', 'Durum', 'Tarih'].map(
                      (h) => (
                        <th key={h} className="text-start px-5 py-3 font-medium">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700/50">
                  {jobs.slice(0, 8).map((job) => (
                    <tr key={job.id} className="hover:bg-zinc-700/30 transition-colors">
                      <td className="px-5 py-3 text-white font-medium">{job.feedName}</td>
                      <td className="px-5 py-3">
                        <span className="bg-zinc-700 text-zinc-300 text-xs px-2 py-0.5 rounded">
                          {job.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-zinc-300">{job.total}</td>
                      <td className="px-5 py-3 text-emerald-400">{job.success}</td>
                      <td className="px-5 py-3 text-red-400">{job.failed}</td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'flex items-center gap-1 text-xs',
                            job.status === 'completed'
                              ? 'text-emerald-400'
                              : job.status === 'failed'
                                ? 'text-red-400'
                                : job.status === 'processing'
                                  ? 'text-blue-400'
                                  : 'text-zinc-400',
                          )}
                        >
                          {job.status === 'completed' && <CheckCircle size={12} />}
                          {job.status === 'failed' && <XCircle size={12} />}
                          {job.status === 'processing' && (
                            <Loader2 size={12} className="animate-spin" />
                          )}
                          {job.status === 'queued' && <Clock size={12} />}
                          {job.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-zinc-500 text-xs">
                        {new Date(job.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── XML FEED ── */}
      {activeTab === 'xml' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-zinc-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Feed Kaynağı</h3>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Feed Adı</label>
              <input
                value={xmlFeedName}
                onChange={(e) => setXmlFeedName(e.target.value)}
                placeholder="Örn: Ana Ürün Feed'i"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">XML Feed URL</label>
              <div className="flex gap-2">
                <input
                  value={xmlUrl}
                  onChange={(e) => setXmlUrl(e.target.value)}
                  placeholder="https://yourstore.com/feed.xml"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-xs transition-colors">
                  Test
                </button>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Senkronizasyon</h3>
            <div className="flex flex-wrap gap-2">
              {(['manual', '15m', '30m', '1h', 'daily'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setSyncInterval(v)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    syncInterval === v
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600',
                  )}
                >
                  {v === 'manual' ? 'Manuel' : v === 'daily' ? 'Günlük' : v}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-800 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-semibold text-white">Gelişmiş Seçenekler</h3>
            {(
              [
                ['updatePrice', 'Fiyatları güncelle'],
                ['updateStock', 'Stoku güncelle'],
                ['createNew', 'Yeni ürün oluştur'],
                ['disableMissing', "Feed'de olmayan ürünleri gizle"],
                ['autoPublish', 'Otomatik yayınla (onay atla)'],
              ] as [keyof typeof xmlOpts, string][]
            ).map(([key, label]) => (
              <label key={String(key)} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={xmlOpts[key]}
                  onChange={(e) => setXmlOpts((p) => ({ ...p, [key]: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-500"
                />
                <span className="text-sm text-zinc-300">{label}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleSaveFeed}
            disabled={savingFeed || (!xmlUrl && !xmlFeedName)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
          >
            {savingFeed ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
            {feedSaved
              ? 'Kaydedildi ✓'
              : savingFeed
                ? 'Kaydediliyor...'
                : 'Feed Kaydet & Kuyruğa Al'}
          </button>

          {/* Coming Soon integrations */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-700">
            {['ERP Bağlantısı', 'API Entegrasyonu', 'Webhook Ayarları', 'Marketplace Sync'].map(
              (label) => (
                <div
                  key={label}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 flex items-center justify-between"
                >
                  <span className="text-sm text-zinc-400">{label}</span>
                  <span className="text-xs bg-zinc-700 text-zinc-500 px-2 py-0.5 rounded-full">
                    Yakında
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* ── CSV UPLOAD ── */}
      {activeTab === 'csv' && (
        <div className="space-y-6 max-w-3xl">
          {/* Export button — top-right of CSV tab content area (SEL-05) */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 border border-zinc-600 text-zinc-300 hover:bg-zinc-700 px-3 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors"
            >
              {isExporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              {isExporting ? 'Dışa aktarılıyor…' : 'Ürünleri Dışa Aktar'}
            </button>
          </div>

          {/* Server-side CSV import (validated, partial import, error report) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              pickServerFile(e.dataTransfer.files[0]);
            }}
            onClick={() => serverCsvRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center min-h-48 text-center cursor-pointer transition-colors',
              isDragging
                ? 'border-[var(--accent,#6418E5)] bg-[var(--accent-soft,rgba(100,24,229,0.1))]'
                : 'border-zinc-600 hover:border-emerald-500',
            )}
          >
            <FileUp size={32} className="text-zinc-400 mb-2" />
            <p className="text-base text-zinc-300">Drop your CSV here or click to browse</p>
            <p className="text-sm text-zinc-500 mt-1">
              Max 10 MB · UTF-8 encoded · .csv files only
            </p>
            {selectedFile && (
              <div className="mt-4 inline-flex items-center gap-2 bg-zinc-700 rounded-full px-3 py-1">
                <FileText size={14} className="text-zinc-300" />
                <span className="text-xs text-zinc-200">{selectedFile.name}</span>
                <span className="text-xs text-zinc-400">{formatSize(selectedFile.size)}</span>
              </div>
            )}
          </div>
          <input
            ref={serverCsvRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => pickServerFile(e.target.files?.[0])}
          />

          {/* Import button + indeterminate progress */}
          <div>
            <button
              onClick={handleServerImport}
              disabled={!selectedFile || isImporting}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
            >
              {isImporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Importing… please wait
                </>
              ) : (
                'Import Products'
              )}
            </button>
            {isImporting && (
              <div className="h-1 w-full bg-zinc-700 mt-3 overflow-hidden rounded-full">
                <div className="h-full w-1/2 bg-emerald-500 animate-pulse" />
              </div>
            )}
          </div>

          {/* Import result banner */}
          {importResult && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'rounded-lg p-4 border',
                importResult.imported > 0
                  ? 'bg-green-900/20 border-green-700'
                  : 'bg-red-900/20 border-red-700',
              )}
            >
              <div className="flex items-center gap-2">
                {importResult.imported > 0 ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : (
                  <XCircle size={20} className="text-red-500" />
                )}
                <h4
                  className={cn(
                    'font-semibold',
                    importResult.imported > 0 ? 'text-green-300' : 'text-red-300',
                  )}
                >
                  {importResult.imported > 0 ? 'Import complete' : 'Import failed'}
                </h4>
              </div>
              <p className="text-sm text-zinc-300 mt-1">
                {importResult.imported} products imported / {importResult.skipped} rows skipped
              </p>
              {importResult.skipped > 0 && (
                <button
                  onClick={downloadErrorReport}
                  className="mt-3 flex items-center gap-2 border border-zinc-500 text-zinc-200 px-3 py-1 rounded text-sm hover:bg-zinc-700 transition-colors"
                >
                  <Download size={14} /> Download Error Report
                </button>
              )}
            </motion.div>
          )}

          <div className="border-t border-zinc-700 pt-2 text-xs text-zinc-500">
            Hızlı (istemci taraflı) önizleme yükleme — aşağıda
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f?.name.endsWith('.csv')) handleCsvFile(f);
            }}
            onClick={() => csvRef.current?.click()}
            className="border-2 border-dashed border-zinc-600 hover:border-emerald-500 rounded-xl p-10 text-center cursor-pointer transition-colors"
          >
            <Upload size={32} className="mx-auto text-zinc-500 mb-3" />
            <p className="text-sm text-zinc-400">CSV dosyasını buraya sürükleyin ya da tıklayın</p>
            <p className="text-xs text-zinc-600 mt-1">
              Şablona uygun sütunlar gereklidir (maks 500 ürün önerilir)
            </p>
          </div>
          <input
            ref={csvRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleCsvFile(f);
            }}
          />

          {bulkErrors.length > 0 && (
            <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-red-400 mb-2">{bulkErrors.length} Hata</h4>
              <ul className="space-y-1 max-h-36 overflow-y-auto">
                {bulkErrors.map((e, i) => (
                  <li key={i} className="text-xs text-red-300">
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bulkPreview.length > 0 && (
            <div className="bg-zinc-800 rounded-xl p-5">
              <p className="text-sm text-zinc-300 mb-4">
                <span className="text-emerald-400 font-bold">{bulkPreview.length} ürün</span>{' '}
                yüklenmeye hazır
                {bulkErrors.length > 0 && (
                  <span className="text-yellow-400 ms-2">({bulkErrors.length} hata var)</span>
                )}
              </p>
              {bulkUploading && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>İçe aktarılıyor...</span>
                    <span>
                      {bulkProgress}/{bulkPreview.length}
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${(bulkProgress / bulkPreview.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={confirmBulkUpload}
                  disabled={bulkUploading}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
                >
                  {bulkUploading ? 'Yükleniyor...' : 'Ürünleri İçe Aktar'}
                </button>
                <button
                  onClick={() => {
                    setBulkPreview([]);
                    setBulkErrors([]);
                  }}
                  className="px-4 py-2 bg-zinc-700 text-zinc-300 text-sm rounded-lg hover:bg-zinc-600"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FIELD MAPPING ── */}
      {activeTab === 'mapping' && (
        <div className="space-y-6">
          {/* Step 1: Paste sample */}
          <div className="bg-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Adım 1 — Feed&apos;den Örnek Yapıştır
            </h3>
            <div className="flex gap-2 mb-3">
              {(['xml', 'csv'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSampleType(t)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold',
                    sampleType === t ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-400',
                  )}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            <textarea
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
              rows={6}
              placeholder={
                sampleType === 'xml'
                  ? '<product>\n  <productName>Test</productName>\n  <salePrice>149.99</salePrice>\n  <qty>50</qty>\n</product>'
                  : 'productName,salePrice,qty\nTest Ürün,149.99,50'
              }
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono resize-none focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleDetectFields}
              disabled={!sampleInput.trim()}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
            >
              <ArrowRight size={14} /> Alanları Algıla
            </button>
          </div>

          {/* Step 2: Map fields */}
          {feedFields.length > 0 && (
            <div className="bg-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-white">
                  Adım 2 — Alan Eşleştirme
                  <span className="ms-2 text-xs text-zinc-500">
                    ({feedFields.length} alan algılandı)
                  </span>
                </h3>
                <button
                  onClick={handleAiMatch}
                  disabled={aiMatching}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                >
                  {aiMatching ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Wand2 size={12} />
                  )}
                  {aiMatching ? 'AI eşleştiriyor...' : '✨ AI ile Otomatik Eşleştir'}
                </button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_40px_1fr] gap-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider px-1 mb-3">
                  <span>Feed Alanı</span>
                  <span />
                  <span>Benim Olan Sistem Alanı</span>
                </div>
                {feedFields.map(({ name, sample }) => (
                  <div key={name} className="grid grid-cols-[1fr_40px_1fr] gap-3 items-center">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2">
                      <p className="text-sm text-emerald-400 font-mono">{name}</p>
                      {sample && <p className="text-xs text-zinc-500 truncate mt-0.5">{sample}</p>}
                    </div>
                    <div className="text-zinc-600 text-center">→</div>
                    <select
                      value={fieldMappings[name] ?? ''}
                      onChange={(e) => {
                        setFieldMappings((prev) => {
                          const next = { ...prev };
                          if (e.target.value) next[name] = e.target.value;
                          else delete next[name];
                          return next;
                        });
                      }}
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Eşleştirme yok --</option>
                      {SYSTEM_FIELDS.map((sf) => (
                        <option key={sf.key} value={sf.key}>
                          {sf.label}
                          {sf.required ? ' *' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Required field coverage indicator */}
              <div className="mt-4 pt-4 border-t border-zinc-700">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>Zorunlu alan kapsamı</span>
                  <span>
                    {coveredFields.length}/{requiredFields.length}
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all rounded-full"
                    style={{ width: `${(coveredFields.length / requiredFields.length) * 100}%` }}
                  />
                </div>
              </div>

              <button
                onClick={handleSaveMapping}
                disabled={!Object.keys(fieldMappings).length}
                className="mt-4 flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
              >
                {mappingSaved ? 'Kaydedildi ✓' : 'Eşleştirmeyi Kaydet'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── LOGS ── */}
      {activeTab === 'logs' && (
        <div className="bg-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">İçe Aktarma Geçmişi</h3>
            <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
              <Download size={12} /> Dışa Aktar
            </button>
          </div>
          {loadingJobs ? (
            <div className="flex justify-center py-8">
              <Loader2 size={18} className="animate-spin text-zinc-500" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-center py-8 text-zinc-500 text-sm">İçe aktarma geçmişi yok</p>
          ) : (
            <div className="divide-y divide-zinc-700/50">
              {jobs.map((job) => (
                <div key={job.id} className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{job.feedName}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {job.type.toUpperCase()} • {new Date(job.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-1 rounded-full',
                        job.status === 'completed'
                          ? 'bg-emerald-900/40 text-emerald-400'
                          : job.status === 'failed'
                            ? 'bg-red-900/40 text-red-400'
                            : 'bg-zinc-700 text-zinc-400',
                      )}
                    >
                      {job.status}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                    <span>
                      Toplam: <span className="text-white">{job.total}</span>
                    </span>
                    <span>
                      Başarılı: <span className="text-emerald-400">{job.success}</span>
                    </span>
                    <span>
                      Başarısız: <span className="text-red-400">{job.failed}</span>
                    </span>
                  </div>
                  {job.errors && job.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-yellow-400 cursor-pointer">
                        {job.errors.length} hata görüntüle
                      </summary>
                      <ul className="mt-1 space-y-0.5 ps-3">
                        {job.errors.map((e, i) => (
                          <li key={i} className="text-xs text-red-300">
                            Satır {e.line}: {e.message}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TEMPLATES ── */}
      {activeTab === 'templates' && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-1">CSV Şablonu</h3>
            <p className="text-xs text-zinc-400 mb-4">
              {CSV_COLUMNS.length} kolonlu standart şablon. BOM eklidir — Excel ve Numbers ile
              açılır.
            </p>
            <button
              onClick={downloadCsvTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
            >
              <Download size={14} /> CSV Şablonu İndir
            </button>
          </div>

          <div className="bg-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-1">XML Şablonu</h3>
            <p className="text-xs text-zinc-400 mb-4">Standart Benim Olan XML feed formatı.</p>
            <button
              onClick={() => {
                const xml = [
                  '<?xml version="1.0" encoding="UTF-8"?>',
                  '<products>',
                  '  <product>',
                  '    <title>Örnek Ürün</title>',
                  '    <brand>Marka</brand>',
                  '    <sku>SKU-001</sku>',
                  '    <price>149.99</price>',
                  '    <oldPrice>199.99</oldPrice>',
                  '    <currency>TRY</currency>',
                  '    <stock>50</stock>',
                  '    <description>Kısa açıklama</description>',
                  '    <images>https://example.com/img1.jpg|https://example.com/img2.jpg</images>',
                  '    <tags>spor,outdoor</tags>',
                  '    <weight>0.5</weight>',
                  '    <originCountry>Türkiye</originCountry>',
                  '  </product>',
                  '</products>',
                ].join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([xml], { type: 'text/xml;charset=utf-8;' }));
                a.download = 'mercora-feed-sablonu.xml';
                a.click();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
            >
              <Download size={14} /> XML Şablonu İndir
            </button>
          </div>

          <div className="bg-zinc-800 rounded-xl p-6 overflow-x-auto">
            <h3 className="text-sm font-semibold text-white mb-4">Alan Referansı</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-700">
                  <th className="text-start pb-2 pe-4 font-medium">Alan</th>
                  <th className="text-start pb-2 pe-4 font-medium">Zorunlu</th>
                  <th className="text-start pb-2 font-medium">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/30">
                {SYSTEM_FIELDS.map((f) => (
                  <tr key={f.key}>
                    <td className="py-1.5 pe-4 font-mono text-emerald-400">{f.key}</td>
                    <td className="py-1.5 pe-4 text-center">{f.required ? '✓' : '—'}</td>
                    <td className="py-1.5 text-zinc-400">{f.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PLATFORM BAĞLANTISI ── */}
      {activeTab === 'platform' && (
        <div className="space-y-6 max-w-2xl">
          {/* Platform selector */}
          <div className="bg-zinc-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Platform Se\xE7imi</h3>
            <div className="flex gap-3">
              {[
                { key: 'shopify' as const, label: 'Shopify', icon: ShoppingCart },
                { key: 'woocommerce' as const, label: 'WooCommerce', icon: Store },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setPlatformType(key);
                    setPlatformValid(null);
                    setPlatformResult(null);
                    setPlatformCategories([]);
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors flex-1',
                    platformType === key
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600',
                  )}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Credentials */}
          <div className="bg-zinc-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">
              {platformType === 'shopify' ? 'Shopify API Bilgileri' : 'WooCommerce API Bilgileri'}
            </h3>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Mağaza URL</label>
              <input
                value={platformStoreUrl}
                onChange={(e) => {
                  setPlatformStoreUrl(e.target.value);
                  setPlatformValid(null);
                }}
                placeholder={
                  platformType === 'shopify'
                    ? 'https://your-store.myshopify.com'
                    : 'https://your-store.com'
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                {platformType === 'shopify' ? 'API Key / Access Token' : 'Consumer Key'}
              </label>
              <input
                value={platformApiKey}
                onChange={(e) => {
                  setPlatformApiKey(e.target.value);
                  setPlatformValid(null);
                }}
                type="password"
                placeholder={
                  platformType === 'shopify'
                    ? 'shpat_xxxxxxxxxxxxxxxxxxxx'
                    : 'ck_xxxxxxxxxxxxxxxxxxxxxxxx'
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                {platformType === 'shopify' ? 'API Secret Key' : 'Consumer Secret'}
              </label>
              <input
                value={platformApiSecret}
                onChange={(e) => {
                  setPlatformApiSecret(e.target.value);
                  setPlatformValid(null);
                }}
                type="password"
                placeholder={
                  platformType === 'shopify'
                    ? 'shpss_xxxxxxxxxxxxxxxxxxxx'
                    : 'cs_xxxxxxxxxxxxxxxxxxxxxxxx'
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Category mapping (shown after validation) */}
            {platformCategories.length > 0 && (
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Varsayılan Kategori (isteğe bağlı)
                </label>
                <select
                  value={platformCategoryId}
                  onChange={(e) => setPlatformCategoryId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Se\xE7ilmedi --</option>
                  {platformCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Validation result */}
            {platformValid !== null && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'rounded-lg px-4 py-3 text-sm font-medium',
                  platformValid
                    ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700'
                    : 'bg-red-900/30 text-red-400 border border-red-700',
                )}
              >
                <div className="flex items-center gap-2">
                  {platformValid ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {platformValid
                    ? 'Bağlantı başarılı!'
                    : 'Bağlantı başarısız — bilgileri kontrol edin'}
                </div>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handlePlatformValidate}
                disabled={
                  platformValidating || !platformStoreUrl || !platformApiKey || !platformApiSecret
                }
                className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {platformValidating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Link2 size={14} />
                )}
                Bağlantıyı Test Et
              </button>

              <button
                onClick={handlePlatformImport}
                disabled={platformImporting || !platformValid}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
              >
                {platformImporting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                Ürünleri İçe Aktar
              </button>

              <button
                onClick={handlePlatformSave}
                disabled={platformSaving || !platformValid || !platformStoreUrl}
                className="flex items-center gap-2 px-4 py-2 border border-zinc-600 text-zinc-300 hover:bg-zinc-700 text-sm rounded-lg disabled:opacity-50 transition-colors"
              >
                {platformSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Database size={14} />
                )}
                {platformSaved ? 'Kaydedildi ✓' : 'Bilgileri Kaydet'}
              </button>
            </div>
          </div>

          {/* Import progress */}
          {platformImporting && platformProgress && (
            <div className="bg-zinc-800 rounded-xl p-5 border border-emerald-700/50">
              <div className="flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-emerald-400" />
                <div>
                  <p className="text-sm text-white font-medium">İçe aktarılıyor...</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{platformProgress}</p>
                </div>
              </div>
              <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-emerald-500 animate-pulse rounded-full w-2/3" />
              </div>
            </div>
          )}

          {/* Import result */}
          {platformResult && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-xl p-5 border',
                platformResult.imported > 0
                  ? 'bg-emerald-900/20 border-emerald-700'
                  : 'bg-red-900/20 border-red-700',
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                {platformResult.imported > 0 ? (
                  <CheckCircle size={20} className="text-emerald-400" />
                ) : (
                  <XCircle size={20} className="text-red-400" />
                )}
                <h4
                  className={cn(
                    'font-semibold text-sm',
                    platformResult.imported > 0 ? 'text-emerald-300' : 'text-red-300',
                  )}
                >
                  {platformResult.imported > 0 ? 'İçe aktarma tamamlandı' : 'İçe aktarma başarısız'}
                </h4>
              </div>
              <div className="flex gap-6 text-sm">
                <span className="text-emerald-400">
                  {platformResult.imported} ürün içe aktarıldı
                </span>
                <span className="text-zinc-400">{platformResult.skipped} atlandı</span>
              </div>
              {platformResult.errors.length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs text-yellow-400 cursor-pointer">
                    {platformResult.errors.length} hata görüntüle
                  </summary>
                  <ul className="mt-2 space-y-0.5 max-h-32 overflow-y-auto">
                    {platformResult.errors.map((e, i) => (
                      <li key={i} className="text-xs text-red-300">
                        {e}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </motion.div>
          )}

          {/* Help text */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Nasıl Çalışır?
            </h4>
            <ol className="space-y-2 text-xs text-zinc-400">
              <li className="flex gap-2">
                <span className="text-emerald-400 font-bold">1.</span>
                {platformType === 'shopify'
                  ? "Shopify Admin'den bir private app oluşturun veya Admin API access token alın."
                  : 'WooCommerce > Settings > Advanced > REST API \xFCzerinden API key oluşturun.'}
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 font-bold">2.</span>
                Mağaza URL, API key ve secret bilgilerini yukarı girin.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 font-bold">3.</span>
                Bağlantıyı test edin, ardından ürünleri içe aktarın.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 font-bold">4.</span>
                Ürün görselleri otomatik olarak Benim Olan depolama alanına yüklenir.
              </li>
            </ol>
            {platformType === 'shopify' && (
              <p className="text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-700">
                Shopify private app oluşturmak için: Shopify Admin {`>`} Settings {`>`} Apps and
                sales channels {`>`} Develop apps. Admin API scopes: read_products, read_inventory.
              </p>
            )}
            {platformType === 'woocommerce' && (
              <p className="text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-700">
                WooCommerce API key&apos;i: WooCommerce {`>`} Settings {`>`} Advanced {`>`} REST
                API. Permissions: Read.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
