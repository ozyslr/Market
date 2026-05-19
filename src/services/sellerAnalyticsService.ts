import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface SellerAnalytics {
  weeklyRevenue: number;
  totalOrders: number;
  conversionRate: number;
  totalViews: number;
  totalClicks: number;
  revenueTrend: number;
  orderTrend: number;
  conversionTrend: number;
  viewsTrend: number;
  dailyRevenue: { date: string; value: number }[];
  topProducts: { id: string; name: string; price: number; views: number; sales: number; revenue: number }[];
  deviceBreakdown: { name: string; percentage: number; color: string }[];
  recentOrders: { id: string; total: number; status: string; createdAt: string }[];
}

function getTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

export async function getSellerAnalytics(sellerId: string): Promise<SellerAnalytics> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // ─── Orders ──────────────────────────────────────────────────────────────────
  const ordersRef = collection(db, 'orders');
  const ordersSnap = await getDocs(query(
    ordersRef,
    where('sellerIds', 'array-contains', sellerId),
    orderBy('createdAt', 'desc'),
  ));

  const thisWeekOrders: { total: number; status: string; createdAt: string; id: string }[] = [];
  const lastWeekOrders: { total: number }[] = [];
  let thisWeekRevenue = 0;
  let lastWeekRevenue = 0;
  let thisWeekCount = 0;
  let lastWeekCount = 0;

  // Daily aggregation
  const dailyMap: Record<string, number> = {};
  const lastWeekDailyMap: Record<string, number> = {};

  ordersSnap.docs.forEach(doc => {
    const data = doc.data();
    const total = data.total || data.totalAmount || 0;
    const createdAt = data.createdAt || '';
    const orderDate = new Date(createdAt);

    if (orderDate >= weekAgo) {
      thisWeekRevenue += total;
      thisWeekCount++;
      if (data.status === 'delivered' || data.status === 'paid' || data.status === 'processing') {
        thisWeekOrders.push({ id: doc.id, total, status: data.status, createdAt });
      }
      const dayKey = orderDate.toISOString().slice(0, 10);
      dailyMap[dayKey] = (dailyMap[dayKey] || 0) + total;
    } else if (orderDate >= twoWeeksAgo && orderDate < weekAgo) {
      lastWeekRevenue += total;
      lastWeekCount++;
      const dayKey = orderDate.toISOString().slice(0, 10);
      lastWeekDailyMap[dayKey] = (lastWeekDailyMap[dayKey] || 0) + total;
    }
  });

  // ─── Events (views, clicks) ──────────────────────────────────────────────────
  // Use product IDs for this seller
  const productsRef = collection(db, 'products');
  const productsSnap = await getDocs(query(
    productsRef,
    where('sellerId', '==', sellerId),
  ));
  const sellerProductIds = productsSnap.docs.map(d => d.id);

  // Get events for these products
  let thisWeekViews = 0;
  let thisWeekClicks = 0;
  let lastWeekViews = 0;
  let lastWeekClicks = 0;
  const productViewCount: Record<string, number> = {};
  const productSalesCount: Record<string, number> = {};

  if (sellerProductIds.length > 0) {
    const eventsRef = collection(db, 'events');
    // Get events from the past 2 weeks
    const eventsSnap = await getDocs(query(
      eventsRef,
      where('type', 'in', ['view', 'click', 'purchase']),
      orderBy('ts', 'desc'),
    ));

    eventsSnap.docs.forEach(doc => {
      const data = doc.data();
      const pid = data.productId;
      if (!sellerProductIds.includes(pid)) return;

      const eventDate = data.ts?.toDate ? data.ts.toDate() : new Date(data.ts);
      const type = data.type;

      if (eventDate >= weekAgo) {
        if (type === 'view') { thisWeekViews++; productViewCount[pid] = (productViewCount[pid] || 0) + 1; }
        else if (type === 'click') thisWeekClicks++;
        else if (type === 'purchase') productSalesCount[pid] = (productSalesCount[pid] || 0) + 1;
      } else if (eventDate >= twoWeeksAgo) {
        if (type === 'view') lastWeekViews++;
        else if (type === 'click') lastWeekClicks++;
      }
    });
  }

  // ─── Build daily revenue chart (last 7 days) ─────────────────────────────────
  const dailyRevenue: { date: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyRevenue.push({
      date: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
      value: dailyMap[key] || 0,
    });
  }

  // ─── Top products ────────────────────────────────────────────────────────────
  const topProducts = productsSnap.docs.map(doc => {
    const data = doc.data();
    const pid = doc.id;
    return {
      id: pid,
      name: data.title || 'Unnamed',
      price: data.price || 0,
      views: productViewCount[pid] || 0,
      sales: productSalesCount[pid] || 0,
      revenue: (productSalesCount[pid] || 0) * (data.price || 0),
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // ─── Conversion rate ─────────────────────────────────────────────────────────
  const prevConversion = lastWeekViews > 0 ? (lastWeekCount / lastWeekViews) * 100 : 0;
  const conversionRate = thisWeekViews > 0 ? (thisWeekCount / thisWeekViews) * 100 : 0;

  // ─── Device breakdown (mock for now — can extend with real UA parsing) ───────
  const deviceBreakdown = [
    { name: 'Mobil', percentage: 58, color: '#F9423A' },
    { name: 'Masaüstü', percentage: 32, color: '#3B82F6' },
    { name: 'Tablet', percentage: 10, color: '#10B981' },
  ];

  // ─── Recent orders ───────────────────────────────────────────────────────────
  const recentOrders = thisWeekOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map(o => ({ id: o.id, total: o.total, status: o.status, createdAt: o.createdAt }));

  return {
    weeklyRevenue: Math.round(thisWeekRevenue * 100) / 100,
    totalOrders: thisWeekCount,
    conversionRate: Math.round(conversionRate * 100) / 100,
    totalViews: thisWeekViews,
    totalClicks: thisWeekClicks,
    revenueTrend: getTrend(thisWeekRevenue, lastWeekRevenue),
    orderTrend: getTrend(thisWeekCount, lastWeekCount),
    conversionTrend: getTrend(conversionRate, prevConversion),
    viewsTrend: getTrend(thisWeekViews, lastWeekViews),
    dailyRevenue,
    topProducts,
    deviceBreakdown,
    recentOrders,
  };
}
