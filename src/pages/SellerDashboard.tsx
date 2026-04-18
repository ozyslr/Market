import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Package, ShoppingCart, BarChart3, Globe2, 
  Settings, Bell, Search, TrendingUp, Info, AlertTriangle, 
  ChevronRight, ArrowUpRight, DollarSign, Users, Sparkles, ShieldCheck,
  Upload, FileText, CheckCircle2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SellerDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'bulk'>('overview');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsUploading(false), 1000);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  return (
    <div className="flex min-h-screen bg-brand-secondary/20 pt-20">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-brand-primary/5 hidden lg:flex flex-col p-6 sticky top-20 h-[calc(100vh-80px)]">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm">AuraAudio Staff</h2>
            <p className="text-[10px] text-brand-primary/40 uppercase font-bold">Verified Artisan</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: 'overview', icon: <LayoutDashboard size={20} />, name: 'Overview' },
            { id: 'bulk', icon: <Upload size={20} />, name: 'Bulk Ingestion' },
            { id: 'inventory', icon: <Package size={20} />, name: 'Inventory' },
            { id: 'orders', icon: <ShoppingCart size={20} />, name: 'Global Orders' },
            { id: 'revenue', icon: <BarChart3 size={20} />, name: 'Revenue Analytics' },
            { id: 'compliance', icon: <Globe2 size={20} />, name: 'Compliance & Tax' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => {
                if (item.id === 'overview' || item.id === 'bulk') {
                  setActiveTab(item.id as any);
                }
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === item.id ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/10" : "text-brand-primary/60 hover:bg-brand-secondary hover:text-brand-primary"
              )}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-brand-primary/5 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-brand-primary/60 hover:bg-brand-secondary transition-all">
            <Settings size={20} /> Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                  <div>
                    <h1 className="text-4xl font-display font-bold mb-2">Artisan Marketplace Control</h1>
                    <p className="text-brand-primary/40 font-medium">Monitoring global performance for <span className="text-brand-primary font-bold">AuraAudio</span></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold uppercase text-brand-primary/40">Marketplace Balance</p>
                      <p className="text-2xl font-display font-bold text-accent">£12,450.80</p>
                    </div>
                    <button className="px-6 py-3 bg-accent text-white rounded-xl font-bold shadow-lg shadow-accent/10 hover:bg-brand-primary transition-all flex items-center gap-2">
                      Withdraw Funds <ArrowUpRight size={18} />
                    </button>
                  </div>
                </div>

                {/* Visionary Insights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-white p-8 rounded-[2rem] border border-brand-primary/5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                        <TrendingUp size={24} />
                      </div>
                      <span className="text-xs font-bold text-green-500">+12% vs LY</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-primary/40 mb-1">Global Reach</p>
                    <h3 className="text-3xl font-display font-bold">14 Countries</h3>
                    <p className="text-[10px] text-brand-primary/40 mt-4 leading-relaxed">Most active markets: <span className="font-bold text-brand-primary">UK, Germany, Turkey</span></p>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] border border-brand-primary/5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                        <Sparkles size={24} />
                      </div>
                      <span className="text-xs font-bold text-brand-primary/40">AI Predicted</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-primary/40 mb-1">Demand Forecast</p>
                    <h3 className="text-3xl font-display font-bold">High Surge</h3>
                    <p className="text-[10px] text-brand-primary/40 mt-4 leading-relaxed">Action: <span className="font-bold text-accent">Increase inventory of "Soundscape Pro" by 20%</span></p>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] border border-brand-primary/5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                        <ShieldCheck size={24} />
                      </div>
                      <span className="text-xs font-bold text-green-500">Verified</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-primary/40 mb-1">Compliance Health</p>
                    <h3 className="text-3xl font-display font-bold">98% Green</h3>
                    <p className="text-[10px] text-brand-primary/40 mt-4 leading-relaxed">Tax & Customs documentation is up to date for <span className="font-bold text-brand-primary">EU Markets</span></p>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-[2.5rem] border border-brand-primary/5 shadow-sm overflow-hidden mb-12">
                  <div className="p-8 border-b border-brand-primary/5 flex items-center justify-between">
                    <h2 className="text-2xl font-display font-bold">Recent Multi-Market Orders</h2>
                    <button className="text-accent text-sm font-bold hover:underline">View All Orders</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-brand-secondary/20 text-[10px] uppercase font-bold tracking-widest text-brand-primary/40">
                          <th className="px-8 py-4">Order ID</th>
                          <th className="px-8 py-4">Product</th>
                          <th className="px-8 py-4">Destination</th>
                          <th className="px-8 py-4">Amount</th>
                          <th className="px-8 py-4">Status</th>
                          <th className="px-8 py-4">Compliance</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {[
                          { id: '#MER-8812', title: 'Soundscape Pro', dest: 'Berlin, DE', price: '£249.99', status: 'In Transit', compliant: true },
                          { id: '#MER-8813', title: 'Titan Stand', dest: 'London, UK', price: '£45.00', status: 'Processing', compliant: true },
                          { id: '#MER-8814', title: 'Bedding Set', dest: 'Istanbul, TR', price: '£120.00', status: 'Awaiting Pickup', compliant: false },
                        ].map((order, i) => (
                          <tr key={i} className="border-b border-brand-primary/5 hover:bg-brand-secondary/10 transition-colors">
                            <td className="px-8 py-6 font-mono font-medium">{order.id}</td>
                            <td className="px-8 py-6 font-bold">{order.title}</td>
                            <td className="px-8 py-6 flex items-center gap-2">
                              <Globe2 size={14} className="text-brand-primary/20" /> {order.dest}
                            </td>
                            <td className="px-8 py-6 font-display font-bold">{order.price}</td>
                            <td className="px-8 py-6">
                              <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-bold uppercase">{order.status}</span>
                            </td>
                            <td className="px-8 py-6">
                              {order.compliant ? (
                                <div className="flex items-center gap-1 text-green-500 text-[10px] font-bold">
                                  <ShieldCheck size={14} /> VAT/CUSTOMS OK
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-accent text-[10px] font-bold">
                                  <AlertTriangle size={14} /> DOCS REQUIRED
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="bulk"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <div>
                    <h1 className="text-4xl font-display font-bold mb-2">Bulk Product Ingestion</h1>
                    <p className="text-brand-primary/40 font-medium">Add hundreds of global products instantly via CSV or Marketplace Sync.</p>
                  </div>
                  <div className="flex gap-4">
                    <button className="px-6 py-3 border border-brand-primary/5 bg-white rounded-xl font-bold flex items-center gap-2 hover:bg-brand-secondary transition-all">
                      <FileText size={18} /> Download Template
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 bg-white rounded-[3rem] p-12 border-2 border-dashed border-brand-primary/10 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[400px]">
                    {isUploading ? (
                      <div className="w-full max-w-sm space-y-6">
                        <div className="flex justify-between items-end">
                           <p className="text-xs font-black uppercase text-brand-primary/40">Uploading "Spring_Collection.csv"</p>
                           <p className="text-sm font-black text-accent">{uploadProgress}%</p>
                        </div>
                        <div className="h-2 w-full bg-brand-secondary rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-accent" 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-brand-primary/40 animate-pulse">Running AI Auto-Categorization & Tax Engine Mapping...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-accent/5 rounded-3xl flex items-center justify-center text-accent mb-8">
                          <Upload size={40} />
                        </div>
                        <h3 className="text-2xl font-display font-black mb-4 uppercase italic">Drop Artifact Data</h3>
                        <p className="text-brand-primary/40 text-sm max-w-sm mb-8 font-medium">Select your organized CSV file from Shopify, Trendyol, Hepsiburada, or WooCommerce. Our AI will automatically map the fields.</p>
                        <button 
                          onClick={simulateUpload}
                          className="px-10 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-accent hover:scale-105 transition-all shadow-xl shadow-brand-primary/10"
                        >
                          Select File
                        </button>
                      </>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-brand-primary rounded-[2rem] p-8 text-white">
                      <h4 className="flex items-center gap-2 font-display font-bold mb-4">
                        <Sparkles size={18} className="text-accent" /> AI Mapping Active
                      </h4>
                      <p className="text-[10px] text-white/60 leading-relaxed font-medium">Our system will automatically translate your Turkish or European product data into 14 languages and classify HS-Codes for international shipping.</p>
                      <ul className="mt-8 space-y-3">
                         {['Auto-Translation', 'HS-Code Labeling', 'VAT Calculation', 'Currency Conversion'].map((item, i) => (
                           <li key={i} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle2 size={12} className="text-accent" /> {item}
                           </li>
                         ))}
                      </ul>
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 border border-brand-primary/5 shadow-sm">
                      <h4 className="text-xs font-black uppercase tracking-widest text-brand-primary/40 mb-6">Marketplace Sync</h4>
                      <div className="space-y-4">
                        {['Shopify', 'Trendyol', 'Amazon GTIN'].map(m => (
                          <div key={m} className="flex items-center justify-between p-3 bg-brand-secondary/30 rounded-xl border border-brand-primary/5 group cursor-pointer hover:border-accent/40 transition-all">
                             <span className="text-xs font-bold text-brand-primary/60">{m} Connection</span>
                             <ChevronRight size={14} className="text-brand-primary/20 group-hover:text-accent" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Batch History */}
                <div className="bg-white rounded-[2.5rem] border border-brand-primary/5 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-brand-primary/5">
                    <h2 className="text-2xl font-display font-bold">Recent Batches</h2>
                  </div>
                  <div className="p-8 space-y-4">
                     {[
                       { date: '18 Apr 2026', files: '142 Products', status: 'Completed', error: 0 },
                       { date: '15 Apr 2026', files: '89 Products', status: 'Completed', error: 2 },
                     ].map((batch, i) => (
                       <div key={i} className="flex items-center justify-between p-4 border-b border-brand-primary/5 last:border-0">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center">
                                <CheckCircle2 size={20} />
                             </div>
                             <div>
                                <p className="text-xs font-bold">{batch.files}</p>
                                <p className="text-[10px] text-brand-primary/40">{batch.date}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-green-500 uppercase">{batch.status}</span>
                             {batch.error > 0 && <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded leading-none">{batch.error} Errors</span>}
                          </div>
                       </div>
                     ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
