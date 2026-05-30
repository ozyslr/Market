import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, ShieldCheck, Zap, Instagram, Twitter, Linkedin, Facebook, Youtube, Smartphone, CheckCircle2, Lock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { cn } from '@/lib/utils';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer role="contentinfo" className="bg-white dark:bg-zinc-950 text-brand-primary dark:text-white pt-16 pb-8 border-t border-brand-primary/5">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        
        {/* Top Benefits Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 mb-12 border-b border-brand-primary/5">
           <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-500">
                 <ShieldCheck size={32} />
              </div>
              <h4 className="font-bold text-sm">Güvenli Alışveriş</h4>
              <p className="text-xs text-brand-primary/50 dark:text-white/50">256 Bit Şifreleme</p>
           </div>
           <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/10 flex items-center justify-center text-green-500">
                 <CheckCircle2 size={32} />
              </div>
              <h4 className="font-bold text-sm">Orijinal Ürün Garantisi</h4>
              <p className="text-xs text-brand-primary/50 dark:text-white/50">%100 Güvenilir Kaynaklar</p>
           </div>
           <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-mercora-red/10 dark:bg-mercora-red/5 flex items-center justify-center text-mercora-red">
                 <Zap size={32} />
              </div>
              <h4 className="font-bold text-sm">Hızlı Teknoloji</h4>
              <p className="text-xs text-brand-primary/50 dark:text-white/50">Anında Stok ve Flaş Teslimat</p>
           </div>
           <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-900/10 flex items-center justify-center text-purple-500">
                 <Lock size={32} />
              </div>
              <h4 className="font-bold text-sm">Gizlilik Politikası</h4>
              <p className="text-xs text-brand-primary/50 dark:text-white/50">KVKK Kapsamında Koruma</p>
           </div>
        </div>

        {/* Link Sections */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-8 mb-16 px-4">
          
          <div className="xl:col-span-1 hidden xl:block">
            <Link to="/" className="flex items-center gap-2 mb-6 group w-fit">
              <div className="w-10 h-10 bg-mercora-red rounded-xl flex items-center justify-center text-white scale-100 group-hover:scale-110 transition-transform shadow-lg">
                <ShoppingBagIcon />
              </div>
              <span className="font-display font-black text-3xl tracking-tighter uppercase italic text-brand-primary dark:text-white">TrendAl</span>
            </Link>
            <p className="text-xs text-brand-primary/50 dark:text-white/50 leading-relaxed font-medium mb-6 pe-8">
              Türkiye'nin yenilikçi, hızlı ve her zaman avantajlı e-ticaret platformu. Aradığın her şey burada.
            </p>
            <div className="flex flex-col gap-3">
               <button className="flex items-center gap-3 bg-black text-white px-4 py-2 rounded-xl hover:scale-105 transition-transform w-[160px]">
                  <AppleIcon />
                  <div className="text-start flex flex-col items-start leading-none">
                     <span className="text-[9px]">App Store'dan</span>
                     <span className="text-xs font-bold">İndirin</span>
                  </div>
               </button>
               <button className="flex items-center gap-3 bg-black text-white px-4 py-2 rounded-xl hover:scale-105 transition-transform w-[160px]">
                  <PlayIcon />
                  <div className="text-start flex flex-col items-start leading-none">
                     <span className="text-[9px]">Google Play'den</span>
                     <span className="text-xs font-bold">Alın</span>
                  </div>
               </button>
            </div>
          </div>

          {[
            {
              title: 'TrendAl',
              links: ['Biz Kimiz', 'Kariyer', 'İletişim', 'Sürdürülebilirlik', 'Güvenli Alışveriş']
            },
            {
              title: 'Hakkımızda',
              links: ['Müşteri Hizmetleri', 'TrendAl Blog', 'Yatırımcı İlişkileri', 'Kampanyalar', 'Hediye Kartı']
            },
            {
              title: 'Yardım',
              links: ['Sıkça Sorulan Sorular', 'Canlı Yardım', 'Nasıl İade Ederim', 'İşlem Rehberi', 'Kullanım Koşulları']
            },
            {
              title: 'Satış Yap',
              links: ['Satıcı Platformu', 'TrendAl Akademi', 'Reklam Ver', 'İş Ortaklığı', 'Seller Center']
            }
          ].map((section, i) => (
            <div key={i}>
              <h4 className="font-bold text-sm mb-6 text-brand-primary dark:text-white">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map(link => (
                  <li key={link}>
                    <Link to="/" className="text-brand-primary/60 dark:text-white/60 hover:text-mercora-red dark:hover:text-mercora-red transition-colors text-xs font-medium">{link}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="pt-8 border-t border-brand-primary/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-4">
            <span className="text-xs font-bold text-brand-primary/50 dark:text-white/50">Bizi Takip Edin:</span>
             <div className="flex gap-4">
               {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => {
                 const names = ['Instagram', 'Twitter', 'Facebook', 'Youtube'];
                 return (
                 <a href="#" key={i} className="text-brand-primary/40 hover:text-mercora-red dark:text-white/40 dark:hover:text-mercora-red transition-colors" aria-label={names[i]}>
                   <Icon size={18} />
                 </a>
               );
               })}
             </div>
          </div>
          
          {/* Payment Providers Mock */}
          <div className="flex gap-2 opacity-60 grayscale hover:grayscale-0 transition-all">
             <div className="w-10 h-6 bg-brand-primary rounded border border-brand-primary/10 flex items-center justify-center text-white text-[8px] font-black italic">VISA</div>
             <div className="w-10 h-6 bg-red-600 rounded border border-brand-primary/10 flex items-center justify-center text-white text-[8px] font-black">MC</div>
             <div className="w-10 h-6 bg-blue-600 rounded border border-brand-primary/10 flex items-center justify-center text-white text-[8px] font-black italic">AMEX</div>
             <div className="w-10 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded border border-brand-primary/10 flex items-center justify-center text-white text-[8px] font-black">TROY</div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-[10px] text-brand-primary/40 dark:text-white/40 font-medium pb-20 md:pb-0">
          <p>© 2026 TrendAl E-Ticaret A.Ş. Her Hakkı Saklıdır.</p>
          <p className="mt-1">Kayıtlı Elektronik Posta Adresi: trendal@hs01.kep.tr | Mersis No: 0123456789000001</p>
        </div>
      </div>
    </footer>
  );
}

// Simple icons for footer
const ShoppingBagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);
const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.04C10.5 2.04 8.79 3.01 7.9 4.31c-2.45 3.59-1.92 8.78.25 11.23.97 1.09 2.19 2.18 3.5 1.5 1.48-.77 2.44-1.28 4.2-1.23 1.5.03 2.5.54 4.04 1.34 1.4.73 2.37.1 3.25-.97 1.38-1.63 2.16-4.66 1.33-6.95-3.32-2.1-1.34-6.42 1.94-7.85-1.1-1.74-3.15-2.07-4.22-2.13-1.64-.1-3.23.86-3.86 1.25-.84.5-2.07-.63-4.33-.46Z"/></svg>
);
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3.05v17.9a1 1 0 0 0 1.5.86l14.4-9a1 1 0 0 0 0-1.7L5.5 2.2A1 1 0 0 0 4 3.05Z"/></svg>
);
