'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck, Search, Loader2, ExternalLink,
  CheckCircle2, AlertTriangle, Package,
} from 'lucide-react';
import Link from 'next/link';
import { verifyProduct, getExplorerUrl } from '@/services/blockchainService';
import type { VerificationResult } from '@/services/blockchainService';

type ViewState = 'search' | 'loading' | 'found' | 'not_found' | 'error';

export default function VerifyPage() {
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-[800px] mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="pt-12 pb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Blockchain Doğrulama
          </h1>
          <p className="text-sm text-gray-500 mt-3 max-w-md mx-auto">
            Ürün sertifika numarası veya seri numarası ile orijinallik doğrulaması yapın
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8 mb-8">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Sertifika ID veya seri numarası girin (örn: MRC-XXXX-XXXX)"
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-4 ring-purple-500/10 text-sm font-medium transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim() || viewState === 'loading'}
              className="px-6 py-3.5 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-600/20 flex items-center gap-2"
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
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 size={28} className="animate-spin text-purple-600" />
              </div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                Blockchain sorgulanıyor...
              </p>
            </div>
          )}

          {viewState === 'found' && result?.certificate && (
            <div className="space-y-6">
              {/* Verified Banner */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2rem] border border-emerald-200 shadow-sm p-8 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={40} className="text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-800 uppercase tracking-wider mb-2">
                  Ürün Orijinaldir
                </h2>
                <p className="text-sm font-medium text-emerald-600">
                  Blockchain kaydı başarıyla doğrulandı
                </p>
              </div>

              {/* Certificate Details */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <img
                    src={result.certificate.productImage}
                    alt={result.certificate.productTitle}
                    className="w-20 h-20 object-contain bg-gray-50 rounded-2xl p-2 border border-gray-100"
                    loading="lazy"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{result.certificate.productTitle}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {result.certificate.metadata.brand} &middot; {result.certificate.metadata.originCountry}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Seri Numarası</p>
                    <p className="text-xs font-mono font-bold text-gray-900">{result.certificate.metadata.serialNumber}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">İşlem Hash</p>
                    <p className="text-[10px] font-mono font-bold text-gray-900 truncate">{result.certificate.txHash.substring(0, 20)}...</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Blok Numarası</p>
                    <p className="text-xs font-mono font-bold text-gray-900">#{result.certificate.blockNumber.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ağ</p>
                    <p className="text-xs font-bold text-gray-900">{result.certificate.network}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Düzenlenme</p>
                    <p className="text-xs font-bold text-gray-900">{new Date(result.certificate.issuedAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Menşei</p>
                    <p className="text-xs font-bold text-gray-900">{result.certificate.metadata.originCountry}</p>
                  </div>
                </div>

                <a
                  href={getExplorerUrl(result.certificate)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  <ExternalLink size={16} />
                  PolygonScan'de Görüntüle
                </a>
              </div>
            </div>
          )}

          {viewState === 'not_found' && (
            <div className="bg-white rounded-[2rem] border border-amber-200 shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-amber-700 uppercase tracking-wider mb-2">
                Sertifika Bulunamadı
              </h2>
              <p className="text-sm font-medium text-amber-600 mb-6">
                Bu sertifika numarasına ait kayıt bulunamadı. Lütfen girdiğiniz bilgiyi kontrol edin.
              </p>
              <button
                onClick={() => { setViewState('search'); setQuery(''); setResult(null); }}
                className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-purple-700 transition-all"
              >
                Yeni Sorgulama
              </button>
            </div>
          )}

          {viewState === 'error' && (
            <div className="bg-white rounded-[2rem] border border-red-200 shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-red-700 uppercase tracking-wider mb-2">
                Sorgulama Hatası
              </h2>
              <p className="text-sm font-medium text-red-600 mb-6">
                Blockchain sorgulaması sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.
              </p>
              <button
                onClick={() => setViewState('search')}
                className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-purple-700 transition-all"
              >
                Tekrar Dene
              </button>
            </div>
          )}
        </motion.div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-purple-600" />
            Blockchain Doğrulama Nedir?
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            {[
              { icon: ShieldCheck, title: 'Değiştirilemez Kayıt', desc: 'Her sertifika blok zincirinde saklanır ve değiştirilemez.' },
              { icon: Search, title: 'Anında Doğrulama', desc: 'Seri numarası ile saniyeler içinde orijinallik kontrolü yapın.' },
              { icon: Package, title: 'Ürün Güvencesi', desc: 'Satın aldığınız ürünün orijinal olduğundan emin olun.' },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <item.icon size={24} className="text-purple-600 mx-auto mb-3" />
                <h4 className="text-xs font-bold text-gray-900 uppercase mb-1">{item.title}</h4>
                <p className="text-[10px] font-medium text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
