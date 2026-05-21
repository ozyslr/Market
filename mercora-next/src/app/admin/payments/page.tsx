'use client';

import { useState, useEffect } from 'react';
import { CreditCard, ToggleLeft, ToggleRight, Loader2, AlertCircle, Building, Smartphone } from 'lucide-react';

interface Provider {
  id: string;
  provider: string;
  isActive: boolean;
  label: string;
  description?: string;
  apiKey?: string;
  secretKey?: string;
  merchantId?: string;
  feePercent: number;
  feeFixed: number;
  supportedCurrencies: string[];
}

const PROVIDER_ICONS: Record<string, React.ElementType> = {
  stripe: CreditCard,
  iyzico: Smartphone,
  paypal: CreditCard,
  manual: Building,
};

export default function AdminPaymentsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { getProviders } = await import('@/services/paymentProviderService');
      const data = await getProviders();
      setProviders(data ?? []);
    } catch {
      setError('Ödeme yöntemleri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProviders(); }, []);

  const handleToggle = async (provider: Provider) => {
    setToggling((p) => ({ ...p, [provider.id]: true }));
    try {
      const { updateProvider } = await import('@/services/paymentProviderService');
      await updateProvider(provider.id, { isActive: !provider.isActive });
      setProviders((prev) =>
        prev.map((p) => (p.id === provider.id ? { ...p, isActive: !p.isActive } : p))
      );
    } catch {
      setError('Durum güncellenirken bir hata oluştu.');
    } finally {
      setToggling((p) => ({ ...p, [provider.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-700 mx-auto" />
          <p className="mt-4 text-gray-500">Ödeme yöntemleri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error && providers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-900 font-medium">Hata</p>
          <p className="text-gray-500 mt-1">{error}</p>
          <button
            onClick={fetchProviders}
            className="mt-4 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Ödeme Yöntemleri</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="mt-4 text-gray-900 font-medium">Henüz ödeme yöntemi eklenmemiş</p>
          <p className="text-gray-500 mt-1">
            Bir ödeme sağlayıcısı yapılandırmak için lütfen ayarlar sayfasını kullanın.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ödeme Yöntemleri</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider) => {
          const Icon = PROVIDER_ICONS[provider.provider] ?? CreditCard;
          return (
            <div
              key={provider.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Icon className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{provider.label}</h3>
                    <p className="text-xs text-gray-500 capitalize">{provider.provider}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(provider)}
                  disabled={toggling[provider.id]}
                  className={`p-2 rounded-lg transition disabled:opacity-50 ${
                    provider.isActive
                      ? 'text-green-600 bg-green-50 hover:bg-green-100'
                      : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                  }`}
                  title={provider.isActive ? 'Devre Dışı Bırak' : 'Aktifleştir'}
                >
                  {toggling[provider.id] ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : provider.isActive ? (
                    <ToggleRight className="w-5 h-5" />
                  ) : (
                    <ToggleLeft className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="space-y-2 text-sm">
                {provider.merchantId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Merchant ID</span>
                    <span className="text-gray-900 font-mono">{provider.merchantId}</span>
                  </div>
                )}
                {provider.apiKey && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">API Anahtarı</span>
                    <span className="text-gray-900 font-mono">
                      {provider.apiKey.slice(0, 8)}...
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Komisyon</span>
                  <span className="text-gray-900">
                    %{provider.feePercent} + {provider.feeFixed.toFixed(2)} TL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Para Birimleri</span>
                  <span className="text-gray-900">
                    {provider.supportedCurrencies.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Durum</span>
                  <span
                    className={`font-medium ${
                      provider.isActive ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {provider.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
