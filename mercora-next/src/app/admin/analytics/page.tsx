'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Activity, Users, Eye, MousePointerClick, ShoppingCart, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import type { AnalyticsEvent } from '@/services/analyticsService';

type Period = '24h' | '7d' | '30d';

const periodLabels: Record<Period, string> = { '24h': 'Son 24 Saat', '7d': 'Son 7 Gun', '30d': 'Son 30 Gun' };

const eventColors: Record<string, string> = {
  view: 'bg-blue-500',
  click: 'bg-purple-500',
  cart: 'bg-yellow-500',
  purchase: 'bg-green-500',
  wishlist: 'bg-pink-500',
};

const eventIcons: Record<string, typeof Eye> = {
  view: Eye,
  click: MousePointerClick,
  cart: ShoppingCart,
  purchase: TrendingUp,
  wishlist: Eye,
};

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('7d');
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
	      const since = new Date(Date.now() - days * 86400000);
	      const snap = await getDocs(query(collection(db, 'events'), where('ts', '>=', since), orderBy('ts', 'desc'), limit(200)));
	      const data = snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().ts?.toDate()?.toISOString() })) as unknown as AnalyticsEvent[];
      setEvents(data);
    } catch {
      setError('Analitik verileri yuklenirken bir hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [period]);

  const uniqueSessions = new Set(events.map((e) => e.sessionId)).size;
  const uniqueUsers = new Set(events.filter((e) => e.userId).map((e) => e.userId)).size;

  const typeCounts: Record<string, number> = {};
  events.forEach((e) => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });
  const totalEvents = events.length;

  const metrics = [
    { label: 'Toplam Event', value: totalEvents.toLocaleString(), icon: Activity, color: 'text-purple-700' },
    { label: 'Benzersiz Session', value: uniqueSessions.toLocaleString(), icon: Users, color: 'text-blue-600' },
    { label: 'Benzersiz Kullanici', value: uniqueUsers.toLocaleString(), icon: BarChart3, color: 'text-green-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-purple-700" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="text-red-500" size={48} />
        <p className="text-gray-500">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800">Tekrar Dene</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analitik</h1>
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1">
          {(Object.entries(periodLabels) as [Period, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                period === key ? 'bg-purple-700 text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gray-50 ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalEvents === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BarChart3 className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">Bu donemde hic event bulunamadi.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">Event Turleri</h2>
            <div className="space-y-3">
              {Object.entries(typeCounts).map(([type, count]) => {
                const percentage = totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0;
                const Icon = eventIcons[type] || Activity;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2 text-gray-700 capitalize">
                        <Icon size={14} className="text-gray-500" /> {type}
                      </span>
                      <span className="text-gray-500">{count} (%{percentage})</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${eventColors[type] || 'bg-gray-500'}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <h2 className="font-semibold text-gray-900 p-4 border-b border-gray-200">Son Eventler</h2>
            {events.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Event bulunamadi.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500">
                      <th className="text-left px-4 py-2 font-medium">Tur</th>
                      <th className="text-left px-4 py-2 font-medium">Urun ID</th>
                      <th className="text-left px-4 py-2 font-medium">Kullanici ID</th>
                      <th className="text-left px-4 py-2 font-medium">Zaman</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.slice(0, 10).map((event, i) => (
                      <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            eventColors[event.type] ? 'text-white' : 'bg-gray-100 text-gray-600'
                          } ${eventColors[event.type] || ''}`}>
                            {event.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-700 font-mono text-xs">{event.productId || '-'}</td>
                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">{event.userId || '-'}</td>
                        <td className="px-4 py-2 text-gray-500">{new Date((event as any).ts?.toDate?.() || (event as any).ts || Date.now()).toLocaleString('tr-TR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
