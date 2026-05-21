'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, AlertCircle, Check, Globe, Mail, Image } from 'lucide-react';
import { getSettings, updateSettings } from '@/services/settingsService';
import type { AppSettings } from '@/services/settingsService';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ siteName: '', logoUrl: '', contactEmail: '', maintenanceMode: false, maintenanceMessage: '' });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSettings();
      setSettings(data);
      if (data) {
        setForm({
          siteName: data.siteName || '',
          logoUrl: data.logo || '',
          contactEmail: data.supportEmail || '',
          maintenanceMode: data.maintenanceMode || false,
          maintenanceMessage: data.maintenanceMode ? 'Sitede bakım çalışması devam ediyor.' : '',
        });
      }
    } catch {
      setError('Ayarlar yuklenirken bir hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateSettings({
        siteName: form.siteName,
        logo: form.logoUrl,
        supportEmail: form.contactEmail,
        maintenanceMode: form.maintenanceMode,
        updatedBy: 'admin',
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Ayarlar kaydedilirken hata olustu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-purple-700" size={40} />
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="text-red-500" size={48} />
        <p className="text-gray-500">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800">Tekrar Dene</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="text-purple-700" size={28} />
        <h1 className="text-2xl font-bold text-gray-900">Site Ayarlari</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Globe size={14} /> Site Adi</label>
            <input
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Site adi"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Image size={14} /> Logo URL</label>
            <input
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="https://example.com/logo.png"
            />
            {form.logoUrl && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200 inline-block">
                <img src={form.logoUrl} alt="Logo preview" className="h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1"><Mail size={14} /> Iletisim E-posta</label>
            <input
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="ornek@site.com"
              type="email"
            />
          </div>

          <hr className="border-gray-200" />

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Bakim Modu</label>
              <button
                onClick={() => setForm({ ...form, maintenanceMode: !form.maintenanceMode })}
                className={`relative w-10 h-5 rounded-full transition ${form.maintenanceMode ? 'bg-purple-700' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition ${form.maintenanceMode ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            {form.maintenanceMode && (
              <textarea
                value={form.maintenanceMessage}
                onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2 resize-none"
                rows={3}
                placeholder="Bakim mesaji"
              />
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600 mt-3">
            <Check size={16} /> Ayarlar basariyla kaydedildi.
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50 text-sm mt-4"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Kaydet
        </button>
      </div>
    </div>
  );
}
