'use client';
import { useState, useEffect } from 'react';
import { Megaphone, Plus, ToggleLeft, ToggleRight, Loader2, AlertCircle, Calendar, Percent } from 'lucide-react';
import { getCampaigns, createCampaign, updateCampaign } from '@/services/campaignService';
import type { Campaign } from '@/services/campaignService';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', discountPercent: 0, startDate: '', endDate: '',
    type: 'discount' as const, status: 'draft' as const, createdBy: 'admin',
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setCampaigns(await getCampaigns());
    } catch {
      setError('Kampanyalar yuklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate) return;
    setSaving(true);
    try {
      await createCampaign({ ...formData, usedCount: 0 });
      setShowForm(false);
      setFormData({ name: '', description: '', discountPercent: 0, startDate: '', endDate: '', type: 'discount', status: 'draft', createdBy: 'admin' });
      await load();
    } catch {
      setError('Kampanya olusturulamadi.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Campaign) => {
    try {
      const newStatus = c.status === 'active' ? 'paused' : 'active';
      await updateCampaign(c.id, { status: newStatus });
      setCampaigns((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: newStatus } : x)));
    } catch {
      setError('Durum guncellenemedi.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-700 animate-spin" />
      </div>
    );
  }

  if (error && campaigns.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-4">{error}</p>
          <button onClick={load} className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800">Tekrar Dene</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Megaphone className="w-6 h-6 text-purple-700" />
          <h1 className="text-2xl font-bold text-gray-900">Kampanyalar</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 text-sm">
          <Plus className="w-4 h-4" /> Yeni Kampanya
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          <input placeholder="Kampanya adi" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Aciklama" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input type="number" placeholder="Indirim %" value={formData.discountPercent} onChange={(e) => setFormData({ ...formData, discountPercent: +e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <button onClick={handleCreate} disabled={saving}
              className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Henuz kampanya bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{c.name}</h3>
                <p className="text-sm text-gray-500">{c.description}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span><Percent className="w-3 h-3 inline" /> {c.discountPercent}%</span>
                  <span><Calendar className="w-3 h-3 inline" /> {c.startDate} - {c.endDate}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.status === 'active' ? 'bg-green-100 text-green-700' :
                    c.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>{c.status}</span>
                </div>
              </div>
              <button onClick={() => toggleActive(c)} className="text-gray-400 hover:text-gray-600">
                {c.status === 'active' ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
