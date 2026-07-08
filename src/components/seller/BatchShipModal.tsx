import React from 'react';
import { X, Loader2 } from 'lucide-react';

interface BatchShipModalProps {
  open: boolean;
  selectedCount: number;
  batchCarrier: string;
  batchTracking: string;
  batchShipping: boolean;
  carriers: string[];
  onBatchCarrierChange: (carrier: string) => void;
  onBatchTrackingChange: (tracking: string) => void;
  onClose: () => void;
  onShip: () => void;
}

export function BatchShipModal({
  open,
  selectedCount,
  batchCarrier,
  batchTracking,
  batchShipping,
  carriers,
  onBatchCarrierChange,
  onBatchTrackingChange,
  onClose,
  onShip,
}: BatchShipModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-display font-black text-brand-primary uppercase italic">Toplu Kargo</h3>
          <button onClick={onClose} className="p-2 hover:bg-brand-secondary rounded-xl transition-colors">
            <X size={20} className="text-brand-primary/40" />
          </button>
        </div>
        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4">
          <p className="text-sm font-black text-brand-primary">{selectedCount} sipariş</p>
          <p className="text-[10px] font-bold text-brand-primary/50 uppercase tracking-widest">toplu olarak kargoya verilecek</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">Kargo Firması</label>
          <select
            value={batchCarrier}
            onChange={e => onBatchCarrierChange(e.target.value)}
            className="w-full bg-brand-secondary/30 text-brand-primary rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-accent/10"
          >
            {carriers.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">Takip No Öneki (opsiyonel)</label>
          <input
            value={batchTracking}
            onChange={e => onBatchTrackingChange(e.target.value)}
            placeholder="örn. BATCH-2026-"
            className="w-full bg-brand-secondary/30 text-brand-primary rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-accent/10 placeholder:text-brand-primary/20"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-brand-secondary text-brand-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-secondary/70 transition-all"
          >
            İptal
          </button>
          <button
            onClick={onShip}
            disabled={batchShipping || selectedCount === 0}
            className="flex-1 py-3 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {batchShipping ? <><Loader2 size={14} className="animate-spin" /> Gönderiliyor…</> : <>{selectedCount} Siparişi Kargola</>}
          </button>
        </div>
      </div>
    </div>
  );
}
