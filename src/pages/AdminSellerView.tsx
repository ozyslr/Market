import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getProducts } from '@/services/productService';
import { getOrdersBySeller } from '@/services/orderService';
import { calcSellerPerformance, SellerPerformanceScore } from '@/services/sellerRatingService';
import { getSellerCommissions, CommissionTransaction } from '@/services/commissionService';
import { getPayoutHistory, getSellerBalance, PayoutRequest } from '@/services/sellerPayoutService';
import { Seller, Product } from '@/types';
import { Order } from '@/types/order';
import { ArrowLeft, Package, ShoppingBag, Star, Loader2, TrendingUp, DollarSign, Medal, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminSellerView() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const [seller, setSeller]     = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);

  const [perfScore, setPerfScore]     = useState<SellerPerformanceScore | null>(null);
  const [commissions, setCommissions] = useState<CommissionTransaction[]>([]);
  const [payouts, setPayouts]         = useState<PayoutRequest[]>([]);
  const [sellerBal, setSellerBal]     = useState<any>(null);

  useEffect(() => {
    if (!sellerId) return;
    Promise.all([
      getDoc(doc(db, 'sellers', sellerId)),
      getProducts({ sellerId, includeNonApproved: true } as any),
      getOrdersBySeller(sellerId),
      calcSellerPerformance(sellerId),
      getSellerCommissions(sellerId),
      getPayoutHistory(sellerId),
      getSellerBalance(sellerId),
    ]).then(([snap, prods, ords, perf, comms, pays, bal]) => {
      if (snap.exists()) setSeller({ id: snap.id, ...snap.data() } as Seller);
      setProducts(prods);
      setOrders(ords);
      setPerfScore(perf);
      setCommissions(comms);
      setPayouts(pays);
      setSellerBal(bal);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [sellerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Satıcı bulunamadı.
      </div>
    );
  }

  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((s, o) => s + o.total, 0);

  const kycColor =
    seller.kycStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
    seller.kycStatus === 'pending'  ? 'bg-blue-500/20 text-blue-400' :
                                      'bg-red-500/20 text-red-400';

  const kycLabel =
    seller.kycStatus === 'verified' ? 'Onaylı' :
    seller.kycStatus === 'pending'  ? 'Beklemede' : 'Reddedildi';

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back */}
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Admin Paneli
        </Link>

        {/* Seller header */}
        <div className="bg-zinc-900 rounded-2xl p-6 mb-6 flex items-start gap-5">
          {seller.logoUrl ? (
            <img src={seller.logoUrl} alt={seller.storeName} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" loading="lazy" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Package size={24} className="text-zinc-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold truncate">{seller.storeName}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${kycColor}`}>{kycLabel}</span>
            </div>
            {seller.description && (
              <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{seller.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5"><Star size={13} /> {seller.rating?.toFixed(1) ?? '0.0'}</span>
              <span className="flex items-center gap-1.5"><Package size={13} /> {products.length} ürün</span>
              <span className="flex items-center gap-1.5"><ShoppingBag size={13} /> {orders.length} sipariş</span>
              <span>Komisyon: %{seller.commissionRate}</span>
              {seller.origin && <span>Menşei: {seller.origin}</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-emerald-400">{totalRevenue.toLocaleString('tr-TR')} ₺</p>
            <p className="text-xs text-zinc-500 mt-0.5">Toplam Ciro</p>
          </div>
        </div>

        {/* Performance & Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {perfScore && (
            <div className="bg-zinc-900 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Medal size={16} className="text-yellow-400" />
                <span className="text-xs text-zinc-500 font-semibold">Performans</span>
              </div>
              <p className="text-2xl font-bold text-white">{perfScore.overall}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-semibold',
                  perfScore.level === 'platinum' ? 'bg-purple-500/20 text-purple-400' :
                  perfScore.level === 'gold' ? 'bg-yellow-500/20 text-yellow-400' :
                  perfScore.level === 'silver' ? 'bg-gray-500/20 text-gray-400' :
                  'bg-orange-500/20 text-orange-400'
                )}>{perfScore.level}</span>
                <span className="text-xs text-zinc-500">İade: %{perfScore.returnRate}</span>
              </div>
            </div>
          )}
          <div className="bg-zinc-900 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={16} className="text-emerald-400" />
              <span className="text-xs text-zinc-500 font-semibold">Ödenen</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{sellerBal?.totalPaidOut?.toLocaleString('tr-TR') ?? '0'} ₺</p>
            <p className="text-xs text-zinc-500 mt-1">Kullanılabilir: {sellerBal?.availableBalance?.toLocaleString('tr-TR') ?? '0'} ₺</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-blue-400" />
              <span className="text-xs text-zinc-500 font-semibold">Komisyon</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{commissions.reduce((s, c) => s + c.amount, 0).toLocaleString('tr-TR')} ₺</p>
            <p className="text-xs text-zinc-500 mt-1">{commissions.length} işlem</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={16} className="text-purple-400" />
              <span className="text-xs text-zinc-500 font-semibold">Çekimler</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{payouts.length}</p>
            <p className="text-xs text-zinc-500 mt-1">{payouts.filter(p => p.status === 'completed').length} tamamlandı</p>
          </div>
        </div>

        {/* Products */}
        <section className="mb-6">
          <h2 className="text-base font-semibold mb-3 text-zinc-300">Ürünler ({products.length})</h2>
          {products.length === 0 ? (
            <p className="text-zinc-500 text-sm py-6 text-center bg-zinc-900 rounded-2xl">Henüz ürün yok.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.slice(0, 20).map(p => (
                <div key={p.id} className="bg-zinc-900 rounded-xl p-4 flex gap-3 items-center">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Package size={16} className="text-zinc-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-white">{p.title}</p>
                    <p className="text-xs text-zinc-500">{p.price?.toLocaleString('tr-TR')} ₺ · Stok: {p.stock}</p>
                    <span className={`text-xs ${
                      p.status === 'approved' ? 'text-emerald-400' :
                      p.status === 'pending'  ? 'text-yellow-400' :
                                                'text-red-400'
                    }`}>
                      {p.status === 'approved' ? 'Onaylı' : p.status === 'pending' ? 'Beklemede' : p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Orders */}
        <section>
          <h2 className="text-base font-semibold mb-3 text-zinc-300">Son Siparişler ({orders.length})</h2>
          {orders.length === 0 ? (
            <p className="text-zinc-500 text-sm py-6 text-center bg-zinc-900 rounded-2xl">Henüz sipariş yok.</p>
          ) : (
            <div className="bg-zinc-900 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800 text-xs">
                    <th className="text-left px-5 py-3 font-semibold">Sipariş ID</th>
                    <th className="text-left px-5 py-3 font-semibold">Tarih</th>
                    <th className="text-left px-5 py-3 font-semibold">Durum</th>
                    <th className="text-right px-5 py-3 font-semibold">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 20).map(o => (
                    <tr key={o.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-zinc-400">
                        #{o.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-5 py-3 text-zinc-400">
                        {new Date(o.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          o.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                          o.status === 'shipped'   ? 'bg-blue-500/20 text-blue-400' :
                          o.status === 'cancelled' ? 'bg-zinc-700 text-zinc-400' :
                                                     'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">
                        {o.total.toLocaleString('tr-TR')} ₺
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
