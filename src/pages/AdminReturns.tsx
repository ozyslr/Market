import React, { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus, issueRefund } from '@/services/orderService';
import { Order } from '@/types/order';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { audit } from '@/services/auditLogService';
import { useAuth } from '@/context/AuthContext';

export function AdminReturns() {
  const { user } = useAuth();
  const [returns, setReturns] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllOrders().then((orders) => {
      setReturns(orders.filter((o) => o.status === 'refunded' || o.status === 'cancelled'));
      setLoading(false);
    });
  }, []);

  const handleAction = async (orderId: string, action: 'refunded' | 'cancelled') => {
    setUpdating(orderId);
    setError(null);
    try {
      if (action === 'refunded') {
        // Gerçek para iadesi sunucu üzerinden (Stripe) yapılır; sipariş orada işaretlenir.
        await issueRefund(orderId);
        audit(
          user?.uid ?? '',
          user?.email ?? '',
          user?.role ?? 'admin',
          'return.refund',
          'order',
          orderId,
        );
      } else {
        await updateOrderStatus(orderId, action);
        audit(
          user?.uid ?? '',
          user?.email ?? '',
          user?.role ?? 'admin',
          'return.reject',
          'order',
          orderId,
        );
      }
      setReturns((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: action } : o)));
    } catch (e: any) {
      setError(e?.message || 'İşlem başarısız');
    } finally {
      setUpdating(null);
    }
  };

  const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    refunded: { label: 'İade Onaylandı', cls: 'bg-green-100 text-green-700' },
    cancelled: { label: 'İptal Edildi', cls: 'bg-red-100 text-red-700' },
    pending: { label: 'Bekliyor', cls: 'bg-yellow-100 text-yellow-700' },
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );

  return (
    <div className="bg-white rounded-[3.5rem] p-8 lg:p-12 border border-[#F8F8FA] shadow-sm">
      <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033] mb-8">
        İade Talepleri
      </h3>

      {error && (
        <p className="mb-6 text-xs font-bold text-red-600 bg-red-50 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {returns.length === 0 ? (
        <p className="text-center py-16 text-[#1A1033]/30 font-bold">İade talebi bulunmuyor</p>
      ) : (
        <div className="space-y-4">
          {returns.map((order) => {
            const st = STATUS_LABEL[order.status] || {
              label: order.status,
              cls: 'bg-zinc-100 text-zinc-600',
            };
            return (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#F8F8FA] rounded-2xl"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-black text-[#1A1033]">
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                    <span
                      className={cn(
                        'text-[9px] font-black uppercase px-2 py-0.5 rounded-full',
                        st.cls,
                      )}
                    >
                      {st.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#1A1033]/40">
                    {new Date(order.createdAt).toLocaleDateString('tr-TR')} · {order.items.length}{' '}
                    ürün
                  </p>
                  <p className="text-xs font-bold text-[#1A1033] mt-0.5">
                    {order.totalAmount?.toLocaleString('tr-TR') || '—'} ₺
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(order.id, 'refunded')}
                    disabled={updating === order.id || order.status === 'refunded'}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-40 hover:bg-green-600 transition-colors"
                  >
                    <CheckCircle size={12} /> Onayla
                  </button>
                  <button
                    onClick={() => handleAction(order.id, 'cancelled')}
                    disabled={updating === order.id || order.status === 'cancelled'}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-40 hover:bg-red-600 transition-colors"
                  >
                    <XCircle size={12} /> Reddet
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
