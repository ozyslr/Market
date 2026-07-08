import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
  Store,
  Home,
  FileUp,
  Loader2,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Activity,
  Ticket,
  Trophy,
  FileText,
  Target,
  Key,
  MessageSquare,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Seller } from '../../types';

const navItems = [
  { path: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/seller/inventory', icon: Package, label: 'Ürünlerim' },
  { path: '/seller/orders', icon: ShoppingBag, label: 'Siparişler' },
  { path: '/seller/messages', icon: MessageSquare, label: 'Mesajlar' },
  { path: '/seller/analytics', icon: Activity, label: 'Analitik' },
  { path: '/seller/finance', icon: BarChart3, label: 'Finans' },
  { path: '/seller/settings', icon: Settings, label: 'Mağaza Ayarları' },
  { path: '/seller/import', icon: FileUp, label: 'Import Center' },
  { path: '/seller/pricing', icon: TrendingUp, label: 'Fiyatlandırma' },
  { path: '/seller/certificates', icon: ShieldCheck, label: 'Sertifikalar' },
  { path: '/seller/coupons', icon: Ticket, label: 'Kuponlarım' },
  { path: '/seller/performance', icon: Trophy, label: 'Performans' },
  { path: '/seller/invoices', icon: FileText, label: 'E-Fatura' },
  { path: '/seller/price-analysis', icon: Target, label: 'Fiyat Analizi' },
  { path: '/seller/api-keys', icon: Key, label: 'API Anahtarları' },
];

type KycStatus = 'loading' | 'none' | 'pending' | 'verified' | 'rejected';

export default function SellerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sellerStatus, setSellerStatus] = useState<KycStatus>('loading');

  // Defense-in-depth: redirect non-seller users away
  if (user && user.role !== 'seller') {
    return (
      <Navigate
        to="/sell"
        replace
        state={{ notice: 'Satıcı paneline erişmek için satıcı olmalısınız.' }}
      />
    );
  }

  useEffect(() => {
    if (!user?.id) return;
    getDoc(doc(db, 'sellers', user.id))
      .then((snap) => {
        if (!snap.exists()) {
          setSellerStatus('none');
        } else {
          const data = snap.data() as Seller;
          if (data.kycStatus === 'verified') setSellerStatus('verified');
          else if (data.kycStatus === 'pending') setSellerStatus('pending');
          else setSellerStatus('rejected');
        }
      })
      .catch(() => setSellerStatus('none'));
  }, [user?.id]);

  if (sellerStatus === 'loading') {
    return (
      <div className="flex h-screen bg-zinc-950 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-emerald-400" />
      </div>
    );
  }

  if (sellerStatus === 'none') {
    return (
      <div className="flex h-screen bg-zinc-950 items-center justify-center text-center px-6">
        <div className="max-w-md space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 flex items-center justify-center mx-auto">
            <AlertTriangle size={32} className="text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('seller.guard.applicationRequired')}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {t('seller.guard.applicationRequiredDesc')}
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/sell"
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-colors"
            >
              {t('seller.guard.applyNow')}
            </Link>
            <Link
              to="/"
              className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-semibold text-sm hover:bg-zinc-700 transition-colors"
            >
              {t('seller.guard.goHome')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (sellerStatus === 'pending') {
    return (
      <div className="flex h-screen bg-zinc-950 items-center justify-center text-center px-6">
        <div className="max-w-md space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-400/10 flex items-center justify-center mx-auto">
            <Clock size={32} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('seller.guard.pending')}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">{t('seller.guard.pendingDesc')}</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-semibold text-sm hover:bg-zinc-700 transition-colors"
          >
            {t('seller.guard.goHome')}
          </Link>
        </div>
      </div>
    );
  }

  if (sellerStatus === 'rejected') {
    return (
      <div className="flex h-screen bg-zinc-950 items-center justify-center text-center px-6">
        <div className="max-w-md space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-400/10 flex items-center justify-center mx-auto">
            <XCircle size={32} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">{t('seller.guard.rejected')}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">{t('seller.guard.rejectedDesc')}</p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/sell"
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-colors"
            >
              {t('seller.guard.reapply')}
            </Link>
            <Link
              to="/"
              className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-semibold text-sm hover:bg-zinc-700 transition-colors"
            >
              {t('seller.guard.goHome')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <aside
        role="navigation"
        aria-label="Satıcı paneli navigasyonu"
        className="w-[240px] flex-shrink-0 flex flex-col bg-zinc-900 border-e border-zinc-800"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Store size={18} className="text-emerald-400" />
            <span className="font-semibold text-sm">Satıcı Paneli</span>
          </div>
          <Link
            to="/"
            title="Ana Sayfa"
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <Home size={16} />
          </Link>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-zinc-800 px-3 py-3 space-y-1">
          <div className="px-3 py-2 text-xs text-zinc-500 truncate">{user?.email}</div>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Çıkış Yap
          </button>
        </div>
      </aside>
      <main id="seller-main-content" className="flex-1 overflow-auto" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
