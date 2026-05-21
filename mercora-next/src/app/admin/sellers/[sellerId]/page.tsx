'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Store, Package, ShoppingCart, DollarSign, Star,
  Loader2, Ban, CheckCircle, AlertTriangle, Mail, Calendar,
  Shield, Edit3, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import {
  collection, getDocs, query, where, doc, getDoc, updateDoc,
} from 'firebase/firestore';
import { getProducts } from '@/services/productService';
import { getOrdersBySeller } from '@/services/orderService';
import type { Product } from '@/types';
import type { Order } from '@/types/order';

export default function AdminSellerDetailPage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const router = useRouter();
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!sellerId) return;
    setLoading(true);
    Promise.all([
      getDoc(doc(db, 'sellers', sellerId)).then(s => ({ id: s.id, ...s.data() })),
      getProducts({ sellerId, includeNonApproved: true }),
      getOrdersBySeller(sellerId),
    ]).then(([s, prods, ords]) => {
      setSeller(s);
      setProducts(prods);
      setOrders(ords);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [sellerId]);

  const stats = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'delivered');
    const totalRevenue = delivered.reduce((s, o) => s + (o.totalAmount || o.total || 0), 0);
    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      deliveredOrders: delivered.length,
      totalRevenue,
      activeProducts: products.filter(p => p.stock > 0).length,
    };
  }, [products, orders]);

  const toggleStatus = async (newStatus: string) => {
    if (!confirm(`Satıcı durumunu "${newStatus}" olarak değiştirmek istediğinize emin misiniz?`)) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'sellers', sellerId), { status: newStatus });
      setSeller((prev: any) => ({ ...prev, status: newStatus }));
    } catch {
      alert('Durum güncellenemedi.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto text-center py-16">
          <Store size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-bold text-gray-900">Satıcı bulunamadı</h2>
          <button onClick={() => router.push('/admin/sellers')} className="mt-4 text-purple-600 font-medium hover:underline">
            Satıcı listesine dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <Link href="/admin/sellers" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft size={16} /> Satıcı Listesi
        </Link>

        {/* Seller Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
                <Store size={28} className="text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{seller.storeName || 'İsimsiz Mağaza'}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Mail size={14} /> {seller.email || '—'}</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> {seller.joinedDate ? new Date(seller.joinedDate).toLocaleDateString('tr-TR') : '—'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {updating ? (
                <Loader2 size={20} className="animate-spin text-purple-600" />
              ) : (
                <>
                  {seller.status !== 'suspended' && (
                    <button
                      onClick={() => toggleStatus('suspended')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                    >
                      <Ban size={14} /> Askıya Al
                    </button>
                  )}
                  {seller.status === 'suspended' && (
                    <button
                      onClick={() => toggleStatus('active')}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
                    >
                      <CheckCircle size={14} /> Aktifleştir
                    </button>
                  )}
                </>
              )}
              <span className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold',
                seller.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                seller.status === 'suspended' ? 'bg-red-50 text-red-700' :
                'bg-gray-100 text-gray-600'
              )}>
                {seller.status || 'active'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Toplam Ürün', value: stats.totalProducts, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Aktif Ürün', value: stats.activeProducts, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Toplam Sipariş', value: stats.totalOrders, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Toplam Gelir', value: `${stats.totalRevenue.toLocaleString('tr-TR')} ₺`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', s.bg)}>
                  <Icon size={20} className={s.color} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Ürünler ({products.length})</h2>
            </div>
            {products.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Henüz ürün yok</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {products.slice(0, 10).map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                    {p.images?.[0] && (
                      <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded-lg object-cover bg-gray-50" loading="lazy" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                      <p className="text-xs text-gray-400">{p.price.toLocaleString('tr-TR')} ₺ · Stok: {p.stock}</p>
                    </div>
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded',
                      p.status === 'approved' || !p.status ? 'bg-emerald-50 text-emerald-700' :
                      p.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-700'
                    )}>
                      {p.status || 'approved'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Son Siparişler ({orders.length})</h2>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Henüz sipariş yok</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {orders.slice(0, 10).map(o => (
                  <Link
                    key={o.id}
                    href={`/admin/orders`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 block"
                  >
                    <div>
                      <p className="text-sm font-mono font-bold text-gray-900">#{o.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{(o.totalAmount || o.total || 0).toLocaleString('tr-TR')} ₺</p>
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded',
                        o.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                        o.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-700'
                      )}>
                        {o.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
