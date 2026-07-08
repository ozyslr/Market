import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Key, Plus, Copy, Loader2, Check, AlertCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  createApiKey,
  getApiKeys,
  revokeApiKey,
  ALL_PERMISSIONS,
  ApiKeyPermission,
  ApiKey,
} from '@/services/apiKeyService';

export function SellerApiKeys() {
  const { firebaseUser } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPermissions, setFormPermissions] = useState<ApiKeyPermission[]>([
    'products:read',
    'orders:read',
  ]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  // keyId of the row that has the inline revoke confirmation open
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);
  // keyIds that are fading out after revoke
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());

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
    setCreateError(null);
    try {
      const { rawKey, keyId } = await createApiKey(formName.trim(), formPermissions);
      // Refresh key list from service (to pick up the new doc with proper keyPrefix)
      const refreshed = await getApiKeys(firebaseUser.uid);
      setKeys(refreshed);
      setNewlyCreatedKey(rawKey);
      setShowCreate(false);
      setFormName('');
      setFormPermissions(['products:read', 'orders:read']);
    } catch (err: any) {
      setCreateError(err.message || 'Anahtar oluşturma başarısız.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    if (!newlyCreatedKey) return;
    navigator.clipboard.writeText(newlyCreatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismissKey = () => {
    setNewlyCreatedKey(null);
    setCopied(false);
  };

  const handleRevokeConfirm = async (keyId: string) => {
    if (!firebaseUser) return;
    setRevokeLoading(true);
    try {
      await revokeApiKey(firebaseUser.uid, keyId);
      setRevokingId(null);
      // Fade out the row, then remove from list
      setFadingIds((prev) => new Set(prev).add(keyId));
      setTimeout(() => {
        setKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, isActive: false } : k)));
        setFadingIds((prev) => {
          const next = new Set(prev);
          next.delete(keyId);
          return next;
        });
      }, 350);
    } catch {
      // keep confirmation open on error
    } finally {
      setRevokeLoading(false);
    }
  };

  const togglePerm = (perm: ApiKeyPermission) => {
    setFormPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-brand-primary">
              API Anahtarları
            </h1>
            <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest mt-1">
              Satıcı REST API&apos;si için erişim anahtarları
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreate(true);
              setCreateError(null);
            }}
            className="px-5 py-3 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> Yeni Anahtar
          </button>
        </div>

        {/* Raw Key — shown once after creation */}
        <AnimatePresence>
          {newlyCreatedKey && (
            <motion.div
              key="raw-key-box"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="bg-yellow-50 border-2 border-amber-300 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-700 font-bold">
                    Bu anahtar bir daha gösterilmeyecek. Şimdi kopyalayın.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-amber-200">
                  <code className="flex-1 text-sm font-mono text-brand-primary break-all select-all">
                    {newlyCreatedKey}
                  </code>
                  <button
                    onClick={handleCopy}
                    className={cn(
                      'p-2 rounded-lg transition-all shrink-0',
                      copied
                        ? 'bg-green-100 text-green-600'
                        : 'bg-accent text-white hover:opacity-90',
                    )}
                    title="Anahtarı Kopyala"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <button
                  onClick={handleDismissKey}
                  className="text-[10px] font-bold text-amber-700 underline"
                >
                  Kaydettim, kapat
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              key="create-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-[2rem] p-6 border border-brand-primary/5 space-y-4">
                <h3 className="text-sm font-black uppercase text-brand-primary/60">
                  Yeni API Anahtarı
                </h3>
                {createError && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    {createError}
                  </p>
                )}
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Anahtar adı (örn: Entegrasyon API)"
                  className="w-full px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm font-bold outline-none"
                />
                <div>
                  <p className="text-[9px] font-black uppercase text-brand-primary/40 mb-2">
                    İzinler
                  </p>
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
                        <span className="text-[10px] font-bold text-brand-primary">{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2.5 bg-[#F8F8FA] text-brand-primary rounded-xl text-[10px] font-black uppercase"
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keys List */}
        <div className="space-y-3">
          {keys.length === 0 && !newlyCreatedKey && (
            <div className="bg-white rounded-[2rem] p-16 text-center border border-dashed border-brand-primary/10">
              <Key size={40} className="mx-auto text-brand-primary/10 mb-4" />
              <p className="text-sm font-bold text-brand-primary/30">Henüz API anahtarı yok</p>
              <p className="text-[10px] text-brand-primary/20 mt-1">
                Entegrasyonlarınız için API anahtarı oluşturun
              </p>
            </div>
          )}

          <AnimatePresence>
            {keys.map((apiKey) => (
              <motion.div
                key={apiKey.id}
                layout
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeIn' }}
                animate={fadingIds.has(apiKey.id) ? { opacity: 0, height: 0 } : { opacity: 1 }}
                className="overflow-hidden"
              >
                <div
                  className={cn(
                    'bg-white rounded-2xl p-5 border',
                    apiKey.isActive ? 'border-brand-primary/5' : 'border-red-200 opacity-60',
                  )}
                >
                  {/* Key row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                          apiKey.isActive ? 'bg-accent/10 text-accent' : 'bg-red-50 text-red-400',
                        )}
                      >
                        <Key size={18} />
                      </div>
                      <div>
                        <p className="font-black text-brand-primary text-sm">{apiKey.name}</p>
                        <code className="text-[10px] text-brand-primary/40">
                          {apiKey.keyPrefix}••••••••
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
                      {apiKey.isActive && revokingId !== apiKey.id && (
                        <button
                          onClick={() => setRevokingId(apiKey.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                          title="İptal Et"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {apiKey.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 mt-2 text-[9px] text-brand-primary/30">
                    <span>{apiKey.usageCount} istek</span>
                    {apiKey.lastUsedAt && (
                      <span>Son: {new Date(apiKey.lastUsedAt).toLocaleString('tr-TR')}</span>
                    )}
                    <span>Oluşturma: {new Date(apiKey.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>

                  {/* Inline revoke confirmation */}
                  <AnimatePresence>
                    {revokingId === apiKey.id && (
                      <motion.div
                        key="revoke-confirm"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-red-100 flex items-center gap-3">
                          <p className="text-xs text-red-700 font-bold flex-1">
                            Bu anahtarı iptal etmek istiyor musunuz? Bu işlem geri alınamaz.
                          </p>
                          <button
                            onClick={() => handleRevokeConfirm(apiKey.id)}
                            disabled={revokeLoading}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            {revokeLoading ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <XCircle size={12} />
                            )}
                            Anahtarı İptal Et
                          </button>
                          <button
                            onClick={() => setRevokingId(null)}
                            className="text-[10px] font-bold text-brand-primary/50 hover:text-brand-primary transition-colors"
                          >
                            Vazgeç
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Rate limit info */}
        <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-3">
          <Info size={14} className="text-gray-400 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-500">
            API istekleri dakikada 100 istek ile sınırlıdır. Limitler her 60 saniyede bir
            sıfırlanır.
          </p>
        </div>

        {/* API Documentation */}
        <div className="bg-white rounded-[2rem] border border-brand-primary/5 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-accent" />
            <h3 className="text-sm font-black uppercase text-brand-primary">API Dokümantasyonu</h3>
          </div>
          <div className="bg-brand-primary rounded-2xl p-5 text-white/90 font-mono text-xs space-y-2 overflow-x-auto">
            <p className="text-green-400"># Benim Olan Seller REST API v1.0</p>
            <p className="text-white/60"># Auth: Authorization: Bearer bo_&#123;api_key&#125;</p>
            <br />
            <p>
              <span className="text-green-400">POST</span> /api/v1/keys — Yeni anahtar oluştur
            </p>
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
            <p className="text-white/40"># Rate Limit: 100 istek/dk</p>
            <p className="text-white/40"># Batch stock: max 500 ürün/istek</p>
            <p className="text-white/40"># Tüm fiyatlar TRY cinsindendir</p>
          </div>
        </div>
      </div>
    </div>
  );
}
