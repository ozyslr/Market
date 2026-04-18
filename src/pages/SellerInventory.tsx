import React, { useState } from 'react';
import { 
  Plus, Upload, Download, Search, Filter, 
  MoreVertical, Edit, Trash2, Eye, Copy,
  CheckCircle, Clock, AlertTriangle, Package,
  ArrowRight, Globe, Zap, BarChart3, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_PRODUCTS } from '@/mockData';
import { cn } from '@/lib/utils';

export function SellerInventoryPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'bulk' | 'analytics'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const products = MOCK_PRODUCTS.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-brand-secondary/30 pt-24">
      {/* Mini Sidebar */}
      <div className="w-20 bg-brand-primary flex flex-col items-center py-8 gap-8 hidden lg:flex">
         <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg">
           <Zap size={20} fill="currentColor" />
         </div>
         <nav className="flex flex-col gap-6">
           {[
             { icon: Database, id: 'inventory' },
             { icon: Upload, id: 'bulk' },
             { icon: BarChart3, id: 'analytics' }
           ].map((item) => (
             <button 
               key={item.id}
               onClick={() => setActiveTab(item.id as any)}
               className={cn(
                 "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                 activeTab === item.id ? "bg-accent text-white" : "text-white/40 hover:bg-white/10 hover:text-white"
               )}
             >
               <item.icon size={20} />
             </button>
           ))}
         </nav>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest rounded-full">
                  Inventory Engine v4.2
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">
                  <Globe size={10} /> Multi-Market Sync Active
                </span>
              </div>
              <h1 className="text-4xl font-display font-black tracking-tighter text-brand-primary uppercase italic">
                {activeTab === 'inventory' ? 'Global Artifact Inventory' : activeTab === 'bulk' ? 'Mass Ingestion' : 'Demand Dynamics'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button className="px-6 py-3 bg-white text-brand-primary border border-brand-primary/5 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm hover:shadow-xl transition-all flex items-center gap-2">
                <Download size={14} /> Export Report
              </button>
              <button className="px-6 py-3 bg-brand-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-2xl shadow-brand-primary/20 hover:bg-accent transition-all flex items-center gap-2">
                <Plus size={14} /> Add Artifact
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'inventory' ? (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Stock', value: '1,420', icon: Package, status: 'Healthy' },
                    { label: 'Low Stock Alerts', value: '12', icon: AlertTriangle, status: 'Urgent' },
                    { label: 'Global Orders', value: '84', icon: Globe, status: '+15%' },
                    { label: 'Merchant Level', value: 'Top-Rated', icon: Zap, status: 'Verified' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-brand-primary/5 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-brand-secondary rounded-lg text-brand-primary"><stat.icon size={16} /></div>
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", stat.status === 'Urgent' ? 'text-red-500' : 'text-green-500')}>{stat.status}</span>
                      </div>
                      <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">{stat.label}</p>
                      <p className="text-2xl font-display font-black text-brand-primary">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Search & Bulk Actions */}
                <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-brand-primary/5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/20" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search inventory by serial, name, or HS code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-brand-secondary/30 rounded-xl text-sm font-medium focus:ring-2 focus:ring-accent/20 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-3 bg-brand-secondary text-brand-primary/60 rounded-xl hover:text-brand-primary transition-colors">
                      <Filter size={18} />
                    </button>
                    {selectedProducts.length > 0 && (
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest">{selectedProducts.length} Selected</span>
                        <button className="p-2 bg-brand-primary text-white rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inventory Table */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-brand-primary/5 overflow-hidden">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-brand-secondary/30 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">
                           <th className="px-8 py-6">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-brand-primary/10 text-accent focus:ring-accent"
                                checked={selectedProducts.length === products.length}
                                onChange={(e) => setSelectedProducts(e.target.checked ? products.map(p => p.id) : [])}
                              />
                           </th>
                           <th className="px-8 py-6">Artifact Detail</th>
                           <th className="px-8 py-6">Compliance</th>
                           <th className="px-8 py-6">Stock Level</th>
                           <th className="px-8 py-6 text-right">Pricing</th>
                           <th className="px-8 py-6"></th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-brand-primary/5">
                         {products.slice(0, 10).map((product) => (
                           <tr key={product.id} className="group hover:bg-brand-secondary/20 transition-colors">
                             <td className="px-8 py-6">
                               <input 
                                 type="checkbox" 
                                 className="w-4 h-4 rounded border-brand-primary/10 text-accent focus:ring-accent"
                                 checked={selectedProducts.includes(product.id)}
                                 onChange={(e) => {
                                   if (e.target.checked) setSelectedProducts([...selectedProducts, product.id]);
                                   else setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                                 }}
                               />
                             </td>
                             <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                 <div className="w-14 h-14 bg-brand-secondary rounded-2xl p-2 flex-shrink-0">
                                   <img src={product.images[0]} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                                 </div>
                                 <div className="max-w-xs">
                                   <p className="font-bold text-brand-primary line-clamp-1">{product.title}</p>
                                   <p className="text-[10px] text-brand-primary/40 font-mono tracking-tighter">SKU: {product.id.split('-')[0].toUpperCase()}</p>
                                 </div>
                               </div>
                             </td>
                             <td className="px-8 py-6">
                               <div className="flex items-center gap-2">
                                 <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-100">
                                   <CheckCircle size={10} /> Certified
                                 </div>
                                 <span className="text-[9px] font-bold text-brand-primary/40 uppercase tracking-widest">HS: {product.hsCode || '8518.21'}</span>
                               </div>
                             </td>
                             <td className="px-8 py-6">
                               <div className="flex items-center gap-3">
                                 <div className="flex-1 w-24 h-2 bg-brand-secondary rounded-full overflow-hidden">
                                   <div 
                                      className={cn(
                                        "h-full rounded-full bg-accent",
                                        product.stock < 20 ? "bg-red-500" : product.stock < 50 ? "bg-orange-500" : "bg-green-500"
                                      )} 
                                      style={{ width: `${Math.min(100, product.stock || 45)}%` }} 
                                   />
                                 </div>
                                 <span className="text-[10px] font-black text-brand-primary">{product.stock || 45} units</span>
                               </div>
                             </td>
                             <td className="px-8 py-6 text-right font-black text-brand-primary">
                               ${product.price}
                             </td>
                             <td className="px-8 py-6">
                               <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="p-2 hover:bg-white rounded-lg text-brand-primary/40 hover:text-accent transition-all shadow-sm">
                                   <Edit size={16} />
                                 </button>
                                 <button className="p-2 hover:bg-white rounded-lg text-brand-primary/40 hover:text-red-500 transition-all shadow-sm">
                                   <Trash2 size={16} />
                                 </button>
                                 <button className="p-2 hover:bg-white rounded-lg text-brand-primary/40 hover:text-brand-primary transition-all shadow-sm">
                                   <MoreVertical size={16} />
                                 </button>
                               </div>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                   <div className="px-8 py-6 bg-brand-secondary/10 flex items-center justify-between border-t border-brand-primary/5">
                      <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">Showing 10 of {products.length} Inventory Items</p>
                      <div className="flex items-center gap-2">
                        <button className="px-4 py-2 bg-white rounded-xl text-[10px] font-black border border-brand-primary/5 opacity-50 cursor-not-allowed">Previous</button>
                        <button className="px-4 py-2 bg-white rounded-xl text-[10px] font-black border border-brand-primary/5 hover:bg-brand-primary hover:text-white transition-all shadow-sm">Next Page</button>
                      </div>
                   </div>
                </div>
              </motion.div>
            ) : activeTab === 'bulk' ? (
              <motion.div
                key="bulk"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-4xl mx-auto"
              >
                <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-brand-primary/5 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-accent/10 text-accent rounded-3xl flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 animate-ping bg-accent/20 rounded-3xl" />
                    <Upload size={40} className="relative z-10" />
                  </div>
                  <h2 className="text-3xl font-display font-black tracking-tight mb-4 uppercase italic">Global Mass Data Ingestion</h2>
                  <p className="text-brand-primary/40 max-w-lg mb-12">
                    Upload your inventory feed directly. Our AI engine will automatically map HS Codes, taxes, and calculate fulfillment routes for UK, EU, and Middle East markets.
                  </p>
                  
                  <div className="w-full border-2 border-dashed border-brand-primary/10 p-16 rounded-[3rem] hover:border-accent hover:bg-accent/5 transition-all cursor-pointer group">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary/30 group-hover:text-accent">Drag & Drop Inventory Feed (CSV, XLSX, JSON)</p>
                    <p className="text-[10px] mt-2 text-brand-primary/20 italic">Max file size 50MB per single ingestion session</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 w-full mt-12">
                    <div className="p-6 bg-brand-secondary/50 rounded-3xl border border-brand-primary/5 text-left group hover:bg-white hover:shadow-xl transition-all">
                       <h4 className="flex items-center gap-2 font-black text-brand-primary mb-2">
                         <Download size={16} className="text-accent" /> Starter Template
                       </h4>
                       <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest leading-relaxed">Download our standardized artifact schema to ensure 100% data fidelity.</p>
                       <button className="mt-4 text-[10px] font-black uppercase text-accent hover:gap-3 flex items-center gap-2 transition-all">Download Schema <ArrowRight size={12} /></button>
                    </div>
                    <div className="p-6 bg-brand-secondary/50 rounded-3xl border border-brand-primary/5 text-left group hover:bg-white hover:shadow-xl transition-all">
                       <h4 className="flex items-center gap-2 font-black text-brand-primary mb-2">
                         <Globe size={16} className="text-accent" /> API Synchronizer
                       </h4>
                       <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest leading-relaxed">Connect your existing ERP or Shopify store directly to our global infrastructure.</p>
                       <button className="mt-4 text-[10px] font-black uppercase text-accent hover:gap-3 flex items-center gap-2 transition-all">Setup Webhook <ArrowRight size={12} /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="analytics"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-brand-primary/5">
                   <h3 className="text-xl font-display font-black mb-6">Regional Sales Forecast</h3>
                   <div className="h-64 bg-brand-secondary rounded-2xl flex items-end justify-between p-6 gap-2">
                      {[60, 40, 80, 50, 90, 70, 100].map((h, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          className="flex-1 bg-brand-primary rounded-t-lg relative group cursor-pointer"
                        >
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-brand-primary text-white text-[9px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {h}k
                          </div>
                        </motion.div>
                      ))}
                   </div>
                   <div className="flex justify-between mt-4 text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                     <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                   </div>
                </div>

                <div className="bg-brand-primary text-white rounded-[3rem] p-10 overflow-hidden relative">
                   <Zap size={100} className="absolute -top-10 -right-10 text-white/5" />
                   <h3 className="text-xl font-display font-black mb-12 uppercase italic">AI Demand Pulse</h3>
                   <div className="space-y-8">
                     {[
                       { country: 'United Kingdom', growth: '+24%', demand: 'High', color: 'bg-green-500' },
                       { country: 'Saudi Arabia', growth: '+18%', demand: 'Surging', color: 'bg-accent' },
                       { country: 'Germany', growth: '+12%', demand: 'Moderate', color: 'bg-blue-500' }
                     ].map((item, i) => (
                       <div key={i} className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                           <div className={cn("w-3 h-3 rounded-full", item.color)} />
                           <div>
                             <p className="font-bold">{item.country}</p>
                             <p className="text-[10px] text-white/40 uppercase tracking-widest">{item.demand} Demand</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-xl font-display font-black">{item.growth}</p>
                           <p className="text-[9px] text-white/40 uppercase tracking-widest text-accent">MoM Projection</p>
                         </div>
                       </div>
                     ))}
                   </div>
                   <button className="w-full py-4 bg-white text-brand-primary rounded-2xl mt-12 font-black text-xs uppercase tracking-widest hover:bg-accent hover:text-white transition-all">
                     Unlock Full Prediction Data
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
