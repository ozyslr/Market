import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order } from '../types/order';

export interface SellerAnalytics {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalProducts: number;
    activeProducts: number;
    conversionRate: number;
  };
  revenueOverTime: { date: string; revenue: number; orders: number }[];
  topProducts: {
    productId: string;
    id: string;
    name: string;
    revenue: number;
    unitsSold: number;
    sales: number;
    price: number;
    views: number;
  }[];
  orderStatusBreakdown: { status: string; count: number }[];
  customerMetrics: {
    uniqueCustomers: number;
    repeatCustomers: number;
    returnRate: number;
  };
  weeklyRevenue: number;
  revenueTrend: number;
  totalOrders: number;
  orderTrend: number;
  conversionRate: number;
  conversionTrend: number;
  totalViews: number;
  viewsTrend: number;
  dailyRevenue: { date: string; value: number }[];
  deviceBreakdown: { name: string; percentage: number; color: string }[];
}

function getPeriodStartDate(period: '7d' | '30d' | '90d' | '1y'): Date {
  const now = new Date();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function getTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

function groupByDate(
  orders: Order[],
  sellerId: string,
  days: number,
): { date: string; revenue: number; orders: number }[] {
  const map = new Map<string, { revenue: number; orders: number }>();

  // Initialize all dates in range
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { revenue: 0, orders: 0 });
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  for (const order of orders) {
    const orderDate = new Date(order.createdAt);
    if (orderDate < cutoff) continue;
    const key = orderDate.toISOString().slice(0, 10);
    const sellerItems = order.items?.filter((i) => i.sellerId === sellerId) ?? [];
    const revenue = sellerItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const entry = map.get(key);
    if (entry) {
      entry.revenue += revenue;
      entry.orders += 1;
    }
  }

  return Array.from(map.entries()).map(([date, data]) => ({ date, ...data }));
}

/** No orders yet (or a read failed): all zeros. Sellers must never see invented sales. */
function emptyAnalytics(days: number): SellerAnalytics {
  const revenueOverTime = groupByDate([], '', days);
  return {
    overview: {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalProducts: 0,
      activeProducts: 0,
      conversionRate: 0,
    },
    revenueOverTime,
    topProducts: [],
    orderStatusBreakdown: [],
    customerMetrics: { uniqueCustomers: 0, repeatCustomers: 0, returnRate: 0 },
    weeklyRevenue: 0,
    revenueTrend: 0,
    totalOrders: 0,
    orderTrend: 0,
    conversionRate: 0,
    conversionTrend: 0,
    totalViews: 0,
    viewsTrend: 0,
    dailyRevenue: revenueOverTime.map((d) => ({ date: d.date, value: d.revenue })),
    deviceBreakdown: [],
  };
}

export async function getSellerAnalytics(
  sellerId: string,
  period: '7d' | '30d' | '90d' | '1y' = '30d',
): Promise<SellerAnalytics> {
  try {
    const periodStart = getPeriodStartDate(period);
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;

    // ─── Orders ──────────────────────────────────────────────────────────────────
    const ordersRef = collection(db, 'orders');
    const ordersSnap = await getDocs(
      query(ordersRef, where('sellerIds', 'array-contains', sellerId)),
    );

    if (ordersSnap.empty) {
      return emptyAnalytics(days);
    }

    const orders = ordersSnap.docs
      .map(
        (d) =>
          ({
            id: d.id,
            ...(d.data() as Omit<Order, 'id'>),
            createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() ?? d.data().createdAt,
          }) as Order,
      )
      .filter((o) => new Date(o.createdAt) >= periodStart);

    // ─── Revenue & order calculations ────────────────────────────────────────────
    const delivered = orders.filter((o) => o.status === 'delivered');
    const totalRevenue = delivered.reduce((sum, o) => {
      const sellerItems = o.items?.filter((i) => i.sellerId === sellerId) ?? [];
      return sum + sellerItems.reduce((s, i) => s + i.price * i.quantity, 0);
    }, 0);
    const totalOrders = delivered.length;

    // ─── Products ────────────────────────────────────────────────────────────────
    const productsRef = collection(db, 'products');
    const productsSnap = await getDocs(query(productsRef, where('sellerId', '==', sellerId)));
    const totalProducts = productsSnap.size;
    const activeProducts = productsSnap.docs.filter((d) => {
      const data = d.data();
      return data.status === 'active' || data.isActive === true || data.stock > 0;
    }).length;

    // ─── Top products by revenue ─────────────────────────────────────────────────
    const productMap = new Map<string, { name: string; revenue: number; unitsSold: number }>();
    for (const order of orders) {
      const sellerItems = order.items?.filter((i) => i.sellerId === sellerId) ?? [];
      for (const item of sellerItems) {
        const existing = productMap.get(item.productId);
        if (existing) {
          existing.revenue += item.price * item.quantity;
          existing.unitsSold += item.quantity;
        } else {
          productMap.set(item.productId, {
            name: item.name || item.title || item.productId,
            revenue: item.price * item.quantity,
            unitsSold: item.quantity,
          });
        }
      }
    }
    const topProducts = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        id: productId,
        ...data,
        sales: data.unitsSold,
        price: Math.round(data.revenue / Math.max(data.unitsSold, 1)),
        views: 0, // not tracked per product yet
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ─── Status breakdown ────────────────────────────────────────────────────────
    const statusMap = new Map<string, number>();
    for (const order of orders) {
      statusMap.set(order.status, (statusMap.get(order.status) ?? 0) + 1);
    }
    const orderStatusBreakdown = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    // ─── Customer metrics ────────────────────────────────────────────────────────
    const customerSet = new Set<string>();
    const customerOrderCount = new Map<string, number>();
    for (const order of orders) {
      const uid = order.userId || order.buyerId;
      if (uid) {
        customerSet.add(uid);
        customerOrderCount.set(uid, (customerOrderCount.get(uid) ?? 0) + 1);
      }
    }
    const uniqueCustomers = customerSet.size;
    let repeatCount = 0;
    for (const count of customerOrderCount.values()) {
      if (count > 1) repeatCount++;
    }
    const returnedOrders = orders.filter(
      (o) => o.status === 'returned' || o.status === 'refunded',
    ).length;
    const returnRate = totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0;

    // ─── Revenue over time ───────────────────────────────────────────────────────
    const revenueOverTime = groupByDate(orders, sellerId, days);

    return {
      overview: {
        totalOrders,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        totalProducts,
        activeProducts,
        conversionRate: 0,
      },
      revenueOverTime,
      topProducts,
      orderStatusBreakdown,
      customerMetrics: {
        uniqueCustomers,
        repeatCustomers: repeatCount,
        returnRate: Math.round(returnRate * 10) / 10,
      },
      weeklyRevenue: Math.round((totalRevenue / days) * 7),
      // Views, conversion and trends are not measured yet: report 0, never invented numbers.
      revenueTrend: 0,
      totalOrders,
      orderTrend: 0,
      conversionRate: 0,
      conversionTrend: 0,
      totalViews: 0,
      viewsTrend: 0,
      dailyRevenue: revenueOverTime.map((d) => ({ date: d.date, value: d.revenue })),
      deviceBreakdown: [],
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'analytics');
    return emptyAnalytics(
      period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365,
    );
  }
}
