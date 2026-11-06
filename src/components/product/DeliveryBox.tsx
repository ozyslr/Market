import React from 'react';
import { Truck, Package, MapPin, ChevronRight } from 'lucide-react';

interface DeliveryBoxProps {
  locationLabel: string;
  onChangeLocation: () => void;
  hasExpressShipping?: boolean;
  freeShipping?: boolean;
  estimatedDeliveryDays?: number;
}

export function DeliveryBox({
  locationLabel,
  onChangeLocation,
  hasExpressShipping,
  freeShipping,
  estimatedDeliveryDays,
}: DeliveryBoxProps) {
  const deliveryRange = React.useMemo(() => {
    if (!estimatedDeliveryDays || estimatedDeliveryDays <= 0) return null;
    const start = new Date();
    start.setDate(start.getDate() + 1);
    const end = new Date();
    end.setDate(end.getDate() + estimatedDeliveryDays);
    const fmt = (d: Date) => d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    return `${fmt(start)} - ${fmt(end)}`;
  }, [estimatedDeliveryDays]);

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
      <button
        onClick={onChangeLocation}
        aria-label="Teslimat adresini değiştir"
        className="w-full flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-brand-secondary/30 transition-colors"
      >
        <div className="w-9 h-9 bg-brand-secondary/40 rounded-xl flex items-center justify-center text-accent shrink-0">
          <MapPin size={16} />
        </div>
        <div className="flex-1 text-start min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40">
            Teslimat Adresi
          </p>
          <p className="text-xs font-black text-brand-primary mt-0.5 truncate">{locationLabel}</p>
        </div>
        <ChevronRight size={14} className="text-brand-primary/30 shrink-0" />
      </button>

      <div className="border-t border-brand-primary/5 pt-3 space-y-2.5">
        <div className="flex items-start gap-2.5">
          <Truck size={15} className="text-green-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-black text-brand-primary">Satıcı tarafından kargolanır</p>
            <p className="text-[10px] font-bold text-brand-primary/50 mt-0.5">
              Kargo takip numarası siparişlerim sayfasında görünür
            </p>
            {deliveryRange && (
              <p className="text-[10px] font-bold text-green-700 mt-0.5">
                Tahmini Teslimat: {deliveryRange}
              </p>
            )}
            {estimatedDeliveryDays !== undefined && estimatedDeliveryDays <= 2 && (
              <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-black uppercase rounded">
                Hızlı Teslimat
              </span>
            )}
          </div>
        </div>

        {freeShipping && (
          <div className="flex items-start gap-2.5">
            <Truck size={15} className="text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-green-600">Ücretsiz Kargo</p>
              <p className="text-[10px] font-bold text-brand-primary/50 mt-0.5">
                Bu üründe kargo ücreti alınmaz
              </p>
            </div>
          </div>
        )}

        {hasExpressShipping && (
          <div className="flex items-start gap-2.5">
            <Truck size={15} className="text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-accent">Hızlı Teslimat</p>
              <p className="text-[10px] font-bold text-brand-primary/50 mt-0.5">Aynı gün kargo</p>
              <p className="text-[10px] font-bold text-accent mt-0.5">Express kargo mevcut</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2.5">
          <Package size={15} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-brand-primary">Kolay İade</p>
            <p className="text-[10px] font-bold text-brand-primary/50 mt-0.5">
              Teslimattan sonra 14 gün içinde cayma hakkı
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
