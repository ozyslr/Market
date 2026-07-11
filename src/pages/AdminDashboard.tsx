import React, { useState, useEffect } from 'react';
import {
  Users,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Shield,
  BarChart3,
  Globe,
  Zap,
  ArrowUpRight,
  Search,
  Filter,
  Database,
  Plus,
  Edit,
  Trash2,
  Star,
  X,
  ChevronRight,
  MoreVertical,
  Package,
  LayoutDashboard,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ArrowDownRight,
  CreditCard,
  Activity,
  Briefcase,
  MessageSquare,
  FileText,
  Percent,
  MousePointer2,
  Smartphone,
  Monitor,
  Laptop,
  Map,
  Globe2,
  Sparkles,
  Languages,
  Sun,
  Moon,
  Receipt,
  TicketPercent,
  FolderOpen,
  PieChart as PieIcon,
  ShoppingBasket,
  RefreshCcw,
  Megaphone,
  Tag,
  Newspaper,
  Scale,
  MessageCircle,
  Share2,
  Menu,
  Webhook,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { seedMarketplace } from '@/services/seedService';

import { AdminCMS } from './AdminCMS';
import { AdminUsers } from './AdminUsers';
import { AdminSellers } from './AdminSellers';
import { AdminLanguages } from './AdminLanguages';
import { AdminOrders } from './AdminOrders';
import { AdminPayments } from './AdminPayments';
import { AdminProducts } from './AdminProducts';
import { AdminReturns } from './AdminReturns';
import { AdminCoupons } from './AdminCoupons';
import { AdminReviews } from './AdminReviews';
import { AdminSettings } from './AdminSettings';
import { AdminFinance } from './AdminFinance';
import { AdminCampaigns } from './AdminCampaigns';
import { AdminDeals } from './AdminDeals';
import { AdminTiers } from './AdminTiers';
import { AdminReports } from './AdminReports';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminSupport } from './AdminSupport';
import { AdminChat } from './AdminChat';
import { AdminWebhooks } from './AdminWebhooks';
import { AdminAuditLog } from './AdminAuditLog';
import { AdminIntegrations } from './AdminIntegrations';

// --- FALLBACK CHART DATA (used only when Firestore data is unavailable) ---
const SALES_PERFORMANCE = [
  { day: '01 May', purple: 450000, green: 380000 },
  { day: '05 May', purple: 520000, green: 450000 },
  { day: '10 May', purple: 480000, green: 510000 },
  { day: '15 May', purple: 610000, green: 550000 },
  { day: '20 May', purple: 550000, green: 600000 },
  { day: '25 May', purple: 740000, green: 680000 },
  { day: '30 May', purple: 820000, green: 720000 },
];

// Fallback — real data computed from Firestore in useEffect
const ORDER_STATUS_DISTRIBUTION = [
  { name: 'Teslim Edilen', value: 12458, color: '#10B981' },
  { name: 'Kargoda', value: 3215, color: '#3B82F6' },
  { name: 'Hazırlanıyor', value: 1853, color: '#F59E0B' },
  { name: 'İptal/İade', value: 866, color: '#EF4444' },
];

// Fallback — real data computed from Firestore in useEffect
const SPARKLINE_DATA = [
  { v: 10 },
  { v: 25 },
  { v: 15 },
  { v: 45 },
  { v: 30 },
  { v: 60 },
  { v: 50 },
  { v: 80 },
];

const RECENT_ORDERS = [
  {
    id: '#TRND-84562',
    customer: 'Mehmet Kaya',
    product: 'iPhone 15 Pro 256GB',
    amount: '84.999 ₺',
    status: 'Kargoda',
    date: '30 May 2026',
  },
  {
    id: '#TRND-84561',
    customer: 'Ayşe Demir',
    product: 'Nike Air Max 270',
    amount: '4.299 ₺',
    status: 'Teslim Edildi',
    date: '30 May 2026',
  },
  {
    id: '#TRND-84560',
    customer: 'Ali Yılmaz',
    product: 'Samsung 65" 4K TV',
    amount: '28.999 ₺',
    status: 'Hazırlanıyor',
    date: '30 May 2026',
  },
  {
    id: '#TRND-84559',
    customer: 'Zeynep Çelik',
    product: 'MacBook Air M2',
    amount: '38.999 ₺',
    status: 'Kargoda',
    date: '30 May 2026',
  },
];

const TOP_SELLING = [
  {
    id: 1,
    name: 'iPhone 15 Pro 256GB',
    sales: '2.345 sipariş',
    price: '84.999 ₺',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=100&h=100&fit=crop',
  },
  {
    id: 2,
    name: 'Apple AirPods Pro 2',
    sales: '1.987 sipariş',
    price: '8.999 ₺',
    image: 'https://images.unsplash.com/photo-1627933611562-bdad39077974?w=100&h=100&fit=crop',
  },
  {
    id: 3,
    name: 'Nike Air Max 270',
    sales: '1.765 sipariş',
    price: '4.299 ₺',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
  },
];

// --- COMPONENTS ---

const KPICard = ({ label, value, trend, icon: Icon, color, bg }: any) => {
  const effectiveTrend = trend ?? 0;
  const isUp = effectiveTrend >= 0;
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-brand-primary/5 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40 dark:text-white/40 mb-2">
            {label}
          </p>
          <h3 className="text-2xl font-display font-black text-brand-primary dark:text-white tracking-tighter">
            {value}
          </h3>
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg',
            bg,
          )}
        >
          <Icon size={22} strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-[10px] font-black uppercase flex items-center gap-1',
              isUp ? 'text-green-500' : 'text-red-500',
            )}
          >
            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{' '}
            {Math.abs(effectiveTrend).toFixed(1)}%
          </span>
          <span className="text-[10px] font-bold text-brand-primary/20 dark:text-white/20 uppercase tracking-widest leading-none">
            Geçen Dönem
          </span>
        </div>
        <div className="h-8 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline.length > 0 ? sparkline : SPARKLINE_DATA}>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                fill={color}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ id, label, icon: Icon, active, onClick }: any) => (
  <button
    onClick={() => onClick(id)}
    className={cn(
      'w-full flex items-center gap-3.5 px-6 py-3.5 rounded-2xl transition-all duration-300 relative group',
      active
        ? 'bg-white/10 text-white shadow-xl shadow-black/20'
        : 'text-white/40 hover:text-white',
    )}
  >
    {active && (
      <motion.div
        layoutId="activeNav"
        className="absolute start-0 w-1 h-6 bg-accent rounded-full"
      />
    )}
    <Icon
      size={18}
      className={cn('transition-colors', active ? 'text-accent' : 'group-hover:text-white/60')}
    />
    <span className="text-[11px] font-black uppercase tracking-[0.1em]">{label}</span>
  </button>
);

export function AdminDashboard() {
  const { user, firebaseUser, login, adminRole } = useAuth();

  // Sub-role visibility map per CONTEXT D-ADM-01 section→role mapping.
  // super-admin sees everything (superset); null adminRole = nothing.
  const FINANCE_SECTIONS = new Set([
    'orders',
    'returns',
    'deals',
    'coupons',
    'payments',
    'finance',
    'reports',
    'analytics',
  ]);
  const SUPPORT_SECTIONS = new Set([
    'users',
    'sellers',
    'returns',
    'reviews',
    'livechat',
    'support',
    'audit',
  ]);
  const isSectionVisible = (sectionId: string): boolean => {
    // Effective role: null adminRole + admin user → super-admin (backward compat)
    const effectiveRole = adminRole ?? (user?.role === 'admin' ? 'super-admin' : null);
    if (effectiveRole === 'super-admin') return true;
    if (effectiveRole === 'finance')
      return sectionId === 'dashboard' || FINANCE_SECTIONS.has(sectionId);
    if (effectiveRole === 'support')
      return sectionId === 'dashboard' || SUPPORT_SECTIONS.has(sectionId);
    return sectionId === 'dashboard'; // fallback: only dashboard
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [realKpis, setRealKpis] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalSellers: 0,
  });
  const [realRevenue, setRealRevenue] = useState({ revenue: 0, completedOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [topProductsData, setTopProductsData] = useState<any[]>([]);
  const [recentOrdersData, setRecentOrdersData] = useState<any[]>([]);
  const [trends, setTrends] = useState({ revenue: 15.2, orders: 10.8, users: 5.4, sellers: -1.6 });
  const [salesPerformance, setSalesPerformance] = useState<
    { day: string; purple: number; green: number }[]
  >([]);
  const [orderStatusDist, setOrderStatusDist] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const [sparkline, setSparkline] = useState<{ v: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const {
          collection,
          getDocs,
          query,
          orderBy,
          limit: limitQ,
          getCountFromServer,
        } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const [uCount, pCount, oCount, sCount] = await Promise.all([
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(collection(db, 'products')),
          getCountFromServer(collection(db, 'orders')),
          getCountFromServer(collection(db, 'sellers')),
        ]);

        const totalUsers = uCount.data().count;
        const totalProducts = pCount.data().count;
        const totalOrders = oCount.data().count;
        const totalSellers = sCount.data().count;
        setRealKpis({ totalUsers, totalProducts, totalOrders, totalSellers });

        // Fetch limited order docs for revenue/trends/sales map
        // (capped at 1000 for performance; consider moving to Firestore aggregations at scale)
        const orderSnap = await getDocs(
          query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limitQ(1000)),
        );

        // Revenue & completed orders
        let revenue = 0,
          completedOrders = 0;
        orderSnap.forEach((d) => {
          const data = d.data();
          if (data.status === 'delivered' || data.status === 'completed') {
            revenue += data.total || data.totalAmount || 0;
            completedOrders++;
          }
        });
        setRealRevenue({ revenue, completedOrders });

        // Trend calculation (last 30d vs 30-60d ago)
        const now = Date.now();
        const t30 = new Date(now - 30 * 86400000).toISOString();
        const t60 = new Date(now - 60 * 86400000).toISOString();
        let recentOrd = 0,
          prevOrd = 0,
          recentRev = 0,
          prevRev = 0;
        orderSnap.forEach((d) => {
          const data = d.data();
          const ca = data.createdAt || '';
          if (ca >= t30) {
            recentOrd++;
            if (data.status === 'delivered' || data.status === 'completed')
              recentRev += data.total || data.totalAmount || 0;
          } else if (ca >= t60 && ca < t30) {
            prevOrd++;
            if (data.status === 'delivered' || data.status === 'completed')
              prevRev += data.total || data.totalAmount || 0;
          }
        });
        setTrends({
          revenue:
            prevRev > 0
              ? Math.round(((recentRev - prevRev) / prevRev) * 1000) / 10
              : recentRev > 0
                ? 100
                : 15.2,
          orders:
            prevOrd > 0
              ? Math.round(((recentOrd - prevOrd) / prevOrd) * 1000) / 10
              : recentOrd > 0
                ? 100
                : 10.8,
          users: totalUsers > 0 ? Math.round((totalUsers / (totalUsers + 1)) * 1000) / 10 : 5.4,
          sellers:
            totalSellers > 0 ? Math.round((totalSellers / (totalSellers + 1)) * 1000) / 10 : -1.6,
        });

        // Compute sales performance by day (last 7 days)
        const dayMap: Record<string, { revenue: number; orders: number }> = {};
        const statusMap: Record<string, number> = {};
        const dailyRev: number[] = [];
        orderSnap.forEach((d) => {
          const data = d.data();
          const ca = data.createdAt || '';
          const day = ca ? ca.slice(0, 10) : '';
          if (day) {
            const entry = dayMap[day] || { revenue: 0, orders: 0 };
            entry.revenue += data.total || data.totalAmount || 0;
            entry.orders += 1;
            dayMap[day] = entry;
          }
          const st = data.status || 'pending';
          statusMap[st] = (statusMap[st] || 0) + 1;
        });
        const sortedDays = Object.keys(dayMap).sort().slice(-7);
        setSalesPerformance(
          sortedDays.map((d) => ({
            day: `${d.slice(8)} ${['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][parseInt(d.slice(5, 7)) - 1]}`,
            purple: Math.round((dayMap[d].revenue || 0) / 1000),
            green: dayMap[d].orders,
          })),
        );
        setOrderStatusDist(
          Object.entries(statusMap)
            .map(([st, val]) => ({
              name:
                st === 'delivered'
                  ? 'Teslim Edilen'
                  : st === 'shipped'
                    ? 'Kargoda'
                    : st === 'preparing'
                      ? 'Hazırlanıyor'
                      : st === 'cancelled'
                        ? 'İptal/İade'
                        : st,
              value: val,
              color:
                st === 'delivered'
                  ? '#10B981'
                  : st === 'shipped'
                    ? '#3B82F6'
                    : st === 'preparing'
                      ? '#F59E0B'
                      : st === 'cancelled'
                        ? '#EF4444'
                        : '#8B5CF6',
            }))
            .sort((a, b) => b.value - a.value),
        );
        for (const d of sortedDays) {
          dailyRev.push(Math.round((dayMap[d]?.revenue || 0) / 1000));
        }
        setSparkline(
          dailyRev.length > 0 ? dailyRev.map((v) => ({ v })) : [{ v: 0 }, { v: 0 }, { v: 0 }],
        );

        // Build aggregate sales map from all orders
        const salesMap: Record<string, { count: number; revenue: number }> = {};
        orderSnap.forEach((orderDoc) => {
          const data = orderDoc.data();
          (data.items || []).forEach((item: any) => {
            if (!item.productId) return;
            const qty = item.quantity || 1;
            const rev = (item.price || 0) * qty;
            const cur = salesMap[item.productId] || { count: 0, revenue: 0 };
            salesMap[item.productId] = { count: cur.count + qty, revenue: cur.revenue + rev };
          });
        });

        // Top 5 products by rating
        const topQ = query(collection(db, 'products'), orderBy('rating', 'desc'), limitQ(5));
        const topSnap = await getDocs(topQ);
        setTopProductsData(
          topSnap.docs.map((d) => {
            const data = d.data();
            const s = salesMap[d.id] || { count: 0, revenue: 0 };
            return {
              id: d.id.slice(-4),
              name: data.title || 'Unknown',
              sales: `${s.count} satış`,
              price:
                s.revenue > 0
                  ? `${s.revenue.toLocaleString('tr-TR')} ₺`
                  : `${(data.price || 0).toLocaleString('tr-TR')} ₺`,
              image: data.images?.[0] || '',
              soldCount: s.count,
              totalRevenue: s.revenue,
            };
          }),
        );

        // Recent 5 orders
        const ordQ = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limitQ(5));
        const ordSnap = await getDocs(ordQ);
        setRecentOrdersData(
          ordSnap.docs.map((d) => {
            const data = d.data();
            const items = data.items || [];
            return {
              id: d.id,
              displayId: `#TRND-${d.id.slice(-5).toUpperCase()}`,
              customer: data.userEmail || data.buyerId || 'Unknown',
              product: items.length > 0 ? items[0].name || items[0].title || 'Ürün' : 'Ürün',
              amount: data.total ?? data.totalAmount ?? 0,
              amountFormatted: `${(data.total ?? data.totalAmount ?? 0).toLocaleString('tr-TR')} ${data.currency === 'TRY' || !data.currency ? '₺' : data.currency}`,
              status: data.status || 'pending',
              date: data.createdAt
                ? new Date(data.createdAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '',
            };
          }),
        );
      } catch (err) {
        console.error('[AdminDashboard] Firestore fetch failed, using mock fallback:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await seedMarketplace();
      setSeedResult(res.message);
    } catch (err: any) {
      setSeedResult(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
      setTimeout(() => setSeedResult(null), 5000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F8FA] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl border border-[#F8F8FA]">
          <div className="w-24 h-24 bg-accent/10 rounded-[2.5rem] flex items-center justify-center text-accent mx-auto mb-10 shadow-xl shadow-accent/10">
            <ShieldCheck size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-display font-black uppercase italic tracking-tighter text-brand-primary mb-4">
            Yönetim Paneli
          </h1>
          <p className="text-[11px] font-bold text-brand-primary/30 uppercase tracking-[0.2em] mb-12 leading-relaxed">
            Benim Olan yönetim sistemine erişmek için kimlik doğrulaması gereklidir.
          </p>
          <button
            onClick={login}
            className="w-full py-5 bg-brand-primary text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-black/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
          >
            Giriş Yap <Zap size={18} fill="currentColor" />
          </button>
        </div>
      </div>
    );
  }

  // Final gate for Admin Role (defense-in-depth — AdminRoute already checked)
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F8F8FA] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={64} className="text-red-500 mb-6" />
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-brand-primary">
          Access Denied
        </h2>
        <p className="text-brand-primary/40 text-xs font-bold uppercase tracking-widest mt-4">
          Your account does not have administrative clearance for this node.
        </p>
        <button className="mt-10 px-8 py-3 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
          Request Authorization
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F8FA] overflow-hidden text-brand-primary relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Apple/Shopify Modern Dark */}
      <aside
        className={cn(
          'fixed inset-y-0 start-0 lg:relative w-[300px] h-full bg-zinc-950 flex flex-col z-50 transition-transform duration-300 transform shrink-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="p-8 lg:p-10 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-black/40 group cursor-pointer overflow-hidden">
              <div className="w-full h-full bg-gradient-to-tr from-[#F9423A] to-yellow-500 flex items-center justify-center text-white">
                <Package size={20} className="lg:size-[24px]" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight leading-none">
                Benim Olan
              </h2>
              <p className="text-[8px] lg:text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mt-1">
                Yönetici Modülü
              </p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/40 p-2">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar-sidebar space-y-1">
          <SidebarItem
            id="dashboard"
            label="Özet Tablo"
            icon={LayoutDashboard}
            active={activeTab === 'dashboard'}
            onClick={setActiveTab}
          />
          {isSectionVisible('users') && (
            <SidebarItem
              id="users"
              label="Kullanıcılar"
              icon={Users}
              active={activeTab === 'users'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('sellers') && (
            <SidebarItem
              id="sellers"
              label="Satıcı Ortakları"
              icon={Briefcase}
              active={activeTab === 'sellers'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('products') && (
            <SidebarItem
              id="products"
              label="Ürün Kataloğu"
              icon={Package}
              active={activeTab === 'products'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('orders') && (
            <SidebarItem
              id="orders"
              label="Sipariş Merkezi"
              icon={ShoppingBag}
              active={activeTab === 'orders'}
              onClick={setActiveTab}
            />
          )}
          <div className="my-4 h-px bg-white/5 mx-6" />
          {isSectionVisible('returns') && (
            <SidebarItem
              id="returns"
              label="İade Talepleri"
              icon={RefreshCcw}
              active={activeTab === 'returns'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('campaigns') && (
            <SidebarItem
              id="campaigns"
              label="Kampanyalar"
              icon={Megaphone}
              active={activeTab === 'campaigns'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('deals') && (
            <SidebarItem
              id="deals"
              label="Fırsatı Yakala"
              icon={Zap}
              active={activeTab === 'deals'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('coupons') && (
            <SidebarItem
              id="coupons"
              label="Kupon & İndirim"
              icon={Tag}
              active={activeTab === 'coupons'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('tiers') && (
            <SidebarItem
              id="tiers"
              label="Satıcı Kademeleri"
              icon={Star}
              active={activeTab === 'tiers'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('cms') && (
            <SidebarItem
              id="cms"
              label="İçerik Stüdyosu"
              icon={Newspaper}
              active={activeTab === 'cms'}
              onClick={setActiveTab}
            />
          )}
          <div className="my-4 h-px bg-white/5 mx-6" />
          {isSectionVisible('payments') && (
            <SidebarItem
              id="payments"
              label="Ödeme Sistemleri"
              icon={CreditCard}
              active={activeTab === 'payments'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('finance') && (
            <SidebarItem
              id="finance"
              label="Finans Takibi"
              icon={CreditCard}
              active={activeTab === 'finance'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('reports') && (
            <SidebarItem
              id="reports"
              label="Satış Raporları"
              icon={BarChart3}
              active={activeTab === 'reports'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('analytics') && (
            <SidebarItem
              id="analytics"
              label="Analitik"
              icon={Activity}
              active={activeTab === 'analytics'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('reviews') && (
            <SidebarItem
              id="reviews"
              label="Ürün Değerlendirme"
              icon={Star}
              active={activeTab === 'reviews'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('livechat') && (
            <SidebarItem
              id="livechat"
              label="Sohbet"
              icon={MessageCircle}
              active={activeTab === 'livechat'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('support') && (
            <SidebarItem
              id="support"
              label="Destek Biletleri"
              icon={MessageSquare}
              active={activeTab === 'support'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('languages') && (
            <SidebarItem
              id="languages"
              label="Dil Yönetimi"
              icon={Languages}
              active={activeTab === 'languages'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('settings') && (
            <SidebarItem
              id="settings"
              label="Site Ayarları"
              icon={Settings}
              active={activeTab === 'settings'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('integrations') && (
            <SidebarItem
              id="integrations"
              label="Entegrasyonlar"
              icon={Share2}
              active={activeTab === 'integrations'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('webhooks') && (
            <SidebarItem
              id="webhooks"
              label="Webhook'lar"
              icon={Webhook}
              active={activeTab === 'webhooks'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('audit') && (
            <SidebarItem
              id="audit"
              label="Denetim Kaydı"
              icon={Shield}
              active={activeTab === 'audit'}
              onClick={setActiveTab}
            />
          )}
          {isSectionVisible('ai') && (
            <SidebarItem
              id="ai"
              label="Yapay Zeka Analizi"
              icon={Sparkles}
              active={activeTab === 'ai'}
              onClick={setActiveTab}
            />
          )}
        </nav>

        <div className="p-8">
          <div className="bg-white/5 rounded-[2rem] p-4 flex items-center gap-4 border border-white/5">
            <div className="w-10 h-10 rounded-full border-2 border-[#F9423A] p-0.5">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
                className="w-full h-full rounded-full bg-white/10"
                alt="Admin avatarı"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-white truncate">
                {user?.name || firebaseUser?.displayName || 'Admin'}
              </p>
              <p className="text-[9px] font-bold text-[#F9423A] uppercase tracking-widest">
                {user?.role === 'admin' ? 'Yönetici' : user?.role || 'Admin'}
              </p>
            </div>
            <button className="text-white/20 hover:text-[#F9423A] transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto no-scrollbar pt-16 lg:pt-0 bg-zinc-50 dark:bg-zinc-950">
        {/* Modern Header */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl px-4 lg:px-12 py-4 lg:py-6 flex items-center justify-between border-b border-brand-primary/5 dark:border-white/5 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-white rounded-xl shadow-sm border border-brand-primary/5 text-brand-primary"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-xl lg:text-3xl font-display font-black uppercase italic tracking-tight text-brand-primary dark:text-white">
                Genel{' '}
                <span className="text-[#F9423A] underline underline-offset-4 lg:underline-offset-8 decoration-2 lg:decoration-4">
                  Bakiş
                </span>
              </h1>
              <p className="text-[8px] lg:text-[10px] font-black text-brand-primary/30 dark:text-white/30 uppercase tracking-[0.2em] lg:tracking-[0.4em] mt-1 lg:mt-2">
                Core Matrix Düğümü
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative group">
              <Search
                className="absolute start-6 top-1/2 -translate-y-1/2 text-brand-primary/20 dark:text-white/20 group-focus-within:text-[#F9423A] transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Arama yapın... (⌘K)"
                className="w-full ps-16 pe-10 bg-zinc-50 dark:bg-zinc-900 border border-brand-primary/5 dark:border-white/5 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 ring-[#F9423A]/10 transition-all py-3 lg:py-3.5 lg:rounded-[1.5rem]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-8 border-s border-brand-primary/10 ps-4 lg:pl-8 shrink-0">
            <div className="hidden sm:flex items-center gap-4 text-brand-primary dark:text-white">
              <button className="p-3 opacity-30 hover:opacity-100 hover:text-[#F9423A] transition-all">
                <Sun size={20} strokeWidth={2.5} />
              </button>
              <button className="p-3 opacity-30 hover:opacity-100 hover:text-[#F9423A] transition-all relative">
                <Bell size={20} strokeWidth={2.5} />
                <span className="absolute top-2.5 end-2.5 w-4 h-4 bg-[#F9423A] text-[8px] font-black text-white rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950">
                  12
                </span>
              </button>
            </div>
            <button className="flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2.5 bg-white dark:bg-zinc-900 border border-brand-primary/5 dark:border-white/5 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest shadow-sm text-brand-primary dark:text-white">
              <Languages size={18} /> <span className="hidden xs:inline">TR</span>{' '}
              <ChevronRight size={14} className="opacity-30" />
            </button>
          </div>
        </header>

        {/* Dashboard Canvas */}
        <div className="p-4 md:p-8 lg:p-12 max-w-[1700px] mx-auto space-y-8 lg:space-y-12">
          {activeTab === 'cms' ? (
            <AdminCMS />
          ) : activeTab === 'users' ? (
            <AdminUsers />
          ) : activeTab === 'sellers' ? (
            <AdminSellers />
          ) : activeTab === 'languages' ? (
            <AdminLanguages />
          ) : activeTab === 'orders' ? (
            <AdminOrders />
          ) : activeTab === 'payments' ? (
            <AdminPayments />
          ) : activeTab === 'products' ? (
            <AdminProducts />
          ) : activeTab === 'returns' ? (
            <AdminReturns />
          ) : activeTab === 'coupons' ? (
            <AdminCoupons />
          ) : activeTab === 'reviews' ? (
            <AdminReviews />
          ) : activeTab === 'settings' ? (
            <AdminSettings />
          ) : activeTab === 'finance' ? (
            <AdminFinance />
          ) : activeTab === 'campaigns' ? (
            <AdminCampaigns />
          ) : activeTab === 'deals' ? (
            <AdminDeals />
          ) : activeTab === 'tiers' ? (
            <AdminTiers />
          ) : activeTab === 'reports' ? (
            <AdminReports />
          ) : activeTab === 'analytics' ? (
            <AdminAnalytics />
          ) : activeTab === 'support' ? (
            <AdminSupport />
          ) : activeTab === 'livechat' ? (
            <AdminChat />
          ) : activeTab === 'webhooks' ? (
            <AdminWebhooks />
          ) : activeTab === 'audit' ? (
            <AdminAuditLog />
          ) : activeTab === 'integrations' ? (
            <AdminIntegrations />
          ) : activeTab === 'ai' ? (
            <div className="p-8 text-center text-brand-primary/40">
              AI analiz paneli yapım aşamasında
            </div>
          ) : (
            <>
              {/* Loading indicator */}
              {loading && (
                <div className="flex items-center gap-4 mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#F9423A] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40">
                      Veriler yükleniyor...
                    </span>
                  </div>
                  <div className="flex-1 h-0.5 bg-brand-primary/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#F9423A] to-purple-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              )}
              {/* Top KPIs Row - Premium Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <KPICard
                  label="Toplam Satış Hacmi (GMV)"
                  value={`${realRevenue.revenue.toLocaleString('tr-TR')} ₺`}
                  trend={trends.revenue}
                  icon={CreditCard}
                  color="#F9423A"
                  bg="bg-gradient-to-tr from-[#F9423A] to-orange-500"
                />
                <KPICard
                  label="Tamamlanan Sipariş"
                  value={realRevenue.completedOrders.toLocaleString('tr-TR')}
                  trend={trends.orders}
                  icon={ShoppingBasket}
                  color="#10B981"
                  bg="bg-gradient-to-tr from-[#10B981] to-[#34D399]"
                />
                <KPICard
                  label="Toplam Kullanıcı"
                  value={realKpis.totalUsers.toLocaleString('tr-TR')}
                  trend={trends.users}
                  icon={Users}
                  color="#3B82F6"
                  bg="bg-gradient-to-tr from-[#3B82F6] to-[#60A5FA]"
                />
                <KPICard
                  label="Toplam Satıcı"
                  value={realKpis.totalSellers.toLocaleString('tr-TR')}
                  trend={trends.sellers}
                  icon={Briefcase}
                  color="#F59E0B"
                  bg="bg-gradient-to-tr from-[#F59E0B] to-[#FBBF24]"
                />
              </div>

              {/* Second Row: Large Analytics View */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
                {/* Sales Performance Line Chart */}
                <div className="lg:col-span-8 bg-white rounded-[2rem] lg:rounded-[3.5rem] p-6 lg:p-12 border border-[#F8F8FA] shadow-sm relative overflow-hidden group">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 lg:mb-12 gap-4">
                    <div>
                      <h3 className="text-xl lg:text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary">
                        Satış Performansı
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                      <div className="flex items-center gap-4 lg:gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#6D28D9]" />
                          <span className="text-[10px] font-black uppercase text-brand-primary/40 tracking-widest leading-none">
                            Toplam Satış
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                          <span className="text-[10px] font-black uppercase text-brand-primary/40 tracking-widest leading-none">
                            Komisyon Geliri
                          </span>
                        </div>
                      </div>
                      <select className="bg-[#F8F8FA] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border border-transparent focus:border-accent/10 transition-all">
                        <option>Bu Ay</option>
                        <option>Geçen Ay</option>
                      </select>
                    </div>
                  </div>

                  <div className="h-[400px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={salesPerformance.length > 0 ? salesPerformance : SALES_PERFORMANCE}
                      >
                        <defs>
                          <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6D28D9" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#6D28D9" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#1A1033"
                          strokeOpacity={0.03}
                        />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#1A1033', opacity: 0.3, fontWeight: 800 }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#1A1033', opacity: 0.3, fontWeight: 800 }}
                          tickFormatter={(v) => `₺${v / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1A1033',
                            borderRadius: '20px',
                            border: 'none',
                            padding: '15px',
                          }}
                          itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="purple"
                          stroke="#6D28D9"
                          strokeWidth={5}
                          fill="url(#purpleGradient)"
                          animationDuration={2000}
                        />
                        <Area
                          type="monotone"
                          dataKey="green"
                          stroke="#10B981"
                          strokeWidth={4}
                          fill="url(#greenGradient)"
                          animationDuration={2500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Order Status Donut Chart */}
                <div className="lg:col-span-4 bg-white rounded-[2rem] lg:rounded-[3.5rem] p-6 lg:p-12 border border-[#F8F8FA] shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl lg:text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary">
                      Sipariş Durumu
                    </h3>
                    <select className="bg-[#F8F8FA] px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none">
                      <option>Bu Ay</option>
                    </select>
                  </div>

                  <div className="flex-1 flex flex-col justify-center items-center py-6 lg:py-10 relative">
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-3xl lg:text-5xl font-display font-black text-brand-primary tracking-tighter">
                        18,392
                      </p>
                      <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/30 mt-1 lg:mt-2">
                        Toplam
                      </p>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={
                            orderStatusDist.length > 0 ? orderStatusDist : ORDER_STATUS_DISTRIBUTION
                          }
                          innerRadius={90}
                          outerRadius={120}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {(orderStatusDist.length > 0
                            ? orderStatusDist
                            : ORDER_STATUS_DISTRIBUTION
                          ).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-x-10 gap-y-6 mt-6">
                    {(orderStatusDist.length > 0 ? orderStatusDist : ORDER_STATUS_DISTRIBUTION).map(
                      (item, i) => (
                        <div key={i} className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-[10px] font-black uppercase text-brand-primary/40 tracking-widest leading-none">
                              {item.name}
                            </span>
                          </div>
                          <p className="text-sm font-black text-brand-primary ms-4.5">
                            {item.value.toLocaleString()}{' '}
                            <span className="text-[10px] text-brand-primary/30 font-bold">
                              ({Math.round((item.value / 18392) * 100)}%)
                            </span>
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Third Row: Metric Grid & Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Secondary Metrics Grid */}
                <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-5 gap-6">
                  {[
                    {
                      label: 'Aktif Kullanıcılar',
                      value: '7,846',
                      sub: 'Şu anda aktif',
                      icon: Users,
                      color: '#6D28D9',
                    },
                    {
                      label: 'Aktif Satıcılar',
                      value: '1,253',
                      sub: 'Şu anda aktif',
                      icon: ShoppingBasket,
                      color: '#10B981',
                    },
                    {
                      label: 'Stokta Olan Ürünler',
                      value: '32,457',
                      sub: 'Toplam ürün',
                      icon: Package,
                      color: '#3B82F6',
                    },
                    {
                      label: 'Bekleyen Onaylar',
                      value: '89',
                      sub: 'Ürün & satıcı',
                      icon: Clock,
                      color: '#F59E0B',
                    },
                    {
                      label: 'Destek Talepleri',
                      value: '23',
                      sub: 'Açık talepler',
                      icon: MessageCircle,
                      color: '#EF4444',
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-white p-8 rounded-[2.5rem] border border-[#F8F8FA] shadow-sm hover:shadow-xl transition-all group"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform',
                            'bg-[#F8F8FA]',
                          )}
                        >
                          <stat.icon
                            size={22}
                            className="text-brand-primary/20 group-hover:text-accent transition-colors"
                          />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/30 mb-2 leading-tight">
                          {stat.label}
                        </p>
                        <h4 className="text-2xl font-display font-black text-brand-primary tracking-tighter mb-1">
                          {stat.value}
                        </h4>
                        <p className="text-[8px] font-bold text-brand-primary/20 uppercase tracking-widest">
                          {stat.sub}
                        </p>
                        {/* Mini Chart Mock for metrics */}
                        <div className="w-full h-10 mt-6 opacity-30 group-hover:opacity-100 transition-opacity">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sparkline.length > 0 ? sparkline : SPARKLINE_DATA}>
                              <Bar dataKey="v" fill={stat.color} radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Son Aktiviteler - Premium Feed */}
                <div className="lg:col-span-4 bg-white rounded-[2rem] lg:rounded-[3.5rem] p-6 lg:p-12 border border-[#F8F8FA] shadow-sm flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8 lg:mb-10">
                    <h3 className="text-xl lg:text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary">
                      Son Aktiviteler
                    </h3>
                    <button className="text-[10px] font-black uppercase text-accent hover:underline">
                      Tümü →
                    </button>
                  </div>
                  <div className="flex-1 space-y-8 lg:space-y-10">
                    {[
                      {
                        icon: ShoppingBasket,
                        color: 'bg-green-100 text-green-600',
                        title: 'Yeni sipariş #MRC-84562',
                        desc: '₺2,599.00 tutarında sipariş oluşturuldu.',
                        time: '2 dakika önce',
                      },
                      {
                        icon: Users,
                        color: 'bg-blue-100 text-blue-600',
                        title: 'Yeni satıcı başvurusu',
                        desc: 'TechStore başvurusu onay bekliyor.',
                        time: '15 dakika önce',
                      },
                      {
                        icon: Package,
                        color: 'bg-purple-100 text-purple-600',
                        title: 'Ürün onaylandı',
                        desc: 'Kablosuz Kulaklık Pro ürünü onaylandı.',
                        time: '1 saat önce',
                      },
                      {
                        icon: RefreshCcw,
                        color: 'bg-red-100 text-red-600',
                        title: 'İade talebi',
                        desc: '#MRC-84510 siparişi için iade talebi.',
                        time: '2 saat önce',
                      },
                    ].map((activity, i) => (
                      <div
                        key={i}
                        className="flex gap-6 group cursor-pointer transition-transform hover:translate-x-1"
                      >
                        <div
                          className={cn(
                            'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm',
                            activity.color,
                          )}
                        >
                          <activity.icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h5 className="text-[13px] font-black text-brand-primary leading-none tracking-tight">
                              {activity.title}
                            </h5>
                            <span className="text-[9px] font-bold text-brand-primary/20 uppercase whitespace-nowrap ms-4">
                              {activity.time}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-brand-primary/40 leading-relaxed italic">
                            {activity.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-12 py-5 bg-[#F8F8FA] text-brand-primary/40 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-primary hover:text-white transition-all shadow-sm">
                    Tüm Aktiviteleri Görüntüle
                  </button>
                </div>
              </div>

              {/* Final Row: Recent Orders & Top Selling Products */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Son Siparişler Table */}
                <div className="lg:col-span-8 bg-white rounded-[2rem] lg:rounded-[4rem] border border-[#F8F8FA] shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 lg:p-12 lg:pb-8 border-b border-[#F8F8FA] flex items-center justify-between">
                    <h3 className="text-xl lg:text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary">
                      Son Siparişler
                    </h3>
                    <button className="text-[10px] font-black uppercase text-accent hover:underline">
                      Tümü →
                    </button>
                  </div>
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-start">
                      <thead>
                        <tr className="bg-[#F8F8FA] text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                          <th className="px-12 py-6">Sipariş ID</th>
                          <th className="px-10 py-6">Müşteri</th>
                          <th className="px-10 py-6">Ürün</th>
                          <th className="px-10 py-6">Tutar</th>
                          <th className="px-10 py-6 text-center">Durum</th>
                          <th className="px-12 py-6 text-end">Tarih</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {(recentOrdersData.length > 0 ? recentOrdersData : RECENT_ORDERS).map(
                          (order, i) => (
                            <tr
                              key={i}
                              className="border-b border-[#F8F8FA] last:border-0 hover:bg-[#F8F8FA]/50 transition-colors group cursor-pointer"
                              onClick={() => setActiveTab('orders')}
                            >
                              <td className="px-12 py-8">
                                <span className="font-mono font-black text-accent">
                                  {order.displayId || order.id}
                                </span>
                              </td>
                              <td className="px-10 py-8">
                                <p className="font-black text-brand-primary">{order.customer}</p>
                              </td>
                              <td className="px-10 py-8">
                                <p className="font-medium text-brand-primary/40 italic truncate max-w-[200px]">
                                  {order.product}
                                </p>
                              </td>
                              <td className="px-10 py-8 font-black text-brand-primary">
                                {order.amountFormatted || order.amount}
                              </td>
                              <td className="px-10 py-8 text-center">
                                <span
                                  className={cn(
                                    'px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest leading-none',
                                    order.status === 'delivered' || order.status === 'Teslim Edildi'
                                      ? 'bg-green-100 text-green-600'
                                      : order.status === 'shipped' || order.status === 'Kargoda'
                                        ? 'bg-blue-100 text-blue-600'
                                        : order.status === 'cancelled' ||
                                            order.status === 'refunded' ||
                                            order.status === 'İptal/İade'
                                          ? 'bg-red-100 text-red-600'
                                          : 'bg-orange-100 text-orange-600',
                                  )}
                                >
                                  {order.status === 'delivered' || order.status === 'Teslim Edildi'
                                    ? 'Teslim Edildi'
                                    : order.status === 'shipped' || order.status === 'Kargoda'
                                      ? 'Kargoda'
                                      : order.status === 'cancelled'
                                        ? 'İptal'
                                        : order.status === 'refunded'
                                          ? 'İade'
                                          : order.status === 'paid'
                                            ? 'Ödendi'
                                            : order.status === 'processing' ||
                                                order.status === 'Hazırlanıyor'
                                              ? 'Hazırlanıyor'
                                              : 'Hazırlanıyor'}
                                </span>
                              </td>
                              <td className="px-12 py-8 text-end font-black text-brand-primary/20">
                                {order.date}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* En Çok Satanlar & Quick Actions Panel Cluster */}
                <div className="lg:col-span-4 flex flex-col gap-10">
                  {/* Top Products */}
                  <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary">
                        En Çok Satan Ürünler
                      </h3>
                      <button className="text-[10px] font-black uppercase text-accent hover:underline">
                        Tümü →
                      </button>
                    </div>
                    <div className="space-y-8">
                      {(topProductsData.length > 0 ? topProductsData : TOP_SELLING).map(
                        (product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between group cursor-pointer hover:translate-x-2 transition-transform duration-300"
                          >
                            <div className="flex items-center gap-5">
                              <div className="w-16 h-16 bg-[#F8F8FA] rounded-[1.5rem] flex items-center justify-center relative overflow-hidden shadow-sm">
                                <img
                                  src={product.image}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  alt={product.name || 'Product'}
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                />
                                <div className="absolute top-0 end-0 w-6 h-6 bg-brand-primary rotate-45 translate-x-3 -translate-y-3" />
                                <span className="absolute top-1 start-2 text-[10px] font-black text-brand-primary">
                                  {product.id}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-brand-primary leading-none mb-2">
                                  {product.name}
                                </h4>
                                <p className="text-[10px] font-bold text-brand-primary/20 uppercase tracking-widest">
                                  {product.sales}
                                </p>
                              </div>
                            </div>
                            <div className="text-end">
                              <p className="text-sm font-black text-brand-primary">
                                {product.price}
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Hızlı İşlemler - Modern Minimal Grid */}
                  <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm flex-1">
                    <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary mb-10">
                      Hızlı İşlemler
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { icon: Plus, label: 'Ürün Ekle', color: 'accent' },
                        { icon: Users, label: 'Satıcı Ekle', color: 'blue-500' },
                        { icon: Megaphone, label: 'Kampanya Oluştur', color: 'purple-500' },
                        { icon: Tag, label: 'Kupon Oluştur', color: 'orange-500' },
                        {
                          id: 'reports',
                          icon: BarChart3,
                          label: 'Rapor Oluştur',
                          color: 'green-500',
                        },
                        {
                          id: 'seed',
                          icon: Database,
                          label: seeding ? 'Seeding...' : 'Seed Data',
                          color: 'pink-500',
                          onClick: handleSeed,
                        },
                      ].map((action: any, i) => (
                        <button
                          key={i}
                          onClick={action.onClick}
                          disabled={action.id === 'seed' && seeding}
                          className={cn(
                            'group bg-[#F8F8FA] p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:bg-brand-primary transition-all duration-500 shadow-sm border border-brand-primary/5',
                            action.id === 'seed' && seeding && 'opacity-50 cursor-not-allowed',
                          )}
                        >
                          <div
                            className={cn(
                              'w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow-sm group-hover:scale-110 transition-transform duration-500',
                              `text-accent`,
                            )}
                          >
                            <action.icon size={26} strokeWidth={2} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/40 group-hover:text-white transition-colors">
                            {action.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Overlay */}
              <AnimatePresence>
                {seedResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-12 end-12 z-50 bg-brand-primary text-white p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 min-w-[300px]"
                  >
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                      <Database size={20} />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-widest flex-1">
                      {seedResult}
                    </p>
                    <button onClick={() => setSeedResult(null)}>
                      <X size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Final Bottom Spacing & Disclaimer */}
              <div className="py-20 flex flex-col items-center justify-center text-center opacity-20 hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-[#F9423A] rounded-2xl flex items-center justify-center text-white mb-6">
                  <ShieldCheck size={24} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.5em] mb-2 leading-none">
                  Benim Olan
                </p>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]">
                  Admin Kontrol Paneli • 2026
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .custom-scrollbar-sidebar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-sidebar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .custom-scrollbar-sidebar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar-sidebar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `,
        }}
      />
    </div>
  );
}
