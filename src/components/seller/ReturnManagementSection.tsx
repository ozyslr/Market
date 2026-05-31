import React, { useState, useEffect } from 'react';
import { RotateCcw, ThumbsUp, ThumbsDown, MoreVertical, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getReturnRequests, updateReturnStatus, ReturnRequest } from '@/services/returnService';

interface ReturnManagementSectionProps {
  uid: string;
  show: boolean;
}

export function ReturnManagementSection({ uid, show }: ReturnManagementSectionProps) {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [processingReturn, setProcessingReturn] = useState(false);

  useEffect(() => {
    if (!uid || !show) return;
    setLoadingReturns(true);
    getReturnRequests(uid).then(data => {
      setReturns(data);
      setLoadingReturns(false);
    });
  }, [uid, show]);

  if (!show) return null;

  return (
    <>
      {/* ── RETURNS TABLE ── */}
      <div className="bg-white rounded-[3.5rem] shadow-sm border border-amber-200 overflow-hidden mt-8">
        <div className="p-8 border-b border-amber-100 flex items-center justify-between">
          <h2 className="font-black text-brand-primary uppercase italic flex items-center gap-2">
            <RotateCcw size={18} className="text-amber-500" /> İade Yönetimi
          </h2>
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
            {returns.filter(r => r.status === 'requested').length} bekleyen
          </span>
        </div>

        {loadingReturns ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
        ) : returns.length === 0 ? (
          <div className="text-center py-16">
            <RotateCcw size={36} className="mx-auto text-brand-primary/10 mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30">İade talebi yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="bg-brand-secondary/20 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">
                  <th className="px-8 py-5">İade Kodu</th>
                  <th className="px-8 py-5">Ürün</th>
                  <th className="px-8 py-5">Sebep</th>
                  <th className="px-8 py-5">Tarih</th>
                  <th className="px-8 py-5">Durum</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-primary/5">
                {returns.map(r => (
                  <tr key={r.id} className={cn("transition-colors group", r.autoApproved ? "bg-green-50/30 hover:bg-green-50/50" : "hover:bg-brand-secondary/20")}>
                    <td className="px-8 py-5">
                      <div>
                        <span className="font-mono font-black text-accent text-sm">{r.returnCode || '—'}</span>
                        <p className="text-[10px] font-bold text-brand-primary/30">#{r.orderId.slice(-6).toUpperCase()}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-bold text-brand-primary text-sm">{r.items.map(i => i.name).join(', ')}</p>
                      <p className="text-[10px] font-bold text-brand-primary/40">{r.items.reduce((s, i) => s + i.quantity, 0)} adet</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-medium text-brand-primary max-w-[200px] truncate">{r.reason}</p>
                    </td>
                    <td className="px-8 py-5 text-sm text-brand-primary/60">
                      {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest',
                          r.status === 'requested' ? 'bg-amber-50 text-amber-600' :
                          r.status === 'approved' ? 'bg-green-50 text-green-600' :
                          r.status === 'rejected' ? 'bg-red-50 text-red-600' :
                          r.status === 'received' ? 'bg-blue-50 text-blue-600' :
                          r.status === 'refunded' ? 'bg-purple-50 text-purple-600' :
                          'bg-gray-50 text-gray-500'
                        )}>
                          {r.status === 'requested' ? 'Bekliyor' :
                           r.status === 'approved' ? 'Onaylandı' :
                           r.status === 'rejected' ? 'Reddedildi' :
                           r.status === 'received' ? 'Teslim Alındı' :
                           r.status === 'refunded' ? 'İade Edildi' :
                           r.status === 'pickup_scheduled' ? 'Kargo Planlandı' :
                           r.status === 'closed' ? 'Kapandı' : r.status}
                        </span>
                        {r.autoApproved && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-black uppercase rounded-full" title={r.autoApprovalReason}>
                            Oto
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {r.status === 'requested' && (
                          <>
                            <button
                              onClick={async () => {
                                setProcessingReturn(true);
                                await updateReturnStatus(r.id, 'approved', 'İade onaylandı. Kargonuzu bekliyoruz.');
                                setReturns(prev => prev.map(rr => rr.id === r.id ? { ...rr, status: 'approved' as const } : rr));
                                setProcessingReturn(false);
                              }}
                              disabled={processingReturn}
                              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50"
                              title="Onayla"
                            >
                              <ThumbsUp size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                setProcessingReturn(true);
                                await updateReturnStatus(r.id, 'rejected', 'İade talebi reddedildi.');
                                setReturns(prev => prev.map(rr => rr.id === r.id ? { ...rr, status: 'rejected' as const } : rr));
                                setProcessingReturn(false);
                              }}
                              disabled={processingReturn}
                              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                              title="Reddet"
                            >
                              <ThumbsDown size={14} />
                            </button>
                            <button
                              onClick={() => setSelectedReturn(r)}
                              className="p-2 bg-brand-secondary/50 text-brand-primary/60 rounded-lg hover:bg-brand-secondary transition-all"
                              title="Detay"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </>
                        )}
                        {r.status !== 'requested' && (
                          <button
                            onClick={() => setSelectedReturn(r)}
                            className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline"
                          >
                            Detay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── RETURN DETAIL MODAL ── */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedReturn(null)} />
          <div className="relative bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-black text-brand-primary uppercase italic">İade Detayı</h3>
              <span className={cn(
                'px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest',
                selectedReturn.status === 'requested' ? 'bg-amber-50 text-amber-600' :
                selectedReturn.status === 'approved' ? 'bg-green-50 text-green-600' :
                selectedReturn.status === 'rejected' ? 'bg-red-50 text-red-600' :
                selectedReturn.status === 'refunded' ? 'bg-purple-50 text-purple-600' :
                selectedReturn.status === 'received' ? 'bg-blue-50 text-blue-600' :
                'bg-gray-50 text-gray-500'
              )}>
                {selectedReturn.status === 'requested' ? 'Bekliyor' :
                 selectedReturn.status === 'approved' ? 'Onaylandı' :
                 selectedReturn.status === 'rejected' ? 'Reddedildi' :
                 selectedReturn.status === 'received' ? 'Teslim Alındı' :
                 selectedReturn.status === 'refunded' ? 'İade Edildi' :
                 selectedReturn.status === 'pickup_scheduled' ? 'Kargo Planlandı' :
                 selectedReturn.status === 'closed' ? 'Kapandı' : selectedReturn.status}
              </span>
            </div>

            <div className="space-y-3">
              {selectedReturn.returnCode && (
                <div className="flex items-center gap-3 bg-accent/5 border border-accent/20 rounded-2xl p-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-accent/60">İade Kodu</span>
                  <span className="text-xl font-display font-black text-accent tracking-widest">{selectedReturn.returnCode}</span>
                  {selectedReturn.autoApproved && (
                    <span className="ms-auto px-3 py-1 bg-green-500 text-white text-[9px] font-black uppercase rounded-full">Otomatik Onay</span>
                  )}
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-brand-primary/50 font-bold">Sipariş</span>
                <span className="font-black font-mono">#{selectedReturn.orderId.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-primary/50 font-bold">Talep Tarihi</span>
                <span className="font-black">{new Date(selectedReturn.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
              {selectedReturn.returnWindowExpiry && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-primary/50 font-bold">İade Süresi</span>
                  <span className={cn("font-bold", new Date(selectedReturn.returnWindowExpiry) > new Date() ? "text-green-600" : "text-red-500")}>
                    {new Date(selectedReturn.returnWindowExpiry).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-brand-primary/50 font-bold">Müşteri</span>
                <span className="font-black">{selectedReturn.userEmail}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-primary/50 font-bold">İade Tutarı</span>
                <span className="font-black text-accent">{(selectedReturn.refundAmount ?? 0).toFixed(2)} ₺</span>
              </div>
              <div className="pt-3 border-t border-brand-primary/5">
                <p className="text-xs font-bold text-brand-primary/50 mb-1 uppercase tracking-widest">İade Sebebi</p>
                <p className="text-sm font-bold">{selectedReturn.reason}</p>
              </div>
              {selectedReturn.autoApprovalReason && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-green-700">{selectedReturn.autoApprovalReason}</p>
                </div>
              )}
              {selectedReturn.details && (
                <div className="pt-2">
                  <p className="text-xs font-bold text-brand-primary/50 mb-1 uppercase tracking-widest">Açıklama</p>
                  <p className="text-sm">{selectedReturn.details}</p>
                </div>
              )}
              {selectedReturn.timeline && selectedReturn.timeline.length > 0 && (
                <div className="pt-3 border-t border-brand-primary/5">
                  <p className="text-xs font-bold text-brand-primary/50 mb-3 uppercase tracking-widest">Süreç</p>
                  <div className="space-y-2">
                    {selectedReturn.timeline.map((entry, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5",
                            idx === 0 ? "bg-accent" : "bg-brand-primary/20"
                          )} />
                          {idx < (selectedReturn.timeline?.length ?? 0) - 1 && (
                            <div className="w-px flex-1 bg-brand-primary/10 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <p className="text-[11px] font-black text-brand-primary">
                            {entry.status === 'requested' ? 'Talep Oluşturuldu' :
                             entry.status === 'approved' ? 'Onaylandı' :
                             entry.status === 'rejected' ? 'Reddedildi' :
                             entry.status === 'received' ? 'Teslim Alındı' :
                             entry.status === 'refunded' ? 'İade Tamamlandı' :
                             entry.status === 'pickup_scheduled' ? 'Kargo Planlandı' :
                             entry.status === 'closed' ? 'Kapatıldı' : entry.status}
                          </p>
                          {entry.note && <p className="text-[10px] text-brand-primary/50">{entry.note}</p>}
                          <p className="text-[9px] text-brand-primary/30">{new Date(entry.timestamp).toLocaleString('tr-TR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setSelectedReturn(null)}
                className="flex-1 py-3 border border-brand-primary/10 text-brand-primary font-black text-xs rounded-xl hover:bg-brand-secondary/30 transition-all uppercase tracking-widest">
                Kapat
              </button>
              {selectedReturn.status === 'requested' && (
                <>
                  <button
                    onClick={async () => {
                      setProcessingReturn(true);
                      await updateReturnStatus(selectedReturn.id, 'approved', 'İade onaylandı.');
                      setReturns(prev => prev.map(r => r.id === selectedReturn.id ? { ...r, status: 'approved' } : r));
                      setSelectedReturn(prev => prev ? { ...prev, status: 'approved' } : null);
                      setProcessingReturn(false);
                    }}
                    disabled={processingReturn}
                    className="flex-1 py-3 bg-green-500 text-white font-black text-xs rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 uppercase tracking-widest"
                  >
                    İadeyi Onayla
                  </button>
                  <button
                    onClick={async () => {
                      setProcessingReturn(true);
                      await updateReturnStatus(selectedReturn.id, 'rejected', 'İade reddedildi.');
                      setReturns(prev => prev.map(r => r.id === selectedReturn.id ? { ...r, status: 'rejected' } : r));
                      setSelectedReturn(prev => prev ? { ...prev, status: 'rejected' } : null);
                      setProcessingReturn(false);
                    }}
                    disabled={processingReturn}
                    className="flex-1 py-3 bg-red-500 text-white font-black text-xs rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 uppercase tracking-widest"
                  >
                    Reddet
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
