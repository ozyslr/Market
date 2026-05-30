import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { Loader2, TrendingUp, Eye, ShoppingCart, Heart, MousePointerClick, Zap, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsEvent {
  id: string;
  type: string;
  productId: string;
  userId?: string;
  sessionId?: string;
  ts?: Timestamp;
}

export function AdminAnalytics() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    loadEvents();
  }, [period]);

  async function loadEvents() {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'events'),
        orderBy('ts', 'desc'),
        limit(200),
      );
      const snap = await getDocs(q);
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }) as AnalyticsEvent));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'events');
    } finally {
      setLoading(false);
    }
  }

  // Breakdown by type
  const typeCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});

  // Trending products
  const productCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.productId] = (acc[e.productId] || 0) + 1;
    return acc;
  }, {});
  const trending = Object.entries(productCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10);

  const totalEvents = events.length;
  const uniqueSessions = new Set(events.filter(e => e.sessionId).map(e => e.sessionId)).size;
  const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId)).size;

  const TYPE_ICONS: Record<string, React.ReactNode> = {
    view: <Eye size={14} />,
    click: <MousePointerClick size={14} />,
    cart: <ShoppingCart size={14} />,
    purchase: <Zap size={14} />,
    wishlist: <Heart size={14} />,
  };

  const TYPE_COLORS: Record<string, string> = {
    view: 'bg-blue-100 text-blue-600 border-blue-200',
    click: 'bg-amber-100 text-amber-600 border-amber-200',
    cart: 'bg-violet-100 text-violet-600 border-violet-200',
    purchase: 'bg-green-100 text-green-600 border-green-200',
    wishlist: 'bg-rose-100 text-rose-600 border-rose-200',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tight text-brand-primary dark:text-white">
            Analitik <span className="text-[#F9423A] underline underline-offset-4 decoration-2">Verileri</span>
          </h2>
          <p className="text-xs text-brand-primary/40 dark:text-white/40 font-bold mt-1">
            Firestore olay verileri — gerçek zamanlı kullanıcı etkileşimleri
          </p>
        </div>
        <div className="flex gap-1 bg-white dark:bg-zinc-800 rounded-xl p-1 border border-brand-primary/5">
          {(['24h', '7d', '30d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all',
                period === p
                  ? 'bg-[#F9423A] text-white shadow-sm'
                  : 'text-brand-primary/40 hover:text-brand-primary dark:text-white/40 dark:hover:text-white'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Activity size={18} />}
          label="Toplam Olay"
          value={totalEvents.toLocaleString()}
          color="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
        />
        <MetricCard
          icon={<Globe size={18} />}
          label="Tekil Oturum"
          value={uniqueSessions.toLocaleString()}
          color="text-violet-600 bg-violet-50 dark:bg-violet-900/20"
        />
        <MetricCard
          icon={<Users size={18} />}
          label="Tekil Kullanıcı"
          value={uniqueUsers.toLocaleString()}
          color="text-amber-600 bg-amber-50 dark:bg-amber-900/20"
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label="Trend Ürün"
          value={trending[0]?.[0]?.slice(0, 8) || '—'}
          color="text-green-600 bg-green-50 dark:bg-green-900/20"
        />
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Olay Dağılımı */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/5 p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary dark:text-white mb-4">
            Olay Dağılımı
          </h3>
          <div className="space-y-3">
            {(Object.entries(typeCounts) as [string, number][]).map(([type, count]) => {
              const pct = totalEvents > 0 ? ((count / totalEvents) * 100).toFixed(1) : '0';
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className={cn('p-1.5 rounded-lg border', TYPE_COLORS[type] || 'bg-zinc-100 text-zinc-600')}>
                    {TYPE_ICONS[type] || <Activity size={14} />}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-brand-primary dark:text-white capitalize">{type}</span>
                      <span className="font-bold text-brand-primary/50">{String(count)} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F9423A] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {Object.keys(typeCounts).length === 0 && (
              <p className="text-xs text-brand-primary/40 text-center py-4">Henüz veri yok</p>
            )}
          </div>
        </div>

        {/* Trend Ürünler */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/5 p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary dark:text-white mb-4">
            En Çok Etkileşim Alan Ürünler
          </h3>
          <div className="space-y-2">
            {(trending as [string, number][]).slice(0, 8).map(([id, count], i) => (
              <div
                key={id}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <span className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black',
                  i < 3 ? 'bg-[#F9423A] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-brand-primary/40'
                )}>
                  {i + 1}
                </span>
                <span className="flex-1 text-xs font-bold text-brand-primary dark:text-white truncate">
                  {id}
                </span>
                <span className="text-[10px] font-bold text-brand-primary/40">{count} etkileşim</span>
              </div>
            ))}
            {trending.length === 0 && (
              <p className="text-xs text-brand-primary/40 text-center py-4">Henüz veri yok</p>
            )}
          </div>
        </div>
      </div>

      {/* Son Olaylar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/5 p-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary dark:text-white mb-4">
          Son Olaylar
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-brand-primary/5">
                <th className="text-start py-2 pe-4 font-bold text-brand-primary/40">Tip</th>
                <th className="text-start py-2 pe-4 font-bold text-brand-primary/40">Ürün ID</th>
                <th className="text-start py-2 pe-4 font-bold text-brand-primary/40">Kullanıcı</th>
                <th className="text-start py-2 pe-4 font-bold text-brand-primary/40">Oturum</th>
                <th className="text-end py-2 font-bold text-brand-primary/40">Zaman</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 20).map(ev => (
                <tr key={ev.id} className="border-b border-brand-primary/5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <td className="py-2 pe-4">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-bold capitalize',
                      TYPE_COLORS[ev.type] || 'bg-zinc-100 text-zinc-600'
                    )}>
                      {TYPE_ICONS[ev.type]} {ev.type}
                    </span>
                  </td>
                  <td className="py-2 pe-4 font-mono text-brand-primary dark:text-white">{ev.productId?.slice(0, 16)}</td>
                  <td className="py-2 pe-4 text-brand-primary/50">{ev.userId ? ev.userId.slice(0, 12) : '—'}</td>
                  <td className="py-2 pe-4 text-brand-primary/50">{ev.sessionId?.slice(0, 10) || '—'}</td>
                  <td className="py-2 text-end text-brand-primary/40">
                    {ev.ts?.toDate?.().toLocaleString('tr-TR') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-brand-primary/5 p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className={cn('p-2 rounded-xl', color)}>{icon}</span>
      </div>
      <p className="text-2xl font-black text-brand-primary dark:text-white">{value}</p>
      <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

// Missing imports
function Activity({ size }: { size?: number }) { return <TrendingUp size={size} />; }
function Globe({ size }: { size?: number }) { return <Calendar size={size} />; }
function Users({ size }: { size?: number }) { return <TrendingUp size={size} />; }
