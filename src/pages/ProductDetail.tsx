import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, Truck, ShieldCheck, ChevronRight, ShoppingCart, 
  Globe, Heart, Share2, Info, ChevronLeft, Award, 
  Clock, Sparkles, Zap, Shield, MapPin, 
  Undo2, CheckCircle2, AlertCircle, MessageCircle,
  ThumbsUp, BarChart, ExternalLink, Package, ArrowRight
} from 'lucide-react';
import { MOCK_PRODUCTS } from '@/mockData';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { calculateTotal, MARKETS } from '@/lib/taxEngine';
import { ProductCard } from '@/components/commerce/ProductCard';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Mock data for the chart
const MARKET_DATA = [
  { day: 'Mon', demand: 65, price: 230 },
  { day: 'Tue', demand: 72, price: 245 },
  { day: 'Wed', demand: 68, price: 240 },
  { day: 'Thu', demand: 85, price: 260 },
  { day: 'Fri', demand: 92, price: 280 },
  { day: 'Sat', demand: 88, price: 275 },
  { day: 'Sun', demand: 95, price: 299 },
];

export function ProductDetail() {
  const { t } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const product = MOCK_PRODUCTS.find(p => p.slug === slug);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews'>('details');

  // Breadcrumbs: Simplified for marketplace feel
  const currentMarket = MARKETS['UK'];
  const tax = calculateTotal(product?.price || 0, 12, currentMarket, product?.originCountry === 'UK');

  if (!product) return null; // Logic in actual app includes 404

  return (
    <div className="bg-[#f2f4f7] min-h-screen pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        
        {/* Breadcrumbs - High Visibility */}
        <nav className="flex items-center gap-1 text-[11px] font-bold text-brand-primary/40 uppercase tracking-wider mb-6 overflow-hidden whitespace-nowrap">
          <Link to="/" className="hover:text-accent transition-colors">Ana Sayfa</Link>
          <ChevronRight size={10} />
          <Link to={`/search?category=${product.categoryId}`} className="hover:text-accent transition-colors uppercase">{product.categoryId}</Link>
          <ChevronRight size={10} />
          <span className="text-brand-primary truncate">{product.title}</span>
        </nav>

        {/* Main Product Stage */}
        <div className="bg-white rounded-[2rem] border border-brand-primary/5 shadow-sm overflow-hidden mb-8">
          <div className="grid lg:grid-cols-12 gap-0">
            
            {/* Left: Gallery Hub */}
            <div className="lg:col-span-1 border-r border-brand-primary/5 p-4 flex flex-row lg:flex-col gap-3 order-2 lg:order-1 overflow-x-auto lg:overflow-visible no-scrollbar">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onMouseEnter={() => setActiveImage(i)}
                  className={cn(
                    "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all p-1 bg-white shrink-0",
                    activeImage === i ? "border-accent shadow-lg shadow-accent/20" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>

            {/* Middle: Feature Visual */}
            <div className="lg:col-span-5 p-8 order-1 lg:order-2 border-r border-brand-primary/5 flex flex-col items-center justify-center bg-white relative">
               <motion.div 
                 key={activeImage}
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="w-full aspect-square relative"
               >
                 <img src={product.images[activeImage]} className="w-full h-full object-contain mix-blend-multiply" alt="" />
               </motion.div>
               <div className="absolute top-8 right-8 flex flex-col gap-3">
                 <button className="p-3 bg-white shadow-xl rounded-full text-brand-primary/40 hover:text-accent hover:bg-white transition-all border border-brand-primary/5">
                   <Heart size={20} />
                 </button>
                 <button className="p-3 bg-white shadow-xl rounded-full text-brand-primary/40 hover:text-accent hover:bg-white transition-all border border-brand-primary/5">
                   <Share2 size={20} />
                 </button>
               </div>
               <div className="mt-8 flex gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-secondary/40 rounded-full border border-brand-primary/5">
                    <BarChart size={14} className="text-brand-primary/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/60">300+ Sold recently</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
                    <CheckCircle2 size={14} className="text-green-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Merchant Shield Verified</span>
                  </div>
               </div>
            </div>

            {/* Right: The Detail Brain (Amazon Style) */}
            <div className="lg:col-span-6 p-8 md:p-12 order-3 bg-white">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter text-brand-primary mb-2 leading-[1.1]">{product.title}</h1>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 group cursor-pointer">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={14} fill={i < Math.floor(product.rating) ? "#FF5200" : "none"} className={i < Math.floor(product.rating) ? "text-accent" : "text-brand-primary/10"} />
                        ))}
                        <span className="text-xs font-black text-accent ml-2">{product.rating}</span>
                        <span className="text-xs font-bold text-brand-primary/40 ml-1 underline decoration-dotted">({product.reviewsCount} Reviews)</span>
                      </div>
                      <div className="h-4 w-[1px] bg-brand-primary/10" />
                      <Link to={`/seller/${product.sellerId}`} className="text-xs font-black uppercase tracking-widest text-brand-primary hover:text-accent transition-colors">Vendor: {product.brand}</Link>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-brand-secondary/30 rounded-[2.5rem] border border-brand-primary/5 relative mb-8">
                   <div className="absolute top-6 right-8 bg-accent text-white px-2 py-1 rounded text-[10px] font-black uppercase leading-none shadow-lg shadow-accent/20">-{Math.round(((product.oldPrice || product.price) - product.price) / (product.oldPrice || product.price) * 100)}%</div>
                   <div className="flex items-baseline gap-4 mb-4">
                     <span className="text-5xl font-display font-black text-brand-primary">${product.price.toFixed(2)}</span>
                     {product.oldPrice && <span className="text-xl text-brand-primary/30 line-through">${product.oldPrice.toFixed(2)}</span>}
                   </div>
                   <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
                      <span className="text-green-600 flex items-center gap-1"><Truck size={14} /> Free Shipping</span>
                      <span className="flex items-center gap-1"><ShieldCheck size={14} /> Mercora Trust Protection</span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                   <div className="p-4 bg-white border border-brand-primary/5 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-secondary rounded-xl flex items-center justify-center text-brand-primary/40">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase opacity-40">Shipping Hub</p>
                        <p className="text-xs font-black uppercase">{product.originCountry} Center</p>
                      </div>
                   </div>
                   <div className="p-4 bg-white border border-brand-primary/5 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/5 rounded-xl flex items-center justify-center text-accent">
                        <MessageCircle size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase opacity-40">Questions</p>
                        <p className="text-xs font-black uppercase">48 Ask Experts</p>
                      </div>
                   </div>
                </div>

                {/* Purchase Call to Action */}
                <div className="mt-auto space-y-4">
                   <div className="p-4 bg-brand-secondary/50 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe size={18} className="text-accent" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-brand-primary/40 tracking-widest">Origin</p>
                          <p className="text-xs font-black">{product.originCountry}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Package size={18} className="text-accent" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-brand-primary/40 tracking-widest">Delivery</p>
                          <p className="text-xs font-black">{product.deliveryTerms || 'Standard Global'}</p>
                        </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-32 h-14 bg-brand-secondary/50 rounded-2xl p-1 border border-brand-primary/5 flex items-center">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 h-full flex items-center justify-center hover:bg-white rounded-xl transition-all text-brand-primary/40 hover:text-brand-primary">-</button>
                        <span className="w-10 text-center font-black text-sm">{quantity}</span>
                        <button onClick={() => setQuantity(quantity + 1)} className="flex-1 h-full flex items-center justify-center hover:bg-white rounded-xl transition-all text-brand-primary/40 hover:text-brand-primary">+</button>
                      </div>
                      <button className="flex-1 h-14 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-primary transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-3 active:scale-95">
                        <ShoppingCart size={18} /> {t('product.add_cart')}
                      </button>
                   </div>
                   <button className="w-full h-14 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-brand-primary/10 flex items-center justify-center gap-3 group active:scale-95">
                     {t('product.buy_now')} <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Fulfillment Journey (Strategic Trust Section) */}
        <section className="bg-brand-primary rounded-[3.5rem] p-12 mb-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-12">
                   <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-accent/20">
                      <Truck size={20} />
                   </div>
                   <div>
                     <h3 className="text-xl font-display font-black uppercase tracking-tighter text-white italic leading-none">{t('logistics.timeline')}</h3>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mt-1">Global Artifact Movement Protocol</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                   {/* Connector Line */}
                   <div className="absolute top-8 left-[10%] right-[10%] h-0.5 bg-white/5 hidden md:block" />
                   
                   {[
                     { step: '01', title: t('logistics.hub_processing'), desc: 'Item inspected and consolidated at London Hub.', icon: Package },
                     { step: '02', title: t('logistics.customs_clearance'), desc: 'AI-driven commercial clearance for zero-delay transit.', icon: ShieldCheck },
                     { step: '03', title: t('logistics.last_mile'), desc: 'Door-to-door delivery with live asset tracking.', icon: MapPin },
                   ].map((item, i) => (
                     <div key={i} className="relative z-10 flex flex-col items-center text-center group/card">
                        <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center text-white border border-white/10 mb-8 group-hover/card:bg-accent group-hover/card:scale-110 transition-all duration-700 shadow-2xl">
                           <item.icon size={28} />
                        </div>
                        <span className="text-xs font-black text-accent mb-3 italic tracking-widest">STEP {item.step}</span>
                        <h4 className="text-lg font-display font-black text-white mb-3 tracking-tight uppercase italic">{item.title}</h4>
                        <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-[0.1em] max-w-[200px]">{item.desc}</p>
                     </div>
                   ))}
                </div>
            </div>
        </section>

        {/* Tabbed Info Hub (Hepsiburada Style) */}
        <div className="grid lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 space-y-8">
              <div className="bg-white rounded-[3rem] p-4 md:p-10 border border-brand-primary/5 shadow-sm">
                <div className="flex items-center gap-8 mb-12 border-b border-brand-primary/5">
                   {[
                     { id: 'details', name: 'Product Description' },
                     { id: 'specs', name: 'Technical Specs' },
                     { id: 'reviews', name: 'User Reviews' }
                   ].map(tab => (
                     <button 
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id as any)}
                       className={cn(
                         "pb-6 text-xs font-black uppercase tracking-widest transition-all relative",
                         activeTab === tab.id ? "text-accent" : "text-brand-primary/30 hover:text-brand-primary"
                       )}
                     >
                       {tab.name}
                       {activeTab === tab.id && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1.5 bg-accent rounded-full" />}
                     </button>
                   ))}
                </div>

                <div className="min-h-[400px]">
                   <AnimatePresence mode="wait">
                     {activeTab === 'details' && (
                       <motion.div 
                         key="details"
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -10 }}
                         className="space-y-8"
                       >
                         <h3 className="text-3xl font-display font-black text-brand-primary uppercase italic">Product Intelligence</h3>
                         <p className="text-brand-primary/60 leading-relaxed font-medium">
                           {product.longDescription || product.description}
                         </p>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                            {[
                              { label: 'Origin', value: product.originCountry, icon: Globe },
                              { label: 'Merchant', value: product.brand, icon: Award },
                              { label: 'Escrow', value: 'Protected', icon: Shield },
                              { label: 'Shipping', value: 'Expedited', icon: Zap },
                            ].map((f, i) => (
                              <div key={i} className="p-6 bg-brand-secondary/30 rounded-3xl border border-brand-primary/5 text-center group hover:bg-white hover:shadow-xl transition-all">
                                 <f.icon size={24} className="text-accent mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                 <p className="text-[10px] font-black uppercase text-brand-primary/40 tracking-widest mb-1">{f.label}</p>
                                 <p className="text-xs font-black text-brand-primary uppercase tracking-wider">{f.value}</p>
                              </div>
                            ))}
                         </div>
                       </motion.div>
                     )}

                     {activeTab === 'specs' && (
                       <motion.div 
                         key="specs"
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -10 }}
                         className="space-y-6"
                       >
                         <h3 className="text-2xl font-display font-black text-brand-primary uppercase italic mb-8">Technical Attributes</h3>
                         <div className="grid grid-cols-1 gap-0">
                           {product.specifications ? Object.entries(product.specifications).map(([key, val], i) => (
                             <div key={key} className={cn("grid grid-cols-2 p-6 transition-colors", i % 2 === 0 ? "bg-brand-secondary/20" : "bg-white")}>
                               <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary/40">{key}</span>
                               <span className="text-sm font-black text-brand-primary uppercase tracking-tight">{val}</span>
                             </div>
                           )) : (
                             <div className="p-12 text-center text-brand-primary/20">Data unavailable for this artifact.</div>
                           )}
                           <div className="grid grid-cols-2 p-6 bg-brand-primary/5 rounded-b-[2rem]">
                             <span className="text-[10px] font-black uppercase tracking-wider text-accent">Mercora HS-CODE</span>
                             <span className="text-sm font-black text-accent uppercase tracking-tight">{product.hsCode || '8518.21.000'}</span>
                           </div>
                         </div>
                       </motion.div>
                     )}

                     {activeTab === 'reviews' && (
                       <motion.div 
                         key="reviews"
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -10 }}
                         className="space-y-12"
                       >
                         <div className="grid md:grid-cols-3 gap-12">
                            <div className="text-center md:text-left space-y-4">
                               <h4 className="text-6xl font-display font-black text-brand-primary uppercase italic">{product.rating}</h4>
                               <div className="flex items-center justify-center md:justify-start gap-1">
                                 {Array.from({ length: 5 }).map((_, i) => (
                                   <Star key={i} size={20} fill={i < Math.floor(product.rating) ? "#FF5200" : "none"} className={i < Math.floor(product.rating) ? "text-accent" : "text-brand-primary/10"} />
                                 ))}
                               </div>
                               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/40">Verified Artifact Rating</p>
                            </div>
                            <div className="md:col-span-2 space-y-3">
                               {[
                                 { star: 5, perc: 85 },
                                 { star: 4, perc: 10 },
                                 { star: 3, perc: 3 },
                                 { star: 2, perc: 1 },
                                 { star: 1, perc: 1 },
                               ].map(r => (
                                 <div key={r.star} className="flex items-center gap-4">
                                    <span className="text-[10px] font-black w-8 text-right text-brand-primary/60">{r.star} ★</span>
                                    <div className="flex-1 h-2 bg-brand-secondary rounded-full overflow-hidden">
                                       <div className="h-full bg-accent" style={{ width: `${r.perc}%` }} />
                                    </div>
                                    <span className="text-[10px] font-black w-8 text-brand-primary/40 text-right">{r.perc}%</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                         
                         <div className="space-y-8 pt-12 border-t border-brand-primary/5">
                            {[1, 2].map(i => (
                              <div key={i} className="space-y-4">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 bg-brand-secondary rounded-xl flex items-center justify-center font-black text-xs text-brand-primary/40 uppercase">A{i}</div>
                                       <div>
                                          <p className="text-xs font-black uppercase tracking-wider">Artifact Buyer #{820 + i}</p>
                                          <div className="flex items-center gap-1 text-[8px] text-accent">
                                            <Star size={10} fill="currentColor" /> <Star size={10} fill="currentColor" /> <Star size={10} fill="currentColor" /> <Star size={10} fill="currentColor" /> <Star size={10} fill="currentColor" />
                                          </div>
                                       </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/20">Verified Purchase</span>
                                 </div>
                                 <p className="text-sm text-brand-primary/60 leading-relaxed font-medium">The artisan quality of this {product.categoryId} is beyond comparison. The international shipping was handled by the Frankfurt Hub perfectly.</p>
                                 <div className="flex items-center gap-4">
                                    <button className="flex items-center gap-1.5 text-[10px] font-black uppercase text-brand-primary/40 hover:text-accent transition-colors"><ThumbsUp size={12} /> Useful (14)</button>
                                 </div>
                              </div>
                            ))}
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
              </div>
           </div>

           {/* Sidebar Accessories & Upsells */}
           <div className="lg:col-span-4 space-y-8">
              {/* Commercial Intelligence Pulse (New Professional Segment) */}
              <div className="bg-white rounded-[3rem] p-8 border border-brand-primary/5 shadow-2xl overflow-hidden relative group">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-brand-primary italic">Commercial Intelligence</h4>
                    <p className="text-[10px] font-black uppercase text-accent tracking-widest mt-1">Global Demand Index</p>
                  </div>
                  <BarChart size={20} className="text-brand-primary/20 group-hover:text-accent transition-colors" />
                </div>
                
                <div className="h-48 w-full relative">
                  <ResponsiveContainer width="100%" height="100%" minHeight={192}>
                    <AreaChart 
                      data={MARKET_DATA}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF5200" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FF5200" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="demand" stroke="#FF5200" strokeWidth={3} fillOpacity={1} fill="url(#colorDemand)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 pt-6 border-t border-brand-primary/5 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-brand-primary/40 mb-1">Hub Status</p>
                    <p className="text-xs font-bold text-green-500 uppercase tracking-tighter">Fast Moving</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-brand-primary/40 mb-1">Export Risk</p>
                    <p className="text-xs font-bold text-brand-primary uppercase tracking-tighter">Minimal</p>
                  </div>
                </div>
              </div>

              {/* Similar Products */}
              <div className="bg-white rounded-[3rem] p-8 border border-brand-primary/5 shadow-sm">
                 <h4 className="text-xs font-black uppercase tracking-widest text-brand-primary/40 mb-8 border-b border-brand-primary/5 pb-4">{t('home.new_arrivals')}</h4>
                 <div className="space-y-6">
                    {MOCK_PRODUCTS.slice(4, 8).map(p => (
                      <Link key={p.id} to={`/product/${p.slug}`} className="flex gap-4 group">
                         <div className="w-20 h-20 bg-brand-secondary/50 rounded-2xl p-2 shrink-0 group-hover:bg-accent/5 transition-all">
                            <img src={p.images[0]} referrerPolicy="no-referrer" className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" alt="" />
                         </div>
                         <div className="pt-2">
                            <h5 className="text-xs font-bold text-brand-primary line-clamp-1 group-hover:text-accent transition-colors">{p.title}</h5>
                            <p className="text-sm font-black text-brand-primary mt-1">£{p.price}</p>
                            <div className="flex items-center gap-1 text-[8px] text-accent mt-2">
                               <Star size={10} fill="currentColor" /> <span className="text-brand-primary/40">{p.rating}</span>
                            </div>
                         </div>
                      </Link>
                    ))}
                 </div>
                 <button className="w-full mt-10 py-4 border border-brand-primary/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">{t('global.see_all')}</button>
              </div>

              {/* Artisan Profile Card */}
              <div className="bg-brand-primary rounded-[3rem] p-10 text-white relative overflow-hidden group">
                 <Sparkles size={160} className="absolute -bottom-10 -right-10 text-white/5 pointer-events-none group-hover:rotate-12 transition-transform duration-700" />
                 <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Authorized Seller</span>
                    <h5 className="text-3xl font-display font-black mt-2 mb-6 uppercase italic leading-none">{product.brand} Store</h5>
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-16 h-16 bg-white/10 rounded-2xl overflow-hidden p-2 backdrop-blur-xl">
                          <img src={`https://placehold.co/100x100/1a1a2e/ffffff?text=${product.sellerId}`} className="w-full h-full object-cover rounded-xl grayscale brightness-110" alt="" />
                       </div>
                       <div>
                          <p className="text-xs font-bold">Mercora Gold Elite</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">Export Performance: 99%</p>
                       </div>
                    </div>
                    <button className="w-full py-4 bg-white text-brand-primary rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-3">
                       Visit Store <ChevronRight size={18} />
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Recently Viewed / Recommended Carousel */}
        <section className="mt-24">
           <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-black tracking-tighter text-brand-primary uppercase italic">{t('home.best_sellers')}</h2>
              <div className="flex gap-2">
                 <button className="p-4 border border-brand-primary/5 bg-white rounded-xl shadow-sm hover:bg-accent hover:text-white transition-all"><ChevronLeft size={20} /></button>
                 <button className="p-4 border border-brand-primary/5 bg-white rounded-xl shadow-sm hover:bg-accent hover:text-white transition-all"><ChevronRight size={20} /></button>
              </div>
           </div>
           <div className="flex gap-6 overflow-x-auto no-scrollbar pb-10">
              {MOCK_PRODUCTS.slice(0, 10).map(p => (
                <div key={p.id} className="w-[300px] shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
           </div>
        </section>

      </div>
    </div>
  );
}
