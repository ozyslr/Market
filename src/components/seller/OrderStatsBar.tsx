import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Clock, Truck, AlertTriangle, BarChart2 } from 'lucide-react';

interface OrderStatsBarProps {
  pendingCount: number;
  shippedCount: number;
  attentionCount: number;
  revenue24h: number;
}

export function OrderStatsBar({ pendingCount, shippedCount, attentionCount, revenue24h }: OrderStatsBarProps) {
  const stats = [
    { label: 'Bekleyen Gönderim', value: String(pendingCount), icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Kargoda',           value: String(shippedCount), icon: Truck, color: 'text-blue-500',   bg: 'bg-blue-50' },
    { label: 'İade / İnceleme',   value: String(attentionCount), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: '24s Ciro',          value: `${revenue24h.toLocaleString('tr-TR')} ₺`, icon: BarChart2, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
      {stats.map((stat, i) => (
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
  );
}
