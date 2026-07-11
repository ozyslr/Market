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
  History,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Product, ProductVariant, Warehouse, WarehouseStock } from '@/types';
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
import { recordEvent } from '@/services/sellerOnboardingService';
import { getSellerTierStatus, type SellerTierStatus } from '@/services/sellerTierService';
import {
  getStockMovements,
  getReasonLabel,
  type StockMovement,
} from '@/services/stockMovementService';
import {
  createWarehouse,
  getWarehouses,
  updateWarehouse,
  deleteWarehouse,
  setWarehouseStock,
  getWarehouseStock,
  getDefaultWarehouse,
} from '@/services/warehouseService';

export function SellerInventoryPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    'inventory' | 'lowStock' | 'bulk' | 'analytics' | 'depolar'
  >('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [stockHistoryProduct, setStockHistoryProduct] = useState<Product | null>(null);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tierStatus, setTierStatus] = useState<SellerTierStatus | null>(null);
  const [tierWarning, setTierWarning] = useState<{ atCap: boolean; remaining: number } | null>(
    null,
  );

  // CSV import state (legacy)
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvProgress, setCsvProgress] = useState(0);
  const [csvStatus, setCsvStatus] = useState<'idle' | 'parsing' | 'uploading' | 'done' | 'error'>(
    'idle',
  );
  const [csvMessage, setCsvMessage] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Warehouse state
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: false,
  });
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [stockAllocation, setStockAllocation] = useState<Record<string, WarehouseStock[]>>({});
  const [selectedWarehouseStockProduct, setSelectedWarehouseStockProduct] = useState<string | null>(
    null,
  );
  const [warehouseLoading, setWarehouseLoading] = useState(false);

  // Bulk inline edit mode
  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getProductThreshold = (p: Product): number => p.lowStockThreshold ?? lowStockThreshold;

  const lowStockProducts = filteredProducts.filter((p) => (p.stock ?? 0) <= getProductThreshold(p));

  const displayProducts = activeTab === 'lowStock' ? lowStockProducts : filteredProducts;
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
        // Load seller's low stock threshold from store config
        try {
          const { getStoreConfig } = await import('@/services/sellerStoreService');
          const cfg = await getStoreConfig(user.id);
          setLowStockThreshold(cfg.lowStockThreshold ?? 5);
        } catch {
          /* keep default */
        }
      }
      setIsLoading(false);
    };
    fetchProducts();
  }, [user]);

  // Fetch tier status for enforcement
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const status = await getSellerTierStatus(user.uid || user.id, products.length, 0, 0);
        setTierStatus(status);
        setTierWarning(
          status.atCap
            ? { atCap: true, remaining: 0 }
            : { atCap: false, remaining: status.remainingSlots },
        );
      } catch {
        /* non-critical */
      }
    })();
  }, [user, products.length]);

  // Load warehouses when depolar tab is active
  useEffect(() => {
    if (!user || activeTab !== 'depolar') return;
    (async () => {
      setWarehouseLoading(true);
      try {
        const data = await getWarehouses(user.uid || user.id);
        setWarehouses(data);
      } catch {
        setWarehouses([]);
      } finally {
        setWarehouseLoading(false);
      }
    })();
  }, [user, activeTab]);

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

  const handleShowStockHistory = async (product: Product) => {
    setStockHistoryProduct(product);
    setLoadingMovements(true);
    setStockMovements([]);
    try {
      const movements = await getStockMovements(product.id);
      setStockMovements(movements);
    } catch {
      setStockMovements([]);
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleImportComplete = (refreshedProducts: Product[]) => {
    setProducts(refreshedProducts);
  };

  const [bulkUpdating, setBulkUpdating] = useState(false);
  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedProducts.length === 0) return;
    setBulkUpdating(true);
    try {
      const result = await batchUpdateProducts(
        selectedProducts.map((id) => ({ productId: id, status })),
      );
      if (result.failCount > 0) {
        alert(`${result.successCount} ürün güncellendi, ${result.failCount} ürün güncellenemedi.`);
      }
      // Refresh products list
      const refreshed = await getProducts({ sellerId });
      if (refreshed.length > 0) setProducts(refreshed);
      setSelectedProducts([]);
    } catch (err: any) {
      alert(`Güncelleme başarısız: ${err.message || 'Bilinmeyen hata'}`);
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleProductSubmit = async (data: ProductFormData, action: 'draft' | 'publish') => {
    // Tier limit enforcement for new products (not editing)
    if (!editingProduct && tierStatus?.atCap) {
      alert(
        `Urun limitine ulastiniz! Mevcut paketiniz ${tierStatus.tierConfig.maxProducts} urunle sinirli.\n\n` +
          `Daha fazla urun eklemek icin ${tierStatus.nextTier ? tierStatus.nextTier + ' paketine yukseltin.' : 'yoneticiyle iletisime gecin.'}`,
      );
      return;
    }

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

    const isFirstProduct = products.length === 0;

    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p)),
      );
    } else {
      const id = await createProduct(payload);
      setProducts((prev) => [{ id, ...payload } as Product, ...prev]);
    }

    // Funnel instrumentation (fire-and-forget — idempotent)
    const sellerId = user!.id;
    if (!editingProduct && isFirstProduct) {
      recordEvent(sellerId, 'first_product_created').catch(() => {});
    }
    if (action === 'publish') {
      recordEvent(sellerId, 'first_product_published').catch(() => {});
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
            { icon: AlertTriangle, id: 'lowStock' },
            { icon: Upload, id: 'bulk' },
            { icon: BarChart3, id: 'analytics' },
            { icon: WarehouseIcon, id: 'depolar' },
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
                  : activeTab === 'lowStock'
                    ? 'Dusuk Stok Urunleri'
                    : activeTab === 'bulk'
                      ? 'Mass Ingestion'
                      : activeTab === 'depolar'
                        ? 'Depo Yonetimi'
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
            {activeTab === 'inventory' || activeTab === 'lowStock' ? (
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
                                selectedProducts.length === displayProducts.length &&
                                displayProducts.length > 0
                              }
                              onChange={(e) =>
                                setSelectedProducts(
                                  e.target.checked ? displayProducts.map((p) => p.id) : [],
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
                        ) : displayProducts.length === 0 ? (
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
                          displayProducts.slice(0, 10).map((product) => (
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
                                    {(product.stock ?? 0) === 0 ? (
                                      <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-200">
                                        Tukendi
                                      </span>
                                    ) : (product.stock ?? 0) <= getProductThreshold(product) ? (
                                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-yellow-200">
                                        Az
                                      </span>
                                    ) : null}
                                    <div className="flex-1 w-24 h-2 bg-brand-secondary rounded-full overflow-hidden">
                                      <div
                                        className={cn(
                                          'h-full rounded-full bg-accent transition-all duration-1000',
                                          (product.stock ?? 0) === 0
                                            ? 'bg-red-500'
                                            : (product.stock ?? 0) <= getProductThreshold(product)
                                              ? 'bg-yellow-500'
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
                                      handleShowStockHistory(product);
                                    }}
                                    className="p-2 hover:bg-white rounded-lg text-brand-primary/40 hover:text-blue-500 transition-all shadow-sm"
                                    title="Stok Geçmişi"
                                  >
                                    <History size={16} />
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
                      Showing {Math.min(10, displayProducts.length)} of {displayProducts.length}{' '}
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
            ) : activeTab === 'depolar' ? (
              <motion.div
                key="depolar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Warehouse header + add button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-xl text-accent">
                      <WarehouseIcon size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
                        Depo Yonetimi
                      </p>
                      <p className="text-xs text-brand-primary/60">
                        Depo bazli stok yonetimi ve atama
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingWarehouse(null);
                      setWarehouseForm({
                        name: '',
                        line1: '',
                        city: '',
                        state: '',
                        postalCode: '',
                        country: '',
                        isDefault: false,
                      });
                      setShowWarehouseForm(true);
                    }}
                    className="px-5 py-2.5 bg-brand-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-accent transition-all flex items-center gap-2"
                  >
                    <Plus size={14} /> Yeni Depo Ekle
                  </button>
                </div>

                {/* Warehouse list */}
                {warehouseLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
                      Depolar yukleniyor...
                    </p>
                  </div>
                ) : warehouses.length === 0 ? (
                  <div className="bg-white rounded-[2rem] p-12 shadow-sm border border-brand-primary/5">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <WarehouseIcon size={64} className="text-brand-primary/20" />
                      <h3 className="text-xl font-display font-black text-brand-primary">
                        Henuz depo eklenmemis
                      </h3>
                      <p className="text-sm text-brand-primary/40 max-w-sm">
                        Urunlerinizi depolamak icin bir depo ekleyin. Her depo icin ozel stok
                        atamasi yapabilirsiniz.
                      </p>
                      <button
                        onClick={() => {
                          setEditingWarehouse(null);
                          setWarehouseForm({
                            name: '',
                            line1: '',
                            city: '',
                            state: '',
                            postalCode: '',
                            country: '',
                            isDefault: false,
                          });
                          setShowWarehouseForm(true);
                        }}
                        className="mt-2 px-6 py-3 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
                      >
                        <Plus size={14} /> Ilk Depoyu Ekle
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {warehouses.map((wh) => (
                      <div
                        key={wh.id}
                        className="bg-white rounded-[2rem] p-6 shadow-sm border border-brand-primary/5 relative overflow-hidden"
                      >
                        {wh.isDefault && (
                          <span className="absolute top-0 end-0 px-3 py-1 bg-accent text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl">
                            Varsayilan Depo
                          </span>
                        )}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-brand-secondary rounded-xl text-brand-primary">
                              <WarehouseIcon size={18} />
                            </div>
                            <div>
                              <h3 className="font-bold text-brand-primary text-sm">{wh.name}</h3>
                              <p className="text-[10px] text-brand-primary/40">
                                {wh.address.line1}, {wh.address.city}, {wh.address.country}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={async () => {
                                setEditingWarehouse(wh);
                                setWarehouseForm({
                                  name: wh.name,
                                  line1: wh.address.line1,
                                  city: wh.address.city,
                                  state: wh.address.state,
                                  postalCode: wh.address.postalCode,
                                  country: wh.address.country,
                                  isDefault: wh.isDefault,
                                });
                                setShowWarehouseForm(true);
                              }}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-brand-primary/40 hover:text-accent hover:bg-accent/10 transition-all"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    `"${wh.name}" deposunu silmek istediginize emin misiniz?`,
                                  )
                                ) {
                                  try {
                                    await deleteWarehouse(wh.id);
                                    setWarehouses((prev) => prev.filter((w) => w.id !== wh.id));
                                  } catch {
                                    /* error handled by warehouseService */
                                  }
                                }
                              }}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-brand-primary/40 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Address details */}
                        <div className="bg-brand-secondary/30 rounded-2xl p-4 space-y-1 text-[11px]">
                          <p className="text-brand-primary/70">
                            <span className="font-bold text-brand-primary/40">Adres: </span>
                            {wh.address.line1}
                            {wh.address.line2 ? `, ${wh.address.line2}` : ''}
                          </p>
                          <p className="text-brand-primary/70">
                            <span className="font-bold text-brand-primary/40">Sehir: </span>
                            {wh.address.city}, {wh.address.state} {wh.address.postalCode}
                          </p>
                          <p className="text-brand-primary/70">
                            <span className="font-bold text-brand-primary/40">Ulke: </span>
                            {wh.address.country}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stock allocation summary */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-brand-primary/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand-secondary rounded-xl text-brand-primary">
                      <Package size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-brand-primary text-sm">
                        Depo Bazli Stok Atamasi
                      </p>
                      <p className="text-[10px] text-brand-primary/40">
                        Her urun icin depo bazli stok miktarlarini ayarlayin
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-brand-primary/50 leading-relaxed bg-brand-secondary/30 rounded-2xl p-4">
                    Depo bazli stok atamasi, her bir urunun hangi depoda ne kadar stogu oldugunu
                    belirlemenizi saglar. Su an icin depo bazli stok atamasi urun duzenleme
                    formundan yapilabilir. Her urune varsayilan depo uzerinden stok atanir.
                  </p>
                </div>
              </motion.div>
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

      {/* Stock History Modal */}
      <AnimatePresence>
        {stockHistoryProduct && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setStockHistoryProduct(null);
                setStockMovements([]);
              }}
              className="absolute inset-0 bg-brand-primary/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] overflow-hidden shadow-2xl max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-8 pb-4 flex items-center justify-between border-b border-brand-primary/5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
                    Stok Geçmişi
                  </p>
                  <h2 className="text-lg font-display font-black text-brand-primary truncate max-w-[280px]">
                    {stockHistoryProduct.title}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setStockHistoryProduct(null);
                    setStockMovements([]);
                  }}
                  className="w-10 h-10 bg-brand-secondary rounded-full flex items-center justify-center text-brand-primary hover:bg-accent hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8">
                {loadingMovements ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
                      Geçmiş yükleniyor...
                    </p>
                  </div>
                ) : stockMovements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                    <History size={40} className="text-brand-primary/20" />
                    <p className="text-sm font-bold text-brand-primary/40">
                      Henüz stok hareketi kaydı bulunmuyor.
                    </p>
                    <p className="text-[10px] text-brand-primary/30">
                      Stok değişiklikleri burada listelenecek.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {stockMovements.map((m, i) => {
                      const isIncrease = m.delta > 0;
                      const isDecrease = m.delta < 0;
                      const dateStr = m.createdAt?.toDate
                        ? m.createdAt.toDate().toLocaleString('tr-TR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : m.createdAt || '—';

                      return (
                        <div key={m.id || i} className="relative pl-8 pb-6 last:pb-0">
                          {/* Timeline line */}
                          {i < stockMovements.length - 1 && (
                            <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-brand-secondary" />
                          )}
                          {/* Timeline dot */}
                          <div
                            className={cn(
                              'absolute left-1 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                              isIncrease
                                ? 'bg-green-50 border-green-400'
                                : isDecrease
                                  ? 'bg-red-50 border-red-400'
                                  : 'bg-gray-50 border-gray-300',
                            )}
                          >
                            <div
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                isIncrease
                                  ? 'bg-green-500'
                                  : isDecrease
                                    ? 'bg-red-500'
                                    : 'bg-gray-400',
                              )}
                            />
                          </div>

                          {/* Content card */}
                          <div className="bg-brand-secondary/30 rounded-2xl p-4 border border-brand-primary/5">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40">
                                {dateStr}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-white border border-brand-primary/5 text-brand-primary/60">
                                {getReasonLabel(m.reason)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="font-mono font-bold text-brand-primary/60">
                                {m.oldStock}
                              </span>
                              <ArrowRight size={14} className="text-brand-primary/30" />
                              <span className="font-mono font-black text-brand-primary">
                                {m.newStock}
                              </span>
                              <span
                                className={cn(
                                  'ml-auto text-xs font-black font-mono px-2 py-0.5 rounded-lg',
                                  isIncrease
                                    ? 'text-green-600 bg-green-50'
                                    : isDecrease
                                      ? 'text-red-500 bg-red-50'
                                      : 'text-gray-400 bg-gray-50',
                                )}
                              >
                                {isIncrease ? '+' : ''}
                                {m.delta}
                              </span>
                            </div>
                            {m.userId && m.userId !== 'system' && (
                              <p className="text-[9px] text-brand-primary/30 mt-1.5 font-mono truncate">
                                Kullanıcı: {m.userId}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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

      {/* Warehouse Add/Edit Modal */}
      <AnimatePresence>
        {showWarehouseForm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWarehouseForm(false)}
              className="absolute inset-0 bg-brand-primary/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-8 pb-4 flex items-center justify-between border-b border-brand-primary/5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
                    Depo
                  </p>
                  <h2 className="text-lg font-display font-black text-brand-primary">
                    {editingWarehouse ? 'Depo Duzenle' : 'Yeni Depo Ekle'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowWarehouseForm(false)}
                  className="w-10 h-10 bg-brand-secondary rounded-full flex items-center justify-center text-brand-primary hover:bg-accent hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <div className="p-8 space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-1.5">
                    Depo Adi *
                  </label>
                  <input
                    type="text"
                    value={warehouseForm.name}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                    placeholder="Ornegin: Merkez Depo, Ikinci Depo"
                    className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-brand-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-1.5">
                    Adres *
                  </label>
                  <input
                    type="text"
                    value={warehouseForm.line1}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, line1: e.target.value })}
                    placeholder="Ornegin: Ataturk Cad. No:123"
                    className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-brand-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-1.5">
                      Sehir *
                    </label>
                    <input
                      type="text"
                      value={warehouseForm.city}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, city: e.target.value })}
                      placeholder="Istanbul"
                      className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-brand-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-1.5">
                      Ilce / Eyalet
                    </label>
                    <input
                      type="text"
                      value={warehouseForm.state}
                      onChange={(e) =>
                        setWarehouseForm({ ...warehouseForm, state: e.target.value })
                      }
                      placeholder="Kadikoy"
                      className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-brand-primary/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-1.5">
                      Posta Kodu
                    </label>
                    <input
                      type="text"
                      value={warehouseForm.postalCode}
                      onChange={(e) =>
                        setWarehouseForm({ ...warehouseForm, postalCode: e.target.value })
                      }
                      placeholder="34000"
                      className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-brand-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-brand-primary/40 mb-1.5">
                      Ulke *
                    </label>
                    <input
                      type="text"
                      value={warehouseForm.country}
                      onChange={(e) =>
                        setWarehouseForm({ ...warehouseForm, country: e.target.value })
                      }
                      placeholder="Turkiye"
                      className="w-full px-4 py-3 bg-brand-secondary/30 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-brand-primary/20"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={warehouseForm.isDefault}
                    onChange={(e) =>
                      setWarehouseForm({ ...warehouseForm, isDefault: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-brand-primary/10 text-accent focus:ring-accent"
                  />
                  <label
                    htmlFor="isDefault"
                    className="text-xs font-bold text-brand-primary cursor-pointer"
                  >
                    Varsayilan depo yap
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="p-8 pt-4 flex gap-3 border-t border-brand-primary/5">
                <button
                  onClick={() => setShowWarehouseForm(false)}
                  className="flex-1 py-3.5 bg-brand-secondary rounded-2xl font-black text-[10px] uppercase tracking-widest text-brand-primary/60 hover:text-brand-primary transition-all"
                >
                  Iptal
                </button>
                <button
                  onClick={async () => {
                    if (!warehouseForm.name.trim()) {
                      alert('Depo adi zorunludur.');
                      return;
                    }
                    if (
                      !warehouseForm.line1.trim() ||
                      !warehouseForm.city.trim() ||
                      !warehouseForm.country.trim()
                    ) {
                      alert('Adres, sehir ve ulke bilgileri zorunludur.');
                      return;
                    }
                    try {
                      if (editingWarehouse) {
                        await updateWarehouse(editingWarehouse.id, {
                          name: warehouseForm.name,
                          address: {
                            line1: warehouseForm.line1,
                            city: warehouseForm.city,
                            state: warehouseForm.state,
                            postalCode: warehouseForm.postalCode,
                            country: warehouseForm.country,
                          },
                          isDefault: warehouseForm.isDefault,
                        });
                      } else {
                        await createWarehouse(user!.uid || user!.id, {
                          name: warehouseForm.name,
                          address: {
                            line1: warehouseForm.line1,
                            city: warehouseForm.city,
                            state: warehouseForm.state,
                            postalCode: warehouseForm.postalCode,
                            country: warehouseForm.country,
                          },
                          isDefault: warehouseForm.isDefault,
                        });
                      }
                      setShowWarehouseForm(false);
                      // Refresh warehouse list
                      const data = await getWarehouses(user!.uid || user!.id);
                      setWarehouses(data);
                    } catch {
                      /* error handled by warehouseService */
                    }
                  }}
                  className="flex-1 py-3.5 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all"
                >
                  <Save size={14} className="inline me-1.5" />
                  {editingWarehouse ? 'Guncelle' : 'Kaydet'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
