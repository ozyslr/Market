import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Papa from 'papaparse';
import { CSV_COLUMNS, downloadCsvTemplate } from '@/lib/csvTemplate';
import { askShoppingAssistant } from '@/lib/gemini';
import { createProduct } from '@/services/productService';
import { Product } from '@/types';
import {
  BarChart3, Link2, Upload, Layers, List, FileText, FileUp,
  RefreshCw, Download, CheckCircle, XCircle, Clock, AlertTriangle,
  Loader2, Wand2, ArrowRight, Database, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ImportTab = 'overview' | 'xml' | 'csv' | 'mapping' | 'logs' | 'templates';

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

interface FeedField { name: string; sample: string; }

const SYSTEM_FIELDS = [
  { key: 'title',                 label: 'Ürün Adı',            required: true  },
  { key: 'brand',                 label: 'Marka',               required: false },
  { key: 'categoryId',            label: 'Kategori ID',         required: true  },
  { key: 'sku',                   label: 'SKU',                 required: false },
  { key: 'price',                 label: 'Fiyat',               required: true  },
  { key: 'oldPrice',              label: 'Eski Fiyat',          required: false },
  { key: 'currency',              label: 'Para Birimi',         required: false },
  { key: 'stock',                 label: 'Stok',                required: true  },
  { key: 'description',           label: 'Kısa Açıklama',       required: true  },
  { key: 'longDescription',       label: 'Detaylı Açıklama',    required: false },
  { key: 'images',                label: 'Görsel URL(lar)',      required: false },
  { key: 'tags',                  label: 'Etiketler',           required: false },
  { key: 'weight',                label: 'Ağırlık (kg)',        required: false },
  { key: 'originCountry',         label: 'Menşei Ülke',         required: false },
  { key: 'hsCode',                label: 'HS Kodu',             required: false },
  { key: 'estimatedDeliveryDays', label: 'Teslimat Süresi (G)', required: false },
  { key: 'deliveryTerms',         label: 'Teslimat Koşulları',  required: false },
  { key: 'returnPolicy',          label: 'İade Politikası',     required: false },
  { key: 'visibility',            label: 'Görünürlük',          required: false },
] as const;

type SystemFieldKey = typeof SYSTEM_FIELDS[number]['key'];

function heuristicMatch(feedFields: string[]): Record<string, string> {
  const aliases: Record<string, string[]> = {
    title:                 ['title','name','productname','product_name','baslik','urunadi','isim','ad'],
    price:                 ['price','saleprice','sale_price','fiyat','satısfiyat','birimfiyat','unit_price'],
    oldPrice:              ['oldprice','old_price','listprice','list_price','eskifiyat'],
    stock:                 ['stock','quantity','qty','stok','miktar','adet','available'],
    brand:                 ['brand','marka','manufacturer','vendor','uretici'],
    categoryId:            ['category','categoryid','cat','kategori','category_id'],
    sku:                   ['sku','code','productcode','product_code','kod','stok_kodu','barkod','barcode'],
    description:           ['description','desc','summary','aciklama','ozet','kisaciklama','short_description'],
    longDescription:       ['longdescription','long_description','detail','fulldescription','detayli'],
    images:                ['image','images','img','photo','picture','gorsel','resim','imageurl','image_url'],
    tags:                  ['tags','keywords','etiket','anahtar','label'],
    weight:                ['weight','agirlik','kg','gram','gr'],
    originCountry:         ['origin','country','mense','uretimyeri','mensei'],
    hsCode:                ['hscode','hs_code','gtip','tariff','gtipno'],
    estimatedDeliveryDays: ['deliveryday','delivery_day','teslimat','kargogun'],
  };
  const result: Record<string, string> = {};
  for (const ff of feedFields) {
    const lf = ff.toLowerCase().replace(/[-_\s]/g, '');
    for (const [sysKey, list] of Object.entries(aliases)) {
      if (list.some(a => lf === a || lf.includes(a) || a.includes(lf))) {
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
    for (const s of selectors) { first = xmlDoc.querySelector(s); if (first) break; }
    if (!first) return [];
    return Array.from(first.children).map(c => ({
      name: c.tagName,
      sample: (c.textContent ?? '').slice(0, 60),
    }));
  } catch { return []; }
}

const MOCK_JOBS: ImportJob[] = [
  { id: 'm1', feedName: 'Örnek XML Feed',    type: 'xml', status: 'completed', total: 1247, success: 1231, failed: 16, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'm2', feedName: 'CSV Toplu Yükleme', type: 'csv', status: 'completed', total: 48,   success: 48,   failed: 0,  createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'm3', feedName: 'Sezon Feed',        type: 'xml', status: 'failed',    total: 200,  success: 87,   failed: 113, createdAt: new Date(Date.now() - 259200000).toISOString(),
    errors: [{ line: 45, message: 'Geçersiz fiyat formatı' }, { line: 88, message: 'Eksik kategori ID' }] },
];

export function SellerImportCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ImportTab>('overview');
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // XML tab state
  const [xmlFeedName, setXmlFeedName] = useState('');
  const [xmlUrl, setXmlUrl] = useState('');
  const [syncInterval, setSyncInterval] = useState<'manual' | '15m' | '30m' | '1h' | 'daily'>('daily');
  const [xmlOpts, setXmlOpts] = useState({
    updatePrice: true, updateStock: true, createNew: true,
    disableMissing: false, autoPublish: false,
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

  useEffect(() => {
    if (!user?.id) return;
    getDocs(query(
      collection(db, 'sellers', user.id, 'importJobs'),
      orderBy('createdAt', 'desc'),
      limit(20),
    )).then(snap => {
      setJobs(snap.empty
        ? MOCK_JOBS
        : snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ImportJob, 'id'>) }))
      );
    }).catch(() => { setJobs(MOCK_JOBS); }).finally(() => setLoadingJobs(false));
  }, [user?.id]);

  function handleDetectFields() {
    if (!sampleInput.trim()) return;
    let fields: FeedField[] = [];
    if (sampleType === 'xml') {
      fields = detectXmlFields(sampleInput);
    } else {
      const lines = sampleInput.trim().split('\n');
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const samples = lines[1] ? lines[1].split(',') : [];
        fields = headers.map((h, i) => ({ name: h, sample: (samples[i] || '').trim().replace(/^"|"$/g, '') }));
      }
    }
    setFeedFields(fields);
    setFieldMappings(heuristicMatch(fields.map(f => f.name)));
  }

  async function handleAiMatch() {
    if (!feedFields.length) return;
    setAiMatching(true);
    try {
      const prompt = `Aşağıdaki ürün feed alanlarını Mercora sistem alanlarıyla eşleştir.
Feed alanları: ${feedFields.map(f => f.name).join(', ')}
Sistem alanları: ${SYSTEM_FIELDS.map(f => f.key).join(', ')}
Yanıtı sadece JSON olarak ver: {"feedAlanı": "sistemAlanı"} formatında. Eşleşme bulamazsan o alanı ekleme.`;
      const response = await askShoppingAssistant(prompt, {});
      const m = response.match(/\{[\s\S]*\}/);
      if (m) {
        const aiMap = JSON.parse(m[0]) as Record<string, string>;
        setFieldMappings(prev => ({ ...prev, ...aiMap }));
      }
    } catch { /* keep heuristic results on Gemini failure */ }
    setAiMatching(false);
  }

  async function handleSaveMapping() {
    if (!user?.id || !Object.keys(fieldMappings).length) return;
    await addDoc(collection(db, 'sellers', user.id, 'fieldMappings'), {
      feedType: sampleType, mappings: fieldMappings, createdAt: serverTimestamp(),
    });
    setMappingSaved(true);
    setTimeout(() => setMappingSaved(false), 2000);
  }

  async function handleSaveFeed() {
    if (!user?.id) return;
    setSavingFeed(true);
    try {
      await addDoc(collection(db, 'sellers', user.id, 'feedConfigs'), {
        name: xmlFeedName || 'XML Feed', type: 'xml', url: xmlUrl,
        syncInterval, options: xmlOpts, enabled: true, createdAt: serverTimestamp(),
      });
      const newJob: ImportJob = {
        id: Date.now().toString(), feedName: xmlFeedName || 'XML Feed',
        type: 'xml', status: 'queued', total: 0, success: 0, failed: 0,
        createdAt: new Date().toISOString(),
      };
      setJobs(prev => [newJob, ...prev]);
      setFeedSaved(true);
      setTimeout(() => setFeedSaved(false), 2000);
      setXmlFeedName('');
      setXmlUrl('');
    } finally { setSavingFeed(false); }
  }

  function handleCsvFile(file: File) {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => {
        const errors: string[] = [];
        const rows = (result.data as Record<string, string>[]).map((raw, i) => {
          const n = i + 2;
          if (!raw.title?.trim())              errors.push(`Satır ${n}: Ürün adı zorunlu`);
          if (!raw.price || isNaN(+raw.price)) errors.push(`Satır ${n}: Geçerli fiyat zorunlu`);
          if (!raw.stock || isNaN(+raw.stock)) errors.push(`Satır ${n}: Geçerli stok zorunlu`);
          if (!raw.categoryId?.trim())         errors.push(`Satır ${n}: Kategori ID zorunlu`);
          if (!raw.description?.trim())        errors.push(`Satır ${n}: Kısa açıklama zorunlu`);
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
      await Promise.all(chunk.map(raw => {
        const slug = (raw.title || '').toLowerCase()
          .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 80);
        return createProduct({
          title:       raw.title?.trim() || '',
          brand:       raw.brand?.trim() || '',
          categoryId:  raw.categoryId?.trim() || '',
          sku:         raw.sku?.trim() || '',
          price:       parseFloat(raw.price) || 0,
          oldPrice:    raw.oldPrice ? parseFloat(raw.oldPrice) : undefined,
          currency:    raw.currency?.trim() || 'TRY',
          stock:       parseInt(raw.stock) || 0,
          description: raw.description?.trim() || '',
          longDescription: raw.longDescription?.trim() || '',
          images:    raw.images ? raw.images.split('|').map(u => u.trim()).filter(Boolean) : [],
          tags:      raw.tags   ? raw.tags.split(',').map(t => t.trim()).filter(Boolean)  : [],
          weight:          parseFloat(raw.weight) || 0,
          originCountry:   raw.originCountry?.trim() || 'Türkiye',
          hsCode:          raw.hsCode?.trim() || '',
          estimatedDeliveryDays: parseInt(raw.estimatedDeliveryDays) || 3,
          deliveryTerms:   raw.deliveryTerms?.trim() || '',
          returnPolicy:    raw.returnPolicy?.trim() || '',
          visibility: (['public', 'hidden', 'draft'].includes(raw.visibility)
            ? raw.visibility : 'public') as 'public' | 'hidden',
          slug,
          sellerId:     user!.uid,
          rating:       0,
          reviewsCount: 0,
          status:       'pending' as const,
        } as Omit<Product, 'id'>);
      }));
      setBulkProgress(Math.min(i + CHUNK, bulkPreview.length));
    }
    setJobs(prev => [{
      id: Date.now().toString(), feedName: 'CSV Toplu Yükleme', type: 'csv' as const,
      status: 'completed' as const, total: bulkPreview.length,
      success: bulkPreview.length, failed: 0, createdAt: new Date().toISOString(),
    }, ...prev]);
    setBulkPreview([]);
    setBulkErrors([]);
    setBulkUploading(false);
  }

  const totalImported = jobs.reduce((s, j) => s + j.success, 0);
  const syncErrors    = jobs.reduce((s, j) => s + j.failed,   0);
  const activeFeeds   = jobs.filter(j => j.status === 'completed').length;

  const TABS: { key: ImportTab; label: string; icon: React.ElementType }[] = [
    { key: 'overview',  label: 'Genel Bakış',     icon: BarChart3 },
    { key: 'xml',       label: 'XML Feed',        icon: Link2     },
    { key: 'csv',       label: 'CSV Yükleme',     icon: Upload    },
    { key: 'mapping',   label: 'Alan Eşleştirme', icon: Layers    },
    { key: 'logs',      label: 'Geçmiş',          icon: List      },
    { key: 'templates', label: 'Şablonlar',       icon: FileText  },
  ];

  const requiredFields = SYSTEM_FIELDS.filter(sf => sf.required);
  const coveredFields  = requiredFields.filter(sf => Object.values(fieldMappings).includes(sf.key));

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
          <button key={key} onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors',
              activeTab === key
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white',
            )}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              { label: 'Toplam İçe Aktarılan', value: totalImported.toLocaleString(), icon: Package,       color: 'text-emerald-400' },
              { label: 'Aktif Feed',            value: String(activeFeeds),            icon: RefreshCw,     color: 'text-blue-400'    },
              { label: 'Senkronizasyon Hatası', value: String(syncErrors),             icon: AlertTriangle, color: 'text-yellow-400'  },
              { label: 'Onay Bekleyen',         value: '—',                            icon: Clock,         color: 'text-purple-400'  },
            ] as const).map(({ label, value, icon: Icon, color }) => (
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
              {([
                { label: 'XML Feed Bağla', icon: Link2,    tab: 'xml'       },
                { label: 'CSV Yükle',      icon: Upload,   tab: 'csv'       },
                { label: 'Alan Eşleştir',  icon: Layers,   tab: 'mapping'   },
                { label: 'Şablon İndir',   icon: Download, tab: 'templates' },
              ] as { label: string; icon: React.ElementType; tab: ImportTab }[]).map(({ label, icon: Icon, tab }) => (
                <button key={label} onClick={() => setActiveTab(tab)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors">
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
                    {['Feed Adı', 'Tür', 'Toplam', 'Başarılı', 'Başarısız', 'Durum', 'Tarih'].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700/50">
                  {jobs.slice(0, 8).map(job => (
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
                        <span className={cn('flex items-center gap-1 text-xs',
                          job.status === 'completed'  ? 'text-emerald-400' :
                          job.status === 'failed'     ? 'text-red-400'     :
                          job.status === 'processing' ? 'text-blue-400'    : 'text-zinc-400')}>
                          {job.status === 'completed'  && <CheckCircle size={12} />}
                          {job.status === 'failed'     && <XCircle size={12} />}
                          {job.status === 'processing' && <Loader2 size={12} className="animate-spin" />}
                          {job.status === 'queued'     && <Clock size={12} />}
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
              <input value={xmlFeedName} onChange={e => setXmlFeedName(e.target.value)}
                placeholder="Örn: Ana Ürün Feed'i"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">XML Feed URL</label>
              <div className="flex gap-2">
                <input value={xmlUrl} onChange={e => setXmlUrl(e.target.value)}
                  placeholder="https://yourstore.com/feed.xml"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                <button className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-xs transition-colors">
                  Test
                </button>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Senkronizasyon</h3>
            <div className="flex flex-wrap gap-2">
              {(['manual', '15m', '30m', '1h', 'daily'] as const).map(v => (
                <button key={v} onClick={() => setSyncInterval(v)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    syncInterval === v ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600')}>
                  {v === 'manual' ? 'Manuel' : v === 'daily' ? 'Günlük' : v}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-800 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-semibold text-white">Gelişmiş Seçenekler</h3>
            {([
              ['updatePrice',    'Fiyatları güncelle'],
              ['updateStock',    'Stoku güncelle'],
              ['createNew',      'Yeni ürün oluştur'],
              ['disableMissing', "Feed'de olmayan ürünleri gizle"],
              ['autoPublish',    'Otomatik yayınla (onay atla)'],
            ] as [keyof typeof xmlOpts, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={xmlOpts[key]}
                  onChange={e => setXmlOpts(p => ({ ...p, [key]: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-500" />
                <span className="text-sm text-zinc-300">{label}</span>
              </label>
            ))}
          </div>

          <button onClick={handleSaveFeed} disabled={savingFeed || (!xmlUrl && !xmlFeedName)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors">
            {savingFeed ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
            {feedSaved ? 'Kaydedildi ✓' : savingFeed ? 'Kaydediliyor...' : 'Feed Kaydet & Kuyruğa Al'}
          </button>

          {/* Coming Soon integrations */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-700">
            {['ERP Bağlantısı', 'API Entegrasyonu', 'Webhook Ayarları', 'Marketplace Sync'].map(label => (
              <div key={label} className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm text-zinc-400">{label}</span>
                <span className="text-xs bg-zinc-700 text-zinc-500 px-2 py-0.5 rounded-full">Yakında</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CSV UPLOAD ── */}
      {activeTab === 'csv' && (
        <div className="space-y-6 max-w-3xl">
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f?.name.endsWith('.csv')) handleCsvFile(f);
            }}
            onClick={() => csvRef.current?.click()}
            className="border-2 border-dashed border-zinc-600 hover:border-emerald-500 rounded-xl p-10 text-center cursor-pointer transition-colors">
            <Upload size={32} className="mx-auto text-zinc-500 mb-3" />
            <p className="text-sm text-zinc-400">CSV dosyasını buraya sürükleyin ya da tıklayın</p>
            <p className="text-xs text-zinc-600 mt-1">Şablona uygun sütunlar gereklidir (maks 500 ürün önerilir)</p>
          </div>
          <input ref={csvRef} type="file" accept=".csv" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); }} />

          {bulkErrors.length > 0 && (
            <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-red-400 mb-2">{bulkErrors.length} Hata</h4>
              <ul className="space-y-1 max-h-36 overflow-y-auto">
                {bulkErrors.map((e, i) => <li key={i} className="text-xs text-red-300">{e}</li>)}
              </ul>
            </div>
          )}

          {bulkPreview.length > 0 && (
            <div className="bg-zinc-800 rounded-xl p-5">
              <p className="text-sm text-zinc-300 mb-4">
                <span className="text-emerald-400 font-bold">{bulkPreview.length} ürün</span> yüklenmeye hazır
                {bulkErrors.length > 0 && (
                  <span className="text-yellow-400 ml-2">({bulkErrors.length} hata var)</span>
                )}
              </p>
              {bulkUploading && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>İçe aktarılıyor...</span>
                    <span>{bulkProgress}/{bulkPreview.length}</span>
                  </div>
                  <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${(bulkProgress / bulkPreview.length) * 100}%` }} />
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={confirmBulkUpload} disabled={bulkUploading}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg disabled:opacity-50 transition-colors">
                  {bulkUploading ? 'Yükleniyor...' : 'Ürünleri İçe Aktar'}
                </button>
                <button onClick={() => { setBulkPreview([]); setBulkErrors([]); }}
                  className="px-4 py-2 bg-zinc-700 text-zinc-300 text-sm rounded-lg hover:bg-zinc-600">
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
            <h3 className="text-sm font-semibold text-white mb-4">Adım 1 — Feed'den Örnek Yapıştır</h3>
            <div className="flex gap-2 mb-3">
              {(['xml', 'csv'] as const).map(t => (
                <button key={t} onClick={() => setSampleType(t)}
                  className={cn('px-3 py-1 rounded-lg text-xs font-semibold',
                    sampleType === t ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-400')}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            <textarea value={sampleInput} onChange={e => setSampleInput(e.target.value)} rows={6}
              placeholder={sampleType === 'xml'
                ? '<product>\n  <productName>Test</productName>\n  <salePrice>149.99</salePrice>\n  <qty>50</qty>\n</product>'
                : 'productName,salePrice,qty\nTest Ürün,149.99,50'}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono resize-none focus:outline-none focus:border-emerald-500" />
            <button onClick={handleDetectFields} disabled={!sampleInput.trim()}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg disabled:opacity-50 transition-colors">
              <ArrowRight size={14} /> Alanları Algıla
            </button>
          </div>

          {/* Step 2: Map fields */}
          {feedFields.length > 0 && (
            <div className="bg-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-white">
                  Adım 2 — Alan Eşleştirme
                  <span className="ml-2 text-xs text-zinc-500">({feedFields.length} alan algılandı)</span>
                </h3>
                <button onClick={handleAiMatch} disabled={aiMatching}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
                  {aiMatching ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  {aiMatching ? 'AI eşleştiriyor...' : '✨ AI ile Otomatik Eşleştir'}
                </button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_40px_1fr] gap-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider px-1 mb-3">
                  <span>Feed Alanı</span><span /><span>Mercora Sistem Alanı</span>
                </div>
                {feedFields.map(({ name, sample }) => (
                  <div key={name} className="grid grid-cols-[1fr_40px_1fr] gap-3 items-center">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2">
                      <p className="text-sm text-emerald-400 font-mono">{name}</p>
                      {sample && <p className="text-xs text-zinc-500 truncate mt-0.5">{sample}</p>}
                    </div>
                    <div className="text-zinc-600 text-center">→</div>
                    <select value={fieldMappings[name] ?? ''}
                      onChange={e => {
                        setFieldMappings(prev => {
                          const next = { ...prev };
                          if (e.target.value) next[name] = e.target.value;
                          else delete next[name];
                          return next;
                        });
                      }}
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                      <option value="">-- Eşleştirme yok --</option>
                      {SYSTEM_FIELDS.map(sf => (
                        <option key={sf.key} value={sf.key}>
                          {sf.label}{sf.required ? ' *' : ''}
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
                  <span>{coveredFields.length}/{requiredFields.length}</span>
                </div>
                <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all rounded-full"
                    style={{ width: `${(coveredFields.length / requiredFields.length) * 100}%` }} />
                </div>
              </div>

              <button onClick={handleSaveMapping} disabled={!Object.keys(fieldMappings).length}
                className="mt-4 flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg disabled:opacity-50 transition-colors">
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
              {jobs.map(job => (
                <div key={job.id} className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{job.feedName}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {job.type.toUpperCase()} • {new Date(job.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <span className={cn('text-xs font-medium px-2 py-1 rounded-full',
                      job.status === 'completed' ? 'bg-emerald-900/40 text-emerald-400' :
                      job.status === 'failed'    ? 'bg-red-900/40 text-red-400'         :
                      'bg-zinc-700 text-zinc-400')}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                    <span>Toplam: <span className="text-white">{job.total}</span></span>
                    <span>Başarılı: <span className="text-emerald-400">{job.success}</span></span>
                    <span>Başarısız: <span className="text-red-400">{job.failed}</span></span>
                  </div>
                  {job.errors && job.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-yellow-400 cursor-pointer">
                        {job.errors.length} hata görüntüle
                      </summary>
                      <ul className="mt-1 space-y-0.5 pl-3">
                        {job.errors.map((e, i) => (
                          <li key={i} className="text-xs text-red-300">Satır {e.line}: {e.message}</li>
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
              {CSV_COLUMNS.length} kolonlu standart şablon. BOM eklidir — Excel ve Numbers ile açılır.
            </p>
            <button onClick={downloadCsvTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors">
              <Download size={14} /> CSV Şablonu İndir
            </button>
          </div>

          <div className="bg-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-1">XML Şablonu</h3>
            <p className="text-xs text-zinc-400 mb-4">Standart Mercora XML feed formatı.</p>
            <button onClick={() => {
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
              <Download size={14} /> XML Şablonu İndir
            </button>
          </div>

          <div className="bg-zinc-800 rounded-xl p-6 overflow-x-auto">
            <h3 className="text-sm font-semibold text-white mb-4">Alan Referansı</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-700">
                  <th className="text-left pb-2 pr-4 font-medium">Alan</th>
                  <th className="text-left pb-2 pr-4 font-medium">Zorunlu</th>
                  <th className="text-left pb-2 font-medium">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/30">
                {SYSTEM_FIELDS.map(f => (
                  <tr key={f.key}>
                    <td className="py-1.5 pr-4 font-mono text-emerald-400">{f.key}</td>
                    <td className="py-1.5 pr-4 text-center">{f.required ? '✓' : '—'}</td>
                    <td className="py-1.5 text-zinc-400">{f.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
