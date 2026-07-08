import React, { useEffect, useState, useRef } from 'react';
import { Package, Search, RefreshCw, ChevronDown, Square, CheckSquare, X, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { getAllOrders, subscribeAllOrders, updateOrderStatus, batchUpdateOrders } from '@/services/orderService';
import { Order, OrderStatus } from '@/types/order';
import { cn } from '@/lib/utils';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:          'bg-orange-50 text-orange-600',
  paid:             'bg-blue-50 text-blue-600',
  processing:       'bg-purple-50 text-purple-600',
  shipped:          'bg-cyan-50 text-cyan-600',
  delivered:        'bg-green-50 text-green-600',
  cancelled:        'bg-zinc-100 text-zinc-500',
  refunded:         'bg-red-50 text-red-500',
  return_requested: 'bg-yellow-50 text-yellow-600',
  returned:         'bg-orange-100 text-orange-700',
};

const ALL_STATUSES: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'return_requested', 'returned'];

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [newSinceLoad, setNewSinceLoad] = useState(0);
  const initialLoadDone = useRef(false);

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchStatus, setBatchStatus] = useState<OrderStatus>('shipped');
  const [batchUpdating, setBatchUpdating] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(o => o.id)));
    }
  };

  const handleBatchUpdate = async () => {
    if (selectedIds.size === 0) return;
    setBatchUpdating(true);
    const updates = Array.from(selectedIds).map(orderId => ({ orderId, status: batchStatus }));
    await batchUpdateOrders(updates);
    setBatchUpdating(false);
    setBatchOpen(false);
    setSelectedIds(new Set());
  };

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeAllOrders(
      (realtimeOrders) => {
        setOrders(realtimeOrders);
        setLoading(false);
        setRealtimeActive(true);
        if (initialLoadDone.current) {
          // Orders changed after initial load — count new ones
          setNewSinceLoad(prev => prev + 1);
        } else {
          initialLoadDone.current = true;
        }
      },
      (err) => {
        console.error('Admin orders subscription error:', err);
        setLoading(false);
      },
    );

    return () => { unsubscribe(); };
  }, []);

  const filtered = orders.filter(o => {
    const matchesStatus = filter === 'all' || o.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q || o.id.toLowerCase().includes(q) || o.userEmail.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setUpdatingId(orderId);
    await updateOrderStatus(orderId, status);
    // No need for setOrders here — onSnapshot will update automatically
    setUpdatingId(null);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Sipariş Merkezi</h2>
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
            {newSinceLoad > 0 && (
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-200">
                {newSinceLoad} güncelleme
              </span>
            )}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30 mt-1">{orders.length} kayıt</p>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 bg-[#1A1033] text-white px-5 py-3 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest">{selectedIds.size} seçili</span>
            <button onClick={() => setBatchOpen(true)}
              className="px-4 py-1.5 bg-accent rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-1.5">
              <Zap size={12} /> Toplu İşlem
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2rem] border border-[#F8F8FA] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#F8F8FA] flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex flex-wrap gap-2">
            {(['all', ...ALL_STATUSES] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={cn('px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                  filter === s ? 'bg-[#1A1033] text-white' : 'bg-[#F8F8FA] text-[#1A1033]/40 hover:text-[#1A1033]')}>
                {s === 'all' ? 'Tümü' : s}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm md:ml-auto">
            <Search size={14} className="absolute start-4 top-1/2 -translate-y-1/2 text-[#1A1033]/20" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ID veya e-posta ara..."
              className="w-full ps-10 pe-4 py-2.5 bg-[#F8F8FA] rounded-xl text-xs font-medium outline-none" />
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={7} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-24 text-center">
            <Package size={40} className="mx-auto text-[#1A1033]/10 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">Sipariş bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="bg-[#F8F8FA] text-[10px] font-black uppercase tracking-widest text-[#1A1033]/30">
                  <th className="px-4 py-5 w-10">
                    <button onClick={toggleSelectAll} className="hover:text-accent transition-colors">
                      {selectedIds.size > 0 && selectedIds.size === filtered.length
                        ? <CheckSquare size={16} className="text-accent" />
                        : <Square size={16} />}
                    </button>
                  </th>
                  <th className="px-4 py-5">Sipariş ID</th>
                  <th className="px-8 py-5">Müşteri</th>
                  <th className="px-8 py-5">Tutar</th>
                  <th className="px-8 py-5">Ödeme</th>
                  <th className="px-8 py-5">Durum</th>
                  <th className="px-8 py-5">Tarih</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8F8FA]">
                {filtered.map(order => {
                  const isSelected = selectedIds.has(order.id);
                  return (
                  <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={cn("transition-colors group", isSelected ? "bg-accent/5" : "hover:bg-[#F8F8FA]/50")}>
                    <td className="px-4 py-5">
                      <button onClick={() => toggleSelect(order.id)} className="hover:text-accent transition-colors">
                        {isSelected
                          ? <CheckSquare size={16} className="text-accent" />
                          : <Square size={16} className="text-[#1A1033]/15 group-hover:text-[#1A1033]/40" />}
                      </button>
                    </td>
                    <td className="px-4 py-5">
                      <p className="font-black text-[#1A1033] text-sm">{order.id.slice(0, 8)}…</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-[#1A1033]">{order.shippingAddress?.fullName || '—'}</p>
                      <p className="text-[10px] text-[#1A1033]/40 font-bold">{order.userEmail}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-black text-[#1A1033]">{order.currency} {order.total.toFixed(2)}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn('px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest',
                        order.paymentStatus === 'succeeded' ? 'bg-green-50 text-green-600' :
                        order.paymentStatus === 'failed'    ? 'bg-red-50 text-red-500' :
                        'bg-orange-50 text-orange-500')}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="relative group/status inline-block">
                        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer', STATUS_COLORS[order.status])}>
                          {order.status}
                          {updatingId === order.id ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <ChevronDown size={10} />}
                        </span>
                        <div className="absolute top-full start-0 mt-1 bg-white rounded-2xl shadow-2xl border border-[#F8F8FA] py-2 z-20 hidden group-hover/status:block min-w-[130px]">
                          {ALL_STATUSES.map(s => (
                            <button key={s} onClick={() => handleStatusChange(order.id, s)}
                              className={cn('w-full px-4 py-2 text-start text-[10px] font-black uppercase tracking-widest hover:bg-[#F8F8FA] transition-colors',
                                order.status === s ? 'text-[#1A1033]' : 'text-[#1A1033]/40')}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-[#1A1033]/40">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="px-3 py-1.5 border border-[#F8F8FA] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1A1033] hover:text-white hover:border-transparent transition-all">
                          Detay
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Batch Update Modal */}
      {batchOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-black text-[#1A1033] uppercase italic">Toplu Durum Güncelle</h3>
              <button onClick={() => setBatchOpen(false)} className="p-2 hover:bg-[#F8F8FA] rounded-xl transition-colors">
                <X size={20} className="text-[#1A1033]/40" />
              </button>
            </div>
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4">
              <p className="text-sm font-black text-[#1A1033]">{selectedIds.size} sipariş</p>
              <p className="text-[10px] font-bold text-[#1A1033]/50 uppercase tracking-widest">toplu olarak güncellenecek</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">Yeni Durum</label>
              <select value={batchStatus} onChange={e => setBatchStatus(e.target.value as OrderStatus)}
                className="w-full bg-[#F8F8FA] text-[#1A1033] rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-accent/10">
                {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setBatchOpen(false)}
                className="flex-1 py-3 bg-[#F8F8FA] text-[#1A1033] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F8F8FA]/70 transition-all">İptal</button>
              <button onClick={handleBatchUpdate} disabled={batchUpdating || selectedIds.size === 0}
                className="flex-1 py-3 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {batchUpdating ? 'Güncelleniyor…' : `${selectedIds.size} Siparişi Güncelle`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
