'use client';
import { useState, useEffect } from 'react';
import { Shield, Check, X, Loader2, AlertCircle, Clock, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import { getPendingReviews, reviewItem } from '@/services/moderationService';

interface ModerationItem {
  id: string;
  type: 'product' | 'review';
  content: string;
  status: 'bekleyen' | 'onaylanan' | 'reddedilen';
  createdAt: string;
}

export default function ModeratorDashboardPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingReviews();
      setItems(data.map((d: any) => ({
        id: d.id,
        type: d.targetType === 'product' ? 'product' : 'review',
        content: d.reason || d.targetName || '',
        status: d.status === 'pending' ? 'bekleyen' : d.status === 'approved' ? 'onaylanan' : 'reddedilen',
        createdAt: d.createdAt || new Date().toISOString(),
      })));
    } catch {
      setError('Moderasyon kuyrugu yuklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, status: 'onaylanan' | 'reddedilen') {
    setUpdatingId(id);
    try {
      await reviewItem(id, status === 'onaylanan' ? 'approved' : 'rejected', '');
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    } catch {
      setError('İşlem sirasinda hata oluştu.');
    } finally {
      setUpdatingId(null);
    }
  }

  const stats = {
    bekleyen: items.filter((i) => i.status === 'bekleyen').length,
    onaylanan: items.filter((i) => i.status === 'onaylanan').length,
    reddedilen: items.filter((i) => i.status === 'reddedilen').length,
  };

  const statusCfg: Record<string, { color: string; label: string }> = {
    bekleyen: { color: 'bg-yellow-100 text-yellow-800', label: 'Bekleyen' },
    onaylanan: { color: 'bg-green-100 text-green-800', label: 'Onaylanan' },
    reddedilen: { color: 'bg-red-100 text-red-800', label: 'Reddedilen' },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Moderasyon kuyrugu yukleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Hata</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={loadQueue} className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition">
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-7 h-7 text-purple-700" />
          <h1 className="text-2xl font-bold text-gray-900">Moderator Paneli</h1>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Bekleyen', value: stats.bekleyen, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Onaylanan', value: stats.onaylanan, icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Reddedilen', value: stats.reddedilen, icon: ThumbsDown, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-xl border border-gray-200 p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Moderasyon kuyrugunda og bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const cfg = statusCfg[item.status] || statusCfg.bekleyen;
              const dateStr = new Date(item.createdAt).toLocaleDateString('tr-TR');
              return (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          item.type === 'product' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {item.type === 'product' ? 'Urun' : 'Yorum'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{item.content}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <Eye className="w-3 h-3" />
                        <span>{dateStr}</span>
                      </div>
                    </div>
                    {item.status === 'bekleyen' && (
                      <div className="flex gap-1 ml-3">
                        <button
                          onClick={() => handleAction(item.id, 'onaylanan')}
                          disabled={updatingId === item.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50 transition"
                          title="Onayla"
                        >
                          {updatingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleAction(item.id, 'reddedilen')}
                          disabled={updatingId === item.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition"
                          title="Reddet"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
