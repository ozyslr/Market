import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, RotateCcw, Check, Loader2 } from 'lucide-react';
import { Order } from '@/types/order';
import { createReturnRequest } from '@/services/returnService';

const RETURN_REASONS = [
  'Ürün hasarlı/kusurlu geldi',
  'Yanlış ürün gönderildi',
  'Ürün açıklamayla uyuşmuyor',
  'Beden/numara uymadı',
  'Fikrimi değiştirdim',
  'Diğer',
];

interface Props {
  order: Order;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const ReturnRequestModal: React.FC<Props> = ({ order, onClose, onSubmitted }) => {
  // Map of productId -> selected quantity
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const toggleItem = (productId: string, maxQty: number) => {
    setSelected(prev => {
      const next = { ...prev };
      if (next[productId]) delete next[productId];
      else next[productId] = maxQty;
      return next;
    });
  };

  const setQty = (productId: string, qty: number, maxQty: number) => {
    setSelected(prev => ({ ...prev, [productId]: Math.max(1, Math.min(maxQty, qty)) }));
  };

  const selectedItems = order.items.filter(i => selected[i.productId]);

  const handleSubmit = async () => {
    if (!selectedItems.length) { setError('Lütfen en az bir ürün seçin'); return; }
    setSubmitting(true);
    setError('');
    try {
      // Group selected items by seller — one return request per seller
      const bySeller = new Map<string, typeof selectedItems>();
      for (const item of selectedItems) {
        const sid = item.sellerId || order.sellerIds?.[0] || '';
        if (!bySeller.has(sid)) bySeller.set(sid, []);
        bySeller.get(sid)!.push(item);
      }

      for (const [sellerId, items] of bySeller) {
        await createReturnRequest(
          {
            orderId: order.id,
            sellerId,
            userId: order.userId,
            userEmail: order.userEmail,
            items: items.map(i => ({
              productId: i.productId,
              name: i.name || i.title || i.productId,
              quantity: selected[i.productId],
              price: i.price,
            })),
            reason,
            details: details.trim() || undefined,
            status: 'requested',
          },
          order.createdAt,
        );
      }
      setDone(true);
      onSubmitted?.();
    } catch {
      setError('İade talebi oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="İade talebi oluştur"
      >
        <div className="flex items-center justify-between p-5 border-b border-brand-primary/10 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 rounded-t-3xl">
          <h2 className="text-base font-black text-brand-primary dark:text-white flex items-center gap-2">
            <RotateCcw size={18} className="text-accent" /> İade Talebi
          </h2>
          <button onClick={onClose} aria-label="Kapat" className="p-1.5 rounded-full hover:bg-brand-secondary dark:hover:bg-zinc-800">
            <X size={18} className="text-brand-primary/60 dark:text-zinc-400" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-green-600" />
            </div>
            <p className="text-sm font-black text-brand-primary dark:text-white mb-1">İade talebiniz alındı</p>
            <p className="text-xs text-brand-primary/50 dark:text-zinc-400">İade kodunuz bildirimlerinizde. Onay sürecini siparişlerinizden takip edebilirsiniz.</p>
            <button onClick={onClose} className="mt-5 px-6 py-2.5 bg-accent text-white rounded-xl text-[11px] font-black uppercase tracking-widest">
              Tamam
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-zinc-500 mb-2">İade edilecek ürünler</p>
              <div className="space-y-2">
                {order.items.map((item, idx) => {
                  const isSel = !!selected[item.productId];
                  return (
                    <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${isSel ? 'border-accent bg-accent/5' : 'border-brand-primary/10 dark:border-zinc-800'}`}>
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleItem(item.productId, item.quantity)}
                        className="w-4 h-4 accent-current text-accent"
                        aria-label={`${item.name} iade için seç`}
                      />
                      <img src={item.image} alt={item.name} loading="lazy" referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-contain bg-brand-secondary/50 dark:bg-zinc-800 p-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-brand-primary dark:text-white truncate">{item.name || item.title}</p>
                        <p className="text-[10px] text-brand-primary/40 dark:text-zinc-500">{order.currency} {item.price.toFixed(2)} · {item.quantity} adet</p>
                      </div>
                      {isSel && item.quantity > 1 && (
                        <input
                          type="number"
                          min={1}
                          max={item.quantity}
                          value={selected[item.productId]}
                          onChange={e => setQty(item.productId, parseInt(e.target.value) || 1, item.quantity)}
                          className="w-14 px-2 py-1 text-xs rounded-lg border border-brand-primary/10 dark:border-zinc-700 bg-transparent text-brand-primary dark:text-white"
                          aria-label="İade adedi"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-zinc-500 mb-2 block">İade nedeni</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-brand-primary/10 dark:border-zinc-700 bg-transparent text-brand-primary dark:text-white"
              >
                {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 dark:text-zinc-500 mb-2 block">Açıklama (opsiyonel)</label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Sorununuzu kısaca açıklayın…"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-brand-primary/10 dark:border-zinc-700 bg-transparent text-brand-primary dark:text-white resize-none"
              />
            </div>

            {error && <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 bg-accent text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Gönderiliyor…</> : 'İade Talebini Gönder'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
