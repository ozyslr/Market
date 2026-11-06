import React from 'react';
import { ShieldCheck, RotateCcw, Lock, MessageSquare } from 'lucide-react';

const BADGES = [
  { icon: ShieldCheck, label: 'Güvenli Ödeme', color: 'text-green-600' },
  { icon: RotateCcw, label: '14 Gün Cayma Hakkı', color: 'text-blue-600' },
  { icon: Lock, label: '3D Secure Ödeme', color: 'text-purple-600' },
  { icon: MessageSquare, label: 'Satıcıya Soru Sor', color: 'text-orange-500' },
];

export function TrustBadges() {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {BADGES.map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-2 py-2 rounded-lg bg-brand-secondary/20"
          >
            <Icon size={16} className={`${color} shrink-0`} />
            <span className="text-[10px] font-black text-brand-primary leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
