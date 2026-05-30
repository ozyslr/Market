import React, { useState, useRef } from 'react';
import { Camera, MapPin, Lock, Bell, Plus, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Address } from '@/types';
import {
  updateUser,
  addAddress,
  replaceAddress,
  deleteAddress,
  setDefaultAddress,
  updateProfilePhoto,
} from '@/services/userService';
import { uploadProfilePhoto } from '@/services/storageService';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type CardKey = 'profile' | 'addresses' | 'security' | 'notifications';

const EMPTY_ADDRESS: Omit<Address, 'id'> = {
  label: '', fullName: '', line1: '', line2: '', city: '',
  state: '', postalCode: '', country: '', phone: '',
};

interface AddressFormState extends Omit<Address, 'id'> {
  setAsDefault: boolean;
}

export function ProfileSettings({ defaultOpen }: { defaultOpen?: CardKey } = {}) {
  const { user, firebaseUser, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [openCard, setOpenCard] = useState<CardKey | null>(defaultOpen ?? null);

  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [country, setCountry] = useState(user?.country ?? '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addresses: Address[] = user?.addresses ?? [];
  const defaultId: string = user?.defaultAddressId ?? '';
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormState>({ ...EMPTY_ADDRESS, setAsDefault: false });
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [resetSent, setResetSent] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const prefs = user?.preferences ?? { newsletter: false, personalizedDeals: false, pushNotifications: false };

  function toggleCard(key: CardKey) {
    setOpenCard(prev => prev === key ? null : key);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    setSavingProfile(true);
    try {
      if (photoFile) {
        const photoURL = await uploadProfilePhoto(firebaseUser.uid, photoFile);
        await updateProfilePhoto(firebaseUser.uid, photoURL);         // Firestore
        await updateProfile(firebaseUser, { photoURL });               // Firebase Auth
        setPhotoFile(null);
        setPhotoPreview(null);
      }
      await updateUser(firebaseUser.uid, { name: displayName, country });
      await refreshUser();
    } finally {
      setSavingProfile(false);
    }
  }

  function startAddAddress() {
    setEditingAddress(null);
    setAddressForm({ ...EMPTY_ADDRESS, setAsDefault: addresses.length === 0 });
    setShowAddForm(true);
  }

  function startEditAddress(addr: Address) {
    setEditingAddress(addr);
    setAddressForm({ ...addr, setAsDefault: addr.id === defaultId });
    setShowAddForm(true);
  }

  function cancelAddressForm() {
    setShowAddForm(false);
    setEditingAddress(null);
    setAddressForm({ ...EMPTY_ADDRESS, setAsDefault: false });
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    setSavingAddress(true);
    try {
      const { setAsDefault, ...addrData } = addressForm;
      if (editingAddress) {
        const updated: Address = { ...addrData, id: editingAddress.id };
        await replaceAddress(firebaseUser.uid, editingAddress, updated);
        if (setAsDefault) await setDefaultAddress(firebaseUser.uid, updated.id);
      } else {
        const created = await addAddress(firebaseUser.uid, addrData);
        if (setAsDefault) await setDefaultAddress(firebaseUser.uid, created.id);
      }
      await refreshUser();
      cancelAddressForm();
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleDeleteAddress(addr: Address) {
    if (!firebaseUser || !confirm(t('profile.address.confirmDelete'))) return;
    setDeletingId(addr.id);
    try {
      await deleteAddress(firebaseUser.uid, addr);
      await refreshUser();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(addressId: string) {
    if (!firebaseUser) return;
    await setDefaultAddress(firebaseUser.uid, addressId);
    await refreshUser();
  }

  async function handleSendReset() {
    if (!firebaseUser?.email) return;
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, firebaseUser.email);
      setResetSent(true);
    } finally {
      setSendingReset(false);
    }
  }

  async function handleTogglePref(key: keyof typeof prefs) {
    if (!firebaseUser) return;
    await updateUser(firebaseUser.uid, {
      preferences: { ...prefs, [key]: !prefs[key] } as any,
    });
    await refreshUser();
  }

  const avatarSrc = photoPreview ?? user?.photoURL
    ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name ?? 'user')}`;

  return (
    <div className="space-y-3 max-w-xl">

      {/* Profil Bilgileri */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        <button onClick={() => toggleCard('profile')}
          className="w-full flex items-center justify-between p-5 text-start">
          <div className="flex items-center gap-3">
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
              aria-label="Profil fotoğrafını değiştir"
            >
              <img src={avatarSrc} className="w-11 h-11 rounded-full object-cover" alt={user?.name || 'Profil fotoğrafı'} loading="lazy" />
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={12} className="text-white" />
              </div>
            </div>
            <div>
              <p className="font-bold text-sm text-[#1A1033] dark:text-white">{user?.name}</p>
              <p className="text-[10px] text-zinc-400">{user?.email}</p>
            </div>
          </div>
          {openCard === 'profile' ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
        </button>
        <AnimatePresence>
          {openCard === 'profile' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <form onSubmit={handleSaveProfile} className="px-5 pb-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Ad Soyad</label>
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border border-transparent focus:border-accent/30 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Ülke</label>
                  <input value={country} onChange={e => setCountry(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm border border-transparent focus:border-accent/30 outline-none dark:text-white" />
                </div>
                <button type="submit" disabled={savingProfile}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1033] dark:bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50">
                  {savingProfile && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
                  {t('profile.saveChanges')}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Teslimat Adreslerim */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <button onClick={() => toggleCard('addresses')}
          className="w-full flex items-center justify-between p-5 text-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
              <MapPin size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="font-bold text-sm text-[#1A1033] dark:text-white">{t('profile.addresses')}</p>
              <p className="text-[10px] text-zinc-400">{addresses.length} {t('profile.address.saved')}</p>
            </div>
          </div>
          {openCard === 'addresses' ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
        </button>
        <AnimatePresence>
          {openCard === 'addresses' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-5 pb-5 space-y-3">
                {addresses.map(addr => (
                  <div key={addr.id} className={cn('rounded-xl p-4 border transition-all',
                    addr.id === defaultId
                      ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700'
                      : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700')}>
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-bold text-sm text-[#1A1033] dark:text-white">{addr.label}</p>
                      {addr.id === defaultId && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-violet-600 text-white px-2 py-0.5 rounded-full">
                          {t('profile.address.default')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {addr.fullName}<br />
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                      {addr.city}, {addr.state} {addr.postalCode}, {addr.country}<br />
                      {addr.phone}
                    </p>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {addr.id !== defaultId && (
                        <button onClick={() => handleSetDefault(addr.id)}
                          className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:border-violet-400 transition-all">
                          {t('profile.address.makeDefault')}
                        </button>
                      )}
                      <button onClick={() => startEditAddress(addr)}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 transition-all flex items-center gap-1">
                        <Edit2 size={10} /> {t('profile.address.edit')}
                      </button>
                      <button onClick={() => handleDeleteAddress(addr)} disabled={deletingId === addr.id}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-700 border border-red-100 dark:border-red-900/40 text-red-400 hover:bg-red-50 transition-all flex items-center gap-1 disabled:opacity-40">
                        <Trash2 size={10} /> {t('profile.address.delete')}
                      </button>
                    </div>
                  </div>
                ))}

                <AnimatePresence>
                  {showAddForm && (
                    <motion.form
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden" onSubmit={handleSaveAddress}>
                      <div className="bg-violet-50 dark:bg-violet-900/10 rounded-xl p-4 border border-violet-100 dark:border-violet-800 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">
                          {editingAddress ? t('profile.address.edit') : t('profile.address.add')}
                        </p>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{t('profile.address.label')} *</label>
                          <input required value={addressForm.label} placeholder="Ev, İş, Anne Evi..."
                            onChange={e => setAddressForm(f => ({ ...f, label: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 rounded-lg text-xs border border-violet-100 dark:border-zinc-700 focus:border-violet-400 outline-none dark:text-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{t('profile.address.fullName')} *</label>
                            <input required value={addressForm.fullName}
                              onChange={e => setAddressForm(f => ({ ...f, fullName: e.target.value }))}
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 rounded-lg text-xs border border-violet-100 dark:border-zinc-700 focus:border-violet-400 outline-none dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{t('profile.address.phone')} *</label>
                            <input required value={addressForm.phone}
                              onChange={e => setAddressForm(f => ({ ...f, phone: e.target.value }))}
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 rounded-lg text-xs border border-violet-100 dark:border-zinc-700 focus:border-violet-400 outline-none dark:text-white" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{t('profile.address.line1')} *</label>
                          <input required value={addressForm.line1}
                            onChange={e => setAddressForm(f => ({ ...f, line1: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 rounded-lg text-xs border border-violet-100 dark:border-zinc-700 focus:border-violet-400 outline-none dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{t('profile.address.line2')}</label>
                          <input value={addressForm.line2 ?? ''}
                            onChange={e => setAddressForm(f => ({ ...f, line2: e.target.value }))}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 rounded-lg text-xs border border-violet-100 dark:border-zinc-700 focus:border-violet-400 outline-none dark:text-white" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{t('profile.address.city')} *</label>
                            <input required value={addressForm.city}
                              onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))}
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 rounded-lg text-xs border border-violet-100 dark:border-zinc-700 focus:border-violet-400 outline-none dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{t('profile.address.postalCode')} *</label>
                            <input required value={addressForm.postalCode}
                              onChange={e => setAddressForm(f => ({ ...f, postalCode: e.target.value }))}
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 rounded-lg text-xs border border-violet-100 dark:border-zinc-700 focus:border-violet-400 outline-none dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{t('profile.address.country')} *</label>
                            <input required value={addressForm.country}
                              onChange={e => setAddressForm(f => ({ ...f, country: e.target.value }))}
                              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 rounded-lg text-xs border border-violet-100 dark:border-zinc-700 focus:border-violet-400 outline-none dark:text-white" />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={addressForm.setAsDefault}
                            onChange={e => setAddressForm(f => ({ ...f, setAsDefault: e.target.checked }))}
                            className="accent-violet-600" />
                          <span className="text-[10px] font-bold text-zinc-500">{t('profile.address.setDefault')}</span>
                        </label>
                        <div className="flex gap-2">
                          <button type="submit" disabled={savingAddress}
                            className="flex items-center gap-1.5 px-5 py-2 bg-[#1A1033] dark:bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40">
                            {savingAddress && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
                            {t('profile.saveChanges')}
                          </button>
                          <button type="button" onClick={cancelAddressForm}
                            className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            İptal
                          </button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {!showAddForm && (
                  <button onClick={startAddAddress}
                    className="w-full py-3 border-2 border-dashed border-violet-200 dark:border-violet-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-violet-500 flex items-center justify-center gap-2 hover:border-violet-400 transition-all">
                    <Plus size={14} /> {t('profile.address.add')}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Güvenlik */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <button onClick={() => toggleCard('security')}
          className="w-full flex items-center justify-between p-5 text-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Lock size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-sm text-[#1A1033] dark:text-white">{t('profile.security')}</p>
              <p className="text-[10px] text-zinc-400">{user?.email}</p>
            </div>
          </div>
          {openCard === 'security' ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
        </button>
        <AnimatePresence>
          {openCard === 'security' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-5 pb-5">
                {resetSent ? (
                  <p className="text-sm text-green-600 font-medium">{t('profile.resetEmailSent')}</p>
                ) : (
                  <button onClick={handleSendReset} disabled={sendingReset}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1033] dark:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40">
                    {sendingReset && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
                    {t('profile.sendResetEmail')}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bildirimler */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <button onClick={() => toggleCard('notifications')}
          className="w-full flex items-center justify-between p-5 text-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <Bell size={18} className="text-green-500" />
            </div>
            <p className="font-bold text-sm text-[#1A1033] dark:text-white">{t('profile.notifications')}</p>
          </div>
          {openCard === 'notifications' ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
        </button>
        <AnimatePresence>
          {openCard === 'notifications' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-5 pb-5 space-y-4">
                {([
                  ['newsletter', 'E-posta bülteni'],
                  ['personalizedDeals', 'Kişisel fırsatlar'],
                  ['pushNotifications', 'Push bildirimleri'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
                    <div onClick={() => handleTogglePref(key)}
                      className={cn('w-10 h-5 rounded-full transition-colors relative cursor-pointer',
                        prefs[key] ? 'bg-accent' : 'bg-zinc-200 dark:bg-zinc-700')}>
                      <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                        prefs[key] ? 'translate-x-5' : 'translate-x-0.5')} />
                    </div>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
