import React, { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  ArrowRight,
  Globe,
  Zap,
  BarChart3,
  Database,
  X,
  Loader2,
  Save,
  Edit3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Product, ProductVariant } from '@/types';
import {
  getProducts,
  deleteProduct,
  createProduct,
  updateProduct,
  batchUpdateProducts,
} from '@/services/productService';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ProductFormModal } from '../components/seller/ProductFormModal';
import type { ProductFormData } from '../components/seller/ProductForm';
import { CSVImportPanel } from '../components/seller/CSVImportPanel';
import { BulkEditBar } from '../components/seller/BulkEditBar';

export function SellerInventoryPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'inventory' | 'bulk' | 'analytics'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // CSV import state (legacy)
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvProgress, setCsvProgress] = useState(0);
  const [csvStatus, setCsvStatus] = useState<'idle' | 'parsing' | 'uploading' | 'done' | 'error'>(
    'idle',
  );
  const [csvMessage, setCsvMessage] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Bulk inline edit mode
  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, { price?: number; stock?: number }>>(
    {},
  );
  const [savingBulk, setSavingBulk] = useState(false);

  const enterBulkEdit = () => {
    const initial: Record<string, { price: number; stock: number }> = {};
    filteredProducts.forEach((p) => {
      initial[p.id] = { price: p.price, stock: p.stock ?? 0 };
    });
    setEditValues(initial);
    setBulkEditMode(true);
  };

  const updateEditValue = (productId: string, field: 'price' | 'stock', value: number) => {
    setEditValues((prev) => ({ ...prev, [productId]: { ...prev[productId], [field]: value } }));
  };

  const hasBulkChanges = () => {
    return filteredProducts.some((p) => {
      const ev = editValues[p.id];
      if (!ev) return false;
      return ev.price !== p.price || ev.stock !== (p.stock ?? 0);
    });
  };

  const changedCount = filteredProducts.filter((p) => {
    const ev = editValues[p.id];
    if (!ev) return false;
    return ev.price !== p.price || ev.stock !== (p.stock ?? 0);
  }).length;

  const handleBulkSave = async () => {
    setSavingBulk(true);
    const updates = filteredProducts
      .filter((p) => {
        const ev = editValues[p.id];
        if (!ev) return false;
        return ev.price !== p.price || ev.stock !== (p.stock ?? 0);
      })
      .map((p) => ({
        productId: p.id,
        price: editValues[p.id]?.price,
        stock: editValues[p.id]?.stock,
      }));

    const result = await batchUpdateProducts(updates);

    // Update local state
    if (result.successCount > 0) {
      setProducts((prev) =>
        prev.map((p) => {
          const ev = editValues[p.id];
          if (!ev) return p;
          return { ...p, price: ev.price ?? p.price, stock: ev.stock ?? p.stock };
        }),
      );
      setBulkEditMode(false);
      setEditValues({});
    }
    setSavingBulk(false);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      if (user) {
        const data = await getProducts({ sellerId: user.id, includeNonApproved: true });
        setProducts(data);
      }
      setIsLoading(false);
    };
    fetchProducts();
  }, [user]);

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedProducts.length} items?`)) {
      for (const id of selectedProducts) {
        // In real app maybe show a loading toast
        try {
          await deleteProduct(id);
        } catch (e) {
          console.error('Failed to delete', id);
        }
      }
      setProducts(products.filter((p) => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
    }
  };

  const handleDeleteSingle = async (p: Product) => {
    if (confirm(t('seller.inventory.confirmDelete'))) {
      try {
        await deleteProduct(p.id);
        setProducts(products.filter((prod) => prod.id !== p.id));
      } catch (e) {
        console.error('error deleting product');
      }
    }
  };

  const handleCopyProduct = async (p: Product) => {
    if (!user) return;
    try {
      const { id, slug, rating, reviewsCount, createdAt, ...rest } = p as any;
      const newSlug = `${slug || 'copy'}-copy-${Date.now()}`;
      const payload = {
        ...rest,
        slug: newSlug,
        sellerId: user.uid,
        status: 'draft' as const,
        rating: 0,
        reviewsCount: 0,
      };
      const newId = await createProduct(payload as any);
      setProducts((prev) => [{ id: newId, ...payload } as Product, ...prev]);
    } catch (e) {
      console.error('error copying product');
    }
  };

  const handleImportComplete = (refreshedProducts: Product[]) => {
    setProducts(refreshedProducts);
  };

  const handleBulkStatusUpdate = (status: string) => {
    alert(`${selectedProducts.length} ${t('seller.inventory.bulkStatusUpdated')} ${status}.`);
    setSelectedProducts([]);
  };

  const handleProductSubmit = async (data: ProductFormData, action: 'draft' | 'publish') => {
    const slug = data.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 80);

    const payload = {
      ...data,
      slug,
      sellerId: user!.uid,
      rating: editingProduct?.rating ?? 0,
      reviewsCount: editingProduct?.reviewsCount ?? 0,
      status: (action === 'publish' ? 'pending' : 'draft') as any,
    } as Omit<Product, 'id'>;

    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p)),
      );
    } else {
      const id = await createProduct(payload);
      setProducts((prev) => [{ id, ...payload } as Product, ...prev]);
    }
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  function parseCSV(text: string): Partial<Product>[] {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) =>
      h
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, ''),
    );
    return lines
      .slice(1)
      .map((line) => {
        const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = vals[i] || '';
        });
        return {
          title: row['title'] || row['urunad'] || row['name'] || '',
          price: parseFloat(row['price'] || row['fiyat'] || '0') || 0,
          stock: parseInt(row['stock'] || row['stok'] || '0', 10) || 0,
          categoryId: row['categoryid'] || row['kategori'] || 'cat-1-audio',
          brand: row['brand'] || row['marka'] || '',
          description: row['description'] || row['aciklama'] || '',
          images: row['image']
            ? [row['image']]
            : [
                'https://images.unsplash.com/photo-1542382257-80dedb725088?auto=format&fit=crop&q=80&w=800',
              ],
          currency: 'TRY',
          featured: false,
        };
      })
      .filter((p) => p.title);
  }

  function downloadCSVTemplate() {
    const csv =
      'title,brand,categoryId,price,stock,description,image\nÖrnek Ürün,Örnek Marka,cat-1-audio,199.90,50,Ürün açıklaması,https://example.com/image.jpg';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mercora-urun-sablonu.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCSVUpload() {
    if (!csvFile) return;
    setCsvStatus('parsing');
    setCsvProgress(0);
    setCsvMessage('CSV okunuyor...');
    try {
      const text = await csvFile.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setCsvStatus('error');
        setCsvMessage('CSV boş veya geçersiz format.');
        return;
      }
      setCsvStatus('uploading');
      setCsvMessage(`${rows.length} ürün yükleniyor...`);
      const BATCH = 5;
      const newProducts: Product[] = [];
      for (let i = 0; i < rows.length; i += BATCH) {
        const chunk = rows.slice(i, i + BATCH);
        const created = await Promise.all(
          chunk.map(async (p) => {
            const slug =
              (p.title || 'urun')
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '') +
              '-' +
              Math.random().toString(36).slice(2, 6);
            const id = await createProduct({
              ...p,
              sellerId: user?.uid,
              slug,
              hsCode: '8518.21.00',
              originCountry: 'Turkey',
            } as any);
            return { id, ...p, sellerId: user?.uid, slug } as Product;
          }),
        );
        newProducts.push(...created);
        setCsvProgress(Math.round(((i + chunk.length) / rows.length) * 100));
      }
      setProducts((prev) => [...newProducts, ...prev]);
      setCsvStatus('done');
      setCsvMessage(`${newProducts.length} ürün başarıyla eklendi.`);
      setCsvFile(null);
    } catch {
      setCsvStatus('error');
      setCsvMessage('Yükleme sırasında hata oluştu.');
    }
  }

  return (
    <div className="flex min-h-screen bg-brand-secondary/30 pt-24">
      {/* Mini Sidebar */}
      <div className="w-20 bg-brand-primary flex flex-col items-center py-8 gap-8 hidden lg:flex">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg">
          <Zap size={20} fill="currentColor" />
        </div>
        <nav className="flex flex-col gap-6">
          {[
            { icon: Database, id: 'inventory' },
            { icon: Upload, id: 'bulk' },
            { icon: BarChart3, id: 'analytics' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center transition-all',
                activeTab === item.id
                  ? 'bg-accent text-white'
                  : 'text-white/40 hover:bg-white/10 hover:text-white',
              )}
            >
              <item.icon size={20} />
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest rounded-full">
                  Inventory Engine v4.2
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">
                  <Globe size={10} /> Multi-Market Sync Active
                </span>
              </div>
              <h1 className="text-4xl font-display font-black tracking-tighter text-brand-primary uppercase italic">
                {activeTab === 'inventory'
                  ? 'Global Artifact Inventory'
                  : activeTab === 'bulk'
                    ? 'Mass Ingestion'
                    : 'Demand Dynamics'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button className="px-6 py-3 bg-white text-brand-primary border border-brand-primary/5 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm hover:shadow-xl transition-all flex items-center gap-2">
                <Download size={14} /> Export Report
              </button>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsFormOpen(true);
                }}
                className="px-6 py-3 bg-brand-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-2xl shadow-brand-primary/20 hover:bg-accent transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add Artifact
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'inventory' ? (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Stock', value: '1,420', icon: Package, status: 'Healthy' },
                    {
                      label: 'Low Stock Alerts',
                      value: '12',
                      icon: AlertTriangle,
                      status: 'Urgent',
                    },
                    { label: 'Global Orders', value: '84', icon: Globe, status: '+15%' },
                    { label: 'Merchant Level', value: 'Top-Rated', icon: Zap, status: 'Verified' },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-white p-6 rounded-[2rem] border border-brand-primary/5 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-brand-secondary rounded-lg text-brand-primary">
                          <stat.icon size={16} />
                        </div>
                        <span
                          className={cn(
                            'text-[9px] font-black uppercase tracking-widest',
                            stat.status === 'Urgent' ? 'text-red-500' : 'text-green-500',
                          )}
                        >
                          {stat.status}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-display font-black text-brand-primary">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Search & Bulk Actions */}
                <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-brand-primary/5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative flex-1 w-full">
                    <Search
                      className="absolute start-4 top-1/2 -translate-y-1/2 text-brand-primary/20"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search inventory by serial, name, or HS code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full ps-12 pe-4 py-3 bg-brand-secondary/30 rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none placeholder:text-brand-primary/20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {bulkEditMode ? (
                      <>
                        <button
                          onClick={() => {
                            setBulkEditMode(false);
                            setEditValues({});
                          }}
                          className="px-4 py-2.5 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-1.5"
                        >
                          <X size={14} /> İptal
                        </button>
                        <button
                          onClick={handleBulkSave}
                          disabled={!hasBulkChanges() || savingBulk}
                          className={cn(
                            'px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5',
                            hasBulkChanges()
                              ? 'bg-accent text-white shadow-lg shadow-accent/20 hover:opacity-90'
                              : 'bg-zinc-100 text-zinc-400 cursor-not-allowed',
                          )}
                        >
                          {savingBulk ? (
                            <>
                              <Loader2 size={14} className="animate-spin" /> Kaydediliyor…
                            </>
                          ) : (
                            <>
                              <Save size={14} /> {changedCount} Değişikliği Kaydet
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={enterBulkEdit}
                        className="px-4 py-2.5 bg-accent/10 text-accent rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all flex items-center gap-1.5"
                      >
                        <Edit3 size={14} /> Toplu Düzenle
                      </button>
                    )}
                    <button className="p-3 bg-brand-secondary text-brand-primary/60 rounded-xl hover:text-brand-primary transition-colors">
                      <Filter size={18} />
                    </button>
                    <BulkEditBar
                      selectedIds={selectedProducts}
                      onClearSelection={() => setSelectedProducts([])}
                      onBulkStatusUpdate={handleBulkStatusUpdate}
                      onBulkDelete={handleBulkDelete}
                    />
                  </div>
                </div>

                {/* Inventory Table */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-brand-primary/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                      <thead>
                        <tr className="bg-brand-secondary/30 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">
                          <th className="px-8 py-6">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-brand-primary/10 text-accent focus:ring-accent"
                              checked={
                                selectedProducts.length === filteredProducts.length &&
                                filteredProducts.length > 0
                              }
                              onChange={(e) =>
                                setSelectedProducts(
                                  e.target.checked ? filteredProducts.map((p) => p.id) : [],
                                )
                              }
                            />
                          </th>
                          <th className="px-8 py-6">Artifact Detail</th>
                          <th className="px-8 py-6">Compliance</th>
                          <th className="px-8 py-6">Stock Level</th>
                          <th className="px-8 py-6 text-end">Pricing</th>
                          <th className="px-8 py-6"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-primary/5">
                        {isLoading ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-8 py-12 text-center text-brand-primary/40"
                            >
                              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
                              <p className="text-[10px] uppercase tracking-widest font-black">
                                Syncing Node Data...
                              </p>
                            </td>
                          </tr>
                        ) : filteredProducts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-8 py-8">
                              <div className="bg-gray-100 rounded-xl h-40 flex flex-col items-center justify-center gap-2 text-center">
                                <Package size={48} className="text-gray-300" />
                                <p className="font-semibold text-brand-primary">No products yet</p>
                                <p className="text-sm text-brand-primary/50">
                                  Add your first product to start selling.
                                </p>
                                <button
                                  onClick={() => {
                                    setEditingProduct(null);
                                    setIsFormOpen(true);
                                  }}
                                  className="mt-2 px-5 py-2.5 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-1.5"
                                >
                                  <Plus size={14} /> Add Product
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredProducts.slice(0, 10).map((product) => (
                            <tr
                              key={product.id}
                              onClick={() => setViewingProduct(product)}
                              className="group hover:bg-brand-secondary/20 transition-all cursor-pointer"
                            >
                              <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-brand-primary/10 text-accent focus:ring-accent"
                                  checked={selectedProducts.includes(product.id)}
                                  onChange={(e) => {
                                    if (e.target.checked)
                                      setSelectedProducts([...selectedProducts, product.id]);
                                    else
                                      setSelectedProducts(
                                        selectedProducts.filter((id) => id !== product.id),
                                      );
                                  }}
                                />
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-brand-secondary rounded-2xl p-2 flex-shrink-0">
                                    <img
                                      src={product.images[0]}
                                      alt={product.title}
                                      loading="lazy"
                                      className="w-full h-full object-contain mix-blend-multiply"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <div className="max-w-xs">
                                    <p className="font-bold text-brand-primary line-clamp-1 group-hover:text-accent transition-colors">
                                      {product.title}
                                    </p>
                                    <p className="text-[10px] text-brand-primary/40 font-mono tracking-tighter">
                                      SKU: {product.id.split('-')[0].toUpperCase()}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const s = product.status ?? 'approved';
                                    const cfg: Record<string, { label: string; cls: string }> = {
                                      draft: {
                                        label: 'Taslak',
                                        cls: 'bg-gray-100 text-gray-500 border-gray-200',
                                      },
                                      pending: {
                                        label: 'Bekliyor',
                                        cls: 'bg-yellow-50 text-yellow-600 border-yellow-100',
                                      },
                                      approved: {
                                        label: 'Onaylı',
                                        cls: 'bg-green-50 text-green-600 border-green-100',
                                      },
                                      rejected: {
                                        label: 'Reddedildi',
                                        cls: 'bg-red-50 text-red-500 border-red-100',
                                      },
                                    };
                                    const c = cfg[s] ?? cfg.approved;
                                    return (
                                      <span
                                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${c.cls}`}
                                      >
                                        {c.label}
                                      </span>
                                    );
                                  })()}
                                  {product.status === 'draft' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateProduct(product.id, { status: 'pending' });
                                        setProducts((prev) =>
                                          prev.map((p) =>
                                            p.id === product.id ? { ...p, status: 'pending' } : p,
                                          ),
                                        );
                                      }}
                                      className="px-2 py-0.5 bg-accent text-white rounded text-[9px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all"
                                    >
                                      Onaya Gönder
                                    </button>
                                  )}
                                  {product.status === 'rejected' && product.moderationNote && (
                                    <span
                                      className="text-[9px] text-red-400 italic truncate max-w-[120px]"
                                      title={product.moderationNote}
                                    >
                                      {product.moderationNote}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                                {bulkEditMode ? (
                                  <input
                                    type="number"
                                    min={0}
                                    value={editValues[product.id]?.stock ?? product.stock ?? 0}
                                    onChange={(e) =>
                                      updateEditValue(
                                        product.id,
                                        'stock',
                                        parseInt(e.target.value) || 0,
                                      )
                                    }
                                    className="w-20 px-2 py-1.5 bg-brand-secondary/30 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-accent/20 text-center"
                                  />
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 w-24 h-2 bg-brand-secondary rounded-full overflow-hidden">
                                      <div
                                        className={cn(
                                          'h-full rounded-full bg-accent transition-all duration-1000',
                                          (product.stock ?? 0) < 20
                                            ? 'bg-red-500'
                                            : (product.stock ?? 0) < 50
                                              ? 'bg-orange-500'
                                              : 'bg-green-500',
                                        )}
                                        style={{ width: `${Math.min(100, product.stock || 45)}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-black text-brand-primary">
                                      {product.stock ?? 0} units
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td
                                className="px-8 py-6 text-end"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {bulkEditMode ? (
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={editValues[product.id]?.price ?? product.price}
                                    onChange={(e) =>
                                      updateEditValue(
                                        product.id,
                                        'price',
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-24 px-2 py-1.5 bg-brand-secondary/30 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-accent/20 text-end"
                                  />
                                ) : (
                                  <span className="font-black text-brand-primary">
                                    ${product.price}
                                  </span>
                                )}
                              </td>
                              <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingProduct(product);
                                      setIsFormOpen(true);
                                    }}
                                    className="p-2 hover:bg-white rounded-lg text-brand-primary/40 hover:text-accent transition-all shadow-sm"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyProduct(product);
                                    }}
                                    className="p-2 hover:bg-white rounded-lg text-brand-primary/40 hover:text-green-500 transition-all shadow-sm"
                                    title="Kopyala"
                                  >
                                    <Copy size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSingle(product);
                                    }}
                                    className="p-2 hover:bg-white rounded-lg text-brand-primary/40 hover:text-red-500 transition-all shadow-sm"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                  <button className="p-2 hover:bg-white rounded-lg text-brand-primary/40 hover:text-brand-primary transition-all shadow-sm">
                                    <MoreVertical size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-8 py-6 bg-brand-secondary/10 flex items-center justify-between border-t border-brand-primary/5">
                    <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">
                      Showing {Math.min(10, filteredProducts.length)} of {filteredProducts.length}{' '}
                      Inventory Items
                    </p>
                    <div className="flex items-center gap-2">
                      <button className="px-4 py-2 bg-white rounded-xl text-[10px] font-black border border-brand-primary/5 opacity-50 cursor-not-allowed">
                        Previous
                      </button>
                      <button className="px-4 py-2 bg-white rounded-xl text-[10px] font-black border border-brand-primary/5 hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                        Next Page
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'bulk' ? (
              <CSVImportPanel sellerId={user!.uid!} onImportComplete={handleImportComplete} />
            ) : (
              <motion.div
                key="analytics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-brand-primary/5">
                  <h3 className="text-xl font-display font-black mb-6">Regional Sales Forecast</h3>
                  <div className="h-64 bg-brand-secondary rounded-2xl flex items-end justify-between p-6 gap-2">
                    {[60, 40, 80, 50, 90, 70, 100].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        className="flex-1 bg-brand-primary rounded-t-lg relative group cursor-pointer"
                      >
                        <div className="absolute -top-10 start-1/2 -translate-x-1/2 px-2 py-1 bg-brand-primary text-white text-[9px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {h}k
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>

                <div className="bg-brand-primary text-white rounded-[3rem] p-10 overflow-hidden relative">
                  <Zap size={100} className="absolute -top-10 -end-10 text-white/5" />
                  <h3 className="text-xl font-display font-black mb-12 uppercase italic">
                    AI Demand Pulse
                  </h3>
                  <div className="space-y-8">
                    {[
                      {
                        country: 'United Kingdom',
                        growth: '+24%',
                        demand: 'High',
                        color: 'bg-green-500',
                      },
                      {
                        country: 'Saudi Arabia',
                        growth: '+18%',
                        demand: 'Surging',
                        color: 'bg-accent',
                      },
                      {
                        country: 'Germany',
                        growth: '+12%',
                        demand: 'Moderate',
                        color: 'bg-blue-500',
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn('w-3 h-3 rounded-full', item.color)} />
                          <div>
                            <p className="font-bold">{item.country}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest">
                              {item.demand} Demand
                            </p>
                          </div>
                        </div>
                        <div className="text-end">
                          <p className="text-xl font-display font-black">{item.growth}</p>
                          <p className="text-[9px] text-white/40 uppercase tracking-widest text-accent">
                            MoM Projection
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-4 bg-white text-brand-primary rounded-2xl mt-12 font-black text-xs uppercase tracking-widest hover:bg-accent hover:text-white transition-all">
                    Unlock Full Prediction Data
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {viewingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingProduct(null)}
              className="absolute inset-0 bg-brand-primary/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[80vh]"
            >
              <button
                onClick={() => setViewingProduct(null)}
                className="absolute top-6 end-6 w-10 h-10 bg-brand-secondary rounded-full flex items-center justify-center text-brand-primary hover:bg-accent hover:text-white transition-all z-20"
              >
                <X size={20} />
              </button>

              <div className="flex-1 bg-brand-secondary/50 p-12 flex items-center justify-center relative">
                <div className="absolute top-8 start-8">
                  <span className="px-3 py-1 bg-white border border-brand-primary/5 text-brand-primary/40 text-[9px] font-black uppercase tracking-widest rounded-full">
                    Artifact Render
                  </span>
                </div>
                <img
                  src={viewingProduct.images[0]}
                  className="w-full h-full object-contain mix-blend-multiply"
                  alt={viewingProduct.title}
                  loading="lazy"
                />
              </div>

              <div className="flex-1 p-12 overflow-y-auto no-scrollbar">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
                      Artifact ID: {viewingProduct.id}
                    </p>
                    <h2 className="text-3xl font-display font-black leading-tight uppercase italic">
                      {viewingProduct.title}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-brand-secondary/50 p-4 rounded-2xl border border-brand-primary/5">
                      <p className="text-[9px] font-bold text-brand-primary/30 uppercase mb-1">
                        Pricing (USD)
                      </p>
                      <p className="text-xl font-display font-black">${viewingProduct.price}</p>
                    </div>
                    <div className="bg-brand-secondary/50 p-4 rounded-2xl border border-brand-primary/5">
                      <p className="text-[9px] font-bold text-brand-primary/30 uppercase mb-1">
                        Current Stock
                      </p>
                      <p className="text-xl font-display font-black">
                        {viewingProduct.stock || 0} Unit
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary border-b border-brand-primary/5 pb-2">
                      Compliance Metrics
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            HS Code Certified
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-green-700">
                          {viewingProduct.hsCode || '8518.21.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700">
                          <Globe size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Origin Market
                          </span>
                        </div>
                        <span className="text-xs font-bold text-blue-700">
                          {viewingProduct.originCountry}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary border-b border-brand-primary/5 pb-2">
                      Description Feed
                    </h4>
                    <p className="text-xs leading-relaxed text-brand-primary/60 font-medium italic">
                      {viewingProduct.description}
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4 sticky shadow-xl">
                    <button
                      onClick={() => {
                        setViewingProduct(null);
                        setEditingProduct(viewingProduct);
                        setIsFormOpen(true);
                      }}
                      className="flex-1 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-accent transition-all flex items-center justify-center gap-2"
                    >
                      <Edit size={14} /> Update Artifact
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ProductFormModal
        isOpen={isFormOpen}
        editingProduct={editingProduct}
        onSave={handleProductSubmit}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
      />
    </div>
  );
}
