import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, BarChart3, Settings, LogOut, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/seller/inventory',  icon: Package,         label: 'Ürünlerim' },
  { path: '/seller/orders',     icon: ShoppingBag,     label: 'Siparişler' },
  { path: '/seller/finance',    icon: BarChart3,       label: 'Finans' },
  { path: '/seller/settings',   icon: Settings,        label: 'Mağaza Ayarları' },
];

export default function SellerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <aside className="w-[240px] flex-shrink-0 flex flex-col bg-zinc-900 border-r border-zinc-800">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-zinc-800">
          <Store size={20} className="text-emerald-400" />
          <span className="font-semibold text-sm">Satıcı Paneli</span>
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
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Çıkış Yap
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
