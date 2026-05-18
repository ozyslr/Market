import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, Globe, ShieldCheck, TrendingUp, ArrowRight, 
  Package, DollarSign, BarChart3, Users, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function SellOnMercora() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-brand-primary text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-10 w-96 h-96 bg-accent rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <div className="px-6 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-3">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">UK Market Expansion Plan 2026</span>
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-display font-black tracking-tightest leading-none mb-10 italic uppercase"
          >
            Empower Your <br /> 
            <span className="text-accent underline decoration-4 underline-offset-8">Global Artifacts</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/60 max-w-2xl mx-auto mb-12 font-medium"
          >
            Join 450+ elite UK and global sellers. From £0 to £1M revenue with Mercora's AI-driven marketplace infrastructure.
          </motion.p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="px-10 py-5 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-accent/40 hover:scale-105 transition-all flex items-center gap-3">
              Apply to Sell <ArrowRight size={18} />
            </button>
            <button className="px-10 py-5 bg-white/10 text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all">
              View Commission Structure
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-brand-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { label: 'Merchant Growth', value: '420%', icon: TrendingUp },
              { label: 'Global Markets', value: '14+', icon: Globe },
              { label: 'VAT/Tax Handled', value: '100%', icon: ShieldCheck },
              { label: 'AOV Premium', value: '£64', icon: DollarSign },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                 <div className="w-16 h-16 mx-auto mb-6 bg-white rounded-2xl shadow-xl flex items-center justify-center text-accent group-hover:rotate-12 transition-all">
                    <stat.icon size={24} />
                 </div>
                 <h3 className="text-4xl font-display font-black text-brand-primary mb-2 italic uppercase">{stat.value}</h3>
                 <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 leading-none">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Roadmap Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-4xl font-display font-black uppercase italic tracking-tighter mb-4">Elite Seller Roadmap</h2>
            <p className="text-brand-primary/40 uppercase font-black text-[10px] tracking-[0.3em]">Phase 1: Your scale to £1M Revenue</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {[
              { 
                step: '01', 
                title: 'Onboarding', 
                desc: 'AI-driven KYC and store verification in under 24 hours. Connect your existing Shopify or Etsy catalog instantly.',
                feat: ['Auto-Category Mapping', 'Bulk CSV Porting', 'Marketplace Sync']
              },
              { 
                step: '02', 
                title: 'Global Push', 
                desc: 'Your stock is automatically translated into 14 languages and multi-currency pricing is optimized in real-time.',
                feat: ['AI Descriptions', 'Cross-Border VAT', 'HS-Code Labeling']
              },
              { 
                step: '03', 
                title: 'Omni-Sales', 
                desc: 'Activate our Bot Sales Engine. Our AI agents proactively pitch your products to high-intent buyers.',
                feat: ['Algorithmic Bidding', 'Bot Marketing', 'Viral SEO Expansion']
              }
            ].map((card, i) => (
              <div key={i} className="p-10 bg-white rounded-[3rem] border border-brand-primary/5 shadow-2xl relative overflow-hidden group">
                <span className="absolute -top-10 -right-10 text-[10rem] font-display font-black text-brand-primary/5 group-hover:text-accent/10 transition-colors">{card.step}</span>
                <div className="relative z-10">
                  <h3 className="text-2xl font-display font-black uppercase mb-6 italic tracking-tighter">{card.title}</h3>
                  <p className="text-sm text-brand-primary/60 font-medium mb-10 leading-relaxed">{card.desc}</p>
                  <ul className="space-y-4">
                    {card.feat.map((f, j) => (
                      <li key={j} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-brand-primary">
                        <Zap size={14} className="text-accent" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
         <div className="max-w-5xl mx-auto bg-brand-primary rounded-[4rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-accent/20 blur-[100px] opacity-30" />
            <div className="relative z-10">
               <h2 className="text-4xl md:text-6xl font-display font-black text-white italic uppercase tracking-tighter mb-8 leading-none">Ready for the <br /> <span className="text-accent underline decoration-4 underline-offset-8 decoration-accent/50">Elite Marketplace?</span></h2>
               <p className="text-white/60 mb-12 max-w-xl mx-auto font-medium">Limited spots available for UK Artisan Merchants for the 0% commission launch phase.</p>
               <button className="px-12 py-5 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-accent/40 hover:scale-105 transition-all">
                 Join the Waitlist
               </button>
            </div>
         </div>
      </section>
    </div>
  );
}
