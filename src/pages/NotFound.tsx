import { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Home, Package, Megaphone, Headphones } from 'lucide-react';
import { SEO } from '@/components/common/SEO';

const quickLinks = [
  { label: 'Ana Sayfa', to: '/', icon: Home },
  { label: 'Ürünler', to: '/search', icon: Package },
  { label: 'Kampanyalar', to: '/campaigns', icon: Megaphone },
  { label: 'Destek', to: '/contact', icon: Headphones },
];

export function NotFound() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-brand-secondary dark:bg-brand-secondary flex flex-col items-center justify-center text-center px-8 py-20 transition-colors duration-300">
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-404 {
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
        }
      `}</style>

      <SEO
        title="Sayfa Bulunamadı"
        description="Aradığınız sayfa taşınmış veya silinmiş olabilir. Ana sayfaya dönün veya arama yapın."
      />

      <motion.p
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-[12rem] md:text-[16rem] font-black leading-none mb-4 bg-gradient-to-r from-accent via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-404 select-none"
      >
        404
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-2xl md:text-3xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white mb-3"
      >
        Sayfa Bulunamadı
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-brand-primary/60 dark:text-white/60 text-sm mb-10 max-w-md"
      >
        Aradığınız sayfa taşınmış veya silinmiş olabilir.
        Aşağıdaki bağlantıları kullanarak ihtiyacınız olanı bulabilirsiniz.
      </motion.p>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex flex-wrap justify-center gap-3 mb-12"
      >
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 text-brand-primary dark:text-white rounded-2xl font-black text-[11px] uppercase tracking-wide border border-brand-primary/5 dark:border-white/5 hover:border-accent hover:text-accent dark:hover:text-accent shadow-sm transition-all"
          >
            <link.icon size={14} />
            {link.label}
          </Link>
        ))}
      </motion.div>

      {/* Search */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        onSubmit={handleSearch}
        className="w-full max-w-md relative"
        role="search"
        aria-label="Ürün ara"
      >
        <Search
          size={18}
          className="absolute start-4 top-1/2 -translate-y-1/2 text-brand-primary/30 dark:text-white/30"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ne aramıştınız?"
          aria-label="Ne aramıştınız?"
          className="w-full bg-white dark:bg-zinc-900 border border-brand-primary/10 dark:border-white/10 rounded-2xl py-4 ps-12 pe-6 text-brand-primary dark:text-white placeholder:text-brand-primary/30 dark:placeholder:text-white/30 font-medium text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
        />
      </motion.form>
    </div>
  );
}
