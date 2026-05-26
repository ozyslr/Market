import React, { useState } from 'react';
import { CreditCard, ChevronDown, ChevronUp } from 'lucide-react';

interface InstallmentTableProps {
  price: number;
  currency?: string;
}

const BANKS = [
  { name: 'Ziraat Bankası', color: '#E4002B', months: [3, 6, 9, 12] },
  { name: 'İş Bankası', color: '#005DAA', months: [3, 6, 9, 12] },
  { name: 'Garanti BBVA', color: '#00A651', months: [3, 6, 9] },
  { name: 'Yapı Kredi', color: '#00467F', months: [3, 6, 12] },
  { name: 'Akbank', color: '#FF0000', months: [3, 6, 9] },
];

export function InstallmentTable({ price, currency = 'gbp' }: InstallmentTableProps) {
  const [expanded, setExpanded] = useState(false);
  const symbol = currency === 'gbp' ? '£' : '₺';

  return (
    <div className="bg-white rounded-2xl border border-brand-primary/5 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        aria-label={expanded ? 'Taksit seçeneklerini gizle' : 'Taksit seçeneklerini göster'}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-accent" />
          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40">Kredi Kartı</p>
            <p className="text-xs font-black text-brand-primary mt-0.5">Taksit Seçenekleri</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-brand-primary/40" /> : <ChevronDown size={16} className="text-brand-primary/40" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {BANKS.map(bank => (
            <div key={bank.name}>
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: bank.color }}
                />
                <p className="text-[10px] font-black text-brand-primary/60 uppercase tracking-wider">{bank.name}</p>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {bank.months.map(m => {
                  const monthly = (price / m).toFixed(2);
                  return (
                    <div key={m} className="text-center p-2 bg-brand-secondary/30 rounded-xl border border-brand-primary/5">
                      <p className="text-[9px] font-bold text-brand-primary/40">{m} Taksit</p>
                      <p className="text-[11px] font-black text-brand-primary mt-0.5">{symbol}{monthly}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!expanded && (
        <div className="px-4 pb-3">
          <p className="text-[10px] font-bold text-brand-primary/40">
            3 taksit: <span className="text-brand-primary font-black">{symbol}{(price / 3).toFixed(2)}/ay</span>
            {' · '}
            12 taksit: <span className="text-brand-primary font-black">{symbol}{(price / 12).toFixed(2)}/ay</span>
          </p>
        </div>
      )}
    </div>
  );
}
