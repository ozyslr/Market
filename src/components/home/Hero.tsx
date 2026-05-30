import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Globe, Zap, Sparkles, Play, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { useLanguage } from '@/context/LanguageContext';

const SLIDES = [
  {
    id: 1,
    title: 'TEKNOLOJİ',
    subtitle: 'DEV FIRSATLAR',
    desc: 'Lider markaların en yeni teknoloji ürünlerinde sepette ek %20 indirim.',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=1600&h=1000',
    color: 'accent',
    category: 'electronics'
  },
  {
    id: 2,
    title: 'EV & YAŞAM',
    subtitle: 'YENİ SEZON',
    desc: 'Evinizin havasını değiştirecek şık tasarımlar ve mobilyalarda süper fiyatlar.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1600&h=1000',
    color: 'blue-500',
    category: 'living-room'
  },
  {
    id: 3,
    title: 'OUTDOOR',
    subtitle: 'MACERA BAŞLIYOR',
    desc: 'Kamp ve doğa sporları ürünlerinde bahar kampanyasını kaçırma.',
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1600&h=1000',
    color: 'green-500',
    category: 'camping'
  }
];

export function Hero() {
  const { t } = useLanguage();
  const SLIDES = [
    {
      id: 1,
      title: t('hero.slide1.title'),
      subtitle: t('hero.slide1.subtitle'),
      desc: t('hero.slide1.desc'),
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=1600&h=1000',
      color: 'accent',
      category: 'electronics'
    },
    {
      id: 2,
      title: t('hero.slide2.title'),
      subtitle: t('hero.slide2.subtitle'),
      desc: t('hero.slide2.desc'),
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1600&h=1000',
      color: 'blue-500',
      category: 'home'
    },
    {
      id: 3,
      title: t('hero.slide3.title'),
      subtitle: t('hero.slide3.subtitle'),
      desc: t('hero.slide3.desc'),
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1600&h=1000',
      color: 'green-500',
      category: 'sport'
    }
  ];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % SLIDES.length);
  const prev = () => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  return (
    <div className="relative overflow-hidden group w-full h-[200px] md:h-[320px] lg:h-[380px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Link to={`/search?category=${SLIDES[current].category}`} className="block w-full h-full">
            <OptimizedImage
              src={SLIDES[current].image}
              className="absolute inset-0 w-full h-full object-cover md:object-fill"
              alt={SLIDES[current].title}
              containerClassName="absolute inset-0 w-full h-full"
              lazy={false}
              referrerPolicy="no-referrer"
            />
            {/* Dark overlay for contrast if text is visible, but in TR e-commerce, the image ITSELF contains the campaign text usually.
                We'll keep a soft gradient and text here for dynamic usage. */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent p-8 md:p-16 flex flex-col justify-center">
               <motion.div
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.2 }}
                 className="space-y-2 md:space-y-4 max-w-lg"
               >
                  <span className="px-3 py-1 bg-mercora-red text-white text-[10px] md:text-xs font-bold uppercase rounded w-fit">{t('hero.featured_campaign')}</span>
                  <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-white leading-none uppercase tracking-tight drop-shadow-md">
                    {SLIDES[current].title} <br />
                    <span className="text-yellow-400">{SLIDES[current].subtitle}</span>
                  </h1>
                  <p className="text-white/90 text-sm md:text-base font-medium leading-relaxed drop-shadow-md">{SLIDES[current].desc}</p>
               </motion.div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>
      
      {/* Nav Controls - Dots */}
      <div className="absolute bottom-4 start-1/2 -translate-x-1/2 flex items-center gap-2">
         {SLIDES.map((_, i) => (
           <button 
             key={i} 
             onClick={() => setCurrent(i)}
             className={cn(
               "transition-all duration-300 rounded-full", 
               i === current ? "w-8 h-2 bg-mercora-red" : "w-2 h-2 bg-white/50 hover:bg-white"
             )} 
           />
         ))}
      </div>

      {/* Nav Controls - Arrows */}
      <div className="absolute top-1/2 -translate-y-1/2 start-2 md:left-4 end-2 md:right-4 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
         <button onClick={prev} className="w-10 h-10 md:w-12 md:h-12 bg-white/50 dark:bg-zinc-700/50 hover:bg-white dark:hover:bg-zinc-700 rounded-full flex items-center justify-center text-brand-primary dark:text-white transition-all shadow-lg pointer-events-auto"><ChevronLeft size={24} /></button>
         <button onClick={next} className="w-10 h-10 md:w-12 md:h-12 bg-white/50 dark:bg-zinc-700/50 hover:bg-white dark:hover:bg-zinc-700 rounded-full flex items-center justify-center text-brand-primary dark:text-white transition-all shadow-lg pointer-events-auto"><ChevronRight size={24} /></button>
      </div>
    </div>
  );
}
