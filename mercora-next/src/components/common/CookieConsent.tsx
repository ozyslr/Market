'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, X, ChevronRight } from 'lucide-react';
import { acceptAnalytics, denyAnalytics, getConsent } from '@/lib/analytics';

export function CookieConsent() {
  const [visible, setVisible] = useState(() => getConsent() === 'pending');
  const [showDetails, setShowDetails] = useState(false);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-[15000] p-4 sm:p-6"
      >
        <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-950 border border-accent/10 dark:border-white/10 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
          {/* Main bar */}
          <div className="flex items-start gap-4 p-5 sm:p-6">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
              <Cookie size={20} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-brand-primary dark:text-white uppercase tracking-tight">
                    Çerez Tercihleri
                  </h3>
                  <p className="text-[11px] text-brand-primary/60 dark:text-white/60 mt-1 leading-relaxed max-w-xl">
                    Sitemizde alışveriş deneyiminizi iyileştirmek için çerezler kullanıyoruz.
                    {showDetails && (
                      <span> Google Analytics, Meta Pixel ve TikTok Pixel aracılığıyla sayfa görüntüleme, sepet işlemleri ve satın alma gibi etkinlikleri takip ediyoruz.</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setVisible(false)}
                  className="p-1.5 rounded-lg hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors shrink-0"
                  aria-label="Kapat"
                >
                  <X size={16} className="text-brand-primary/40" />
                </button>
              </div>

              {showDetails && (
                <div className="mt-4 p-4 bg-brand-secondary/30 dark:bg-zinc-900 rounded-2xl text-[10px] text-brand-primary/50 dark:text-white/50 leading-relaxed space-y-2">
                  <p><strong className="font-black text-brand-primary dark:text-white">Zorunlu Çerezler:</strong> Site işlevselliği için gerekli (oturum, sepet, güvenlik).</p>
                  <p><strong className="font-black text-brand-primary dark:text-white">Analitik Çerezler:</strong> GA4, Meta Pixel, TikTok Pixel — kullanım istatistikleri ve kişiselleştirme için.</p>
                  <p className="text-[9px] text-brand-primary/30 mt-2">Detaylı bilgi için Gizlilik Politikamızı inceleyebilirsiniz.</p>
                </div>
              )}

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => {
                    acceptAnalytics();
                    setVisible(false);
                  }}
                  className="px-5 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                >
                  Tümünü Kabul Et
                </button>
                <button
                  onClick={() => {
                    denyAnalytics();
                    setVisible(false);
                  }}
                  className="px-5 py-2.5 border border-brand-primary/10 dark:border-white/10 text-brand-primary dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-secondary/50 dark:hover:bg-zinc-900 transition-all"
                >
                  Yalnızca Zorunlu
                </button>
                <button
                  onClick={() => setShowDetails(d => !d)}
                  className="flex items-center gap-1 text-[10px] font-bold text-brand-primary/40 hover:text-brand-primary transition-colors"
                >
                  <ChevronRight size={12} className={showDetails ? 'rotate-90' : ''} />
                  Detaylar
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
