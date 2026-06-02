import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  Code,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  createApiKey,
  getApiKeys,
  revokeApiKey,
  deleteApiKey,
  ALL_PERMISSIONS,
  ApiKeyPermission,
} from '@/services/apiKeyService';
import type { ApiKey } from '@/services/apiKeyService';

export function SellerApiKeys() {
  const { firebaseUser } = useAuth();
  const [keys, setKeys] = useState<Omit<ApiKey, 'key'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<ApiKey | null>(null);
  const [formName, setFormName] = useState('');
  const [formPermissions, setFormPermissions] = useState<ApiKeyPermission[]>([
    'products:read',
    'orders:read',
  ]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;
    getApiKeys(firebaseUser.uid).then((data) => {
      setKeys(data);
      setLoading(false);
    });
  }, [firebaseUser]);

  const handleCreate = async () => {
    if (!firebaseUser || !formName.trim()) return;
    setCreating(true);
    try {
      const created = await createApiKey(firebaseUser.uid, formName.trim(), formPermissions);
      setNewKey(created);
      setKeys((prev) => [
        {
          id: created.id,
          sellerId: created.sellerId,
          name: created.name,
          keyPrefix: created.keyPrefix,
          permissions: created.permissions,
          isActive: true,
          usageCount: 0,
          createdAt: created.createdAt,
        },
        ...prev,
      ]);
      setFormName('');
      setFormPermissions(['products:read', 'orders:read']);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!firebaseUser || !confirm('Bu API anahtarını devre dışı bırakmak istiyor musunuz?')) return;
    await revokeApiKey(firebaseUser.uid, keyId);
    setKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, isActive: false } : k)));
  };

  const handleDelete = async (keyId: string) => {
    if (!firebaseUser || !confirm('Bu API anahtarını kalıcı olarak silmek istiyor musunuz?'))
      return;
    await deleteApiKey(firebaseUser.uid, keyId);
    setKeys((prev) => prev.filter((k) => k.id !== keyId));
  };

  const togglePerm = (perm: ApiKeyPermission) => {
    setFormPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8F8FA] p-6 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">
              API Anahtarları
            </h1>
            <p className="text-[10px] font-bold text-[#1A1033]/40 uppercase tracking-widest mt-1">
              Satıcı REST API&apos;si için erişim anahtarları
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-3 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90"
          >
            <Plus size={14} /> Yeni Anahtar
          </button>
        </div>

        {/* New Key Reveal */}
        {newKey && (
          <div className="bg-green-50 border-2 border-green-400 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Check size={20} className="text-green-600" />
              <h3 className="text-sm font-black text-green-700">API Anahtarınız Oluşturuldu!</h3>
            </div>
            <p className="text-[10px] font-bold text-green-600 uppercase">
              Bu anahtar sadece bir kez gösterilir. Hemen kopyalayın.
            </p>
            <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-green-200">
              <code className="flex-1 text-sm font-mono font-bold text-[#1A1033] break-all select-all">
                {newKey.key}
              </code>
              <button
                onClick={() => copyToClipboard(newKey.key)}
                className="p-2 bg-accent text-white rounded-lg hover:opacity-90 transition-all"
                title="Kopyala"
              >
                <Copy size={16} />
              </button>
            </div>
            <button
              onClick={() => setNewKey(null)}
              className="text-[10px] font-bold text-green-600 underline"
            >
              Anladım, kapat
            </button>
          </div>
        )}

        {/* Create Form */}
        {showCreate && (
          <div className="bg-white rounded-[2rem] p-6 border border-[#1A1033]/5 space-y-4">
            <h3 className="text-sm font-black uppercase text-[#1A1033]/60">Yeni API Anahtarı</h3>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Anahtar adı (örn: Entegrasyon API)"
              className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold outline-none"
            />
            <div>
              <p className="text-[9px] font-black uppercase text-[#1A1033]/40 mb-2">İzinler</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {ALL_PERMISSIONS.map((perm) => (
                  <label
                    key={perm}
                    className="flex items-center gap-2 cursor-pointer bg-[#F8F8FA] rounded-xl p-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={formPermissions.includes(perm)}
                      onChange={() => togglePerm(perm)}
                      className="w-3.5 h-3.5 rounded accent-accent"
                    />
                    <span className="text-[10px] font-bold text-[#1A1033]">{perm}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2.5 bg-[#F8F8FA] text-[#1A1033] rounded-xl text-[10px] font-black uppercase"
              >
                İptal
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !formName.trim()}
                className="px-4 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}{' '}
                Oluştur
              </button>
            </div>
          </div>
        )}

        {/* Keys List */}
        <div className="space-y-3">
          {keys.length === 0 && !newKey && (
            <div className="bg-white rounded-[2rem] p-16 text-center border border-dashed border-[#1A1033]/10">
              <Key size={40} className="mx-auto text-[#1A1033]/10 mb-4" />
              <p className="text-sm font-bold text-[#1A1033]/30">Henüz API anahtarı yok</p>
              <p className="text-[10px] text-[#1A1033]/20 mt-1">
                Entegrasyonlarınız için API anahtarı oluşturun
              </p>
            </div>
          )}
          {keys.map((apiKey) => (
            <div
              key={apiKey.id}
              className={cn(
                'bg-white rounded-2xl p-5 border',
                apiKey.isActive ? 'border-[#1A1033]/5' : 'border-red-200 opacity-60',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      apiKey.isActive ? 'bg-accent/10 text-accent' : 'bg-red-50 text-red-400',
                    )}
                  >
                    <Key size={18} />
                  </div>
                  <div>
                    <p className="font-black text-[#1A1033] text-sm">{apiKey.name}</p>
                    <code className="text-[10px] text-[#1A1033]/40">
                      {apiKey.keyPrefix}••••••••••••••••
                    </code>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-lg text-[8px] font-black uppercase',
                      apiKey.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500',
                    )}
                  >
                    {apiKey.isActive ? 'Aktif' : 'Devre Dışı'}
                  </span>
                  {apiKey.isActive && (
                    <button
                      onClick={() => handleRevoke(apiKey.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Devre Dışı Bırak"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(apiKey.id)}
                    className="p-1.5 text-[#1A1033]/30 hover:text-red-500 rounded-lg transition-colors"
                    title="Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {apiKey.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="px-2 py-0.5 bg-[#F8F8FA] rounded-lg text-[8px] font-black uppercase text-[#1A1033]/50"
                  >
                    {perm}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-2 text-[9px] text-[#1A1033]/30">
                <span>{apiKey.usageCount} istek</span>
                {apiKey.lastUsedAt && (
                  <span>Son: {new Date(apiKey.lastUsedAt).toLocaleString('tr-TR')}</span>
                )}
                <span>Oluşturma: {new Date(apiKey.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* API Documentation */}
        <div className="bg-white rounded-[2rem] border border-[#1A1033]/5 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Code size={18} className="text-accent" />
            <h3 className="text-sm font-black uppercase text-[#1A1033]">API Dokümantasyonu</h3>
          </div>
          <div className="bg-[#1A1033] rounded-2xl p-5 text-white/90 font-mono text-xs space-y-2 overflow-x-auto">
            <p className="text-green-400"># Benim Olan Seller REST API v1.0</p>
            <p className="text-white/60"># Auth: Authorization: Bearer bo_&#123;api_key&#125;</p>
            <br />
            <p>
              <span className="text-blue-400">GET</span> /api/v1/products — Ürünleri listele
            </p>
            <p>
              <span className="text-blue-400">GET</span> /api/v1/products/:id — Ürün detayı
            </p>
            <p>
              <span className="text-green-400">POST</span> /api/v1/products — Ürün oluştur
            </p>
            <p>
              <span className="text-amber-400">PUT</span> /api/v1/products/:id — Ürün güncelle
            </p>
            <p>
              <span className="text-amber-400">PUT</span> /api/v1/products/stock — Toplu stok/fiyat
            </p>
            <p>
              <span className="text-blue-400">GET</span> /api/v1/orders — Siparişleri listele
            </p>
            <p>
              <span className="text-blue-400">GET</span> /api/v1/orders/:id — Sipariş detayı
            </p>
            <br />
            <p className="text-white/40"># Rate Limit: 100-300 req/dk (endpoint&apos;e göre)</p>
            <p className="text-white/40"># Batch stock: max 500 ürün/istek</p>
            <p className="text-white/40"># Tüm fiyatlar TRY cinsindendir</p>
          </div>
        </div>
      </div>
    </div>
  );
}
