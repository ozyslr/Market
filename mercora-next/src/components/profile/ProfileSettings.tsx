'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Globe, Bell, Shield, Save } from 'lucide-react';
import type { UserProfile } from '@/types';

export function ProfileSettings() {
  const { user, firebaseUser, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    country: 'UK',
    currency: 'GBP',
    newsletter: false,
    personalizedDeals: false,
    pushNotifications: false,
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: (user as any).phone || '',
        country: user.country || 'UK',
        currency: user.currency || 'GBP',
        newsletter: user.preferences?.newsletter ?? false,
        personalizedDeals: user.preferences?.personalizedDeals ?? false,
        pushNotifications: user.preferences?.pushNotifications ?? false,
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    setMessage('');
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        name: form.name,
        phone: form.phone,
        country: form.country,
        currency: form.currency,
        preferences: {
          newsletter: form.newsletter,
          personalizedDeals: form.personalizedDeals,
          pushNotifications: form.pushNotifications,
        },
      });
      await refreshUser();
      setMessage('Settings saved successfully');
    } catch {
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Sign in to manage your profile settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <User size={20} className="text-purple-700" />
          Profile Settings
        </h2>
        <p className="text-sm text-gray-500">Manage your personal information and preferences</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* Personal Info */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
          <User size={16} /> Personal Information
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500">
            <Mail size={16} />
            {user.email}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
            placeholder="+44..."
          />
        </div>
      </section>

      {/* Region */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
          <Globe size={16} /> Region & Currency
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select
              value={form.country}
              onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
            >
              <option value="UK">United Kingdom</option>
              <option value="TR">Turkey</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="US">United States</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={form.currency}
              onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-600 outline-none"
            >
              <option value="GBP">GBP (£)</option>
              <option value="TRY">TRY (₺)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
          <Bell size={16} /> Preferences
        </h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.newsletter}
            onChange={e => setForm(p => ({ ...p, newsletter: e.target.checked }))}
            className="accent-purple-700"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">Newsletter</p>
            <p className="text-xs text-gray-500">Receive weekly deals and updates</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.personalizedDeals}
            onChange={e => setForm(p => ({ ...p, personalizedDeals: e.target.checked }))}
            className="accent-purple-700"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">Personalized Deals</p>
            <p className="text-xs text-gray-500">Get offers tailored to your interests</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.pushNotifications}
            onChange={e => setForm(p => ({ ...p, pushNotifications: e.target.checked }))}
            className="accent-purple-700"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">Push Notifications</p>
            <p className="text-xs text-gray-500">Order updates and price alerts</p>
          </div>
        </label>
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-purple-700 text-white rounded-xl hover:bg-purple-800 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <Save size={18} />
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
