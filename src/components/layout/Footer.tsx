import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, ShieldCheck, Zap, Instagram, Twitter, Linkedin, Facebook, TrendingUp, DollarSign, PoundSterling } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-brand-primary text-white pt-24 pb-12 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-20">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-8 group">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white rotate-3 group-hover:rotate-0 transition-transform">
                <Zap size={24} fill="currentColor" />
              </div>
              <span className="font-display font-bold text-3xl tracking-tighter uppercase italic">Mercora</span>
            </Link>
            <p className="text-white/40 max-w-sm mb-8 leading-relaxed text-sm font-medium">
              The next-generation global commerce ecosystem connecting artisans to the world via AI-driven compliance and logistics.
            </p>
            
            {/* Market Intelligence Widget */}
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-8 mr-12">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-accent italic">Commercial Intelligence</h5>
                <TrendingUp size={14} className="text-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">GBP/TRY</p>
                   <p className="font-display font-bold text-lg">43.24 <span className="text-[10px] text-green-500">+0.8%</span></p>
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Global Tax Avg</p>
                   <p className="font-display font-bold text-lg">18.4% <span className="text-[10px] text-white/20">Fixed</span></p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              {[Instagram, Twitter, Linkedin, Facebook].map((Icon, i) => (
                <button key={i} className="w-10 h-10 bg-white/5 rounded-full hover:bg-accent transition-all flex items-center justify-center">
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>

          {[
            {
              title: t('footer.corporate'),
              links: [t('footer.about'), t('footer.careers'), 'Brand Guidelines', 'Global Offices', 'Sustainability']
            },
            {
              title: 'Artisan Hub',
              links: [t('nav.sell'), 'Fulfillment by Mercora', 'Global Taxes', 'Artisan Portal', 'Success Stories']
            },
            {
              title: 'Trust & Safety',
              links: ['Escrow Protection', 'Privacy Policy', 'Cookie Policy', 'Terms of Service', 'Dispute Resolution']
            }
          ].map((section, i) => (
            <div key={i}>
              <h4 className="font-display font-bold mb-8 text-[11px] uppercase tracking-widest text-accent italic">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map(link => (
                  <li key={link}>
                    <Link to="/" className="text-white/40 hover:text-white transition-colors text-xs font-bold tracking-tight">{link}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-white/20 uppercase font-black tracking-[0.2em]">
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2">
              <Globe size={14} /> Global Ecosystem (UK/EU/TR)
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} /> Secured by Mercora Guard
            </span>
          </div>
          <p>© 2026 Mercora Systems. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
