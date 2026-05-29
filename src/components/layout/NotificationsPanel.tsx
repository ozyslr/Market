import React from 'react';
import { Bell, CheckCheck, ShieldAlert, Package, TrendingDown, Star, Truck, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { NotificationType } from '@/services/notificationService';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'az önce';
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa önce`;
  return `${Math.floor(h / 24)}g önce`;
}

const TYPE_ICON: Record<NotificationType, React.ElementType> = {
  admin_alert: ShieldAlert,
  order_status: Package,
  price_drop: TrendingDown,
  back_in_stock: Truck,
  review_approved: Star,
  payout: Truck,
  moderation: Settings,
};

const TYPE_COLOR: Record<NotificationType, string> = {
  admin_alert: 'text-red-500',
  order_status: 'text-blue-500',
  price_drop: 'text-green-500',
  back_in_stock: 'text-indigo-500',
  review_approved: 'text-yellow-500',
  payout: 'text-emerald-500',
  moderation: 'text-orange-500',
};

interface NotificationsPanelProps {
  show: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function NotificationsPanel({ show, onToggle, onClose }: NotificationsPanelProps) {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="relative hidden sm:block">
      <button
        onClick={onToggle}
        className="relative p-2 rounded-lg hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors text-brand-primary dark:text-white"
        aria-label="Bildirimler"
        aria-expanded={show}
        aria-haspopup="true"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-mercora-red text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <AnimatePresence>
        {show && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998]"
              onClick={onClose}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white dark:bg-zinc-950 border border-brand-primary/10 dark:border-white/10 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] z-[9999] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-brand-primary/5 dark:border-white/5">
                <span className="text-xs font-black uppercase tracking-widest text-brand-primary dark:text-white">Bildirimler</span>
                {unreadCount > 0 && (
                  <button onClick={() => markAllAsRead()} className="flex items-center gap-1 text-[10px] font-bold text-accent hover:underline">
                    <CheckCheck size={12} /> Tümünü Oku
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-brand-primary/5 dark:divide-white/5">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-brand-primary/40 dark:text-white/40">
                    <Bell size={28} strokeWidth={1.5} />
                    <p className="text-xs font-bold">Bildirim yok</p>
                  </div>
                ) : (
                  notifications.map(n => {
                    const Icon = TYPE_ICON[n.type] ?? Bell;
                    const iconColor = TYPE_COLOR[n.type] ?? 'text-accent';
                    return (
                      <button
                        key={n.id}
                        onClick={() => {
                          if (!n.read) markRead(n.id);
                          if (n.link) { navigate(n.link); onClose(); }
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-brand-secondary/50 dark:hover:bg-zinc-900 transition-colors flex items-start gap-3 ${!n.read ? 'bg-accent/5' : ''}`}
                      >
                        <span className={`mt-0.5 shrink-0 ${iconColor}`}>
                          <Icon size={15} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] font-bold text-brand-primary dark:text-white leading-tight">{n.title}</p>
                            <span className="text-[9px] text-brand-primary/40 dark:text-white/40 whitespace-nowrap shrink-0">{relativeTime(n.createdAt)}</span>
                          </div>
                          <p className="text-[10px] text-brand-primary/60 dark:text-white/60 mt-0.5 leading-tight">{n.message}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
