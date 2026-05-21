'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { User, Package, Heart, Settings, LogOut } from 'lucide-react';
import { ProfileSettings } from '@/components/profile/ProfileSettings';

export function ProfileContent() {
  const { firebaseUser, logout, loading } = useAuth();
  const { t } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gray-100 rounded-xl animate-pulse h-40" />
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <User size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('nav.login_or_sign_up')}</h2>
        <p className="text-gray-500 mb-6">Siparişlerinizi görüntülemek için giriş yapın.</p>
        {/* Login buttons rendered by AuthContext UI */}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          {firebaseUser.photoURL ? (
            <img src={firebaseUser.photoURL} alt="" className="w-16 h-16 rounded-full" />
          ) : (
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-purple-700" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{firebaseUser.displayName || 'Kullanıcı'}</h2>
            <p className="text-sm text-gray-500">{firebaseUser.email}</p>
          </div>
        </div>
      </div>

      {showSettings ? (
        <div>
          <button
            onClick={() => setShowSettings(false)}
            className="mb-4 text-sm text-purple-700 hover:text-purple-800 font-medium"
          >
            &larr; Profile
          </button>
          <ProfileSettings />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/orders" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-purple-200 transition-colors flex items-center gap-4">
              <Package size={24} className="text-purple-700" />
              <div>
                <h3 className="font-bold">{t('nav.orders')}</h3>
                <p className="text-sm text-gray-500">Siparişlerinizi takip edin</p>
              </div>
            </Link>
            <Link href="/wishlist" className="bg-white p-6 rounded-xl border border-gray-200 hover:border-purple-200 transition-colors flex items-center gap-4">
              <Heart size={24} className="text-purple-700" />
              <div>
                <h3 className="font-bold">{t('nav.favorite')}</h3>
                <p className="text-sm text-gray-500">{t('wishlist.empty_desc')}</p>
              </div>
            </Link>
            <button
              onClick={() => setShowSettings(true)}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:border-purple-200 transition-colors flex items-center gap-4 text-left"
            >
              <Settings size={24} className="text-purple-700" />
              <div>
                <h3 className="font-bold">{t('settings.title') || 'Settings'}</h3>
                <p className="text-sm text-gray-500">Manage your preferences</p>
              </div>
            </button>
          </div>

          <button
            onClick={logout}
            className="mt-6 flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            {t('nav.logout')}
          </button>
        </>
      )}
    </div>
  );
}
