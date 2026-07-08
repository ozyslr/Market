// ─── OrderTimeline — Customer-facing order lifecycle timeline ─────────────────
// Renders a 6-step vertical timeline: pending -> paid -> processing -> shipped -> delivered
// with support for cancelled/refunded as red badges.
import { CheckCircle2, Package, CreditCard, Settings, Truck, MapPin, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { OrderSetStatus } from '@/types/order';

interface HistoryEntry {
  status: string;
  timestamp: string;
}

interface OrderTimelineProps {
  status: OrderSetStatus;
  history?: HistoryEntry[];
}

const STEPS: Array<{ key: OrderSetStatus; label: string; icon: any }> = [
  { key: 'pending', label: 'Sipariş Alındı', icon: CheckCircle2 },
  { key: 'paid', label: 'Ödeme Onaylandı', icon: CreditCard },
  { key: 'processing', label: 'Hazırlanıyor', icon: Settings },
  { key: 'shipped', label: 'Kargoya Verildi', icon: Truck },
  { key: 'delivered', label: 'Teslim Edildi', icon: MapPin },
];

const STEP_ORDER: OrderSetStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

const TERMINAL_NEGATIVE: OrderSetStatus[] = [
  'cancelled',
  'refunded',
  'return_requested',
  'return_approved',
  'return_rejected',
];

function getActiveIndex(status: OrderSetStatus): number {
  const idx = STEP_ORDER.indexOf(status);
  return idx >= 0 ? idx : STEP_ORDER.length - 1;
}

export function OrderTimeline({ status, history }: OrderTimelineProps) {
  const isNegative = (TERMINAL_NEGATIVE as string[]).includes(status);
  const activeIdx = isNegative ? 0 : getActiveIndex(status);

  function getDate(key: OrderSetStatus): string | undefined {
    if (!history) return undefined;
    const entry = history.find((h) => h.status === key);
    if (!entry) return undefined;
    return new Date(entry.timestamp).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
    });
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border border-brand-primary/5 dark:border-zinc-800">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary/50 dark:text-zinc-400 mb-5">
        Sipariş Durumu
      </h3>

      {isNegative && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950">
          <XCircle size={16} className="text-red-500 shrink-0" />
          <span className="text-xs font-bold text-red-600 dark:text-red-400 capitalize">
            {status === 'cancelled'
              ? 'İptal Edildi'
              : status === 'refunded'
                ? 'İade Edildi'
                : status.replace(/_/g, ' ')}
          </span>
        </div>
      )}

      <div className="relative">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIdx;
          const isActive = idx === activeIdx && !isNegative;
          const Icon = step.icon;
          const date = getDate(step.key);

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.07 }}
              className="relative flex gap-3 pb-6 last:pb-0"
            >
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="absolute start-4 top-8 bottom-0 w-0.5 bg-[#F0F0F5] dark:bg-zinc-800">
                  {isCompleted && (
                    <motion.div
                      className="w-full bg-green-400"
                      initial={{ height: 0 }}
                      animate={{ height: '100%' }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                    />
                  )}
                </div>
              )}

              {/* Icon bubble */}
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isCompleted
                    ? 'border-green-400 bg-green-400 text-white'
                    : isActive
                      ? 'border-[#6418E5] bg-[#6418E5] text-white'
                      : 'border-[#E8E8F0] bg-white dark:border-zinc-700 dark:bg-zinc-800 text-brand-primary/30 dark:text-zinc-600',
                )}
              >
                <Icon size={14} />
              </div>

              {/* Label + date */}
              <div className="pt-0.5">
                <p
                  className={cn(
                    'text-xs font-bold',
                    isCompleted || isActive
                      ? 'text-brand-primary dark:text-white'
                      : 'text-brand-primary/35 dark:text-zinc-600',
                  )}
                >
                  {step.label}
                </p>
                {date && (
                  <p className="text-[10px] text-brand-primary/40 dark:text-zinc-500 mt-0.5">
                    {date}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
