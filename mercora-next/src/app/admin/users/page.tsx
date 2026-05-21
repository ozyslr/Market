'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, Mail, Calendar, Shield, Loader2, AlertCircle, UserCheck,
  Search, ChevronLeft, ChevronRight, Ban, Check, X, Edit3,
  Save, MoreHorizontal, UserCog, Filter, ArrowUpDown, Trash2,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection, getDocs, query, orderBy, limit as firestoreLimit,
  doc, updateDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import type { UserRole } from '@/types';

/* ──────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────── */

interface UserData {
  id: string;
  email: string;
  displayName?: string;
  name?: string;
  photoURL?: string;
  createdAt?: Timestamp | string;
  role?: UserRole;
  status?: 'active' | 'suspended' | 'banned';
  phone?: string;
  country?: string;
}

type SortField = 'email' | 'displayName' | 'createdAt' | 'role';
type SortDir = 'asc' | 'desc';

const ROLES: { key: UserRole; label: string }[] = [
  { key: 'buyer', label: 'Alıcı' },
  { key: 'seller', label: 'Satıcı' },
  { key: 'moderator', label: 'Moderatör' },
  { key: 'admin', label: 'Admin' },
];

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  moderator: 'bg-blue-100 text-blue-700',
  seller: 'bg-emerald-100 text-emerald-700',
  buyer: 'bg-gray-100 text-gray-600',
};

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-yellow-100 text-yellow-700',
  banned: 'bg-red-100 text-red-700',
};

const PAGE_SIZE = 20;

/* ──────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */

function formatDate(value: unknown): string {
  if (!value) return '-';
  try {
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString('tr-TR');
    const d = new Date(value as string);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('tr-TR');
  } catch {
    return '-';
  }
}

/* ──────────────────────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────────────────────── */

export default function AdminUsersPage() {
  /* ── data ── */
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── search / sort / page ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  /* ── inline editing ── */
  const [editingRole, setEditingRole] = useState<Record<string, UserRole>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  /* ── detail modal ── */
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  /* ── fetch ── */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(200),
      ));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserData)));
    } catch {
      setError('Kullanıcılar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ── filter / sort / paginate ── */
  const filtered = useMemo(() => {
    let result = [...users];

    // search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        (u.email?.toLowerCase() || '').includes(q) ||
        (u.displayName?.toLowerCase() || '').includes(q) ||
        (u.name?.toLowerCase() || '').includes(q) ||
        (u.phone?.toLowerCase() || '').includes(q)
      );
    }

    // role filter
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }

    // sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'email':
          cmp = (a.email || '').localeCompare(b.email || '');
          break;
        case 'displayName':
          cmp = (a.displayName || a.name || '').localeCompare(b.displayName || b.name || '');
          break;
        case 'createdAt':
          cmp = new Date(String(a.createdAt ?? 0)).getTime() - new Date(String(b.createdAt ?? 0)).getTime();
          break;
        case 'role':
          cmp = (a.role || '').localeCompare(b.role || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [users, searchQuery, roleFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchQuery, roleFilter]);

  /* ── actions ── */
  const handleRoleSave = async (userId: string) => {
    const newRole = editingRole[userId];
    if (!newRole) return;
    setSaving(prev => ({ ...prev, [userId]: true }));
    setFeedback(null);
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setEditingRole(prev => { const n = { ...prev }; delete n[userId]; return n; });
      setFeedback({ type: 'success', msg: 'Rol güncellendi.' });
    } catch {
      setFeedback({ type: 'error', msg: 'Rol güncellenemedi.' });
    } finally {
      setSaving(prev => ({ ...prev, [userId]: false }));
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleToggleStatus = async (userId: string, current: string | undefined) => {
    const newStatus = current === 'active' ? 'suspended' : 'active';
    setSaving(prev => ({ ...prev, [`status-${userId}`]: true }));
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus as UserData['status'] } : u));
      setFeedback({ type: 'success', msg: `Kullanıcı ${newStatus === 'active' ? 'aktifleştirildi' : 'donduruldu'}.` });
    } catch {
      setFeedback({ type: 'error', msg: 'Durum güncellenemedi.' });
    } finally {
      setSaving(prev => ({ ...prev, [`status-${userId}`]: false }));
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  /* ── derived counts ── */
  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    sellers: users.filter(u => u.role === 'seller').length,
    suspended: users.filter(u => u.status === 'suspended' || u.status === 'banned').length,
  }), [users]);

  /* ── render ── */

  /* loading */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
                <div className="h-7 w-12 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-700" />
          </div>
        </div>
      </div>
    );
  }

  /* error (no data) */
  if (error && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Yükleme Hatası</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button onClick={fetchUsers}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors">
              <Loader2 className="w-4 h-4" /> Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Feedback */}
        {feedback && (
          <div className={`flex items-center gap-2 p-3 mb-4 rounded-lg text-sm font-medium border ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {feedback.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.msg}</span>
            <button onClick={() => setFeedback(null)} className="ml-auto text-sm hover:underline">Kapat</button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-7 h-7 text-purple-700" />
            <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              {users.length} kullanıcı
            </span>
          </div>
        </div>

        {/* Error inline */}
        {error && users.length > 0 && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Users} label="Toplam Kullanıcı" value={stats.total.toString()} />
          <StatCard icon={UserCog} label="Admin" value={stats.admins.toString()} />
          <StatCard icon={UserCheck} label="Satıcı" value={stats.sellers.toString()} />
          <StatCard icon={Ban} label="Askıda/Yasaklı" value={stats.suspended.toString()} />
        </div>

        {/* Search / Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="E-posta, ad veya telefon ile ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Role filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value as UserRole | 'all')}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tüm Roller</option>
                {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {users.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-12 text-gray-500">
              <UserCheck className="w-12 h-12 text-gray-300" />
              <span className="font-medium">Henüz kullanıcı bulunmuyor.</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-12 text-gray-500">
              <Search className="w-12 h-12 text-gray-300" />
              <span className="font-medium">Aramanızla eşleşen kullanıcı bulunamadı.</span>
              <button onClick={() => { setSearchQuery(''); setRoleFilter('all'); }}
                className="text-sm text-purple-600 hover:underline">
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <SortHeader label="E-posta" field="email" current={sortField} dir={sortDir} onClick={toggleSort} />
                    <SortHeader label="Ad Soyad" field="displayName" current={sortField} dir={sortDir} onClick={toggleSort} />
                    <SortHeader label="Kayıt Tarihi" field="createdAt" current={sortField} dir={sortDir} onClick={toggleSort} />
                    <SortHeader label="Rol" field="role" current={sortField} dir={sortDir} onClick={toggleSort} />
                    <th className="text-left p-4 text-sm font-semibold text-gray-900">Durum</th>
                    <th className="text-right p-4 pr-6 text-sm font-semibold text-gray-900">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageUsers.map(user => {
                    const isEditing = editingRole[user.id] !== undefined;
                    const isSaving = saving[user.id];
                    const isStatusSaving = saving[`status-${user.id}`];
                    const displayName = user.displayName || user.name || '-';

                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline text-left"
                          >
                            {user.email}
                          </button>
                        </td>
                        <td className="p-4 text-sm text-gray-600">{displayName}</td>
                        <td className="p-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                        <td className="p-4">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <select
                                value={editingRole[user.id]}
                                onChange={e => setEditingRole(prev => ({ ...prev, [user.id]: e.target.value as UserRole }))}
                                className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                                disabled={isSaving}
                              >
                                {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                              </select>
                              <button
                                onClick={() => handleRoleSave(user.id)}
                                disabled={isSaving}
                                className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                                title="Kaydet"
                              >
                                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => setEditingRole(prev => { const n = { ...prev }; delete n[user.id]; return n; })}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                title="İptal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_BADGE[user.role || 'buyer']}`}>
                              <Shield className="w-3 h-3" />
                              {ROLES.find(r => r.key === (user.role || 'buyer'))?.label || 'Alıcı'}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            STATUS_BADGE[user.status || 'active']
                          }`}>
                            {user.status === 'suspended' ? 'Askıda' : user.status === 'banned' ? 'Yasaklı' : 'Aktif'}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit role */}
                            <button
                              onClick={() => setEditingRole(prev => ({ ...prev, [user.id]: user.role || 'buyer' }))}
                              className="p-1.5 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Rol Düzenle"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Suspend / Activate */}
                            <button
                              onClick={() => handleToggleStatus(user.id, user.status)}
                              disabled={isStatusSaving}
                              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                                user.status === 'suspended' || user.status === 'banned'
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-yellow-600 hover:bg-yellow-50'
                              }`}
                              title={user.status === 'suspended' ? 'Aktifleştir' : 'Dondur'}
                            >
                              {isStatusSaving
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : user.status === 'suspended' || user.status === 'banned'
                                  ? <Check className="w-4 h-4" />
                                  : <Ban className="w-4 h-4" />
                              }
                            </button>

                            {/* Detail view */}
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Detay"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700 px-2">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedUser(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Kullanıcı Detayı</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xl font-bold">
                  {(selectedUser.displayName || selectedUser.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedUser.displayName || selectedUser.name || 'İsimsiz'}
                  </p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Rol" value={ROLES.find(r => r.key === (selectedUser.role || 'buyer'))?.label || 'Alıcı'} />
                <DetailField label="Durum" value={
                  selectedUser.status === 'suspended' ? 'Askıda' :
                  selectedUser.status === 'banned' ? 'Yasaklı' : 'Aktif'
                } />
                <DetailField label="Kayıt Tarihi" value={formatDate(selectedUser.createdAt)} />
                <DetailField label="Telefon" value={selectedUser.phone || '-'} />
                <DetailField label="Ülke" value={selectedUser.country || '-'} />
              </div>

              {/* User ID */}
              <div className="pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400 font-mono">ID: {selectedUser.id}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setEditingRole(prev => ({ ...prev, [selectedUser.id]: selectedUser.role || 'buyer' }));
                  setSelectedUser(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-700 text-white rounded-lg text-sm font-medium hover:bg-purple-800 transition-colors"
              >
                <Edit3 className="w-4 h-4" /> Rolü Düzenle
              </button>
              <button
                onClick={() => {
                  handleToggleStatus(selectedUser.id, selectedUser.status);
                  setSelectedUser(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                  selectedUser.status === 'suspended' || selectedUser.status === 'banned'
                    ? 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                    : 'text-yellow-700 bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                }`}
              >
                {selectedUser.status === 'suspended' || selectedUser.status === 'banned'
                  ? <><Check className="w-4 h-4" /> Aktifleştir</>
                  : <><Ban className="w-4 h-4" /> Dondur</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value }: { icon: React.FC<React.SVGProps<SVGSVGElement>>; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function SortHeader({
  label, field, current, dir, onClick,
}: {
  label: string; field: SortField; current: SortField; dir: SortDir; onClick: (f: SortField) => void;
}) {
  const active = current === field;
  return (
    <th
      className="text-left p-4 text-sm font-semibold text-gray-900 cursor-pointer select-none hover:text-purple-700 transition-colors"
      onClick={() => onClick(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3.5 h-3.5 ${active ? 'text-purple-700' : 'text-gray-300'}`} />
        {active && (
          <span className="text-[9px] text-purple-700">{dir === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}
