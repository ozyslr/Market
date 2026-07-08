import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Search,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { verifyProduct, getExplorerUrl } from '@/services/blockchainService';
import type { VerificationResult } from '@/services/blockchainService';

type ViewState = 'search' | 'loading' | 'found' | 'not_found' | 'error';

export function ProductVerification() {
  const [query, setQuery] = useState('');
  const [viewState, setViewState] = useState<ViewState>('search');
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setViewState('loading');
    try {
      const res = await verifyProduct(query.trim());
      setResult(res);
      setViewState(res.authentic ? 'found' : 'not_found');
    } catch {
      setViewState('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f4f7] dark:bg-zinc-950 pb-20 transition-colors duration-300">
      <div className="max-w-[800px] mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="pt-12 pb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-brand-primary dark:text-white uppercase italic tracking-tight">
            Blockchain Doğrulama
          </h1>
          <p className="text-sm font-bold text-brand-primary/40 dark:text-white/40 mt-3 max-w-md mx-auto">
            Ürün sertifika numarası veya seri numarası ile orijinallik doğrulaması yapın
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-brand-primary/5 dark:border-zinc-800 shadow-sm p-6 md:p-8 mb-8">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute start-4 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sertifika ID veya seri numarası girin (örn: MRC-XXXX-XXXX)"
                className="w-full ps-10 pe-4 py-3.5 bg-brand-secondary/30 dark:bg-zinc-800 rounded-xl border border-brand-primary/5 dark:border-zinc-700 outline-none focus:ring-4 ring-accent/10 text-sm font-bold transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim() || viewState === 'loading'}
              className="px-6 py-3.5 bg-accent text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-primary transition-all disabled:opacity-50 shadow-lg shadow-accent/20 flex items-center gap-2"
            >
              {viewState === 'loading' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Sorgula
            </button>
          </form>
        </div>

        {/* Results */}
        <motion.div
          key={viewState}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {viewState === 'loading' && (
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-brand-primary/5 dark:border-zinc-800 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 size={28} className="animate-spin text-accent" />
              </div>
              <p className="text-sm font-black text-brand-primary/40 uppercase tracking-widest">
                Blockchain sorgulanıyor...
              </p>
            </div>
          )}

          {viewState === 'found' && result?.certificate && (
            <div className="space-y-6">
              {/* Verified Banner */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-[2rem] border border-emerald-200 dark:border-emerald-800 shadow-sm p-8 text-center">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl font-black text-emerald-800 dark:text-emerald-200 uppercase tracking-wider mb-2">
                  Ürün Orijinaldir
                </h2>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Blockchain kaydı başarıyla doğrulandı
                </p>
              </div>

              {/* Certificate Details */}
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-brand-primary/5 dark:border-zinc-800 shadow-sm p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-brand-primary/5 dark:border-zinc-800">
                  <img
                    src={result.certificate.productImage}
                    alt={result.certificate.productTitle}
                    className="w-20 h-20 object-contain bg-brand-secondary/30 rounded-2xl p-2 border border-brand-primary/5"
                    loading="lazy"
                  />
                  <div>
                    <h3 className="text-lg font-black text-brand-primary dark:text-white uppercase">
                      {result.certificate.productTitle}
                    </h3>
                    <p className="text-xs font-bold text-brand-primary/40 dark:text-white/40 mt-1">
                      {result.certificate.metadata.brand} ·{' '}
                      {result.certificate.metadata.originCountry}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-brand-secondary/30 dark:bg-zinc-800/50 rounded-xl border border-brand-primary/5 dark:border-zinc-700">
                    <p className="text-[9px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-wider mb-1">
                      Seri Numarası
                    </p>
                    <p className="text-xs font-mono font-bold text-brand-primary dark:text-white">
                      {result.certificate.metadata.serialNumber}
                    </p>
                  </div>
                  <div className="p-4 bg-brand-secondary/30 dark:bg-zinc-800/50 rounded-xl border border-brand-primary/5 dark:border-zinc-700">
                    <p className="text-[9px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-wider mb-1">
                      İşlem Hash
                    </p>
                    <p className="text-[10px] font-mono font-bold text-brand-primary dark:text-white truncate">
                      {result.certificate.txHash.substring(0, 20)}...
                    </p>
                  </div>
                  <div className="p-4 bg-brand-secondary/30 dark:bg-zinc-800/50 rounded-xl border border-brand-primary/5 dark:border-zinc-700">
                    <p className="text-[9px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-wider mb-1">
                      Blok Numarası
                    </p>
                    <p className="text-xs font-mono font-bold text-brand-primary dark:text-white">
                      #{result.certificate.blockNumber.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-brand-secondary/30 dark:bg-zinc-800/50 rounded-xl border border-brand-primary/5 dark:border-zinc-700">
                    <p className="text-[9px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-wider mb-1">
                      Ağ
                    </p>
                    <p className="text-xs font-bold text-brand-primary dark:text-white">
                      {result.certificate.network}
                    </p>
                  </div>
                  <div className="p-4 bg-brand-secondary/30 dark:bg-zinc-800/50 rounded-xl border border-brand-primary/5 dark:border-zinc-700">
                    <p className="text-[9px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-wider mb-1">
                      Düzenlenme
                    </p>
                    <p className="text-xs font-bold text-brand-primary dark:text-white">
                      {new Date(result.certificate.issuedAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="p-4 bg-brand-secondary/30 dark:bg-zinc-800/50 rounded-xl border border-brand-primary/5 dark:border-zinc-700">
                    <p className="text-[9px] font-black text-brand-primary/40 dark:text-white/40 uppercase tracking-wider mb-1">
                      Menşei
                    </p>
                    <p className="text-xs font-bold text-brand-primary dark:text-white">
                      {result.certificate.metadata.originCountry}
                    </p>
                  </div>
                </div>

                <a
                  href={getExplorerUrl(result.certificate)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <ExternalLink size={16} />
                  PolygonScan&apos;de Görüntüle
                </a>
              </div>
            </div>
          )}

          {viewState === 'not_found' && (
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-amber-200 dark:border-amber-800 shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-amber-500" />
              </div>
              <h2 className="text-xl font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-2">
                Sertifika Bulunamadı
              </h2>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-6">
                Bu sertifika numarasına ait kayıt bulunamadı. Lütfen girdiğiniz bilgiyi kontrol
                edin.
              </p>
              <button
                onClick={() => {
                  setViewState('search');
                  setQuery('');
                  setResult(null);
                }}
                className="px-8 py-3 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-primary transition-all"
              >
                Yeni Sorgulama
              </button>
            </div>
          )}

          {viewState === 'error' && (
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-red-200 dark:border-red-800 shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black text-red-700 dark:text-red-300 uppercase tracking-wider mb-2">
                Sorgulama Hatası
              </h2>
              <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-6">
                Blockchain sorgulaması sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.
              </p>
              <button
                onClick={() => setViewState('search')}
                className="px-8 py-3 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-primary transition-all"
              >
                Tekrar Dene
              </button>
            </div>
          )}
        </motion.div>

        {/* Info Section */}
        <div className="mt-8 bg-white dark:bg-zinc-900 rounded-[2rem] border border-brand-primary/5 dark:border-zinc-800 shadow-sm p-6 md:p-8">
          <h3 className="text-sm font-black text-brand-primary dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent" />
            Blockchain Doğrulama Nedir?
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            {[
              {
                icon: ShieldCheck,
                title: 'Değiştirilemez Kayıt',
                desc: 'Her sertifika blok zincirinde saklanır ve değiştirilemez.',
              },
              {
                icon: Search,
                title: 'Anında Doğrulama',
                desc: 'Seri numarası ile saniyeler içinde orijinallik kontrolü yapın.',
              },
              {
                icon: Package,
                title: 'Ürün Güvencesi',
                desc: 'Satın aldığınız ürünün orijinal olduğundan emin olun.',
              },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-brand-secondary/30 dark:bg-zinc-800/50 rounded-xl">
                <item.icon size={24} className="text-accent mx-auto mb-3" />
                <h4 className="text-xs font-black text-brand-primary dark:text-white uppercase mb-1">
                  {item.title}
                </h4>
                <p className="text-[10px] font-bold text-brand-primary/40 dark:text-white/40">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
