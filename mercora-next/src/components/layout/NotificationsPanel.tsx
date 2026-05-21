'use client';

import { X, Bell, CheckCheck, Package, Tag, AlertTriangle, DollarSign, MessageSquare } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  order_status: <Package size={16} />,
  price_drop: <Tag size={16} />,
  back_in_stock: <Package size={16} />,
  review_approved: <CheckCheck size={16} />,
  payout: <DollarSign size={16} />,
  moderation: <AlertTriangle size={16} />,
  question_answered: <MessageSquare size={16} />,
};

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const { firebaseUser } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:absolute md:inset-auto md:top-full md:right-0 md:mt-2 md:w-96 md:rounded-2xl md:shadow-2xl" onClick={onClose}>
      <div
        className="absolute inset-0 md:relative bg-white md:rounded-2xl md:shadow-2xl md:border md:border-gray-200 flex flex-col h-full md:max-h-[70vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-purple-700" />
            <h2 className="font-bold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-purple-700 hover:text-purple-800 font-medium"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="md:hidden p-1 hover:bg-gray-100 rounded-lg">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-700 border-t-transparent" />
            </div>
          ) : !firebaseUser ? (
            <div className="text-center py-12 text-gray-500">
              <Bell size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Sign in to see notifications</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-4 transition-colors ${!n.read ? 'bg-purple-50/50' : 'hover:bg-gray-50'}`}
                >
                  <button
                    onClick={() => markRead(n.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-full mt-0.5 ${!n.read ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                        {typeIcons[n.type] || <Bell size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 bg-purple-700 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {firebaseUser && notifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 text-center">
            <Link
              href="/profile"
              onClick={onClose}
              className="text-xs text-purple-700 hover:text-purple-800 font-medium"
            >
              View all notifications
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
