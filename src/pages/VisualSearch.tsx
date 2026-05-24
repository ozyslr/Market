import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera, Upload, ImageIcon, Search, X,
  Sparkles, Loader2, AlertCircle, ChevronRight,
  Package, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '@/types';
import { ProductCard } from '@/components/commerce/ProductCard';
import { SEO } from '@/components/common/SEO';
import { useLanguage } from '@/context/LanguageContext';
import { searchByImage, VisualSearchResult } from '@/services/visualSearchService';
import { cn } from '@/lib/utils';

type ViewState = 'upload' | 'analyzing' | 'results' | 'error';

export function VisualSearch() {
  const { t, lang } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState<ViewState>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VisualSearchResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Lütfen bir görsel dosyası seçin.');
      setViewState('error');
      return;
    }

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setViewState('analyzing');

    try {
      const visualResult = await searchByImage(file);
      if (visualResult.products.length === 0) {
        setErrorMsg('Bu görsele benzer ürün bulunamadı.');
        setViewState('error');
      } else {
        setResult(visualResult);
        setViewState('results');
      }
    } catch {
      setErrorMsg('Görsel analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      setViewState('error');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const resetSearch = () => {
    setViewState('upload');
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-brand-secondary dark:bg-zinc-950 transition-colors">
      <SEO
        title="Görsel ile Ara — Benim Olan"
        description="Mercora'da fotoğraf çekerek veya görsel yükleyerek ürün arayın."
        lang={lang}
      />

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-black uppercase italic tracking-tight text-brand-primary dark:text-white">
                Görsel ile Ara
              </h1>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/30 dark:text-white/30">
              Fotoğraf çek veya yükle, benzer ürünleri bul
            </p>
          </div>
          {viewState !== 'upload' && (
            <button
              onClick={resetSearch}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary/5 text-brand-primary/60 hover:text-brand-primary rounded-xl text-xs font-bold transition-all"
            >
              <X size={14} /> Yeni Görsel
            </button>
          )}
        </div>

        {/* Upload / Analyzing / Results */}
        <AnimatePresence mode="wait">
          {viewState === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                  'relative border-2 border-dashed rounded-[2rem] p-16 md:p-24 text-center transition-all cursor-pointer',
                  dragOver
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                    : 'border-brand-primary/10 hover:border-purple-400 bg-white dark:bg-zinc-900',
                )}
                onClick={() => fileRef.current?.click()}
              >
                <div className="max-w-md mx-auto space-y-6">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-[2rem] flex items-center justify-center">
                    <ImageIcon size={40} className="text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-black uppercase italic text-brand-primary dark:text-white mb-2">
                      Görsel Yükleyin
                    </h2>
                    <p className="text-sm font-bold text-brand-primary/40 dark:text-white/40">
                      Sürükleyip bırakın veya tıklayarak seçin
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <span className="flex items-center gap-2 px-4 py-2 bg-brand-primary/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
                      <Upload size={12} /> PNG, JPG, WEBP
                    </span>
                    <span className="flex items-center gap-2 px-4 py-2 bg-brand-primary/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
                      Max 10MB
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:from-purple-500 hover:to-pink-400 transition-all shadow-xl shadow-purple-500/20"
                  >
                    <Upload size={16} /> Görsel Seç
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Tips */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Camera, text: 'Net ve iyi aydınlatılmış fotoğraflar daha iyi sonuç verir' },
                  { icon: TrendingUp, text: 'Tek ürün odaklı görseller en doğru eşleşmeyi sağlar' },
                  { icon: Package, text: 'Beyaz veya sade arka planlı ürün görselleri önerilir' },
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/5">
                    <tip.icon size={18} className="text-purple-500 shrink-0" />
                    <p className="text-[11px] font-bold text-brand-primary/50 dark:text-white/50 leading-tight">{tip.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {viewState === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative mb-8">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Yüklenen görsel"
                    className="w-40 h-40 object-cover rounded-[2rem] shadow-2xl border-4 border-white dark:border-zinc-800"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/40 to-transparent rounded-[2rem]" />
                <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center shadow-xl">
                  <Sparkles size={20} className="text-white animate-pulse" />
                </div>
              </div>
              <Loader2 size={28} className="animate-spin text-purple-500 mb-4" />
              <p className="text-sm font-black uppercase tracking-widest text-brand-primary/30 dark:text-white/30">
                Görsel analiz ediliyor...
              </p>
              <p className="text-[10px] font-bold text-brand-primary/20 dark:text-white/20 mt-2">
                Yapay zeka ile benzer ürünler taranıyor
              </p>
            </motion.div>
          )}

          {viewState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-[2rem] flex items-center justify-center mb-6">
                <AlertCircle size={36} className="text-red-400" />
              </div>
              <p className="text-lg font-black uppercase italic text-brand-primary dark:text-white mb-2">
                Sonuç Bulunamadı
              </p>
              <p className="text-sm font-bold text-brand-primary/40 dark:text-white/40 mb-8 text-center max-w-md">
                {errorMsg}
              </p>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Yüklenen görsel"
                  className="w-32 h-32 object-cover rounded-2xl shadow-lg mb-8 border border-brand-primary/10"
                  loading="lazy"
                />
              )}
              <button
                onClick={resetSearch}
                className="inline-flex items-center gap-2 px-8 py-3 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-accent transition-all"
              >
                Tekrar Dene
              </button>
            </motion.div>
          )}

          {viewState === 'results' && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Analysis summary */}
              {result.analysis && (
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-brand-primary/5 p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    {previewUrl && (
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border border-brand-primary/10 shrink-0">
                        <img src={previewUrl} alt="Aranan görsel" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {result.analysis.category}
                        </span>
                        <span className="px-3 py-1 bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {result.analysis.color}
                        </span>
                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {result.analysis.style}
                        </span>
                      </div>
                      <h3 className="text-lg font-display font-black uppercase italic text-brand-primary dark:text-white">
                        {result.analysis.title}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {result.analysis.keywords.map(kw => (
                          <Link
                            key={kw}
                            to={`/search?q=${encodeURIComponent(kw)}`}
                            className="px-2.5 py-1 bg-brand-primary/5 text-brand-primary/50 hover:text-accent rounded-lg text-[10px] font-bold transition-colors"
                          >
                            {kw}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <Link
                      to={`/search?q=${encodeURIComponent(result.analysis.keywords.slice(0, 3).join(' '))}`}
                      className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary transition-all shrink-0"
                    >
                      Tümünü Gör <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              )}

              {/* Results grid */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Search size={16} className="text-purple-500" />
                  <h2 className="text-lg font-display font-black uppercase italic text-brand-primary dark:text-white">
                    Benzer Ürünler
                  </h2>
                  <span className="text-[10px] font-bold text-brand-primary/30 dark:text-white/30">
                    ({result.products.length} sonuç)
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {result.products.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link to={`/product/${product.slug || product.id}`}>
                        <ProductCard product={{
                          ...product,
                          images: product.images?.length ? product.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
                          slug: product.slug || product.id,
                        }} />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
