'use client';
import { useState, useEffect } from 'react';
import { MessageSquare, Mail, Clock, Check, X, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getTickets, updateTicketStatus } from '@/services/supportService';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  customerEmail: string;
  status: 'acik' | 'yanitlandi' | 'kapali';
  createdAt: string;
}

type FilterTab = 'tumu' | 'acik' | 'yanitlandi' | 'kapali';

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'tumu', label: 'Tümü' },
  { key: 'acik', label: 'Açık' },
  { key: 'yanitlandi', label: 'Yanıtlandı' },
  { key: 'kapali', label: 'Kapalı' },
];

const statusConfig: Record<string, { color: string; label: string }> = {
  acik: { color: 'bg-yellow-100 text-yellow-800', label: 'Açık' },
  yanitlandi: { color: 'bg-blue-100 text-blue-800', label: 'Yanıtlandı' },
  kapali: { color: 'bg-gray-100 text-gray-800', label: 'Kapalı' },
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('tumu');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    setError(null);
    try {
      const data = await getTickets();
      setTickets(data.map((t: any) => ({
        id: t.id,
        subject: t.subject,
        message: t.message,
        customerEmail: t.userEmail || t.userId || '',
        status: t.status === 'open' ? 'acik' : t.status === 'awaiting_reply' ? 'yanitlandi' : t.status === 'closed' ? 'kapali' : 'acik',
        createdAt: t.createdAt || new Date().toISOString(),
      })));
    } catch {
      setError('Destek talepleri yuklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  const statusMapToApi: Record<string, string> = { acik: 'open', yanitlandi: 'awaiting_reply', kapali: 'closed' };

  async function handleStatusUpdate(id: string, status: string) {
    setUpdatingId(id);
    try {
      await updateTicketStatus(id, statusMapToApi[status] as any);
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: status as Ticket['status'] } : t))
      );
    } catch {
      setError('Durum guncellenirken hata oluştu.');
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = activeTab === 'tumu' ? tickets : tickets.filter((t) => t.status === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Destek talepleri yukleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Hata</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={loadTickets} className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition">
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-7 h-7 text-purple-700" />
          <h1 className="text-2xl font-bold text-gray-900">Destek Talepleri</h1>
        </div>

        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-purple-700 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Henuz destek talebi bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket) => {
              const isExpanded = expandedId === ticket.id;
              const cfg = statusConfig[ticket.status] || statusConfig.acik;
              return (
                <div key={ticket.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{ticket.subject}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{ticket.message.substring(0, 80)}...</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{ticket.customerEmail}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400 ml-3" /> : <ChevronDown className="w-5 h-5 text-gray-400 ml-3" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                      </div>
                      {ticket.status !== 'kapali' && (
                        <div className="flex gap-2 mt-3">
                          {ticket.status === 'acik' && (
                            <button
                              onClick={() => handleStatusUpdate(ticket.id, 'yanitlandi')}
                              disabled={updatingId === ticket.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition"
                            >
                              {updatingId === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              Yanıtlandı
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusUpdate(ticket.id, 'kapali')}
                            disabled={updatingId === ticket.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 transition"
                          >
                            {updatingId === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            Kapat
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
