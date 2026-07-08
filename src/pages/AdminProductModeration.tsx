import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Tag,
  Package,
  Sparkles,
  Image as ImageIcon,
  MessageSquare,
  List,
  Activity,
  Settings,
  RefreshCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MOCK_PENDING_PRODUCTS = [
  {
    id: 'PRD-8821',
    title: 'iPhone 15 Pro Max 256GB - Natural Titanium',
    seller: 'TechStore Premium',
    category: 'Elektronik > Telefon',
    price: '84,999 ₺',
    status: 'pending',
    aiScore: 98,
    aiFlags: [],
    submittedAt: '10 dk önce',
    image:
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=200&h=200',
    description:
      'Apple iPhone 15 Pro Max. Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.',
    variants: [
      {
        sku: 'APL-IP15PM-256-NAT',
        color: 'Natural Titanium',
        size: '256GB',
        stock: 45,
        price: '84,999 ₺',
      },
      {
        sku: 'APL-IP15PM-512-NAT',
        color: 'Natural Titanium',
        size: '512GB',
        stock: 12,
        price: '94,999 ₺',
      },
    ],
    seo: {
      title: 'iPhone 15 Pro Max 256GB - En Ucuz Fiyat',
      keywords: 'apple, iphone 15, pro max, 256gb, natural titanium, akıllı telefon',
    },
  },
  {
    id: 'PRD-8822',
    title: 'Nike Air Max 2024 Edition - Black/Red',
    seller: 'SneakerHead TR',
    category: 'Moda > Ayakkabı > Sneaker',
    price: '4,299 ₺',
    status: 'flagged',
    aiScore: 65,
    aiFlags: ['suspicious_brand_name', 'low_quality_image'],
    submittedAt: '1 saat önce',
    image:
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=200&h=200',
    description:
      'Yeni sezon Air Max serisi. Günlük kullanım için ideal, nefes alabilen file üst kısım ve maksimum yastıklama.',
    variants: [
      { sku: 'NK-AM24-BR-42', color: 'Black/Red', size: '42', stock: 0, price: '4,299 ₺' },
      { sku: 'NK-AM24-BR-43', color: 'Black/Red', size: '43', stock: 5, price: '4,299 ₺' },
    ],
    seo: {
      title: 'Nike Air Max 2024 Siyah Kırmızı',
      keywords: 'nike, air max, spor ayakkabı, erkek koşu ayakkabısı',
    },
  },
  {
    id: 'PRD-8823',
    title: 'Ultra-Fast Charging Cable 100W Type-C',
    seller: 'Gadget Plus',
    category: 'Elektronik > Aksesuar',
    price: '150 ₺',
    status: 'pending',
    aiScore: 85,
    aiFlags: [],
    submittedAt: '2 saat önce',
    image:
      'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?auto=format&fit=crop&q=80&w=200&h=200',
    description:
      '100W PD hızlı şarj destekli örgülü Type-C kablo. 2 metre uzunluk, veri aktarımı ve şarj için mükemmel.',
    variants: [{ sku: 'CBL-100W-TC-2M', color: 'Siyah', size: '2m', stock: 150, price: '150 ₺' }],
    seo: {
      title: '100W Type-C Hızlı Şarj Kablosu 2 Metre',
      keywords: 'type c kablo, hızlı şarj, 100w, pd kablo, örgülü şarj kablosu',
    },
  },
];

export function AdminProductModeration() {
  const [products, setProducts] = useState(MOCK_PENDING_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const activeProduct = products.find((p) => p.id === selectedProduct);

  const handleApprove = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    setSelectedProduct(null);
  };

  const handleReject = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    setSelectedProduct(null);
  };

  return (
    <div className="w-full">
      {/* Header section (replaces page wrapper) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 lg:mb-12 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl lg:text-3xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">
              Ürün Onay{' '}
              <span className="text-[#F9423A] underline underline-offset-4 decoration-2">
                Merkezi
              </span>
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40 dark:text-white/40 ml-14">
            PIM (Product Information Management) Moderasyon Kuyruğu
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] px-8 py-4 border border-[#F8F8FA] dark:border-white/5 shadow-sm flex flex-col items-center justify-center">
            <span className="text-3xl font-display font-black text-brand-primary dark:text-white leading-none">
              {products.length}
            </span>
            <span className="text-[9px] text-brand-primary/40 dark:text-white/40 font-black uppercase tracking-widest mt-1">
              Bekleyen
            </span>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] px-8 py-4 border border-[#F8F8FA] dark:border-white/5 shadow-sm flex flex-col items-center justify-center">
            <span className="text-3xl font-display font-black text-[#F9423A] leading-none">1</span>
            <span className="text-[9px] text-[#F9423A]/60 font-black uppercase tracking-widest mt-1">
              Şüpheli
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Queue List */}
        <div className="lg:col-span-5 flex flex-col h-[calc(100vh-250px)]">
          {/* Search & Filter */}
          <div className="flex gap-2 mb-6 shrink-0">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary/20 dark:text-white/20 group-focus-within:text-accent transition-colors" />
              <input
                type="text"
                placeholder="SKU, Başlık veya Satıcı ara..."
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-[#F8F8FA] dark:border-white/5 rounded-2xl text-[11px] font-bold text-brand-primary dark:text-white focus:border-accent/30 outline-none transition-all shadow-sm"
              />
            </div>
            <button className="p-3 bg-white dark:bg-zinc-900 border border-[#F8F8FA] dark:border-white/5 rounded-2xl text-brand-primary/40 hover:text-accent transition-colors shadow-sm">
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-10">
            <AnimatePresence>
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedProduct(product.id)}
                  className={cn(
                    'p-4 rounded-[2rem] cursor-pointer transition-all border group relative overflow-hidden',
                    selectedProduct === product.id
                      ? 'bg-accent/5 border-accent/20 shadow-md'
                      : 'bg-white dark:bg-zinc-900 border-[#F8F8FA] dark:border-white/5 hover:border-accent/20 hover:shadow-sm',
                  )}
                >
                  {selectedProduct === product.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent" />
                  )}
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-[1.25rem] overflow-hidden flex-shrink-0 bg-[#F8F8FA] dark:bg-zinc-950 border border-brand-primary/5 dark:border-white/5">
                      <img
                        src={product.image}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-white/40">
                          {product.id}
                        </span>
                        <span className="text-[9px] font-bold text-brand-primary/30 dark:text-white/30 flex items-center gap-1 uppercase tracking-widest">
                          <Clock className="w-3 h-3" /> {product.submittedAt}
                        </span>
                      </div>
                      <h4 className="text-[13px] font-black text-brand-primary dark:text-white truncate mb-2">
                        {product.title}
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-brand-primary/60 dark:text-white/60 truncate max-w-[120px]">
                          {product.seller}
                        </span>
                        <div
                          className={cn(
                            'flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg',
                            product.aiScore >= 90
                              ? 'bg-green-100 text-green-700'
                              : product.aiScore >= 70
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700',
                          )}
                        >
                          <Sparkles className="w-3 h-3" />
                          {product.aiScore}/100
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {products.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-[#F8F8FA] dark:border-white/5 border-dashed">
                <CheckCircle className="w-12 h-12 text-[#10B981] mx-auto mb-4" />
                <p className="text-[13px] font-black text-brand-primary dark:text-white uppercase tracking-widest mb-1">
                  Tüm Liste Temiz!
                </p>
                <p className="text-[10px] text-brand-primary/40 font-bold uppercase tracking-widest">
                  Bekleyen ürün onayı bulunmuyor.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product Detail Review View */}
        <div className="lg:col-span-7 h-[calc(100vh-250px)]">
          {activeProduct ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-[#F8F8FA] dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-full relative"
            >
              {/* Detail Header */}
              <div className="p-8 border-b border-[#F8F8FA] dark:border-white/5 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-brand-primary/5 dark:bg-white/5 text-brand-primary/60 dark:text-white/60 text-[9px] font-black rounded-lg uppercase tracking-widest">
                      {activeProduct.category}
                    </span>
                    {activeProduct.aiFlags.length > 0 && (
                      <span className="px-3 py-1 bg-[#F9423A]/10 text-[#F9423A] text-[9px] font-black rounded-lg uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Şüpheli İçerik
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl lg:text-2xl font-display font-black text-brand-primary dark:text-white leading-tight mb-2">
                    {activeProduct.title}
                  </h2>
                  <p className="text-[11px] font-bold text-brand-primary/40 flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3 h-3" /> {activeProduct.seller}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-brand-primary/20" />
                    <span className="text-brand-primary font-black">{activeProduct.price}</span>
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end shrink-0 bg-[#F8F8FA] dark:bg-zinc-950 p-4 rounded-2xl">
                  <p className="text-[9px] text-brand-primary/40 uppercase font-black tracking-widest mb-1">
                    Yapay Zeka Güven Skoru
                  </p>
                  <div className="text-3xl font-display font-black text-brand-primary dark:text-white flex items-baseline gap-1">
                    {activeProduct.aiScore}{' '}
                    <span className="text-sm font-bold text-brand-primary/20">/100</span>
                  </div>
                </div>
              </div>

              {/* Detail Body */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
                {/* AI Analysis Box */}
                <div
                  className={cn(
                    'p-6 rounded-[2rem] border',
                    activeProduct.aiFlags.length > 0
                      ? 'bg-[#F9423A]/5 border-[#F9423A]/20'
                      : 'bg-[#10B981]/5 border-[#10B981]/20',
                  )}
                >
                  <h4 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 mb-4 text-brand-primary dark:text-white">
                    <Sparkles
                      className={cn(
                        'w-4 h-4',
                        activeProduct.aiFlags.length > 0 ? 'text-[#F9423A]' : 'text-[#10B981]',
                      )}
                    />
                    Sistem Analiz Raporu
                  </h4>
                  {activeProduct.aiFlags.length > 0 ? (
                    <ul className="space-y-3">
                      {activeProduct.aiFlags.map((flag) => (
                        <li
                          key={flag}
                          className="flex items-start gap-3 text-[11px] font-bold text-[#F9423A]"
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Aykırı durum tespit edildi: {flag.toUpperCase()}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] font-bold text-[#10B981] leading-relaxed">
                      ✓ Tüm otomatik denetimler başarılı. Görsel kalitesi uygun, yasaklı kelime
                      bulunamadı, fiyatlandırma kategori standartlarına uygun.
                    </p>
                  )}
                </div>

                {/* Visuals */}
                <div>
                  <h4 className="text-[10px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Yüklenen Medyalar
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="aspect-square rounded-[1.5rem] overflow-hidden bg-[#F8F8FA] border border-brand-primary/5 relative group cursor-zoom-in">
                      <img
                        src={activeProduct.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-brand-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="text-white w-6 h-6" />
                      </div>
                    </div>
                    {/* Placeholders for other images */}
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-[1.5rem] overflow-hidden bg-[#F8F8FA] border border-brand-primary/5 flex items-center justify-center border-dashed"
                      >
                        <span className="text-[10px] font-bold text-brand-primary/20 uppercase">
                          Boş
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-[10px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <List className="w-4 h-4" /> Ürün Açıklaması
                  </h4>
                  <div className="p-6 bg-[#F8F8FA] dark:bg-zinc-950 rounded-[2rem] border border-brand-primary/5">
                    <p className="text-[11px] font-medium text-brand-primary/70 dark:text-white/70 leading-relaxed">
                      {activeProduct.description}
                    </p>
                  </div>
                </div>

                {/* Variants Matrix */}
                {activeProduct.variants && (
                  <div>
                    <h4 className="text-[10px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Varyant Matrisi
                    </h4>
                    <div className="overflow-x-auto rounded-[2rem] border border-brand-primary/5 bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#F8F8FA] text-[9px] font-black uppercase tracking-widest text-brand-primary/40">
                            <th className="px-6 py-4">SKU</th>
                            <th className="px-6 py-4">Özellikler</th>
                            <th className="px-6 py-4">Stok</th>
                            <th className="px-6 py-4">Fiyat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeProduct.variants.map((v, i) => (
                            <tr
                              key={i}
                              className="border-t border-brand-primary/5 text-[11px] font-bold text-brand-primary"
                            >
                              <td className="px-6 py-4 font-mono text-accent">{v.sku}</td>
                              <td className="px-6 py-4">
                                {v.color} - {v.size}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={cn(
                                    'px-2 py-1 rounded-md',
                                    v.stock > 0
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700',
                                  )}
                                >
                                  {v.stock}
                                </span>
                              </td>
                              <td className="px-6 py-4">{v.price}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SEO */}
                {activeProduct.seo && (
                  <div>
                    <h4 className="text-[10px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Arama Motoru Optimizasyonu (SEO)
                    </h4>
                    <div className="p-6 bg-[#F8F8FA] dark:bg-zinc-950 rounded-[2rem] border border-brand-primary/5 space-y-4">
                      <div>
                        <span className="block text-[9px] font-black text-brand-primary/40 uppercase tracking-widest mb-1">
                          SEO Başlığı
                        </span>
                        <p className="text-[11px] font-bold text-blue-600">
                          {activeProduct.seo.title}
                        </p>
                      </div>
                      <div>
                        <span className="block text-[9px] font-black text-brand-primary/40 uppercase tracking-widest mb-1">
                          Anahtar Kelimeler
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {activeProduct.seo.keywords.split(',').map((kw, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-white border border-brand-primary/10 rounded-md text-[10px] font-bold text-brand-primary/60"
                            >
                              {kw.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="p-6 border-t border-[#F8F8FA] dark:border-white/5 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button className="px-6 py-3 flex items-center gap-2 text-brand-primary/40 hover:text-brand-primary dark:hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors rounded-xl hover:bg-[#F8F8FA] dark:hover:bg-white/5">
                  <RefreshCcw className="w-4 h-4" /> Revizyon İste
                </button>
                <div className="flex gap-4 w-full sm:w-auto">
                  <button
                    onClick={() => handleReject(activeProduct.id)}
                    className="flex-1 sm:flex-none px-8 py-3.5 bg-white border-2 border-[#F9423A]/20 text-[#F9423A] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#F9423A]/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Reddet
                  </button>
                  <button
                    onClick={() => handleApprove(activeProduct.id)}
                    className="flex-1 sm:flex-none px-8 py-3.5 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-xl shadow-black/10"
                  >
                    <Check className="w-4 h-4" /> Onayla & Yayınla
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full bg-white dark:bg-zinc-900 rounded-[3rem] border border-[#F8F8FA] dark:border-white/5 shadow-sm flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 bg-[#F8F8FA] dark:bg-zinc-950 rounded-[2rem] flex items-center justify-center mb-6 border border-brand-primary/5">
                <Package className="w-10 h-10 text-brand-primary/20 dark:text-white/20" />
              </div>
              <h3 className="text-xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white mb-2">
                İncelemek İçin Ürün Seçin
              </h3>
              <p className="text-[11px] font-bold text-brand-primary/40 dark:text-white/40 max-w-[250px] leading-relaxed">
                Kuyruktaki ürünlerden birine tıklayarak yapay zeka analizini ve detayları
                görebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
