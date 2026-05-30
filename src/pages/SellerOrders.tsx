import React, { useState, useEffect } from 'react';
import { 
  Package, Truck, CheckCircle, Clock, AlertTriangle,
  Search, Filter, MoreVertical, MapPin, Globe,
  ArrowRight, Download, BarChart2, MessageSquare,
  ShieldCheck, ExternalLink, RefreshCw, Zap, X, FileText, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useOrderStore, ExtendedOrder } from '@/store/useOrderStore';

export function SellerOrdersPage() {
  const { orders, isLoading, fetchOrders, updateOrderStatus } = useOrderStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered'>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(o => 
    (filter === 'all' || o.status === filter) &&
    (o.id.toLowerCase().includes(search.toLowerCase()) || o.buyerName.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = [
    { label: 'Pending Dispatch', value: orders.filter(o => o.status === 'pending').length, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Processing', value: orders.filter(o => o.status === 'processing').length, icon: Package, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'In Transit', value: orders.filter(o => o.status === 'shipped').length, icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Revenue (Total)', value: `$${orders.reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}`, icon: BarChart2, color: 'text-green-500', bg: 'bg-green-50' }
  ];

  return (
    <div className="min-h-screen bg-brand-secondary/30 pt-24 pb-20 px-8 relative overflow-hidden">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest rounded-full">
                Order Management System
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
             <button className="relative group px-6 py-4 bg-white border border-brand-primary/10 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:border-accent hover:text-accent transition-all overflow-hidden shadow-sm hover:shadow-xl hover:shadow-accent/10 hover:-translate-y-1">
               <div className="absolute inset-0 bg-accent/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
               <span className="relative z-10 flex items-center gap-2">
                 <Download size={14} className="group-hover:animate-bounce" /> Manifest Export
               </span>
             </button>
             <button onClick={() => fetchOrders()} className="relative group px-8 py-4 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-brand-primary/20 hover:shadow-brand-primary/40 transition-all overflow-hidden hover:-translate-y-1">
               <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
               <span className="relative z-10 flex items-center gap-2">
                 <RefreshCw size={14} className={isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} /> Orchestrate Sync
               </span>
             </button>
          </div>
        </div>

        {/* Real-time Order Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           {stats.map((stat, i) => (
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
              <div className="flex flex-wrap bg-brand-secondary/50 p-1.5 rounded-2xl">
                 {(['all', 'pending', 'processing', 'shipped', 'delivered'] as const).map(tab => (
                   <button 
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={cn(
                      "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      filter === tab ? "bg-white text-brand-primary shadow-sm" : "text-brand-primary/40 hover:text-brand-primary hover:bg-white/50"
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
                  placeholder="Search buyer name or order serial..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-brand-secondary/30 rounded-2xl outline-none focus:ring-4 focus:ring-accent/5 text-sm font-medium transition-all"
                 />
              </div>
           </div>

           {/* Table */}
           <div className="overflow-x-auto min-h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-64 text-brand-primary/40">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-brand-primary/40">
                  <Package className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-bold">No orders found.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-brand-secondary/30 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">
                         <th className="px-10 py-6">Order ID & Date</th>
                         <th className="px-10 py-6">Buyer Details</th>
                         <th className="px-10 py-6">Destination</th>
                         <th className="px-10 py-6">Total Amount</th>
                         <th className="px-10 py-6">Status</th>
                         <th className="px-10 py-6"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-brand-primary/5">
                      {filteredOrders.map((order) => (
                        <tr 
                          key={order.id} 
                          onClick={() => setSelectedOrder(order)}
                          className="group hover:bg-brand-secondary/20 transition-colors cursor-pointer"
                        >
                           <td className="px-10 py-6">
                              <div>
                                 <p className="font-black text-brand-primary">{order.id}</p>
                                 <p className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-widest">
                                   {new Date(order.createdAt).toLocaleDateString()}
                                 </p>
                              </div>
                           </td>
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-brand-secondary p-1 flex items-center justify-center">
                                    <Package size={18} className="text-brand-primary/40" />
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-brand-primary">{order.buyerName}</p>
                                    <p className="text-[10px] font-bold text-accent uppercase tracking-widest">{order.items.length} Item(s)</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-2">
                                 <MapPin size={14} className="text-brand-primary/30" />
                                 <span className="text-sm font-bold text-brand-primary">{order.market}</span>
                              </div>
                           </td>
                           <td className="px-10 py-6">
                              <p className="text-lg font-display font-black text-brand-primary">${order.total.toFixed(2)}</p>
                           </td>
                           <td className="px-10 py-6">
                              <div className={cn(
                                "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                                order.status === 'delivered' ? "bg-green-50 text-green-600" :
                                order.status === 'shipped' ? "bg-blue-50 text-blue-600" :
                                order.status === 'processing' ? "bg-purple-50 text-purple-600" :
                                "bg-orange-50 text-orange-600"
                              )}>
                                 <div className={cn("w-2 h-2 rounded-full", 
                                   order.status === 'delivered' ? "bg-green-500" :
                                   order.status === 'shipped' ? "bg-blue-500" :
                                   order.status === 'processing' ? "bg-purple-500" :
                                   "bg-orange-500"
                                 )} />
                                 {order.status}
                                 {order.urgency === 'High' && <Zap size={10} className="fill-current text-accent" />}
                              </div>
                           </td>
                           <td className="px-10 py-6 text-right">
                              <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity text-accent">
                                 <span className="text-[10px] font-black uppercase tracking-widest mr-2">Manage</span>
                                 <ChevronRight size={16} />
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              )}
           </div>

           {/* Pagination */}
           <div className="p-8 bg-brand-secondary/10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">Showing {filteredOrders.length} orders</p>
              </div>
              <div className="flex items-center gap-2">
                 {[1].map(i => (
                   <button key={i} className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black bg-brand-primary text-white")}>{i}</button>
                 ))}
                 <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white"><ArrowRight size={14} /></button>
              </div>
           </div>
        </div>
      </div>

      {/* Order Details Slide-out Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-brand-primary/20 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-display font-black text-brand-primary">Order {selectedOrder.id}</h2>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      selectedOrder.status === 'delivered' ? "bg-green-100 text-green-700" :
                      selectedOrder.status === 'shipped' ? "bg-blue-100 text-blue-700" :
                      selectedOrder.status === 'processing' ? "bg-purple-100 text-purple-700" :
                      "bg-orange-100 text-orange-700"
                    )}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-accent hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-8 flex-1 space-y-8">
                {/* Customer & Shipping Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-brand-primary">
                      <ExternalLink size={16} />
                      <h3 className="font-black uppercase tracking-widest text-xs">Customer</h3>
                    </div>
                    <p className="font-bold text-lg">{selectedOrder.buyerName}</p>
                    <p className="text-sm text-gray-500 mt-1">ID: {selectedOrder.buyerId}</p>
                    <button className="mt-4 px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary border border-gray-200 hover:border-accent transition-colors">
                      Contact Buyer
                    </button>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-brand-primary">
                      <MapPin size={16} />
                      <h3 className="font-black uppercase tracking-widest text-xs">Shipping</h3>
                    </div>
                    <p className="font-bold text-sm text-brand-primary">{selectedOrder.shippingAddress}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Urgency: {selectedOrder.urgency}</p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-black uppercase tracking-widest text-xs text-brand-primary mb-4 flex items-center gap-2">
                    <Package size={16} /> Order Items
                  </h3>
                  <div className="border border-gray-100 rounded-3xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="text-[10px] text-gray-500 font-black uppercase tracking-widest text-left">
                          <th className="px-6 py-4">Item</th>
                          <th className="px-6 py-4">Qty</th>
                          <th className="px-6 py-4 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4">
                              <p className="font-bold text-sm text-brand-primary">Product ID: {item.productId}</p>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-600">{item.quantity}</td>
                            <td className="px-6 py-4 text-sm font-bold text-brand-primary text-right">${item.price.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td colSpan={2} className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Total Revenue</td>
                          <td className="px-6 py-4 text-right font-display font-black text-xl text-brand-primary">${selectedOrder.total.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tracking & Fulfillment */}
                <div>
                  <h3 className="font-black uppercase tracking-widest text-xs text-brand-primary mb-4 flex items-center gap-2">
                    <Truck size={16} /> Fulfillment
                  </h3>
                  <div className="p-6 border border-gray-100 rounded-3xl space-y-4">
                    {selectedOrder.trackingNumber ? (
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Tracking Number</p>
                        <p className="font-mono text-lg font-bold text-brand-primary">{selectedOrder.trackingNumber}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500 mb-3">No tracking number assigned yet.</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            id="trackingInput"
                            placeholder="Enter Tracking #" 
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-accent text-sm"
                          />
                          <button 
                            onClick={() => {
                              const input = document.getElementById('trackingInput') as HTMLInputElement;
                              if (input && input.value) {
                                updateOrderStatus(selectedOrder.id, 'shipped', input.value);
                                setSelectedOrder({ ...selectedOrder, status: 'shipped', trackingNumber: input.value });
                              }
                            }}
                            className="px-6 py-2 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-3">
                  {selectedOrder.status === 'pending' && (
                    <button 
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'processing');
                        setSelectedOrder({ ...selectedOrder, status: 'processing' });
                      }}
                      className="flex-1 relative group px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest overflow-hidden transition-all shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:-translate-y-1"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Package size={14} /> Orchestrate Processing
                      </span>
                    </button>
                  )}
                  {selectedOrder.status === 'processing' && (
                    <button 
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'shipped');
                        setSelectedOrder({ ...selectedOrder, status: 'shipped' });
                      }}
                      className="flex-1 relative group px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest overflow-hidden transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Truck size={14} /> Dispatch Fulfillment
                      </span>
                    </button>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <button 
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'delivered');
                        setSelectedOrder({ ...selectedOrder, status: 'delivered' });
                      }}
                      className="flex-1 relative group px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest overflow-hidden transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:-translate-y-1"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <CheckCircle size={14} /> Confirm Delivery
                      </span>
                    </button>
                  )}
                  <button className="flex-1 px-6 py-4 bg-brand-secondary/50 text-brand-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center gap-2">
                    <FileText size={16} /> Print Artifact
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
