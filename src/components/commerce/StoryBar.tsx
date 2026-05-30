import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { CATEGORIES } from '@/mockData';
import { cn } from '@/lib/utils';
import { 
  Smartphone, Shirt, Home, ShoppingBasket, 
  Sparkles, Baby, Dog, Mountain, Zap 
} from 'lucide-react';

export function StoryBar() {
  const { t } = useLanguage();

  const storyImages: Record<string, string> = {
    'electronics': 'https://images.unsplash.com/photo-1526738549149-8e07eca2c1b4?auto=format&fit=crop&q=80&w=150&h=150',
    'fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=150&h=150',
    'home': 'https://images.unsplash.com/photo-1513584684031-43d1eaa483d4?auto=format&fit=crop&q=80&w=150&h=150',
    'supermarket': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=150&h=150',
    'beauty': 'https://images.unsplash.com/photo-1596462502278-27bfac4033c8?auto=format&fit=crop&q=80&w=150&h=150',
    'baby': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&q=80&w=150&h=150',
    'pet': 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=150&h=150',
    'sport': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=150&h=150',
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border-b border-brand-primary/5 py-4 overflow-hidden">
      <div className="max-w-[1700px] mx-auto px-4 md:px-8">
        <div className="flex items-center gap-6 md:gap-8 overflow-x-auto no-scrollbar pb-1">
          {/* Daily Deals Story */}
          <Link to="/search?tag=deals" className="flex flex-col items-center gap-2 shrink-0 group">
            <div className="relative">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full p-1 border-2 border-accent animate-spin-slow">
                 <div className="w-full h-full rounded-full bg-brand-primary flex items-center justify-center text-white">
                    <Zap size={20} fill="currentColor" className="text-accent" />
                 </div>
              </div>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase">Live</span>
            </div>
            <span className="text-[9px] font-black uppercase text-brand-primary dark:text-white tracking-widest">{t('nav.deals')}</span>
          </Link>

          {CATEGORIES.map((cat) => {
            const IconComponent = {
              Smartphone, Shirt, Home, ShoppingBasket, Sparkles, Baby, Dog, Mountain
            }[cat.icon] || Zap;

            return (
              <Link 
                key={cat.id} 
                to={`/search?categoryId=${cat.id}`} 
                className="flex flex-col items-center gap-2 shrink-0 group"
              >
                <div className="relative">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full p-1 border-2 border-brand-primary/10 group-hover:border-accent transition-all duration-500">
                    <div className="w-full h-full rounded-full overflow-hidden bg-brand-secondary">
                      <img 
                        src={storyImages[cat.id] || `https://picsum.photos/seed/${cat.id}/150/150`} 
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-brand-primary/10 group-hover:bg-transparent transition-colors" />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-white dark:bg-zinc-800 rounded-lg shadow-md border border-brand-primary/5 flex items-center justify-center text-brand-primary/40 group-hover:text-accent group-hover:scale-110 transition-all">
                    <IconComponent size={10} />
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase text-brand-primary/60 dark:text-white/60 tracking-widest group-hover:text-brand-primary dark:group-hover:text-white transition-colors text-center">
                  {t(`category.${cat.id}`)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
