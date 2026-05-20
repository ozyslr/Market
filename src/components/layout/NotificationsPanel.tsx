import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';

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
                  notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.read) markRead(n.id);
                        if (n.link) { navigate(n.link); onClose(); }
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-brand-secondary/50 dark:hover:bg-zinc-900 transition-colors flex items-start gap-3 ${!n.read ? 'bg-accent/5' : ''}`}
                    >
                      <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-accent' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-brand-primary dark:text-white leading-tight">{n.title}</p>
                        <p className="text-[10px] text-brand-primary/60 dark:text-white/60 mt-0.5 leading-tight">{n.message}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
