import React, { useState, useEffect } from 'react';
import {
  Shield, Search, Filter, Clock, User, Package, Store, ShoppingBag,
  Tag, Star, RotateCcw, Settings, Loader2, ChevronDown, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getAuditLogs, AuditLogEntry, AuditAction, AuditFilter,
  AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS,
} from '@/services/auditLogService';

const ACTION_ICONS: Partial<Record<string, any>> = {
  product: Package,
  seller: Store,
  order: ShoppingBag,
  user: User,
  coupon: Tag,
  review: Star,
  return: RotateCcw,
  settings: Settings,
  webhook: Shield,
};

function getActionColor(action: AuditAction): string {
  if (action.includes('approve') || action.includes('activate')) return 'bg-green-50 text-green-600';
  if (action.includes('reject') || action.includes('delete') || action.includes('cancel')) return 'bg-red-50 text-red-500';
  if (action.includes('suspend') || action.includes('ban')) return 'bg-orange-50 text-orange-600';
  if (action.includes('create')) return 'bg-blue-50 text-blue-600';
  if (action.includes('update') || action.includes('change')) return 'bg-purple-50 text-purple-600';
  return 'bg-zinc-50 text-zinc-600';
}

export function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AuditFilter>({ limit: 100 });
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    setLoading(true);
    getAuditLogs(filter).then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, [filter]);

  const entities = [...new Set(logs.map(l => l.entityType))];

  return (
    <div className="bg-white rounded-[3.5rem] p-8 lg:p-12 border border-[#F8F8FA] shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Denetim Kayıtları</h3>
          <p className="text-[10px] font-bold text-[#1A1033]/40 uppercase tracking-widest mt-1">Tüm admin işlemlerinin güvenlik günlüğü</p>
        </div>
        <button onClick={() => {
          const csv = ['tarih,aktör,aksiyon,varlık,detay', ...logs.map(l =>
            `${l.createdAt},${l.actorEmail},${AUDIT_ACTION_LABELS[l.action]},${l.entityLabel},${l.details || ''}`
          )].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
          a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`;
          a.click();
        }} className="px-4 py-2.5 bg-[#F8F8FA] text-[#1A1033] rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <Download size={14} /> CSV Export
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter({ limit: 100 })}
          className={cn('px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest',
            !filter.entityType ? 'bg-[#1A1033] text-white' : 'bg-[#F8F8FA] text-[#1A1033]/40')}>
          Tümü
        </button>
        {entities.map(e => {
          const Icon = ACTION_ICONS[e] || Package;
          return (
            <button key={e} onClick={() => setFilter({ entityType: e, limit: 100 })}
              className={cn('px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5',
                filter.entityType === e ? 'bg-[#1A1033] text-white' : 'bg-[#F8F8FA] text-[#1A1033]/40')}>
              <Icon size={12} /> {AUDIT_ENTITY_LABELS[e] || e}
            </button>
          );
        })}
        <button onClick={() => setLogs(prev => [...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))}
          className="ml-auto px-3 py-1.5 bg-[#F8F8FA] rounded-xl text-[9px] font-black uppercase tracking-widest text-[#1A1033]/40 flex items-center gap-1">
          <Clock size={12} /> Yenile
        </button>
      </div>

      {/* Log List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <Shield size={40} className="mx-auto text-[#1A1033]/10 mb-4" />
          <p className="text-sm font-bold text-[#1A1033]/30">Kayıt bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {logs.map(entry => {
            const Icon = ACTION_ICONS[entry.entityType] || Package;
            const actionColor = getActionColor(entry.action);
            return (
              <div key={entry.id}
                onClick={() => setSelectedLog(entry)}
                className="flex items-center gap-4 p-4 bg-[#F8F8FA] rounded-2xl hover:bg-[#F0F0F5] transition-colors cursor-pointer group">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", actionColor)}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase", actionColor)}>
                      {AUDIT_ACTION_LABELS[entry.action] || entry.action}
                    </span>
                    <span className="text-xs font-bold text-[#1A1033] truncate">{entry.entityLabel}</span>
                  </div>
                  <p className="text-[10px] text-[#1A1033]/40 mt-0.5">
                    {entry.actorEmail} · {entry.actorRole} · {new Date(entry.createdAt).toLocaleString('tr-TR')}
                  </p>
                  {entry.details && (
                    <p className="text-[10px] text-[#1A1033]/50 mt-0.5 truncate">{entry.details}</p>
                  )}
                </div>
                <ChevronDown size={14} className="text-[#1A1033]/20 group-hover:text-[#1A1033]/40 shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display font-black text-[#1A1033]">İşlem Detayı</h3>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-[#F8F8FA] rounded-xl">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#1A1033]/40">Tarih</span><span className="font-bold">{new Date(selectedLog.createdAt).toLocaleString('tr-TR')}</span></div>
              <div className="flex justify-between"><span className="text-[#1A1033]/40">Aktör</span><span className="font-bold">{selectedLog.actorEmail} ({selectedLog.actorRole})</span></div>
              <div className="flex justify-between"><span className="text-[#1A1033]/40">İşlem</span><span className="font-bold">{AUDIT_ACTION_LABELS[selectedLog.action]}</span></div>
              <div className="flex justify-between"><span className="text-[#1A1033]/40">Varlık</span><span className="font-bold">{selectedLog.entityLabel}</span></div>
              <div className="flex justify-between"><span className="text-[#1A1033]/40">Tip</span><span className="font-bold">{AUDIT_ENTITY_LABELS[selectedLog.entityType] || selectedLog.entityType}</span></div>
              {selectedLog.details && (
                <div className="pt-2 border-t border-[#F8F8FA]">
                  <p className="text-[#1A1033]/40 text-xs mb-1">Detay</p>
                  <p className="text-sm">{selectedLog.details}</p>
                </div>
              )}
              {selectedLog.before && (
                <div className="pt-2 border-t border-[#F8F8FA]">
                  <p className="text-[#1A1033]/40 text-xs mb-1">Önceki Değer</p>
                  <pre className="text-[10px] bg-[#F8F8FA] rounded-xl p-3 overflow-x-auto">{JSON.stringify(selectedLog.before, null, 2)}</pre>
                </div>
              )}
              {selectedLog.after && (
                <div className="pt-2 border-t border-[#F8F8FA]">
                  <p className="text-[#1A1033]/40 text-xs mb-1">Yeni Değer</p>
                  <pre className="text-[10px] bg-[#F8F8FA] rounded-xl p-3 overflow-x-auto">{JSON.stringify(selectedLog.after, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
