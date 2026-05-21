'use client';
import { useState, useEffect } from 'react';
import { Globe, Check, Loader2, AlertCircle, Save, Star } from 'lucide-react';

interface LanguageConfig {
  supportedLanguages: string[];
  defaultLanguage: string;
}

const languageMeta: Record<string, { name: string; flag: string }> = {
  tr: { name: 'Turkce', flag: '🇹🇷' },
  en: { name: 'English', flag: '🇬🇧' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  fr: { name: 'Francais', flag: '🇫🇷' },
  ar: { name: 'العربية', flag: '🇸🇦' },
};

const STORAGE_KEY = 'mercora_language_config';

export default function AdminLanguagesPage() {
  const [config, setConfig] = useState<LanguageConfig>({ supportedLanguages: ['tr', 'en'], defaultLanguage: 'tr' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    setError(null);
    try {
      const { getSettings } = await import('@/services/settingsService');
      const settings = await getSettings();
      if (settings) {
        const raw = (settings as any).languageConfig;
        if (raw) setConfig(raw as LanguageConfig);
      }
    } catch {
      setError('Dil ayarlari yuklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  function toggleLang(code: string) {
    const active = config.supportedLanguages;
    const exists = active.includes(code);
    setConfig({
      ...config,
      supportedLanguages: exists ? active.filter((l) => l !== code) : [...active, code],
    });
  }

  function setDefault(code: string) {
    setConfig({ ...config, defaultLanguage: code });
  }

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const { updateSettings } = await import('@/services/settingsService');
      await updateSettings({ languageConfig: config } as any);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Ayarlar kaydedilirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Dil ayarlari yukleniyor...</span>
        </div>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Hata</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={loadConfig} className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition">
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  const activeLanguages = config.supportedLanguages || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Globe className="w-7 h-7 text-purple-700" />
            <h1 className="text-2xl font-bold text-gray-900">Dil Ayarlari</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
            <Check className="w-4 h-4" /> Ayarlar basariyla kaydedildi.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {activeLanguages.length === 0 && (
          <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
            Henuz desteklenen dil secilmedi. En az bir dil secmelisiniz.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(languageMeta).map(([code, meta]) => {
            const isActive = activeLanguages.includes(code);
            const isDefault = config.defaultLanguage === code;
            return (
              <div
                key={code}
                className={`bg-white rounded-xl border p-4 transition ${
                  isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{meta.flag}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{meta.name}</h3>
                      <span className="text-xs text-gray-400 uppercase">{code}</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => toggleLang(code)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-purple-700 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>

                {isActive && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Varsayilan dil</span>
                    <button
                      onClick={() => setDefault(code)}
                      className={`flex items-center gap-1 text-sm px-3 py-1 rounded-lg transition ${
                        isDefault
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isDefault ? 'fill-purple-700' : ''}`} />
                      {isDefault ? 'Varsayilan' : 'Sec'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
