import React, { useState, useEffect } from 'react';
import {
  Package, Truck, CheckCircle, Clock, AlertTriangle,
  Search, Filter, MoreVertical, MapPin, Globe,
  ArrowRight, Download, BarChart2, MessageSquare,
  ShieldCheck, ExternalLink, RefreshCw, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { getOrdersBySeller } from '@/services/orderService';
import { Order } from '@/types/order';

export function SellerOrdersPage() {
  const { firebaseUser } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'shipped' | 'delivered'>('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) { setLoading(false); return; }
    getOrdersBySeller(firebaseUser.uid).then(data => {
      setOrders(data);
      setLoading(false);
    });
  }, [firebaseUser]);

  const filteredOrders = orders.filter(o => {
    const buyer = o.shippingAddress?.fullName || o.userEmail;
    return (filter === 'all' || o.status === filter) &&
      (o.id.toLowerCase().includes(search.toLowerCase()) || buyer.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="min-h-screen bg-brand-secondary/30 pt-24 pb-20 px-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest rounded-full">
                Unified Global Fulfillment
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">
                <ShieldCheck size={10} /> Escrow Protection Active
              </span>
            </div>
            <h1 className="text-5xl font-display font-black tracking-tighter text-brand-primary uppercase italic">
              Order Orchestration
            </h1>
          </div>

          <div className="flex items-center gap-3">
             <button className="px-6 py-4 bg-white border border-brand-primary/5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:shadow-xl transition-all">
               <Download size={14} /> Manifest Export
             </button>
             <button className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-brand-primary/20 hover:bg-accent transition-all flex items-center gap-2">
               <RefreshCw size={14} /> Batch Ship
             </button>
          </div>
        </div>

        {/* Real-time Order Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           {[
             { label: 'Pending Dispatch', value: '12', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
             { label: 'In Transit', value: '48', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50' },
             { label: 'Awaiting Compliance', value: '3', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
             { label: 'Revenue (24h)', value: '$4,280', icon: BarChart2, color: 'text-green-500', bg: 'bg-green-50' }
           ].map((stat, i) => (
             <motion.div 
               key={i} 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.1 }}
               className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-brand-primary/5 flex items-center justify-between"
             >
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30 mb-1">{stat.label}</p>
                   <p className="text-3xl font-display font-black text-brand-primary">{stat.value}</p>
                </div>
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                   <stat.icon size={28} />
                </div>
             </motion.div>
           ))}
        </div>

        {/* Orders Workspace */}
        <div className="bg-white rounded-[3.5rem] shadow-sm border border-brand-primary/5 overflow-hidden">
           {/* Filters Bar */}
           <div className="p-8 border-b border-brand-primary/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex bg-brand-secondary/50 p-1.5 rounded-2xl">
                 {(['all', 'pending', 'shipped', 'delivered'] as const).map(tab => (
                   <button 
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={cn(
                      "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      filter === tab ? "bg-white text-brand-primary shadow-sm" : "text-brand-primary/40 hover:text-brand-primary"
                    )}
                   >
                     {tab}
                   </button>
                 ))}
              </div>

              <div className="flex-1 max-w-lg relative">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/20" />
                 <input 
                  type="text" 
                  placeholder="Search buyer name, order serial, or destination..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-brand-secondary/30 rounded-2xl outline-none focus:ring-4 focus:ring-accent/5 text-sm font-medium transition-all"
                 />
              </div>
           </div>

           {/* Table */}
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-brand-secondary/30 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">
                       <th className="px-10 py-6">Identity</th>
                       <th className="px-10 py-6">Buyer Artifacts</th>
                       <th className="px-10 py-6">Destination Hub</th>
                       <th className="px-10 py-6">Investment</th>
                       <th className="px-10 py-6">Workflow Status</th>
                       <th className="px-10 py-6"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-brand-primary/5">
                    {loading ? (
                      <tr><td colSpan={6} className="px-10 py-16 text-center">
                        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      </td></tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr><td colSpan={6} className="px-10 py-16 text-center">
                        <Package size={36} className="mx-auto text-brand-primary/10 mb-3" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30">Sipariş bulunamadı</p>
                      </td></tr>
                    ) : filteredOrders.map((order) => (
                      <tr key={order.id} className="group hover:bg-brand-secondary/20 transition-colors">
                         <td className="px-10 py-6">
                            <div>
                               <p className="font-black text-brand-primary">{order.id.slice(0, 8)}…</p>
                               <p className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                         </td>
                         <td className="px-10 py-6">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-brand-secondary p-1 flex items-center justify-center">
                                  <Package size={18} className="text-brand-primary/40" />
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-brand-primary">{order.shippingAddress?.fullName || order.userEmail}</p>
                                  <p className="text-[10px] font-bold text-accent uppercase tracking-widest">{order.items.length} ürün</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-6">
                            <div className="flex items-center gap-2">
                               <MapPin size={14} className="text-brand-primary/30" />
                               <span className="text-sm font-bold text-brand-primary">
                                 {order.shippingAddress ? `${order.shippingAddress.city}, ${order.shippingAddress.country}` : '—'}
                               </span>
                               <span className="flex items-center gap-1 text-[9px] font-black text-blue-500 uppercase tracking-widest ml-2 px-1.5 py-0.5 bg-blue-50 rounded">
                                  <Globe size={10} /> Express
                               </span>
                            </div>
                         </td>
                         <td className="px-10 py-6">
                            <p className="text-lg font-display font-black text-brand-primary">{order.currency} {order.total.toFixed(2)}</p>
                         </td>
                         <td className="px-10 py-6">
                            <div className={cn(
                              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                              order.status === 'delivered' ? "bg-green-50 text-green-600" :
                              order.status === 'shipped'   ? "bg-blue-50 text-blue-600" :
                              order.status === 'cancelled' ? "bg-zinc-100 text-zinc-500" :
                              "bg-orange-50 text-orange-600"
                            )}>
                               <div className={cn("w-2 h-2 rounded-full",
                                 order.status === 'delivered' ? "bg-green-500" :
                                 order.status === 'shipped'   ? "bg-blue-500" :
                                 order.status === 'cancelled' ? "bg-zinc-400" :
                                 "bg-orange-500"
                               )} />
                               {order.status}
                            </div>
                         </td>
                         <td className="px-10 py-6">
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button className="px-4 py-2 border border-brand-primary/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">
                                  Details
                               </button>
                               <button className="p-2 hover:bg-accent hover:text-white rounded-lg transition-all shadow-sm">
                                  <MoreVertical size={18} />
                               </button>
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* Pagination / Batch Actions */}
           <div className="p-8 bg-brand-secondary/10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">Selected 0 items</p>
                 <select className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none border-none cursor-pointer">
                    <option>Global Bulk Actions</option>
                    <option>Print Shipping Labels</option>
                    <option>Update Customs Data</option>
                    <option>Notify Buyers</option>
                 </select>
              </div>
              <div className="flex items-center gap-2">
                 {[1, 2, 3].map(i => (
                   <button key={i} className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black", i === 1 ? "bg-brand-primary text-white" : "hover:bg-white")}>{i}</button>
                 ))}
                 <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white"><ArrowRight size={14} /></button>
              </div>
           </div>
        </div>

        {/* Fulfillment Network Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
           <div className="lg:col-span-2 bg-brand-primary text-white rounded-[3rem] p-10 overflow-hidden relative group">
              <Globe size={150} className="absolute -bottom-10 -right-10 text-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative z-10 flex flex-col md:flex-row gap-12">
                 <div className="flex-1">
                    <h3 className="text-2xl font-display font-black uppercase italic mb-6">Global Logistics Hub Health</h3>
                    <div className="space-y-6">
                       {[
                         { hub: 'London Gateway', load: 85, health: 'Optimal' },
                         { hub: 'Dubai Logistics City', load: 42, health: 'Optimal' },
                         { hub: 'Frankfurth Hub', load: 92, health: 'High Payload' }
                       ].map((hub, i) => (
                         <div key={i} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                               <span>{hub.hub}</span>
                               <span className={hub.health === 'Optimal' ? "text-green-500" : "text-yellow-500"}>{hub.health}</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${hub.load}%` }}
                                 className="h-full bg-accent" 
                               />
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="w-full md:w-64 flex flex-col items-center justify-center text-center p-8 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10">
                    <ShieldCheck size={48} className="text-accent mb-4" />
                    <p className="text-sm font-black mb-2 uppercase italic">Verified Fulfillment</p>
                    <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-widest">99.2% of your artifacts pass global customs without manual intervention.</p>
                 </div>
              </div>
           </div>

           <div className="bg-accent text-white rounded-[3rem] p-10 flex flex-col justify-between group">
              <div>
                 <MessageSquare size={32} className="mb-6 opacity-40 group-hover:opacity-100 transition-opacity" />
                 <h3 className="text-2xl font-display font-black leading-tight uppercase italic mb-4 font-black">Need Priority Support?</h3>
                 <p className="text-sm font-medium text-white/80 leading-relaxed">Our Global Artifact Specialist team is available 24/7 for logistics and compliance escalations.</p>
              </div>
              <button className="w-full py-4 bg-white text-accent rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all mt-8">
                 Access Curator Helpdesk
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
