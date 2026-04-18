import React from 'react';
import { 
  Package, Heart, CreditCard, MapPin, Settings, 
  HelpCircle, ChevronRight, Star, Clock, ShoppingBag,
  TrendingUp, Wallet, ShieldCheck, Zap, ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { MOCK_USER, MOCK_PRODUCTS } from '@/mockData';
import { cn } from '@/lib/utils';

export function UserProfilePage() {
  const user = MOCK_USER;

  return (
    <div className="min-h-screen bg-brand-secondary/30 pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-[2rem] bg-brand-primary overflow-hidden border-4 border-white shadow-2xl">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                <Settings size={18} />
              </button>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-display font-black tracking-tighter text-brand-primary">
                  {user.name}
                </h1>
                <span className="px-3 py-1 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  Prime Member
                </span>
              </div>
              <p className="text-brand-primary/60 font-medium mt-1">
                Artisan Curator since {new Date(user.lastLogin).getFullYear()} • {user.country}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Spent', value: `$${user.spentTotal.toLocaleString()}`, icon: Wallet, color: 'text-green-500' },
              { label: 'Active Orders', value: user.orders.length, icon: Package, color: 'text-blue-500' },
              { label: 'Saved Items', value: user.savedItems.length, icon: Heart, color: 'text-red-500' },
              { label: 'Reward Points', value: '4,250', icon: Star, color: 'text-accent' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-3xl shadow-sm border border-brand-primary/5 hover:shadow-xl transition-all group">
                <div className={cn("w-10 h-10 rounded-xl bg-brand-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform", stat.color)}>
                  <stat.icon size={20} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">{stat.label}</p>
                <p className={cn("text-lg font-black tracking-tight", stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Recent Orders Section */}
            <section className="bg-white rounded-[3rem] p-8 shadow-sm border border-brand-primary/5">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-display font-black tracking-tight">Recent Global Orders</h2>
                <Link to="/orders" className="text-xs font-black uppercase tracking-widest text-accent hover:gap-3 flex items-center gap-2 transition-all">
                  View All Orders <ChevronRight size={14} />
                </Link>
              </div>

              <div className="space-y-4">
                {user.orders.map((order) => (
                  <div key={order.id} className="p-6 rounded-[2rem] border border-brand-primary/5 hover:border-accent/20 transition-all group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-secondary flex items-center justify-center text-brand-primary/40">
                          <Package size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-brand-primary">Order #{order.id.split('-')[0].toUpperCase()}</p>
                          <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-black text-brand-primary">${order.total}</p>
                          <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">{order.status}</p>
                        </div>
                        <span className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                          order.market === 'UK' ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                        )}>
                          {order.market} Fulfillment
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {order.items.map((item, idx) => {
                        const product = MOCK_PRODUCTS.find(p => p.id === item.productId);
                        return (
                          <div key={idx} className="flex-shrink-0 w-24 h-24 rounded-2xl bg-brand-secondary/50 p-2 relative group-hover:bg-white transition-colors border border-transparent group-hover:border-brand-primary/5">
                             <img 
                               src={product?.images[0]} 
                               alt={product?.title} 
                               className="w-full h-full object-contain mix-blend-multiply"
                             />
                             {item.quantity > 1 && (
                               <span className="absolute -top-2 -right-2 w-6 h-6 bg-brand-primary text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                                 {item.quantity}
                               </span>
                             )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex items-center gap-4">
                      <button className="flex-1 py-3 bg-brand-secondary text-brand-primary rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">
                        Track Package
                      </button>
                      <button className="flex-1 py-3 border border-brand-primary/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-accent hover:text-accent transition-all">
                        Buy Again
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Personalized Recommendations (Strategic Insight) */}
            <section className="bg-brand-primary rounded-[3.5rem] p-10 text-white overflow-hidden relative">
              <Zap size={150} className="absolute -top-12 -right-12 text-white/5 rotate-12" />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="max-w-md">
                   <div className="flex items-center gap-2 mb-4">
                     <TrendingUp size={16} className="text-accent" />
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">AI-Driven Insights</span>
                   </div>
                   <h2 className="text-4xl font-display font-black tracking-tighter leading-[0.9] mb-4 uppercase italic">
                     Curated <br /> Just for <br /> Your Vibe
                   </h2>
                   <p className="text-white/60 text-sm leading-relaxed mb-8">
                     Based on your recent interest in <span className="text-white font-bold">Artisan Audio</span> and <span className="text-white font-bold">Sustainable Design</span>, we've unlocked exclusive market access.
                   </p>
                   <button className="px-8 py-3 bg-accent text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-accent/40 hover:scale-105 active:scale-95 transition-all">
                     Explore Selection
                   </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {MOCK_PRODUCTS.slice(0, 4).map((p, i) => (
                    <motion.div 
                      key={p.id}
                      whileHover={{ scale: 1.05 }}
                      className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-4 relative cursor-pointer"
                    >
                      <img src={p.images[0]} alt={p.title} className="w-full h-full object-contain mb-2 brightness-110" />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <div className="w-1 h-1 bg-accent rounded-full animate-ping" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Quick Links Menu */}
            <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-brand-primary/5 overflow-hidden">
               <h3 className="text-lg font-display font-black mb-6 px-2">Account Control</h3>
               <nav className="space-y-1">
                 {[
                   { label: 'Prime Benefits', icon: Zap, detail: 'Exclusive Deals' },
                   { label: 'Payments & Balance', icon: CreditCard, detail: 'View Transactions' },
                   { label: 'Fulfillment Hubs', icon: MapPin, detail: 'Manage Addresses' },
                   { label: 'Security & Shields', icon: ShieldCheck, detail: 'Multi-Auth Enabled' },
                   { label: 'Artisan Support', icon: HelpCircle, detail: '24/7 Priority' }
                 ].map((nav, i) => (
                   <button key={i} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-brand-secondary/50 group transition-all">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-brand-secondary flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
                         <nav.icon size={18} />
                       </div>
                       <div className="text-left">
                         <p className="text-sm font-bold text-brand-primary">{nav.label}</p>
                         <p className="text-[10px] text-brand-primary/40 font-medium">{nav.detail}</p>
                       </div>
                     </div>
                     <ChevronRight size={16} className="text-brand-primary/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                   </button>
                 ))}
               </nav>
            </div>

            {/* Mercora Card / Financials */}
            <div className="bg-gradient-to-br from-brand-primary to-[#0a0a0a] rounded-[3rem] p-8 text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-accent/20 transition-all duration-1000" />
               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-12">
                   <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                     <CreditCard size={24} className="text-accent" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Mercora Platinum</span>
                 </div>
                 
                 <div className="space-y-1 mb-12">
                   <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Available Credit</p>
                   <p className="text-4xl font-display font-black">$12,500.00</p>
                 </div>

                 <div className="flex items-end justify-between">
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-brand-primary bg-brand-secondary overflow-hidden">
                          <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${i}`} className="w-full h-full" />
                        </div>
                      ))}
                      <div className="w-10 h-10 rounded-full border-2 border-brand-primary bg-accent/20 flex items-center justify-center text-[10px] font-black">
                        +12
                      </div>
                    </div>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent hover:gap-4 transition-all">
                      Card Details <ArrowRight size={14} />
                    </button>
                 </div>
               </div>
            </div>

            {/* Artisan Spotlight / Community */}
            <div className="bg-accent rounded-[3rem] p-8 text-white group overflow-hidden relative">
               <div className="relative z-10">
                 <Star size={24} className="text-white fill-white mb-4" />
                 <h4 className="text-xl font-display font-black leading-tight mb-4">You've reached <br /> "Diamond Patron" status</h4>
                 <p className="text-sm font-medium text-white/80 mb-6">Enjoy free global shipping on all artisan artifacts for the next 30 days.</p>
                 <div className="flex h-2 bg-white/20 rounded-full overflow-hidden mb-2">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: '85%' }}
                     className="bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                   />
                 </div>
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
                   <span>8,500 pts</span>
                   <span>10,000 pts to Legacy</span>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Saved for Later Carousel */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-display font-black tracking-tighter text-brand-primary uppercase italic">Saved from Global Markets</h2>
            <Link to="/saved" className="text-xs font-black uppercase tracking-widest text-accent hover:gap-3 flex items-center gap-2 transition-all">
              Manage Wishlist <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MOCK_PRODUCTS.slice(3, 7).map((product) => (
              <div key={product.id} className="bg-white rounded-[2.5rem] p-6 border border-brand-primary/5 hover:border-accent group transition-all">
                <div className="relative aspect-square bg-brand-secondary/50 rounded-2xl p-4 mb-4 overflow-hidden">
                  <img 
                    src={product.images[0]} 
                    alt={product.title} 
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" 
                  />
                  <button className="absolute top-2 right-2 w-8 h-8 bg-white text-red-500 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                    <Heart size={16} fill="currentColor" />
                  </button>
                </div>
                <h4 className="font-bold text-brand-primary truncate">{product.title}</h4>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-lg font-black text-brand-primary">${product.price}</p>
                  <button className="text-[10px] font-black uppercase tracking-widest text-accent hover:opacity-70">Add to Cart</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
