'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, UserCheck, Percent, Search, Loader2, Check, X, AlertCircle,
  Trash2, Edit3, Star, Plus, Ban, RefreshCw, ChevronRight, ExternalLink,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore';

type Tab = 'sellers' | 'applications' | 'commission';

interface SellerItem {
  id: string;
  storeName: string;
  email?: string;
  userId?: string;
  productCount?: number;
  status?: string;
  performanceScore?: number;
  rating?: number;
  followersCount?: number;
  isVerified?: boolean;
  slug?: string;
}

interface Application {
  id: string;
  name: string;
  email: string;
  storeName: string;
  phone: string;
  date: string;
}

interface CommissionRule {
  id: string;
  name: string;
  rate: number;
  minAmount: number;
  maxAmount: number;
  active: boolean;
}

const TABS: { key: Tab; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { key: 'sellers', label: 'Satıcılar', icon: Users },
  { key: 'applications', label: 'Başvurular', icon: UserCheck },
  { key: 'commission', label: 'Komisyon Kuralları', icon: Percent },
];

const PERFORMANCE_BADGE = (score: number | undefined) => {
  if (!score && score !== 0) return { label: '—', class: 'bg-gray-100 text-gray-500' };
  if (score >= 90) return { label: 'Altın', class: 'bg-yellow-100 text-yellow-800' };
  if (score >= 70) return { label: 'Gümüş', class: 'bg-gray-100 text-gray-600' };
  return { label: 'Bronz', class: 'bg-orange-100 text-orange-800' };
};

export default function AdminSellersPage() {
  const [tab, setTab] = useState<Tab>('sellers');
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState({ sellers: true, applications: true, commission: true });
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>({});

  const [newRule, setNewRule] = useState({ name: '', rate: 0, minAmount: 0, maxAmount: 0, active: true });
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchSellers = async () => {
    setLoading((p) => ({ ...p, sellers: true }));
    setError(null);
    try {
      const snap = await getDocs(query(collection(db, 'sellers'), orderBy('createdAt', 'desc')));
      const items = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          storeName: data.storeName || 'İsimsiz Mağaza',
          email: data.email || '',
          userId: data.userId || '',
          productCount: data.productCount || 0,
          status: data.status || 'active',
          performanceScore: data.performanceScore || 0,
          rating: data.rating || 0,
          followersCount: data.followersCount || 0,
          isVerified: data.isVerified || false,
          slug: data.slug || '',
        } as SellerItem;
      });
      setSellers(items);
    } catch {
      setError('Satıcılar yüklenemedi.');
    } finally {
      setLoading((p) => ({ ...p, sellers: false }));
    }
  };

  const fetchApplications = async () => {
    setLoading((p) => ({ ...p, applications: true }));
    try {
      const { getApplications } = await import('@/services/sellerApplicationService');
      const data = await getApplications();
      setApplications(data.map((a: any) => ({
        id: a.id,
        name: a.userName || a.name || '',
        email: a.userEmail || a.email || '',
        storeName: a.storeName || '',
        phone: a.phone || '',
        date: a.createdAt || a.date || '',
      })));
    } catch {
      setError('Başvurular yüklenemedi.');
    } finally {
      setLoading((p) => ({ ...p, applications: false }));
    }
  };

  const fetchRules = async () => {
    setLoading((p) => ({ ...p, commission: true }));
    try {
      const { getCommissionRules } = await import('@/services/commissionService');
      const data = await getCommissionRules();
      setRules(data.map((r: any) => ({
        id: r.id,
        name: r.name,
        rate: r.rate,
        minAmount: r.minAmount || 0,
        maxAmount: r.maxAmount || 0,
        active: r.isActive ?? true,
      })));
    } catch {
      setError('Komisyon kuralları yüklenemedi.');
    } finally {
      setLoading((p) => ({ ...p, commission: false }));
    }
  };

  useEffect(() => { fetchSellers(); }, []);
  useEffect(() => { if (tab === 'applications') fetchApplications(); }, [tab]);
  useEffect(() => { if (tab === 'commission') fetchRules(); }, [tab]);

  /* ── Status toggle ── */
  const handleStatusToggle = async (sellerId: string, currentStatus: string | undefined) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setStatusUpdating(prev => ({ ...prev, [sellerId]: true }));
    setError(null);
    try {
      await updateDoc(doc(db, 'sellers', sellerId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setSellers(prev => prev.map(s => s.id === sellerId ? { ...s, status: newStatus } : s));
    } catch {
      setError('Durum güncellenemedi.');
    } finally {
      setStatusUpdating(prev => ({ ...prev, [sellerId]: false }));
    }
  };

  /* ── Application review ── */
  const handleReviewApp = async (id: string, status: 'approved' | 'rejected') => {
    const key = `${id}-${status}`;
    setProcessing((p) => ({ ...p, [key]: true }));
    setError(null);
    try {
      const { reviewApplication } = await import('@/services/sellerApplicationService');
      await reviewApplication(String(id), status, reviewNote[id] || '', 'admin');
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setReviewNote((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } catch {
      setError('İşlem başarısız.');
    } finally {
      setProcessing((p) => ({ ...p, [key]: false }));
    }
  };

  /* ── Commission rules ── */
  const handleSaveRule = async () => {
    setError(null);
    try {
      const { saveCommissionRule } = await import('@/services/commissionService');
      await saveCommissionRule({ ...newRule } as any);
      fetchRules();
      setNewRule({ name: '', rate: 0, minAmount: 0, maxAmount: 0, active: true });
      setEditingRule(null);
      setShowAddForm(false);
    } catch {
      setError('Kural kaydedilemedi.');
    }
  };

  /* ── Derived ── */
  const filteredSellers = useMemo(
    () => sellers.filter((s) => s.storeName.toLowerCase().includes(search.toLowerCase())),
    [sellers, search],
  );

  const stats = useMemo(() => ({
    total: sellers.length,
    active: sellers.filter(s => s.status === 'active').length,
    suspended: sellers.filter(s => s.status === 'suspended').length,
    pending: sellers.filter(s => s.status === 'pending').length,
  }), [sellers]);

  /* ── Render helpers ── */
  const renderSellers = () => (
    loading.sellers ? <LoadingSpinner /> :
    sellers.length === 0 ? <EmptyState icon={Users} msg="Henüz satıcı bulunamadı." /> :
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Mağaza Adı</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">E-posta</th>
              <th className="text-center p-4 text-sm font-semibold text-gray-900">Durum</th>
              <th className="text-center p-4 text-sm font-semibold text-gray-900">Performans</th>
              <th className="text-center p-4 text-sm font-semibold text-gray-900">Puan</th>
              <th className="text-right p-4 pr-6 text-sm font-semibold text-gray-900">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSellers.map((s) => {
              const badge = PERFORMANCE_BADGE(s.performanceScore);
              return (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <Link
                      href={`/admin/sellers/${s.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-2"
                    >
                      {s.storeName}
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{s.email || '-'}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      s.status === 'active' ? 'bg-green-100 text-green-700' :
                      s.status === 'suspended' ? 'bg-red-100 text-red-700' :
                      s.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {s.status === 'active' ? 'Aktif' : s.status === 'suspended' ? 'Askıda' : s.status === 'pending' ? 'Beklemede' : s.status || '—'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                      <Star className="w-3 h-3" /> {badge.label}
                      {s.performanceScore != null && <>({s.performanceScore})</>}
                    </span>
                  </td>
                  <td className="p-4 text-center text-sm text-gray-700">
                    {s.rating != null ? `${s.rating.toFixed(1)}` : '-'}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Suspend / Activate */}
                      <button
                        onClick={() => handleStatusToggle(s.id, s.status)}
                        disabled={statusUpdating[s.id]}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          s.status === 'suspended' || s.status === 'banned'
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-yellow-600 hover:bg-yellow-50'
                        }`}
                        title={s.status === 'suspended' || s.status === 'banned' ? 'Aktifleştir' : 'Dondur'}
                      >
                        {statusUpdating[s.id]
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : s.status === 'suspended' || s.status === 'banned'
                            ? <Check className="w-4 h-4" />
                            : <Ban className="w-4 h-4" />
                        }
                      </button>

                      {/* Detail Page Link */}
                      <Link
                        href={`/admin/sellers/${s.id}`}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Satıcı Detayı"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderApplications = () => (
    loading.applications ? <LoadingSpinner /> :
    applications.length === 0 ? <EmptyState icon={UserCheck} msg="Henüz başvuru bulunamadı." /> :
    <div className="space-y-4">
      {applications.map((app) => (
        <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{app.name}</p>
            <p className="text-sm text-gray-500 truncate">{app.email} / {app.storeName}</p>
            <p className="text-sm text-gray-400">{app.phone} - {app.date ? new Date(app.date).toLocaleDateString('tr-TR') : '-'}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <input
              type="text"
              placeholder="Not ekle..."
              value={reviewNote[app.id] || ''}
              onChange={(e) => setReviewNote((p) => ({ ...p, [app.id]: e.target.value }))}
              className="w-36 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => handleReviewApp(app.id, 'approved')}
              disabled={processing[`${app.id}-approved`]}
              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
              title="Onayla"
            >
              {processing[`${app.id}-approved`] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleReviewApp(app.id, 'rejected')}
              disabled={processing[`${app.id}-rejected`]}
              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
              title="Reddet"
            >
              {processing[`${app.id}-rejected`] ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCommission = () => (
    <>
      <div className="mb-4">
        <button onClick={() => { setShowAddForm(!showAddForm); setEditingRule(null); setNewRule({ name: '', rate: 0, minAmount: 0, maxAmount: 0, active: true }); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors">
          <Plus className="w-4 h-4" /> Yeni Kural Ekle
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input placeholder="Kural Adı" value={newRule.name} onChange={(e) => setNewRule((p) => ({ ...p, name: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input type="number" placeholder="Oran (%)" value={newRule.rate} onChange={(e) => setNewRule((p) => ({ ...p, rate: +e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input type="number" placeholder="Min Tutar" value={newRule.minAmount} onChange={(e) => setNewRule((p) => ({ ...p, minAmount: +e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input type="number" placeholder="Max Tutar" value={newRule.maxAmount} onChange={(e) => setNewRule((p) => ({ ...p, maxAmount: +e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <button onClick={handleSaveRule} disabled={!newRule.name || !newRule.rate}
              className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 text-sm disabled:opacity-50 transition-colors">
              {editingRule ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {loading.commission ? <LoadingSpinner /> : rules.length === 0 ? <EmptyState icon={Percent} msg="Henüz komisyon kuralı bulunamadı." /> :
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Kural Adı</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Oran (%)</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Min Tutar</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Max Tutar</th>
                <th className="text-center p-4 text-sm font-semibold text-gray-900">Durum</th>
                <th className="text-right p-4 pr-6 text-sm font-semibold text-gray-900">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{r.name}</td>
                  <td className="p-4 text-gray-600">%{r.rate}</td>
                  <td className="p-4 text-gray-600">{r.minAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                  <td className="p-4 text-gray-600">{r.maxAmount > 0 ? r.maxAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : 'Sınırsız'}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${r.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {r.active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingRule(r); setNewRule(r); setShowAddForm(true); }}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"><Edit3 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-7 h-7 text-purple-700" />
            <h1 className="text-2xl font-bold text-gray-900">Satıcı Yönetimi</h1>
          </div>
          <button onClick={fetchSellers} disabled={loading.sellers}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-purple-700 border border-gray-200 rounded-lg hover:border-purple-200 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading.sellers ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Toplam Satıcı" value={stats.total.toString()} />
          <StatCard label="Aktif" value={stats.active.toString()} />
          <StatCard label="Askıda" value={stats.suspended.toString()} />
          <StatCard label="Beklemede" value={stats.pending.toString()} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                tab === t.key ? 'border-purple-700 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Search (sellers only) */}
        {tab === 'sellers' && (
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Satıcı ara..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        {tab === 'sellers' && renderSellers()}
        {tab === 'applications' && renderApplications()}
        {tab === 'commission' && renderCommission()}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────────────── */

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-purple-700" />
    </div>
  );
}

function EmptyState({ icon: Icon, msg, sub }: { icon: React.FC<React.SVGProps<SVGSVGElement>>; msg: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <Icon className="w-16 h-16 text-gray-300 mx-auto" />
      <p className="mt-4 text-gray-900 font-medium">{msg}</p>
      {sub && <p className="mt-1 text-sm text-gray-500">{sub}</p>}
    </div>
  );
}
