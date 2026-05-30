import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Package, ShoppingCart, BarChart3, Globe2, 
  Settings, Bell, Search, TrendingUp, Info, AlertTriangle, 
  ChevronRight, ArrowUpRight, DollarSign, Users, Sparkles, ShieldCheck,
  Upload, FileText, CheckCircle2, X, Zap, LogOut, ArrowDownRight,
  Activity, CreditCard, MessageSquare, Briefcase, RefreshCcw,
  ShoppingBasket, Smartphone, Monitor, Laptop, Globe, Megaphone, Plus, Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '@/store/useOrderStore';
import { useProductStore } from '@/store/useProductStore';
import { usePayoutStore, COMMISSION_RATE, MIN_PAYOUT, PayoutStatus } from '@/store/usePayoutStore';

// --- MOCK DATA FOR CHARTS (Since we don't have historical timeline data in stores yet) ---
const REVENUE_DATA = [
  { name: 'Pzt', value: 1200 },
  { name: 'Sal', value: 2500 },
  { name: 'Çar', value: 1800 },
  { name: 'Per', value: 4200 },
  { name: 'Cum', value: 3100 },
  { name: 'Cmt', value: 5400 },
  { name: 'Paz', value: 6800 },
];

const SPARKLINE_DATA = [
  { v: 10 }, { v: 25 }, { v: 15 }, { v: 45 }, { v: 30 }, { v: 60 }, { v: 50 }, { v: 75 }, { v: 65 }
];

// --- COMPONENTS ---

const KPICard = ({ label, value, growth, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-[#F8F8FA] shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
    <div className="flex justify-between items-start mb-8">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", bg)}>
        <Icon size={26} strokeWidth={2.5} />
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A1033]/30 mb-1">{label}</p>
        <h3 className="text-3xl font-display font-black text-[#1A1033] tracking-tighter leading-none">{value}</h3>
      </div>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5 font-black text-[10px] uppercase">
        <span className={cn(growth.startsWith('+') ? "text-green-500" : "text-red-500")}>
           {growth.startsWith('+') ? <ArrowUpRight size={14} className="inline mr-1" /> : <ArrowDownRight size={14} className="inline mr-1" />}
           {growth}
        </span>
        <span className="text-[#1A1033]/20 tracking-widest whitespace-nowrap">Geçen Haftaya Göre</span>
      </div>
      <div className="h-8 w-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={SPARKLINE_DATA}>
            <Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

const SidebarItem = ({ id, label, icon: Icon, active, onClick }: any) => (
  <button
    onClick={() => onClick(id)}
    className={cn(
      "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 relative group",
      active ? "bg-white/10 text-white shadow-xl shadow-black/20" : "text-white/40 hover:text-white"
    )}
  >
    {active && <motion.div layoutId="activeSellerNav" className="absolute left-0 w-1 h-6 bg-accent rounded-full" />}
    <Icon size={20} className={cn("transition-colors", active ? "text-accent" : "group-hover:text-white/60")} />
    <span className="text-[11px] font-black uppercase tracking-[0.15em]">{label}</span>
  </button>
);

export function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Load Real Data
  const { orders, fetchOrders } = useOrderStore();
  const { products, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [fetchOrders, fetchProducts]);

  // Calculate Real Stats
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrdersCount = orders.length;
  // Calculate average order value (AOV) or mock conversion rate
  const conversionRate = totalOrdersCount > 0 ? ((totalOrdersCount / 1250) * 100).toFixed(2) : "0.00";
  const storeRating = "9.8"; // This would normally come from reviews collection

  // --- Payout / Finance ---
  const { bankAccount, requests, error: payoutError, setBankAccount, getAvailableBalance, requestPayout } = usePayoutStore();
  const availableBalance = getAvailableBalance(totalRevenue);
  const commissionAmount = totalRevenue * COMMISSION_RATE;
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankForm, setBankForm] = useState({ holder: '', iban: '', bankName: '' });
  const [editingBank, setEditingBank] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.holder.trim() || !bankForm.iban.trim() || !bankForm.bankName.trim()) return;
    setBankAccount(bankForm);
    setEditingBank(false);
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount)) return;
    if (requestPayout(amount, totalRevenue)) {
      setWithdrawAmount('');
      setPayoutSuccess(true);
      setTimeout(() => setPayoutSuccess(false), 3000);
    }
  };

  const PAYOUT_STATUS_META: Record<PayoutStatus, { label: string; cls: string }> = {
    pending: { label: 'Beklemede', cls: 'bg-amber-100 text-amber-700' },
    processing: { label: 'İşleniyor', cls: 'bg-blue-100 text-blue-700' },
    paid: { label: 'Ödendi', cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'Reddedildi', cls: 'bg-red-100 text-red-700' },
  };

  const handleTabClick = (id: string) => {
    if (id === 'inventory') {
      navigate('/seller/inventory');
    } else if (id === 'orders') {
      navigate('/seller/orders');
    } else {
      setActiveTab(id);
    }
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsUploading(false), 1000);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const navItems = [
    { id: 'dashboard', label: 'Monitör', icon: LayoutDashboard },
    { id: 'inventory', label: 'Envanter', icon: Package },
    { id: 'bulk', label: 'Toplu Yükleme', icon: Upload },
    { id: 'finance', label: 'Finans Merkezi', icon: CreditCard },
    { id: 'promotions', label: 'Büyüme', icon: Megaphone },
    { id: 'ai', label: 'Yapay Zeka', icon: Sparkles },
    { id: 'orders', label: 'Siparişler', icon: ShoppingBasket },
    { id: 'support', label: 'Destek', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-[#F8F8FA] overflow-hidden text-[#1A1033] relative">
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

      {/* Sidebar - Consistent with Admin Dashboard */}
      <aside className={cn(
        "fixed inset-y-0 left-0 lg:relative w-[300px] h-full bg-zinc-950 flex flex-col z-50 transition-transform duration-300 transform shrink-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-8 lg:p-10 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-black/40 group cursor-pointer overflow-hidden">
                <div className="w-full h-full bg-gradient-to-tr from-[#F9423A] to-yellow-500 flex items-center justify-center text-white">
                  <Briefcase size={20} className="lg:size-[24px]" strokeWidth={2.5} />
                </div>
             </div>
             <div>
                <h2 className="text-xl lg:text-2xl font-display font-black text-white italic tracking-tighter leading-none">Mercora</h2>
                <p className="text-[8px] lg:text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mt-1">Satıcı Merkezi</p>
             </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/40 p-2">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-6 overflow-y-auto custom-scrollbar-sidebar space-y-1.5">
          {navItems.map((item) => (
             <SidebarItem key={item.id} id={item.id} label={item.label} icon={item.icon} active={activeTab === item.id} onClick={handleTabClick} />
          ))}
        </nav>

        <div className="p-10 pr-6">
           <div className="bg-white/5 rounded-[2.5rem] p-5 flex items-center gap-4 border border-white/5">
              <div className="w-11 h-11 rounded-full border-2 border-[#F9423A] p-0.5 shrink-0">
                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Seller" className="w-full h-full rounded-full bg-white/10" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-[12px] font-black text-white truncate">Mercora Partneri</p>
                 <p className="text-[9px] font-bold text-green-400 uppercase tracking-widest">Premium Satıcı</p>
              </div>
              <button className="text-white/20 hover:text-[#F9423A] transition-colors p-2">
                 <LogOut size={16} />
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto no-scrollbar pt-16 lg:pt-0 bg-zinc-50 dark:bg-zinc-950">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl px-4 lg:px-12 py-4 lg:py-6 flex items-center justify-between border-b border-brand-primary/5 dark:border-white/5 gap-4">
           <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-brand-primary/5 dark:border-white/5 text-brand-primary dark:text-white">
                <Menu size={20} />
              </button>
              <div className="hidden sm:block">
                <h1 className="text-xl lg:text-3xl font-display font-black uppercase italic tracking-tight text-brand-primary dark:text-white">Mağaza <span className="text-[#F9423A] underline underline-offset-4 lg:underline-offset-8 decoration-2 lg:decoration-4">Performansı</span></h1>
                <p className="text-[8px] lg:text-[10px] font-black text-brand-primary/30 dark:text-white/30 uppercase tracking-[0.2em] lg:tracking-[0.4em] mt-1 lg:mt-2">Genel Satış ve Operasyonlar</p>
              </div>
           </div>

           <div className="flex-1 max-w-xl hidden md:block">
              <div className="relative group">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-primary/20 dark:text-white/20 group-focus-within:text-[#F9423A] transition-colors" size={18} />
                 <input 
                   type="text" 
                   placeholder="Ürün, Sipariş veya SKU Ara..." 
                   className="w-full pl-16 pr-10 py-3 bg-zinc-50 dark:bg-zinc-900 border border-brand-primary/5 dark:border-white/5 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 ring-[#F9423A]/10 transition-all lg:py-4 lg:rounded-[1.75rem] text-brand-primary dark:text-white"
                 />
              </div>
           </div>
           
           <div className="flex items-center gap-2 lg:gap-8 border-l border-brand-primary/10 pl-4 lg:pl-8 shrink-0">
              <button className="p-2 lg:p-3.5 text-brand-primary/30 dark:text-white/30 hover:text-[#F9423A] transition-all bg-white dark:bg-zinc-900 border border-brand-primary/5 dark:border-white/5 rounded-xl lg:rounded-2xl shadow-sm"><Bell className="w-5 h-5 lg:w-[22px] lg:h-[22px]" strokeWidth={2.5} /></button>
              <button 
                onClick={() => navigate('/seller/products/new')}
                className="px-4 py-2 lg:px-8 lg:py-4 bg-[#F9423A] text-white rounded-xl lg:rounded-[1.5rem] text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#F9423A]/20 hover:scale-105 transition-all flex items-center gap-2 lg:gap-3 hover:bg-orange-600"
              >
                 <span className="hidden xs:inline">Yeni Ürün Ekle</span> <Plus size={16} />
              </button>
           </div>
        </header>

        {/* Dynamic Content Canvas */}
        <div className="p-4 md:p-8 lg:p-12 max-w-[1700px] mx-auto space-y-8 lg:space-y-12 pb-32">
           
           <AnimatePresence mode="wait">
             {activeTab === 'dashboard' ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-12"
                >
                  {/* KPI Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <KPICard label="Toplam Ciro" value={`₺${totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`} growth="+14.5%" icon={DollarSign} color="#F9423A" bg="bg-gradient-to-tr from-[#F9423A] to-orange-500" />
                    <KPICard label="Toplam Sipariş" value={totalOrdersCount.toString()} growth="+8.2%" icon={ShoppingCart} color="#10B981" bg="bg-gradient-to-tr from-[#10B981] to-emerald-400" />
                    <KPICard label="Dönüşüm Oranı" value={`%${conversionRate}`} growth="-1.2%" icon={Activity} color="#3B82F6" bg="bg-gradient-to-tr from-[#3B82F6] to-blue-400" />
                    <KPICard label="Mağaza Puanı" value={storeRating} growth="+0.5%" icon={ShieldCheck} color="#F59E0B" bg="bg-gradient-to-tr from-[#F59E0B] to-orange-400" />
                  </div>

                  {/* Main Analytics Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-[4rem] p-12 border border-brand-primary/5 dark:border-white/5 shadow-sm group">
                       <div className="flex items-center justify-between mb-12">
                          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary dark:text-white">Satış Performansı</h3>
                          <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded-2xl border border-brand-primary/5 dark:border-white/5">
                             {['7G', '14G', '30G'].map(p => (
                                <button key={p} className={cn(
                                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                  p === '7G' ? "bg-white dark:bg-zinc-800 text-[#F9423A] shadow-sm" : "text-brand-primary/30 dark:text-white/30 hover:text-[#F9423A]"
                                )}>{p}</button>
                             ))}
                          </div>
                       </div>
                       <div className="h-[420px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={REVENUE_DATA}>
                                <defs>
                                  <linearGradient id="purpleG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F9423A" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#F9423A" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1033" strokeOpacity={0.03} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#1A1033', opacity: 0.3, fontWeight: 800 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#1A1033', opacity: 0.3, fontWeight: 800 }} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#1A1033', borderRadius: '24px', border: 'none', padding: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#F9423A" strokeWidth={5} fill="url(#purpleG)" animationDuration={2000} />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-10">
                       <div className="bg-[#1A1033] rounded-[3.5rem] p-12 text-white relative overflow-hidden group">
                          <Globe size={300} className="absolute -bottom-20 -right-20 text-white/5 opacity-40 group-hover:scale-125 transition-transform duration-1000 pointer-events-none" />
                          <h3 className="text-2xl font-display font-black uppercase italic mb-10 relative z-10">Bölgesel Dağılım</h3>
                          <div className="space-y-10 relative z-10">
                             {[
                               { name: 'Marmara Bölgesi', val: 94, status: 'Zirve' },
                               { name: 'Ege Bölgesi', val: 88, status: 'Optimum' },
                               { name: 'İç Anadolu', val: 45, status: 'Gelişen' },
                             ].map((node, i) => (
                               <div key={i} className="space-y-4">
                                  <div className="flex justify-between items-baseline text-[11px] font-black uppercase tracking-widest text-white/40">
                                     <span>{node.name}</span>
                                     <span className="text-white">{node.status}</span>
                                  </div>
                                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                     <motion.div 
                                       initial={{ width: 0 }}
                                       animate={{ width: `${node.val}%` }}
                                       transition={{ duration: 1.5, delay: i * 0.2 }}
                                       className={cn("h-full rounded-full", node.val > 0 ? "bg-[#F9423A]" : "bg-white/10")} 
                                     />
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="bg-accent rounded-[3.5rem] p-12 text-white shadow-2xl shadow-accent/20 flex-1 flex flex-col relative group">
                          <DollarSign size={120} className="absolute -bottom-10 -right-10 text-white/10 group-hover:rotate-12 transition-transform duration-700" />
                          <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60 mb-8 italic">Çekilebilir Bakiye</p>
                          <h4 className="text-5xl font-display font-black tracking-tighter mb-4">₺{availableBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h4>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest italic">Hazır Bakiye (%15 Komisyon Kesilmiştir)</p>
                          <button onClick={() => setActiveTab('finance')} className="w-full mt-auto py-5 bg-white text-[#1A1033] rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all">Para Çek</button>
                       </div>
                    </div>
                  </div>

                  {/* Market Intelligence Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                     {[
                       { icon: TrendingUp, label: 'Trend Analizi', title: 'Elektronik Yükselişte', desc: 'Son 24 saatte bölgenizdeki bilgisayar bileşenleri aramaları %245 arttı.', color: 'text-accent' },
                       { icon: ShieldCheck, label: 'Güvenlik', title: 'Kimlik Doğrulaması', desc: 'Premium satıcı doğrulamanız başarıyla tamamlandı. Rozetiniz aktif.', color: 'text-blue-500' },
                       { icon: Zap, label: 'Sistem Durumu', title: 'Kesintisiz Senkronizasyon', desc: 'Ürün kataloğunuz tüm global veri merkezlerine anında iletiliyor.', color: 'text-green-500' },
                     ].map((item, i) => (
                       <div key={i} className="bg-white p-10 rounded-[3rem] border border-[#F8F8FA] shadow-sm hover:shadow-xl transition-all group">
                          <div className={cn("w-14 h-14 rounded-2xl bg-[#F8F8FA] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform", item.color)}>
                             <item.icon size={26} strokeWidth={2.5} />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/20 mb-3 italic">{item.label}</p>
                          <h5 className="text-xl font-display font-black text-[#1A1033] mb-4 uppercase tracking-tight">{item.title}</h5>
                          <p className="text-[13px] font-medium text-[#1A1033]/40 italic leading-relaxed">{item.desc}</p>
                       </div>
                     ))}
                  </div>
                </motion.div>
             ) : activeTab === 'bulk' ? (
                <motion.div
                  key="bulk"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-12"
                >
                  <div className="bg-white rounded-[4rem] p-16 border-2 border-dashed border-[#1A1033]/5 min-h-[500px] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                     {isUploading ? (
                       <div className="w-full max-w-md space-y-10 scale-110">
                          <div className="flex justify-between items-end">
                             <div>
                                <p className="text-xs font-black uppercase text-[#1A1033]/50 text-left">İşleniyor</p>
                                <p className="text-[10px] font-bold text-[#1A1033]/30 italic text-left mt-1">Urun_Katalogu_2026.csv</p>
                             </div>
                             <p className="text-4xl font-display font-black text-accent tracking-tighter">{uploadProgress}%</p>
                          </div>
                          <div className="h-2 w-full bg-[#F8F8FA] rounded-full overflow-hidden shadow-inner">
                             <motion.div 
                               className="h-full bg-accent" 
                               initial={{ width: 0 }}
                               animate={{ width: `${uploadProgress}%` }}
                             />
                          </div>
                          <div className="flex items-center justify-center gap-3 text-accent animate-pulse">
                             <Sparkles size={18} />
                             <span className="text-[11px] font-black uppercase tracking-[0.3em]">Yapay Zeka Etiketliyor...</span>
                          </div>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center">
                          <div className="w-28 h-28 bg-accent/5 rounded-[3rem] flex items-center justify-center text-accent mb-12 shadow-2xl shadow-accent/5">
                             <Upload size={48} strokeWidth={1.5} />
                          </div>
                          <h2 className="text-4xl font-display font-black uppercase italic tracking-tighter text-[#1A1033] mb-6">Toplu Yükleme</h2>
                          <p className="max-w-md text-[#1A1033]/40 text-sm font-medium italic leading-relaxed mb-12">
                             XML veya CSV formatında ürün verilerinizi buraya sürükleyin. Yapay zeka sistemimiz otomatik olarak kategori eşleştirmesi, SEO ayarları ve eksik bilgi tamamlama işlemlerini yapacaktır.
                          </p>
                          <button 
                             onClick={simulateUpload}
                             className="px-16 py-6 bg-[#1A1033] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-black/30 hover:bg-accent hover:scale-105 transition-all"
                          >
                             Dosya Seç
                          </button>
                       </div>
                     )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="bg-[#1A1033] rounded-[3.5rem] p-12 text-white relative overflow-hidden group">
                        <Sparkles size={160} className="absolute -bottom-20 -left-20 text-white/5 opacity-50 group-hover:scale-125 transition-transform duration-1000" />
                        <h4 className="text-2xl font-display font-black uppercase italic mb-6 relative z-10">Otomatik Yapay Zeka Çevirisi</h4>
                        <p className="text-white/50 text-sm leading-relaxed italic mb-10 relative z-10">Sistemimiz Türkçe girdiğiniz tüm ürün açıklamalarını otomatik olarak 12 farklı global dile çevirir ve doğru bölgesel SEO anahtar kelimelerini yerleştirir.</p>
                        <button className="px-8 py-4 bg-white/5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 relative z-10">Detayları Gör</button>
                     </div>
                     <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm relative overflow-hidden group">
                        <Package size={160} className="absolute -bottom-20 -right-20 text-[#1A1033]/5 group-hover:scale-125 transition-transform duration-1000" />
                        <h4 className="text-2xl font-display font-black uppercase italic mb-6 text-[#1A1033]">Depo Senkronizasyonu</h4>
                        <div className="grid grid-cols-2 gap-8 relative z-10">
                           <div>
                              <p className="text-[10px] font-black text-[#1A1033]/30 uppercase tracking-widest mb-1">Kapasite</p>
                              <p className="text-2xl font-display font-black text-[#1A1033]">50,000 SKU</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-[#1A1033]/30 uppercase tracking-widest mb-1">Günlük Limit</p>
                              <p className="text-2xl font-display font-black text-accent">Sınırsız</p>
                           </div>
                        </div>
                     </div>
                  </div>
                </motion.div>
             ) : activeTab === 'finance' ? (
                <motion.div
                  key="finance"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10"
                >
                  {/* Finance KPI Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-accent rounded-[3rem] p-10 text-white shadow-2xl shadow-accent/20 relative overflow-hidden group">
                       <DollarSign size={120} className="absolute -bottom-8 -right-8 text-white/10 group-hover:rotate-12 transition-transform duration-700" />
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-4 italic">Çekilebilir Bakiye</p>
                       <h4 className="text-4xl font-display font-black tracking-tighter">₺{availableBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h4>
                    </div>
                    <div className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm">
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-4 italic">Brüt Ciro</p>
                       <h4 className="text-4xl font-display font-black tracking-tighter text-[#1A1033]">₺{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h4>
                    </div>
                    <div className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm">
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-4 italic">Komisyon (%{(COMMISSION_RATE * 100).toFixed(0)})</p>
                       <h4 className="text-4xl font-display font-black tracking-tighter text-red-500">-₺{commissionAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Bank Account */}
                    <div className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm">
                       <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center"><CreditCard size={24} /></div>
                          <h3 className="text-xl font-display font-black uppercase tracking-tight text-[#1A1033]">Banka Hesabı</h3>
                       </div>
                       {bankAccount && !editingBank ? (
                          <div className="space-y-4">
                             <div className="bg-[#F8F8FA] rounded-2xl p-6 space-y-3">
                                <div className="flex justify-between text-sm"><span className="text-[#1A1033]/40 font-bold">Hesap Sahibi</span><span className="font-black text-[#1A1033]">{bankAccount.holder}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-[#1A1033]/40 font-bold">Banka</span><span className="font-black text-[#1A1033]">{bankAccount.bankName}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-[#1A1033]/40 font-bold">IBAN</span><span className="font-black text-[#1A1033] tracking-wider">{bankAccount.iban}</span></div>
                             </div>
                             <button onClick={() => { setBankForm(bankAccount); setEditingBank(true); }} className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline">Düzenle</button>
                          </div>
                       ) : (
                          <form onSubmit={handleSaveBank} className="space-y-4">
                             <input value={bankForm.holder} onChange={(e) => setBankForm({ ...bankForm, holder: e.target.value })} placeholder="Hesap Sahibi" className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                             <input value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} placeholder="Banka Adı" className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                             <input value={bankForm.iban} onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })} placeholder="TR00 0000 0000 0000 0000 0000 00" className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold border border-transparent focus:border-accent/20 outline-none" />
                             <button type="submit" className="w-full py-3.5 bg-[#1A1033] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-[1.02] transition-transform">Hesabı Kaydet</button>
                          </form>
                       )}
                    </div>

                    {/* Withdraw */}
                    <div className="bg-[#1A1033] rounded-[3rem] p-10 text-white relative overflow-hidden">
                       <h3 className="text-xl font-display font-black uppercase tracking-tight mb-2">Para Çek</h3>
                       <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-8 italic">Minimum {MIN_PAYOUT}₺ · IBAN'ınıza aktarılır</p>
                       <form onSubmit={handleWithdraw} className="space-y-4">
                          <div className="relative">
                             <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 font-black">₺</span>
                             <input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} type="number" min={0} step="0.01" placeholder="0,00" className="w-full pl-10 pr-4 py-4 bg-white/5 rounded-2xl text-lg font-black border border-white/10 focus:border-accent outline-none text-white placeholder:text-white/20" />
                          </div>
                          <button type="button" onClick={() => setWithdrawAmount(availableBalance.toFixed(2))} className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline">Tümünü Çek (₺{availableBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })})</button>
                          {payoutError && <p className="text-[11px] font-bold text-red-400 flex items-center gap-2"><AlertTriangle size={14} /> {payoutError}</p>}
                          {payoutSuccess && <p className="text-[11px] font-bold text-green-400 flex items-center gap-2"><CheckCircle2 size={14} /> Çekim talebiniz alındı.</p>}
                          <button type="submit" className="w-full py-4 bg-accent text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform">Çekim Talebi Oluştur</button>
                       </form>
                    </div>
                  </div>

                  {/* Payout History */}
                  <div className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm">
                     <h3 className="text-xl font-display font-black uppercase tracking-tight text-[#1A1033] mb-8">Çekim Geçmişi</h3>
                     {requests.length === 0 ? (
                        <div className="text-center py-16">
                           <FileText size={40} className="mx-auto text-[#1A1033]/10 mb-4" />
                           <p className="text-sm font-bold text-[#1A1033]/30 italic">Henüz çekim talebiniz yok.</p>
                        </div>
                     ) : (
                        <div className="space-y-3">
                           {requests.map((r) => (
                              <div key={r.id} className="flex items-center justify-between bg-[#F8F8FA] rounded-2xl px-6 py-4">
                                 <div>
                                    <p className="font-black text-[#1A1033] text-sm">₺{r.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                    <p className="text-[10px] font-bold text-[#1A1033]/30 uppercase tracking-widest mt-1">{new Date(r.requestedAt).toLocaleDateString('tr-TR')} · {r.iban}</p>
                                 </div>
                                 <span className={cn("text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full", PAYOUT_STATUS_META[r.status].cls)}>{PAYOUT_STATUS_META[r.status].label}</span>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
                </motion.div>
             ) : (
                <div className="text-center py-40 bg-white border border-[#F8F8FA] rounded-[5rem] shadow-sm">
                   <Activity size={48} className="mx-auto text-accent mb-10 animate-pulse" />
                   <h3 className="text-3xl font-display font-black uppercase italic text-[#1A1033]/20 tracking-widest">Global Bağlantı <span className="text-accent">Yükleniyor...</span></h3>
                   <p className="text-[11px] font-black text-[#1A1033]/20 uppercase tracking-[0.4em] mt-6">Sistem Verileri Senkronize Ediliyor</p>
                </div>
             )}
           </AnimatePresence>

        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
