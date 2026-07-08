import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  ExternalLink,
  Plus,
  Loader2,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Package,
  Globe,
  Hash,
  Calendar,
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { issueCertificate, getExplorerUrl } from '@/services/blockchainService';
import type { ProductCertificate } from '@/services/blockchainService';
import { Product } from '@/types';

type Tab = 'certificates' | 'issue';

export function SellerCertificates() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('certificates');
  const [certificates, setCertificates] = useState<(ProductCertificate & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);

  // Issue form
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    loadCertificates();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function loadCertificates() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'productCertificates'),
          // Note: We query all and filter client-side since Firestore doesn't support OR queries easily
          // In production, create composite indexes
          orderBy('issuedAt', 'desc'),
          limit(50),
        ),
      );
      const all = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as ProductCertificate & { id: string },
      );
      setCertificates(all.filter((c) => c.sellerId === user.id));
    } catch {
      // Fallback: empty
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    if (!user?.id) return;
    try {
      const snap = await getDocs(
        query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(100)),
      );
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
      setProducts(all.filter((p) => p.sellerId === user.id));
    } catch {
      // Fallback: empty
    }
  }

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  async function handleIssue() {
    if (!selectedProduct || !user?.id) return;
    setIssuing(true);
    try {
      await issueCertificate({
        productId: selectedProduct.id,
        productTitle: selectedProduct.title,
        productImage: selectedProduct.images[0] || '',
        sellerId: user.id,
        ownerId: user.id,
        brand: selectedProduct.brand,
        originCountry: selectedProduct.originCountry,
      });
      setSelectedProduct(null);
      setSearchTerm('');
      await loadCertificates();
    } catch {
      // Handle error silently
    } finally {
      setIssuing(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blockchain Sertifikaları</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Ürünleriniz için blockchain destekli orijinallik sertifikaları oluşturun ve yönetin
          </p>
        </div>
        <button
          onClick={() => setActiveTab('issue')}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all"
        >
          <Plus size={16} />
          Sertifika Oluştur
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        {[
          { id: 'certificates' as Tab, label: 'Sertifikalarım' },
          { id: 'issue' as Tab, label: 'Yeni Sertifika' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="cert-tab"
                className="absolute bottom-0 start-0 end-0 h-0.5 bg-emerald-400"
              />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'certificates' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-emerald-400" />
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={28} className="text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Henüz sertifika yok</h3>
              <p className="text-sm text-zinc-400 mb-6">İlk blockchain sertifikanızı oluşturun</p>
              <button
                onClick={() => setActiveTab('issue')}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-500 transition-all"
              >
                Sertifika Oluştur
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-emerald-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <img
                        src={cert.productImage}
                        alt={cert.productTitle}
                        className="w-16 h-16 object-contain rounded-xl bg-zinc-800 p-2 shrink-0"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-white truncate">{cert.productTitle}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Hash size={12} className="text-emerald-500" />
                            <span className="font-mono">{cert.metadata.serialNumber}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Package size={12} className="text-emerald-500" />
                            {cert.metadata.brand}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe size={12} className="text-emerald-500" />
                            {cert.metadata.originCountry}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-emerald-500" />
                            {new Date(cert.issuedAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded-full text-[10px] font-medium text-emerald-400">
                            <CheckCircle2 size={10} />
                            {cert.verified ? 'Doğrulandı' : 'Beklemede'}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            Blok #{cert.blockNumber.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={getExplorerUrl(cert)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[10px] text-zinc-400 hover:text-white transition-all shrink-0"
                    >
                      <ExternalLink size={12} />
                      Blokta Gör
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'issue' && (
        <div className="max-w-2xl">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">Yeni Sertifika Oluştur</h3>

            {/* Product Selector */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Ürün Seçin</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ürün ara..."
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white outline-none focus:border-emerald-500 transition-colors"
              />
              {searchTerm && (
                <div className="mt-2 max-h-48 overflow-auto space-y-1">
                  {filteredProducts.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProduct(p);
                        setSearchTerm(p.title);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedProduct?.id === p.id
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-8 h-8 object-contain rounded"
                        loading="lazy"
                      />
                      <div className="text-start min-w-0">
                        <p className="truncate">{p.title}</p>
                        <p className="text-[10px] text-zinc-500">
                          {p.brand} · {p.originCountry}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Product Preview */}
            {selectedProduct && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Seçilen Ürün</h4>
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      setSearchTerm('');
                    }}
                    className="p-1 hover:bg-zinc-700 rounded-lg text-zinc-500 hover:text-white transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500">Marka</span>
                    <p className="text-white font-medium">{selectedProduct.brand}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Menşei</span>
                    <p className="text-white font-medium">{selectedProduct.originCountry}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Issue Button */}
            <button
              onClick={handleIssue}
              disabled={!selectedProduct || issuing}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all"
            >
              {issuing ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {issuing ? 'Blok zincire kaydediliyor...' : 'Sertifikayı Oluştur'}
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3">
              <ShieldCheck size={16} />
              Blockchain Sertifikası Hakkında
            </h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                Her sertifika benzersiz bir seri numarası ve işlem hash&apos;i ile blok zincirinde
                saklanır
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                Müşteriler ürün sayfasından veya doğrulama sayfasından sertifikayı görüntüleyebilir
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                Polygon Mumbai test ağı üzerinde kayıt altına alınır
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
