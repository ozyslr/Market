import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, X, ChevronRight, Shield, BarChart3, Megaphone } from 'lucide-react';
import { setConsent, getPreferences, isEU } from '@/lib/analytics';

type ConsentLevel = 'accepted' | 'denied';

interface ToggleState {
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(() => !getPreferences());
  const [showDetails, setShowDetails] = useState(false);
  const [toggles, setToggles] = useState<ToggleState>({
    analytics: false,
    marketing: false,
  });

  if (!visible) return null;

  const euRegion = isEU();

  const handleAcceptAll = () => {
    setConsent({ analytics: 'accepted', marketing: 'accepted' });
    setVisible(false);
  };

  const handleEssentialsOnly = () => {
    setConsent({ analytics: 'denied', marketing: 'denied' });
    setVisible(false);
  };

  const handleSave = () => {
    setConsent({
      analytics: toggles.analytics ? 'accepted' : 'denied',
      marketing: toggles.marketing ? 'accepted' : 'denied',
    });
    setVisible(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 start-0 end-0 z-[15000] p-4 sm:p-6"
      >
        <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-950 border border-brand-primary/10 dark:border-white/10 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
          {/* GDPR notice for EU users */}
          {euRegion && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-5 py-3 text-center">
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                AB kullanicisi olarak cerez tercihleriniz varsayilan olarak kabul etmemektedir
                (opt-in). Istemediginiz cerezleri devre disi birakabilirsiniz.
              </p>
            </div>
          )}

          <div className="flex items-start gap-4 p-5 sm:p-6">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
              <Cookie size={20} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-brand-primary dark:text-white uppercase tracking-tight">
                    Cerez Tercihleri
                  </h3>
                  <p className="text-[11px] text-brand-primary/60 dark:text-white/60 mt-1 leading-relaxed max-w-xl">
                    Sitemizde alisveris deneyiminizi iyilestirmek ve trafik analizi yapmak icin
                    cerezler kullaniyoruz. Lutfen tercihlerinizi secin.
                  </p>
                </div>
                <button
                  onClick={() => handleEssentialsOnly()}
                  className="p-1.5 rounded-lg hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors shrink-0"
                  aria-label="Kapat"
                >
                  <X size={16} className="text-brand-primary/40" />
                </button>
              </div>

              {/* 3-tier toggles */}
              <div className="mt-4 space-y-2">
                {/* Mandatory — always on */}
                <div className="flex items-center justify-between p-3 bg-brand-secondary/30 dark:bg-zinc-900 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-brand-primary/40" />
                    <div>
                      <p className="text-[11px] font-black text-brand-primary dark:text-white">
                        Zorunlu Cerezler
                      </p>
                      <p className="text-[9px] text-brand-primary/40 dark:text-zinc-500">
                        Oturum, sepet, guvenlik — her zaman aktif
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-brand-primary/10 dark:bg-zinc-800 text-brand-primary/50 dark:text-zinc-400 rounded-full text-[9px] font-black uppercase">
                    Hep Acik
                  </span>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between p-3 bg-brand-secondary/30 dark:bg-zinc-900 rounded-xl">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-brand-primary/40" />
                    <div>
                      <p className="text-[11px] font-black text-brand-primary dark:text-white">
                        Analitik Cerezler
                      </p>
                      <p className="text-[9px] text-brand-primary/40 dark:text-zinc-500">
                        GA4 ile sayfa goruntuleme, urun etkilesimi takibi
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setToggles((t) => ({ ...t, analytics: !t.analytics }))}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      toggles.analytics ? 'bg-accent' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                    aria-label="Analitik cerezler"
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        toggles.analytics ? 'start-[18px]' : 'start-[2px]'
                      }`}
                    />
                  </button>
                </div>

                {/* Marketing */}
                <div className="flex items-center justify-between p-3 bg-brand-secondary/30 dark:bg-zinc-900 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Megaphone size={16} className="text-brand-primary/40" />
                    <div>
                      <p className="text-[11px] font-black text-brand-primary dark:text-white">
                        Pazarlama Cerezleri
                      </p>
                      <p className="text-[9px] text-brand-primary/40 dark:text-zinc-500">
                        Meta Pixel, TikTok — kisisellestirme ve reklam
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setToggles((t) => ({ ...t, marketing: !t.marketing }))}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      toggles.marketing ? 'bg-accent' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                    aria-label="Pazarlama cerezleri"
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        toggles.marketing ? 'start-[18px]' : 'start-[2px]'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {showDetails && (
                <div className="mt-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl text-[10px] text-brand-primary/50 dark:text-white/50 leading-relaxed space-y-2">
                  <p>
                    <strong className="font-black text-brand-primary dark:text-white">
                      Zorunlu Cerezler:
                    </strong>{' '}
                    Site islevselligi icin gerekli (oturum, sepet, guvenlik). Devre disi
                    birakilamaz.
                  </p>
                  <p>
                    <strong className="font-black text-brand-primary dark:text-white">
                      Analitik Cerezler:
                    </strong>{' '}
                    Google Analytics (GA4) — kullanim istatistikleri, urun etkilesimi, sayfa
                    goruntuleme. Kisisel veri icermez.
                  </p>
                  <p>
                    <strong className="font-black text-brand-primary dark:text-white">
                      Pazarlama Cerezleri:
                    </strong>{' '}
                    Meta Pixel, TikTok Pixel — reklam kisisellestirme, donusum takibi. 3. taraf
                    cerezleridir.
                  </p>
                  <p className="text-[9px] text-brand-primary/30 mt-2">
                    Detayli bilgi icin{' '}
                    <a href="/cookies" className="underline hover:text-accent">
                      Cerez Politikamizi
                    </a>{' '}
                    ve{' '}
                    <a href="/privacy" className="underline hover:text-accent">
                      Gizlilik Politikamizi
                    </a>{' '}
                    inceleyebilirsiniz.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <button
                  onClick={handleAcceptAll}
                  className="px-5 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                >
                  Tumunu Kabul Et
                </button>
                {euRegion && (
                  <button
                    onClick={handleSave}
                    className="px-5 py-2.5 border border-accent text-accent rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent/10 transition-all"
                  >
                    Secimleri Kaydet
                  </button>
                )}
                <button
                  onClick={handleEssentialsOnly}
                  className="px-5 py-2.5 border border-brand-primary/10 dark:border-white/10 text-brand-primary dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-secondary/50 dark:hover:bg-zinc-900 transition-all"
                >
                  Yalnizca Zorunlu
                </button>
                <button
                  onClick={() => setShowDetails((d) => !d)}
                  className="flex items-center gap-1 text-[10px] font-bold text-brand-primary/40 hover:text-brand-primary transition-colors"
                >
                  <ChevronRight size={12} className={showDetails ? 'rotate-90' : ''} />
                  Detaylar
                </button>
              </div>

              <p className="text-[9px] text-brand-primary/25 dark:text-zinc-600 mt-3">
                Tercihleriniz 6 ay sureyle saklanir. Dilediginiz zaman tarayici ayarlarinizdan
                cerezleri temizleyerek tercihlerinizi sifirlayabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
