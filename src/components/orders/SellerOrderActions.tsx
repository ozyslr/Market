// ─── SellerOrderActions — Seller dropdown for Processing -> Shipped ────────────
// Shows tracking number input + carrier select when subOrder is in processing status.
// Calls POST /api/orders/{orderSetId}/subOrders/{subOrderId}/transition on confirm.
import { useState } from 'react';
import { Package, Truck, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { transitionSubOrderStatus } from '@/services/orderService';
import type { SubOrderStatus } from '@/types/order';

interface SellerOrderActionsProps {
  subOrderId: string;
  orderSetId: string;
  currentStatus: SubOrderStatus;
  onTransition: () => void;
}

const CARRIERS = ['Yurtici', 'MNG', 'Aras', 'PTT', 'UPS'] as const;
type Carrier = (typeof CARRIERS)[number];

export function SellerOrderActions({
  subOrderId,
  orderSetId,
  currentStatus,
  onTransition,
}: SellerOrderActionsProps) {
  const [open, setOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState<Carrier>('Yurtici');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if ((currentStatus as string) !== 'processing') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider',
          currentStatus === 'shipped'
            ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
            : currentStatus === 'delivered'
              ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400'
              : currentStatus === 'cancelled'
                ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
        )}
      >
        {currentStatus === 'shipped' && <Truck size={10} />}
        {currentStatus === 'delivered' && <CheckCircle2 size={10} />}
        {currentStatus === 'processing' && <Package size={10} />}
        {currentStatus}
      </span>
    );
  }

  async function handleConfirm() {
    if (!trackingNumber.trim()) {
      setError('Takip numarası zorunludur.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await transitionSubOrderStatus(orderSetId, subOrderId, 'mark_shipped', {
        trackingNumber: trackingNumber.trim(),
        carrier,
      });
      setSuccess(true);
      setOpen(false);
      onTransition();
    } catch (e: any) {
      setError(e.message || 'Geçiş başarısız oldu.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
        <Truck size={10} /> Kargoya Verildi
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-[#6418E5] text-white hover:bg-[#5210c8] transition-colors"
      >
        <Truck size={12} /> Kargoya Ver
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-[#1A1033]/10 dark:border-zinc-700 p-4 space-y-3">
          <p className="text-xs font-black text-[#1A1033] dark:text-white">Kargo Bilgileri</p>

          <div>
            <label className="block text-[10px] font-bold text-[#1A1033]/50 dark:text-zinc-400 mb-1">
              Takip Numarası *
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="örn. 1234567890"
              className="w-full px-3 py-2 rounded-xl border border-[#E8E8F0] dark:border-zinc-700 bg-[#F8F8FA] dark:bg-zinc-800 text-xs text-[#1A1033] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6418E5]/30"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#1A1033]/50 dark:text-zinc-400 mb-1">
              Kargo Firması
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value as Carrier)}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E8F0] dark:border-zinc-700 bg-[#F8F8FA] dark:bg-zinc-800 text-xs text-[#1A1033] dark:text-white focus:outline-none"
            >
              {CARRIERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-[10px] text-red-500">{error}</p>}

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#6418E5] text-white text-xs font-black hover:bg-[#5210c8] disabled:opacity-60 transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {loading ? 'Gönderiliyor...' : 'Onayla'}
          </button>
        </div>
      )}
    </div>
  );
}
