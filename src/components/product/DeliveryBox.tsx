import React from 'react';
import { Truck, Package, ShieldCheck, MapPin, ChevronRight } from 'lucide-react';

interface DeliveryBoxProps {
  locationLabel: string;
  onChangeLocation: () => void;
  hasExpressShipping?: boolean;
}

const CARGO_COMPANIES = ['Yurtiçi Kargo', 'MNG Kargo', 'PTT Kargo', 'Aras Kargo'];

function getCargoCompany(): string {
  return CARGO_COMPANIES[Math.floor(Math.random() * CARGO_COMPANIES.length)];
}

function getEstimatedDate(): string {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 14) {
    return 'Yarın kargoya verilir';
  }
  const next = new Date(now);
  next.setDate(next.getDate() + 2);
  return `${next.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} kargoya verilir`;
}

export function DeliveryBox({ locationLabel, onChangeLocation, hasExpressShipping }: DeliveryBoxProps) {
  const cargoCompany = React.useMemo(() => getCargoCompany(), []);
  const estimatedDate = React.useMemo(() => getEstimatedDate(), []);

  return (
    <div className="bg-white rounded-2xl border border-brand-primary/5 shadow-sm p-4 space-y-3">
      <button
        onClick={onChangeLocation}
        aria-label="Teslimat adresini değiştir"
        className="w-full flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-brand-secondary/30 transition-colors"
      >
        <div className="w-9 h-9 bg-brand-secondary/40 rounded-xl flex items-center justify-center text-accent shrink-0">
          <MapPin size={16} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40">Teslimat Adresi</p>
          <p className="text-xs font-black text-brand-primary mt-0.5 truncate">{locationLabel}</p>
        </div>
        <ChevronRight size={14} className="text-brand-primary/30 shrink-0" />
      </button>

      <div className="border-t border-brand-primary/5 pt-3 space-y-2.5">
        <div className="flex items-start gap-2.5">
          <Truck size={15} className="text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-brand-primary">{cargoCompany} ile</p>
            <p className="text-[10px] font-bold text-green-600 mt-0.5">{estimatedDate}</p>
          </div>
        </div>

        {hasExpressShipping && (
          <div className="flex items-start gap-2.5">
            <Truck size={15} className="text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-accent">Hızlı Teslimat</p>
              <p className="text-[10px] font-bold text-brand-primary/50 mt-0.5">Aynı gün kargo</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2.5">
          <Package size={15} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-brand-primary">Kolay İade</p>
            <p className="text-[10px] font-bold text-brand-primary/50 mt-0.5">15 gün ücretsiz iade</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <ShieldCheck size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-brand-primary">Garantili Ürün</p>
            <p className="text-[10px] font-bold text-brand-primary/50 mt-0.5">2 yıl resmi garanti</p>
          </div>
        </div>
      </div>
    </div>
  );
}
