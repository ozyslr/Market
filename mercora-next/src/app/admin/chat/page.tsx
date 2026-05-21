'use client';
import { useState, useEffect } from 'react';
import { MessageSquare, User, Clock, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  createdAt: { toDate: () => Date } | Date;
}

interface ChatSession {
  id: string;
  userEmail: string;
  lastMessage: string;
  messageCount: number;
  status: 'active' | 'closed';
  createdAt: { toDate: () => Date } | Date;
  messages?: ChatMessage[];
}

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'chatSessions'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ChatSession));
        setSessions(data);
        setLoading(false);
      },
      () => {
        setError('Sohbet oturumlari yuklenirken bir hata oluştu.');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  async function loadMessages(sessionId: string) {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }
    try {
      const snap = await getDocs(
        query(collection(db, 'chatSessions', sessionId, 'messages'), orderBy('createdAt', 'asc'))
      );
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, messages: msgs } : s)));
      setExpandedId(sessionId);
    } catch {
      setError('Mesajlar yuklenirken hata oluştu.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Sohbet oturumlari yukleniyor...</span>
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
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition">
            Sayfayi Yenile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-7 h-7 text-purple-700" />
          <h1 className="text-2xl font-bold text-gray-900">Sohbet Yönetimi</h1>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Henuz sohbet oturumu bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const isExpanded = expandedId === session.id;
              return (
                <div key={session.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => loadMessages(session.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <h3 className="font-semibold text-gray-900 truncate">{session.userEmail || 'Bilinmeyen Kullanici'}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            session.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {session.status === 'active' ? 'Aktif' : 'Kapalı'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{session.lastMessage || 'Mesaj yok'}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span>{session.messageCount || 0} mesaj</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {'toDate' in session.createdAt
                            ? session.createdAt.toDate().toLocaleDateString('tr-TR')
                            : (session.createdAt as Date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400 ml-3" /> : <ChevronDown className="w-5 h-5 text-gray-400 ml-3" />}
                  </button>

                  {isExpanded && session.messages && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                        {session.messages.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">Henuz mesaj yok.</p>
                        ) : (
                          session.messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-2 rounded-lg text-sm max-w-[80%] ${
                                msg.sender === 'user'
                                  ? 'bg-purple-100 ml-auto'
                                  : 'bg-gray-100'
                              }`}
                            >
                              <p className="text-gray-800">{msg.text}</p>
                              <span className="text-xs text-gray-400 mt-1 block">
                                {'toDate' in msg.createdAt
                                  ? msg.createdAt.toDate().toLocaleTimeString('tr-TR')
                                  : (msg.createdAt as Date).toLocaleTimeString('tr-TR')}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
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
