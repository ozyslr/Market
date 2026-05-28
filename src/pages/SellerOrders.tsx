import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Truck, CheckCircle, Clock, AlertTriangle,
  Search, Filter, MoreVertical, MapPin, Globe,
  ArrowRight, Download, BarChart2, MessageSquare,
  ShieldCheck, ExternalLink, RefreshCw, Zap, Loader2,
  RotateCcw, ThumbsUp, ThumbsDown, Square, CheckSquare, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { getOrdersBySeller, subscribeOrdersBySeller, updateOrderStatus, batchUpdateOrders } from '@/services/orderService';
import { getReturnRequests, updateReturnStatus, ReturnRequest } from '@/services/returnService';
import { createNotification } from '@/services/notificationService';
import { createCargoShipment, getTrackingStatus, getAvailableCarriers, CargoProviderName } from '@/services/cargoService';
import type { ShipmentRequest, TrackingResponse } from '@/services/cargoService';
import { autoGenerateInvoice } from '@/services/invoiceService';
import { Order } from '@/types/order';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

const CARRIERS = ['PTT', 'Yurtiçi', 'Aras', 'MNG', 'Sürat', 'UPS', 'DHL'];

export function SellerOrdersPage() {
  const { firebaseUser } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'shipped' | 'delivered'>('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [shipTarget, setShipTarget] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('PTT');
  const [shipping, setShipping] = useState(false);
  const [prevOrderIds, setPrevOrderIds] = useState<Set<string>>(new Set());
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [realtimeActive, setRealtimeActive] = useState(false);

  // Returns state
  const [showReturns, setShowReturns] = useState(false);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [processingReturn, setProcessingReturn] = useState(false);

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchShipOpen, setBatchShipOpen] = useState(false);
  const [batchCarrier, setBatchCarrier] = useState('PTT');
  const [batchTracking, setBatchTracking] = useState('');
  const [batchShipping, setBatchShipping] = useState(false);

  const shippableOrders = useMemo(
    () => orders.filter(o => o.status === 'pending' || o.status === 'processing'),
    [orders]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === shippableOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(shippableOrders.map(o => o.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBatchShip = async () => {
    if (selectedIds.size === 0) return;
    setBatchShipping(true);
    const updates = Array.from(selectedIds).map(orderId => ({
      orderId,
      status: 'shipped' as const,
      trackingNumber: batchTracking.trim() || undefined,
      carrier: batchCarrier,
    }));
    const result = await batchUpdateOrders(updates);
    // onSnapshot will automatically update the UI with new statuses
    setBatchShipping(false);
    setBatchShipOpen(false);
    setSelectedIds(new Set());
    if (result.successCount > 0) {
      createNotification(
        firebaseUser!.uid,
        'order_status',
        'Toplu Kargo Onaylandı',
        `${result.successCount} sipariş kargoya verildi.`,
        '/seller/orders',
      );
    }
  };

  useEffect(() => {
    if (!firebaseUser) { setLoading(false); return; }

    setLoading(true);
    const unsubscribe = subscribeOrdersBySeller(
      firebaseUser.uid,
      (realtimeOrders) => {
        setOrders(realtimeOrders);
        setLoading(false);
        setRealtimeActive(true);

        // Detect new orders (ones that weren't in previous snapshot)
        if (prevOrderIds.size > 0) {
          const currentIds = new Set(realtimeOrders.map(o => o.id));
          const newOrders = realtimeOrders.filter(o => !prevOrderIds.has(o.id));
          if (newOrders.length > 0) {
            setNewOrderCount(prev => prev + newOrders.length);
            // Notify seller about new orders
            newOrders.forEach(order => {
              createNotification(
                firebaseUser.uid,
                'order_status',
                'Yeni Sipariş!',
                `${order.shippingAddress?.fullName || 'Müşteri'} — ${order.total.toFixed(2)} ${order.currency}`,
                `/seller/orders`,
              );
            });
          }
          setPrevOrderIds(currentIds);
        } else {
          // First load — seed the ID set
          setPrevOrderIds(new Set(realtimeOrders.map(o => o.id)));
        }
      },
      (err) => {
        console.error('Seller orders subscription error:', err);
        setLoading(false);
      },
    );

    return () => { unsubscribe(); };
  }, [firebaseUser]);

  // Load returns
  useEffect(() => {
    if (!firebaseUser || !showReturns) return;
    setLoadingReturns(true);
    getReturnRequests(firebaseUser.uid).then(data => {
      setReturns(data);
      setLoadingReturns(false);
    });
  }, [firebaseUser, showReturns]);

  const now = Date.now();
  const pendingCount   = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const shippedCount   = orders.filter(o => o.status === 'shipped').length;
  const attentionCount = orders.filter(o => o.status === 'return_requested' || o.status === 'refunded').length;
  const revenue24h     = orders
    .filter(o => new Date(o.createdAt).getTime() > now - 86_400_000)
    .reduce((sum, o) => sum + o.total, 0);

  // Tracking view state
  const [trackingTarget, setTrackingTarget] = useState<{ provider: CargoProviderName; trackingNumber: string } | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const handleShip = async () => {
    if (!shipTarget || !firebaseUser) return;
    setShipping(true);
    try {
      const shipmentReq: ShipmentRequest = {
        orderId: shipTarget.id,
        senderName: firebaseUser.email || 'Satıcı',
        senderAddress: 'Mağaza Adresi',
        senderCity: 'İstanbul',
        senderPhone: '',
        receiverName: shipTarget.shippingAddress?.fullName || '',
        receiverAddress: shipTarget.shippingAddress?.line1 || '',
        receiverCity: shipTarget.shippingAddress?.city || '',
        receiverPhone: shipTarget.shippingAddress?.phone || '',
        packageCount: shipTarget.items.length,
        declaredValue: shipTarget.total,
      };

      const result = await createCargoShipment(carrier as CargoProviderName, shipmentReq);

      if (result.success) {
        await updateOrderStatus(shipTarget.id, 'shipped', {
          trackingNumber: result.trackingNumber,
          carrier,
          shippedAt: new Date().toISOString(),
        });
        setShipTarget(null);
        setTrackingNumber('');

        // Auto-generate e-invoice
        autoGenerateInvoice(
          shipTarget.id,
          firebaseUser.uid,
          shipTarget.createdAt,
          shipTarget.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, subtotal: i.subtotal })),
          shipTarget.shippingAddress?.fullName || shipTarget.userEmail,
          shipTarget.shippingAddress ? `${shipTarget.shippingAddress.line1}, ${shipTarget.shippingAddress.city}` : '',
          shipTarget.total,
          shipTarget.currency || 'TRY',
        );

        createNotification(
          firebaseUser.uid, 'order_status',
          'Kargo Oluşturuldu',
          `${carrier} — ${result.trackingNumber} — Tahmini teslimat: ${result.estimatedDelivery ? new Date(result.estimatedDelivery).toLocaleDateString('tr-TR') : '—'}`,
        );
      }
    } catch (err) {
      console.error('Cargo shipment failed:', err);
    } finally {
      setShipping(false);
    }
  };

  const handleViewTracking = async (order: Order) => {
    if (!order.trackingNumber || !order.carrier) return;
    setTrackingTarget({ provider: order.carrier as CargoProviderName, trackingNumber: order.trackingNumber });
    setTrackingLoading(true);
    setTrackingData(null);
    const result = await getTrackingStatus(order.carrier as CargoProviderName, order.trackingNumber);
    setTrackingData(result);
    setTrackingLoading(false);
  };

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
              <span className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                realtimeActive
                  ? "bg-green-50 text-green-600 border border-green-200"
                  : "bg-zinc-100 text-zinc-400"
              )}>
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  realtimeActive ? "bg-green-500 animate-pulse" : "bg-zinc-300"
                )} />
                {realtimeActive ? 'Canlı' : 'Bağlanıyor...'}
              </span>
              {newOrderCount > 0 && (
                <button
                  onClick={() => { setFilter('all'); setNewOrderCount(0); }}
                  className="px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse hover:bg-red-600 transition-all"
                >
                  {newOrderCount} Yeni Sipariş!
                </button>
              )}
            </div>
            <h1 className="text-5xl font-display font-black tracking-tighter text-brand-primary uppercase italic">
              Order Orchestration
            </h1>
          </div>

          <div className="flex items-center gap-3">
             <button className="px-6 py-4 bg-white border border-brand-primary/5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:shadow-xl transition-all">
               <Download size={14} /> Manifest Export
             </button>
             <button
               onClick={() => setBatchShipOpen(true)}
               disabled={selectedIds.size === 0}
               className={cn(
                 "px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all",
                 selectedIds.size > 0
                   ? "bg-accent text-white shadow-2xl shadow-accent/20 hover:opacity-90"
                   : "bg-brand-primary/20 text-brand-primary/40 cursor-not-allowed"
               )}
             >
               <Zap size={14} />
               {selectedIds.size > 0 ? `${selectedIds.size} Siparişi Kargola` : 'Batch Ship'}
             </button>
          </div>
        </div>

        {/* Real-time Order Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           {[
             { label: 'Bekleyen Gönderim', value: String(pendingCount),   icon: Clock,       color: 'text-orange-500', bg: 'bg-orange-50' },
             { label: 'Kargoda',           value: String(shippedCount),   icon: Truck,       color: 'text-blue-500',   bg: 'bg-blue-50'   },
             { label: 'İade / İnceleme',   value: String(attentionCount), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50'    },
             { label: '24s Ciro',          value: `${revenue24h.toLocaleString('tr-TR')} ₺`, icon: BarChart2, color: 'text-green-500', bg: 'bg-green-50' }
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
                 <div className="w-px h-6 bg-brand-primary/10 mx-2 self-center" />
                 <button
                   onClick={() => setShowReturns(!showReturns)}
                   className={cn(
                     "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                     showReturns ? "bg-amber-500 text-white shadow-sm" : "text-brand-primary/40 hover:text-brand-primary"
                   )}
                 >
                   <RotateCcw size={12} /> İadeler
                 </button>
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
                       <th className="px-6 py-6 w-12">
                         <button onClick={toggleSelectAll} className="hover:text-accent transition-colors">
                           {selectedIds.size > 0 && selectedIds.size === shippableOrders.length
                             ? <CheckSquare size={18} className="text-accent" />
                             : <Square size={18} />}
                         </button>
                       </th>
                       <th className="px-4 py-6">Identity</th>
                       <th className="px-4 py-6">Buyer Artifacts</th>
                       <th className="px-4 py-6">Destination Hub</th>
                       <th className="px-4 py-6">Investment</th>
                       <th className="px-4 py-6">Workflow Status</th>
                       <th className="px-6 py-6"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-brand-primary/5">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRowSkeleton key={i} cols={6} />
                      ))
                    ) : filteredOrders.length === 0 ? (
                      <tr><td colSpan={6} className="px-10 py-16 text-center">
                        <Package size={36} className="mx-auto text-brand-primary/10 mb-3" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30">Sipariş bulunamadı</p>
                      </td></tr>
                    ) : filteredOrders.map((order) => {
                      const isShippable = order.status === 'pending' || order.status === 'processing';
                      const isSelected = selectedIds.has(order.id);
                      return (
                      <tr key={order.id} className={cn("group transition-colors", isSelected ? "bg-accent/5" : "hover:bg-brand-secondary/20")}>
                         <td className="px-6 py-6">
                           {isShippable && (
                             <button onClick={() => toggleSelect(order.id)} className="hover:text-accent transition-colors">
                               {isSelected
                                 ? <CheckSquare size={18} className="text-accent" />
                                 : <Square size={18} className="text-brand-primary/20 group-hover:text-brand-primary/50" />}
                             </button>
                           )}
                         </td>
                         <td className="px-4 py-6">
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
                               {(order.status === 'pending' || order.status === 'processing') && (
                                 <button
                                   onClick={() => { setShipTarget(order); setCarrier('PTT'); setTrackingNumber(''); }}
                                   className="px-4 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                                 >
                                   Kargoya Ver
                                 </button>
                               )}
                               {order.status === 'shipped' && order.trackingNumber && (
                                 <button
                                   onClick={() => handleViewTracking(order)}
                                   className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                                 >
                                   Takip Et
                                 </button>
                               )}
                               <button className="px-4 py-2 border border-brand-primary/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all">
                                  Details
                               </button>
                            </div>
                         </td>
                      </tr>
                      );
                    })}
                 </tbody>
              </table>
           </div>

           {/* Pagination / Batch Actions */}
           <div className="p-8 bg-brand-secondary/10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">
                   {selectedIds.size > 0 ? `${selectedIds.size} sipariş seçildi` : 'Selected 0 items'}
                 </p>
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

        {/* ── RETURNS SECTION ── */}
        {showReturns && (
          <div className="bg-white rounded-[3.5rem] shadow-sm border border-amber-200 overflow-hidden mt-8">
            <div className="p-8 border-b border-amber-100 flex items-center justify-between">
              <h2 className="font-black text-brand-primary uppercase italic flex items-center gap-2">
                <RotateCcw size={18} className="text-amber-500" /> İade Yönetimi
              </h2>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                {returns.filter(r => r.status === 'requested').length} bekleyen
              </span>
            </div>

            {loadingReturns ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
            ) : returns.length === 0 ? (
              <div className="text-center py-16">
                <RotateCcw size={36} className="mx-auto text-brand-primary/10 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30">İade talebi yok</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-brand-secondary/20 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">
                      <th className="px-8 py-5">İade Kodu</th>
                      <th className="px-8 py-5">Ürün</th>
                      <th className="px-8 py-5">Sebep</th>
                      <th className="px-8 py-5">Tarih</th>
                      <th className="px-8 py-5">Durum</th>
                      <th className="px-8 py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-primary/5">
                    {returns.map(r => (
                      <tr key={r.id} className={cn("transition-colors group", r.autoApproved ? "bg-green-50/30 hover:bg-green-50/50" : "hover:bg-brand-secondary/20")}>
                        <td className="px-8 py-5">
                          <div>
                            <span className="font-mono font-black text-accent text-sm">{r.returnCode || '—'}</span>
                            <p className="text-[10px] font-bold text-brand-primary/30">#{r.orderId.slice(-6).toUpperCase()}</p>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-bold text-brand-primary text-sm">{r.items.map(i => i.name).join(', ')}</p>
                          <p className="text-[10px] font-bold text-brand-primary/40">{r.items.reduce((s, i) => s + i.quantity, 0)} adet</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-medium text-brand-primary max-w-[200px] truncate">{r.reason}</p>
                        </td>
                        <td className="px-8 py-5 text-sm text-brand-primary/60">
                          {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest',
                              r.status === 'requested' ? 'bg-amber-50 text-amber-600' :
                              r.status === 'approved' ? 'bg-green-50 text-green-600' :
                              r.status === 'rejected' ? 'bg-red-50 text-red-600' :
                              r.status === 'received' ? 'bg-blue-50 text-blue-600' :
                              r.status === 'refunded' ? 'bg-purple-50 text-purple-600' :
                              'bg-gray-50 text-gray-500'
                            )}>
                              {r.status === 'requested' ? 'Bekliyor' :
                               r.status === 'approved' ? 'Onaylandı' :
                               r.status === 'rejected' ? 'Reddedildi' :
                               r.status === 'received' ? 'Teslim Alındı' :
                               r.status === 'refunded' ? 'İade Edildi' :
                               r.status === 'pickup_scheduled' ? 'Kargo Planlandı' :
                               r.status === 'closed' ? 'Kapandı' : r.status}
                            </span>
                            {r.autoApproved && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-black uppercase rounded-full" title={r.autoApprovalReason}>
                                Oto
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {r.status === 'requested' && (
                              <>
                                <button
                                  onClick={async () => {
                                    setProcessingReturn(true);
                                    await updateReturnStatus(r.id, 'approved', 'İade onaylandı. Kargonuzu bekliyoruz.');
                                    setReturns(prev => prev.map(rr => rr.id === r.id ? { ...rr, status: 'approved' as const } : rr));
                                    setProcessingReturn(false);
                                  }}
                                  disabled={processingReturn}
                                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50"
                                  title="Onayla"
                                >
                                  <ThumbsUp size={14} />
                                </button>
                                <button
                                  onClick={async () => {
                                    setProcessingReturn(true);
                                    await updateReturnStatus(r.id, 'rejected', 'İade talebi reddedildi.');
                                    setReturns(prev => prev.map(rr => rr.id === r.id ? { ...rr, status: 'rejected' as const } : rr));
                                    setProcessingReturn(false);
                                  }}
                                  disabled={processingReturn}
                                  className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                                  title="Reddet"
                                >
                                  <ThumbsDown size={14} />
                                </button>
                                <button
                                  onClick={() => setSelectedReturn(r)}
                                  className="p-2 bg-brand-secondary/50 text-brand-primary/60 rounded-lg hover:bg-brand-secondary transition-all"
                                  title="Detay"
                                >
                                  <MoreVertical size={14} />
                                </button>
                              </>
                            )}
                            {r.status !== 'requested' && (
                              <button
                                onClick={() => setSelectedReturn(r)}
                                className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline"
                              >
                                Detay
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Return Detail Modal */}
        {selectedReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedReturn(null)} />
            <div className="relative bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-black text-brand-primary uppercase italic">İade Detayı</h3>
                <span className={cn(
                  'px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest',
                  selectedReturn.status === 'requested' ? 'bg-amber-50 text-amber-600' :
                  selectedReturn.status === 'approved' ? 'bg-green-50 text-green-600' :
                  selectedReturn.status === 'rejected' ? 'bg-red-50 text-red-600' :
                  selectedReturn.status === 'refunded' ? 'bg-purple-50 text-purple-600' :
                  selectedReturn.status === 'received' ? 'bg-blue-50 text-blue-600' :
                  'bg-gray-50 text-gray-500'
                )}>
                  {selectedReturn.status === 'requested' ? 'Bekliyor' :
                   selectedReturn.status === 'approved' ? 'Onaylandı' :
                   selectedReturn.status === 'rejected' ? 'Reddedildi' :
                   selectedReturn.status === 'received' ? 'Teslim Alındı' :
                   selectedReturn.status === 'refunded' ? 'İade Edildi' :
                   selectedReturn.status === 'pickup_scheduled' ? 'Kargo Planlandı' :
                   selectedReturn.status === 'closed' ? 'Kapandı' : selectedReturn.status}
                </span>
              </div>

              <div className="space-y-3">
                {selectedReturn.returnCode && (
                  <div className="flex items-center gap-3 bg-accent/5 border border-accent/20 rounded-2xl p-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-accent/60">İade Kodu</span>
                    <span className="text-xl font-display font-black text-accent tracking-widest">{selectedReturn.returnCode}</span>
                    {selectedReturn.autoApproved && (
                      <span className="ml-auto px-3 py-1 bg-green-500 text-white text-[9px] font-black uppercase rounded-full">Otomatik Onay</span>
                    )}
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/50 font-bold">Sipariş</span>
                  <span className="font-black font-mono">#{selectedReturn.orderId.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/50 font-bold">Talep Tarihi</span>
                  <span className="font-black">{new Date(selectedReturn.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
                {selectedReturn.returnWindowExpiry && (
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-primary/50 font-bold">İade Süresi</span>
                    <span className={cn("font-bold", new Date(selectedReturn.returnWindowExpiry) > new Date() ? "text-green-600" : "text-red-500")}>
                      {new Date(selectedReturn.returnWindowExpiry).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/50 font-bold">Müşteri</span>
                  <span className="font-black">{selectedReturn.userEmail}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/50 font-bold">İade Tutarı</span>
                  <span className="font-black text-accent">{(selectedReturn.refundAmount ?? 0).toFixed(2)} ₺</span>
                </div>
                <div className="pt-3 border-t border-brand-primary/5">
                  <p className="text-xs font-bold text-brand-primary/50 mb-1 uppercase tracking-widest">İade Sebebi</p>
                  <p className="text-sm font-bold">{selectedReturn.reason}</p>
                </div>
                {selectedReturn.autoApprovalReason && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-green-700">{selectedReturn.autoApprovalReason}</p>
                  </div>
                )}
                {selectedReturn.details && (
                  <div className="pt-2">
                    <p className="text-xs font-bold text-brand-primary/50 mb-1 uppercase tracking-widest">Açıklama</p>
                    <p className="text-sm">{selectedReturn.details}</p>
                  </div>
                )}
                {/* Timeline */}
                {selectedReturn.timeline && selectedReturn.timeline.length > 0 && (
                  <div className="pt-3 border-t border-brand-primary/5">
                    <p className="text-xs font-bold text-brand-primary/50 mb-3 uppercase tracking-widest">Süreç</p>
                    <div className="space-y-2">
                      {selectedReturn.timeline.map((entry, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              "w-2 h-2 rounded-full mt-1.5",
                              idx === 0 ? "bg-accent" : "bg-brand-primary/20"
                            )} />
                            {idx < (selectedReturn.timeline?.length ?? 0) - 1 && (
                              <div className="w-px flex-1 bg-brand-primary/10 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-2">
                            <p className="text-[11px] font-black text-brand-primary">
                              {entry.status === 'requested' ? 'Talep Oluşturuldu' :
                               entry.status === 'approved' ? 'Onaylandı' :
                               entry.status === 'rejected' ? 'Reddedildi' :
                               entry.status === 'received' ? 'Teslim Alındı' :
                               entry.status === 'refunded' ? 'İade Tamamlandı' :
                               entry.status === 'pickup_scheduled' ? 'Kargo Planlandı' :
                               entry.status === 'closed' ? 'Kapatıldı' : entry.status}
                            </p>
                            {entry.note && <p className="text-[10px] text-brand-primary/50">{entry.note}</p>}
                            <p className="text-[9px] text-brand-primary/30">{new Date(entry.timestamp).toLocaleString('tr-TR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelectedReturn(null)}
                  className="flex-1 py-3 border border-brand-primary/10 text-brand-primary font-black text-xs rounded-xl hover:bg-brand-secondary/30 transition-all uppercase tracking-widest">
                  Kapat
                </button>
                {selectedReturn.status === 'requested' && (
                  <>
                    <button
                      onClick={async () => {
                        setProcessingReturn(true);
                        await updateReturnStatus(selectedReturn.id, 'approved', 'İade onaylandı.');
                        setReturns(prev => prev.map(r => r.id === selectedReturn.id ? { ...r, status: 'approved' } : r));
                        setSelectedReturn(prev => prev ? { ...prev, status: 'approved' } : null);
                        setProcessingReturn(false);
                      }}
                      disabled={processingReturn}
                      className="flex-1 py-3 bg-green-500 text-white font-black text-xs rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 uppercase tracking-widest"
                    >
                      İadeyi Onayla
                    </button>
                    <button
                      onClick={async () => {
                        setProcessingReturn(true);
                        await updateReturnStatus(selectedReturn.id, 'rejected', 'İade reddedildi.');
                        setReturns(prev => prev.map(r => r.id === selectedReturn.id ? { ...r, status: 'rejected' } : r));
                        setSelectedReturn(prev => prev ? { ...prev, status: 'rejected' } : null);
                        setProcessingReturn(false);
                      }}
                      disabled={processingReturn}
                      className="flex-1 py-3 bg-red-500 text-white font-black text-xs rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 uppercase tracking-widest"
                    >
                      Reddet
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

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

      {/* Tracking Modal */}
      {trackingTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl space-y-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-black text-brand-primary uppercase italic">Kargo Takip</h3>
              <button onClick={() => { setTrackingTarget(null); setTrackingData(null); }} className="p-2 hover:bg-brand-secondary rounded-xl transition-colors">
                <X size={20} className="text-brand-primary/40" />
              </button>
            </div>
            <div className="bg-brand-secondary/30 rounded-2xl p-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-brand-primary/40 font-bold">{trackingTarget.provider}</span>
                <span className="font-black font-mono text-brand-primary">{trackingTarget.trackingNumber}</span>
              </div>
            </div>
            {trackingLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
            ) : trackingData?.success ? (
              <div className="space-y-1">
                <div className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest mb-4",
                  trackingData.delivered ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                )}>
                  {trackingData.delivered ? 'Teslim Edildi' : trackingData.currentStatus}
                  {trackingData.estimatedDelivery && !trackingData.delivered && (
                    <span className="ml-2 font-bold">· Tahmini: {new Date(trackingData.estimatedDelivery).toLocaleDateString('tr-TR')}</span>
                  )}
                </div>
                <div className="space-y-2">
                  {trackingData.events.map((event, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5", idx === 0 ? "bg-accent" : idx === trackingData.events.length - 1 ? "bg-green-500" : "bg-brand-primary/20")} />
                        {idx < trackingData.events.length - 1 && <div className="w-px flex-1 bg-brand-primary/10 mt-1" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className="text-xs font-black text-brand-primary">{event.status}</p>
                        <p className="text-[10px] text-brand-primary/50">{event.description}</p>
                        <p className="text-[9px] text-brand-primary/30 flex items-center gap-2">
                          {event.location && <span>{event.location}</span>}
                          <span>{new Date(event.timestamp).toLocaleString('tr-TR')}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {trackingData.labelUrl && (
                  <a href={trackingData.labelUrl} target="_blank" rel="noopener noreferrer"
                    className="block w-full text-center py-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all mt-4">
                    Kargo Etiketini İndir
                  </a>
                )}
              </div>
            ) : trackingData ? (
              <p className="text-center py-8 text-red-500 font-bold text-sm">{trackingData.error || 'Takip bilgisi alınamadı'}</p>
            ) : null}
          </div>
        </div>
      )}

      {/* Batch Ship Modal */}
      {batchShipOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-black text-brand-primary uppercase italic">Toplu Kargo</h3>
              <button onClick={() => setBatchShipOpen(false)} className="p-2 hover:bg-brand-secondary rounded-xl transition-colors">
                <X size={20} className="text-brand-primary/40" />
              </button>
            </div>
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4">
              <p className="text-sm font-black text-brand-primary">{selectedIds.size} sipariş</p>
              <p className="text-[10px] font-bold text-brand-primary/50 uppercase tracking-widest">toplu olarak kargoya verilecek</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">Kargo Firması</label>
              <select value={batchCarrier} onChange={e => setBatchCarrier(e.target.value)}
                className="w-full bg-brand-secondary/30 text-brand-primary rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-accent/10">
                {CARRIERS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">Takip No Öneki (opsiyonel)</label>
              <input value={batchTracking} onChange={e => setBatchTracking(e.target.value)}
                placeholder="örn. BATCH-2026-"
                className="w-full bg-brand-secondary/30 text-brand-primary rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-accent/10 placeholder:text-brand-primary/20" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setBatchShipOpen(false)}
                className="flex-1 py-3 bg-brand-secondary text-brand-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-secondary/70 transition-all">İptal</button>
              <button onClick={handleBatchShip} disabled={batchShipping || selectedIds.size === 0}
                className="flex-1 py-3 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {batchShipping ? <><Loader2 size={14} className="animate-spin" /> Gönderiliyor…</> : <>{selectedIds.size} Siparişi Kargola</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ship Modal */}
      {shipTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl space-y-5">
            <h3 className="text-xl font-display font-black text-brand-primary uppercase italic">Kargo Bilgileri</h3>
            <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">
              Sipariş #{shipTarget.id.slice(-6).toUpperCase()}
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">Kargo Firması</label>
              <select
                value={carrier}
                onChange={e => setCarrier(e.target.value)}
                className="w-full bg-brand-secondary/30 text-brand-primary rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-accent/10"
              >
                {CARRIERS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">Takip Numarası (opsiyonel)</label>
              <input
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="örn. TR1234567890"
                className="w-full bg-brand-secondary/30 text-brand-primary rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-accent/10 placeholder:text-brand-primary/20"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShipTarget(null)}
                className="flex-1 py-3 bg-brand-secondary text-brand-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-secondary/70 transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleShip}
                disabled={shipping}
                className="flex-1 py-3 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {shipping ? <><Loader2 size={14} className="animate-spin" /> Kaydediliyor…</> : 'Kargoya Ver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
