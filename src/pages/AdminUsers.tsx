import React, { useState, useEffect, useMemo } from 'react';
import { getUsers, updateUser, deleteUser, suspendUser, banUser, unrestrictUser, setAdminNote } from '@/services/userService';
import { User, UserRole } from '@/types';
import { Trash2, User as UserIcon, Loader2, X, Search, ChevronDown, ShoppingBag } from 'lucide-react';
import { MOCK_USER } from '@/mockData';
import { cn } from '@/lib/utils';

const ROLES: UserRole[] = ['buyer', 'seller', 'moderator', 'admin'];

const ROLE_FILTER_CHIPS = [
  { label: 'Tümü', value: '' },
  { label: 'Alıcı', value: 'buyer' },
  { label: 'Satıcı', value: 'seller' },
  { label: 'Moderatör', value: 'moderator' },
  { label: 'Admin', value: 'admin' },
  { label: 'Askıda', value: '__suspended__' },
  { label: 'Banlı', value: '__banned__' },
];

const MOCK_ORDERS = [
  { id: '#MC-00112', date: '2025-05-10', amount: 1299, status: 'Teslim Edildi' },
  { id: '#MC-00089', date: '2025-04-22', amount: 549, status: 'İade' },
  { id: '#MC-00073', date: '2025-03-14', amount: 2849, status: 'Teslim Edildi' },
  { id: '#MC-00061', date: '2025-02-28', amount: 799, status: 'Teslim Edildi' },
  { id: '#MC-00044', date: '2025-01-17', amount: 189, status: 'İptal' },
];

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [suspendDays, setSuspendDays] = useState(7);
  const [actionReason, setActionReason] = useState('');
  const [adminNoteText, setAdminNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterChip, setFilterChip] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let data = await getUsers();
      if (data.length === 0) data = [{ ...MOCK_USER, id: 'mock-1' }];
      setUsers(data);
    } catch {
      setUsers([{ ...MOCK_USER, id: 'mock-1' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let list = users;
    if (search) list = list.filter(u =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );
    if (filterChip === '__suspended__') return list.filter(u => u.status === 'suspended');
    if (filterChip === '__banned__') return list.filter(u => u.status === 'banned');
    if (filterChip) return list.filter(u => u.role === filterChip);
    return list;
  }, [users, search, filterChip]);

  const handleRoleChange = async (id: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    if (selectedUser?.id === id) setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
    if (id.startsWith('mock')) return;
    try { await updateUser(id, { role: newRole }); } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
    if (id.startsWith('mock')) { setUsers(users.filter(u => u.id !== id)); return; }
    try { await deleteUser(id); await fetchUsers(); } catch { /* ignore */ }
  };

  const handleSelectUser = (u: User) => {
    setSelectedUser(u);
    setAdminNoteText(u.adminNote || '');
    setActionReason('');
  };

  const handleSuspend = async () => {
    if (!selectedUser || !actionReason.trim()) return;
    const until = new Date(Date.now() + suspendDays * 86400000).toISOString();
    await suspendUser(selectedUser.id, until, actionReason);
    const updated = { ...selectedUser, status: 'suspended' as const, suspendedUntil: until, adminNote: actionReason };
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? updated : u));
    setSelectedUser(updated);
    setShowSuspendModal(false);
    setActionReason('');
  };

  const handleBan = async () => {
    if (!selectedUser || !actionReason.trim()) return;
    await banUser(selectedUser.id, actionReason);
    const updated = { ...selectedUser, status: 'banned' as const, adminNote: actionReason };
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? updated : u));
    setSelectedUser(updated);
    setShowBanModal(false);
    setActionReason('');
  };

  const handleUnrestrict = async () => {
    if (!selectedUser) return;
    await unrestrictUser(selectedUser.id);
    const updated = { ...selectedUser, status: 'active' as const, suspendedUntil: undefined, adminNote: undefined };
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? updated : u));
    setSelectedUser(updated);
  };

  const handleSaveNote = async () => {
    if (!selectedUser) return;
    setSaving(true);
    await setAdminNote(selectedUser.id, adminNoteText);
    setSelectedUser(prev => prev ? { ...prev, adminNote: adminNoteText } : null);
    setSaving(false);
  };

  const statusBadge = (u: User) => {
    const s = u.status || 'active';
    return (
      <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase', {
        'bg-green-100 text-green-700': s === 'active',
        'bg-yellow-100 text-yellow-700': s === 'suspended',
        'bg-red-100 text-red-600': s === 'banned',
      })}>{s}</span>
    );
  };

  const roleBadgeClass = (role: UserRole) => cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase border', {
    'bg-red-50 text-red-600 border-red-200': role === 'admin',
    'bg-purple-50 text-purple-600 border-purple-200': role === 'moderator',
    'bg-blue-50 text-blue-600 border-blue-200': role === 'seller',
    'bg-gray-50 text-gray-500 border-gray-200': role === 'buyer',
  });

  // mock order totals for selected user
  const mockTotalSpent = MOCK_ORDERS.reduce((s, o) => s + (o.status === 'İptal' ? 0 : o.amount), 0);

  return (
    <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm flex flex-col min-h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Kullanıcı Yönetimi</h3>
        <div className="relative">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ara..."
            className="ps-8 pe-3 py-2 border border-gray-200 rounded-xl text-xs w-52 outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ROLE_FILTER_CHIPS.map(chip => (
          <button
            key={chip.value}
            onClick={() => setFilterChip(prev => prev === chip.value ? '' : chip.value)}
            className={cn(
              'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all',
              filterChip === chip.value
                ? 'bg-accent text-white'
                : 'bg-brand-secondary/40 text-brand-primary/60 hover:bg-brand-secondary'
            )}
          >
            {chip.label}
          </button>
        ))}
        <span className="ms-auto text-[10px] font-bold text-gray-400 self-center">{filteredUsers.length} kullanıcı</span>
      </div>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-start">
            <thead>
              <tr className="border-b border-brand-primary/5">
                {['Kullanıcı', 'Email', 'Rol', 'Durum', 'Ülke', 'İşlemler'].map(h => (
                  <th key={h} className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[#1A1033]/40">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-primary/5">
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="group hover:bg-brand-secondary/30 transition-colors cursor-pointer"
                  onClick={() => handleSelectUser(u)}
                >
                  <td className="px-6 py-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary shrink-0">
                      <UserIcon size={14} />
                    </div>
                    <span className="font-bold text-sm text-[#1A1033]">{u.name}</span>
                  </td>
                  <td className="px-6 py-5 text-sm text-[#1A1033]/60">{u.email}</td>
                  <td className="px-6 py-5">
                    <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                        className={cn(
                          'appearance-none ps-2 pe-6 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border cursor-pointer outline-none',
                          {
                            'bg-red-50 text-red-600 border-red-200': u.role === 'admin',
                            'bg-purple-50 text-purple-600 border-purple-200': u.role === 'moderator',
                            'bg-blue-50 text-blue-600 border-blue-200': u.role === 'seller',
                            'bg-brand-secondary text-brand-primary/60 border-transparent': u.role === 'buyer',
                          }
                        )}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronDown size={10} className="absolute end-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                    </div>
                  </td>
                  <td className="px-6 py-5">{statusBadge(u)}</td>
                  <td className="px-6 py-5 text-sm text-[#1A1033]/60">{u.country || '—'}</td>
                  <td className="px-6 py-5">
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(u.id); }}
                      className="p-2 text-[#1A1033]/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={6} className="px-8 py-12 text-center text-[#1A1033]/40 text-sm font-bold">Kullanıcı bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detay Yan Paneli */}
      {selectedUser && (
        <div className="fixed inset-y-0 end-0 w-96 bg-white shadow-2xl z-50 p-6 overflow-y-auto border-s border-gray-100">
          <button onClick={() => setSelectedUser(null)} className="mb-5 text-xs text-gray-400 hover:text-accent flex items-center gap-1">
            <X size={12} /> Kapat
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-brand-primary/5 flex items-center justify-center">
              <UserIcon size={20} className="text-brand-primary" />
            </div>
            <div>
              <p className="font-black text-[#1A1033]">{selectedUser.name}</p>
              <p className="text-xs text-gray-400">{selectedUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {statusBadge(selectedUser)}
            <span className={roleBadgeClass(selectedUser.role)}>{selectedUser.role}</span>
          </div>
          {selectedUser.suspendedUntil && (
            <p className="text-[10px] text-yellow-600 mb-1">
              Askı bitiş: {new Date(selectedUser.suspendedUntil).toLocaleDateString('tr-TR')}
            </p>
          )}

          {/* Rol değiştirme */}
          <div className="mt-4">
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Rol Değiştir</label>
            <select
              value={selectedUser.role}
              onChange={e => handleRoleChange(selectedUser.id, e.target.value as UserRole)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-accent"
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Sipariş Özeti */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black uppercase text-gray-400">Sipariş Geçmişi</label>
              <span className="text-[10px] font-bold text-accent">Toplam: {mockTotalSpent.toLocaleString('tr-TR')} ₺</span>
            </div>
            <div className="space-y-2">
              {MOCK_ORDERS.map(o => (
                <div key={o.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-[10px] font-black text-gray-700">{o.id}</p>
                    <p className="text-[9px] text-gray-400">{new Date(o.date).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-[10px] font-bold text-gray-700">{o.amount.toLocaleString('tr-TR')} ₺</p>
                    <span className={cn('text-[9px] font-black', {
                      'text-green-600': o.status === 'Teslim Edildi',
                      'text-red-500': o.status === 'İptal',
                      'text-yellow-600': o.status === 'İade',
                    })}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Notu */}
          <div className="mt-5">
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Admin Notu</label>
            <textarea
              value={adminNoteText}
              onChange={e => setAdminNoteText(e.target.value)}
              rows={3}
              className="w-full text-xs border border-gray-200 rounded-xl p-2 resize-none focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleSaveNote}
              disabled={saving}
              className="mt-1 text-xs font-bold text-accent hover:underline disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor...' : 'Notu Kaydet'}
            </button>
          </div>

          {/* Aksiyonlar */}
          <div className="mt-6 space-y-2 border-t border-gray-100 pt-5">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Yönetici İşlemleri</p>
            {(!selectedUser.status || selectedUser.status === 'active') && (
              <>
                <button
                  onClick={() => setShowSuspendModal(true)}
                  className="w-full py-2 bg-yellow-50 text-yellow-700 rounded-xl text-xs font-black hover:bg-yellow-100 transition-colors"
                >
                  Askıya Al
                </button>
                <button
                  onClick={() => setShowBanModal(true)}
                  className="w-full py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black hover:bg-red-100 transition-colors"
                >
                  Engelle
                </button>
              </>
            )}
            {(selectedUser.status === 'suspended' || selectedUser.status === 'banned') && (
              <button
                onClick={handleUnrestrict}
                className="w-full py-2 bg-green-50 text-green-700 rounded-xl text-xs font-black hover:bg-green-100 transition-colors"
              >
                Kısıtı Kaldır
              </button>
            )}
            <button
              onClick={() => handleDelete(selectedUser.id)}
              className="w-full py-2 bg-red-600 text-white rounded-xl text-xs font-black hover:bg-red-700 transition-colors mt-2"
            >
              Hesabı Sil
            </button>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-3xl p-8 w-80 shadow-2xl">
            <h3 className="font-black text-[#1A1033] mb-4">Askıya Alma</h3>
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Süre</label>
            <select
              value={suspendDays}
              onChange={e => setSuspendDays(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl p-2 text-sm mb-3"
            >
              <option value={1}>1 Gün</option>
              <option value={7}>7 Gün</option>
              <option value={30}>30 Gün</option>
              <option value={90}>90 Gün</option>
            </select>
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Sebep</label>
            <textarea
              value={actionReason}
              onChange={e => setActionReason(e.target.value)}
              placeholder="Zorunlu alan"
              rows={2}
              className="w-full border border-gray-200 rounded-xl p-2 text-sm mb-4 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowSuspendModal(false); setActionReason(''); }} className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-bold">İptal</button>
              <button onClick={handleSuspend} disabled={!actionReason.trim()} className="flex-1 py-2 bg-yellow-500 text-white rounded-xl text-xs font-black disabled:opacity-40">Askıya Al</button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-3xl p-8 w-80 shadow-2xl">
            <h3 className="font-black text-[#1A1033] mb-4">Kullanıcıyı Engelle</h3>
            <p className="text-xs text-gray-400 mb-4">Bu işlem geri alınabilir ancak kullanıcı bilgilendirilmeyecektir.</p>
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Sebep</label>
            <textarea
              value={actionReason}
              onChange={e => setActionReason(e.target.value)}
              placeholder="Zorunlu alan"
              rows={2}
              className="w-full border border-gray-200 rounded-xl p-2 text-sm mb-4 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowBanModal(false); setActionReason(''); }} className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-bold">İptal</button>
              <button onClick={handleBan} disabled={!actionReason.trim()} className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-black disabled:opacity-40">Engelle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
