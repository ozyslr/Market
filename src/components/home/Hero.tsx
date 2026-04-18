import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Globe, ShieldCheck, Zap, Sparkles, Play, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative pt-32 pb-12 px-4 md:px-6 overflow-hidden bg-[#f2f4f7]">
      <div className="max-w-[1700px] mx-auto">
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Main Massive Carousel-style Banner (Amazon Style) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-8 bg-brand-primary rounded-[2.5rem] relative overflow-hidden group min-h-[500px] shadow-2xl"
          >
            <img 
              src="https://placehold.co/1600x1000/1a1a2e/ffffff?text=Mercora" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[3s]" 
              alt="" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary via-brand-primary/40 to-transparent p-10 md:p-16 flex flex-col justify-center">
               <motion.div
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.2 }}
                 className="space-y-6 max-w-xl"
               >
                  <span className="px-4 py-1.5 bg-accent text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full inline-block shadow-lg shadow-accent/20">{t('hero.badge')}</span>
                  <h1 className="text-5xl md:text-7xl font-display font-black text-white leading-none uppercase italic tracking-tighter">{t('hero.title')} <br /> Artifacts <br /> <span className="text-accent underline decoration-4 underline-offset-8">{t('hero.subtitle')}</span></h1>
                  <p className="text-white/60 text-lg font-medium leading-relaxed max-w-md">{t('hero.desc')}</p>
                  <div className="flex flex-wrap gap-4 pt-4">
                     <Link to="/search?category=electronics" className="px-8 py-4 bg-white text-brand-primary rounded-xl font-black uppercase text-xs tracking-widest hover:bg-accent hover:text-white transition-all shadow-2xl">{t('hero.cta')}</Link>
                     <button className="px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white/20 transition-all flex items-center gap-2">
                        <Play size={16} fill="white" /> {t('hero.watch')}
                     </button>
                  </div>
               </motion.div>
            </div>
            
            <div className="absolute bottom-8 right-8 flex gap-2">
               {[0,1,2].map(i => <div key={i} className={cn("transition-all duration-500", i===0 ? "w-8 h-2 bg-accent rounded-full" : "w-2 h-2 bg-white/20 rounded-full")} />)}
            </div>
          </motion.div>

          {/* Side Spotlights (Hepsiburada Style) */}
          <div className="lg:col-span-4 grid grid-cols-1 gap-6">
             <div className="bg-brand-secondary rounded-[2.5rem] p-8 border border-brand-primary/5 relative overflow-hidden group border-2 border-transparent hover:border-accent transition-all cursor-pointer shadow-sm">
                <div className="relative z-10 h-full flex flex-col">
                   <span className="text-[10px] font-black uppercase text-accent tracking-widest mb-2 block">{t('hero.spotlight1.title')}</span>
                   <h3 className="text-2xl font-display font-black text-brand-primary uppercase italic leading-none">Global <br />Fulfillment</h3>
                   <p className="text-brand-primary/40 text-[10px] mt-4 font-bold max-w-[140px]">{t('hero.spotlight1.desc')}</p>
                   <div className="mt-auto">
                      <button className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center group-hover:bg-accent transition-colors">
                         <ChevronRight size={20} />
                      </button>
                   </div>
                </div>
                <Globe size={180} className="absolute -bottom-10 -right-10 text-brand-primary/5 group-hover:rotate-12 transition-transform duration-1000" />
             </div>

             <div className="bg-[#fff7ed] rounded-[2.5rem] p-8 border border-orange-100 relative overflow-hidden group hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between">
                <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-4">
                      <Zap size={24} className="text-orange-500 fill-orange-500" />
                      <span className="text-[10px] font-black uppercase text-orange-950 tracking-widest leading-none">Flash Pulse</span>
                   </div>
                   <h3 className="text-2xl font-display font-black text-orange-950 uppercase italic leading-none">Sınırlı Süre <br /> Stokta</h3>
                   <p className="text-orange-900/40 text-[10px] mt-4 font-bold">Kamp & Doğa ekipmanlarında geçerli</p>
                </div>
                <div className="relative z-10 mt-6">
                   <Link to="/search?category=camping" className="inline-flex items-center gap-2 text-xs font-black uppercase text-orange-600">Fırsatları Gör <ChevronRight size={14} /></Link>
                </div>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                <Sparkles size={80} className="absolute bottom-4 right-4 text-orange-500/10 group-hover:scale-125 transition-transform" />
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
