import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, Send, ChevronLeft, Circle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getUserConversations,
  getConversationMessages,
  sendConversationMessage,
  markConversationRead,
  subscribeToConversationMessages,
  getOrCreateConversation,
  type Conversation,
  type ConversationMessage,
} from '@/services/chatService';
import { cn } from '@/lib/utils';
import { SEO } from '@/components/common/SEO';
import { Timestamp } from 'firebase/firestore';

export function MessageCenter() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getUserConversations(user.id).then((data) => {
      setConversations(data);
      setLoading(false);
    });
  }, [user]);

  // Handle ?sellerId=... from product page → auto-open or create conversation
  useEffect(() => {
    const sellerId = searchParams.get('sellerId');
    if (!sellerId || !user || loading) return;
    const productId = searchParams.get('productId') || undefined;
    const productTitle = searchParams.get('productTitle') || undefined;
    getOrCreateConversation(user.id, sellerId, productId, productTitle).then((convId) => {
      setSelectedId(convId);
    });
  }, [searchParams, user, loading]);

  // Subscribe to messages for selected conversation
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    const unsub = subscribeToConversationMessages(selectedId, setMessages);
    return unsub;
  }, [selectedId]);

  // Mark as read when selecting a conversation
  useEffect(() => {
    if (selectedId && user) {
      markConversationRead(selectedId, user.id).then(() => {
        getUserConversations(user.id).then(setConversations);
      });
    }
  }, [selectedId, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedConv = conversations.find((c) => c.id === selectedId);

  const handleSend = useCallback(async () => {
    if (!selectedId || !user || !inputText.trim()) return;
    setSending(true);
    try {
      await sendConversationMessage(selectedId, user.id, inputText.trim());
      setInputText('');
    } finally {
      setSending(false);
    }
  }, [selectedId, user, inputText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMe = (msg: ConversationMessage) => msg.senderId === user?.id;

  const formatTime = (ts: string | Timestamp) => {
    const d = typeof ts === 'string' ? new Date(ts) : ts.toDate();
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000)
      return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'Dün';
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  if (!user) {
    return (
      <div className="flex justify-center py-24">
        <p className="text-sm text-gray-500">Giriş yapmanız gerekiyor.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8FA] p-4 lg:p-6">
      <SEO title="Mesajlarım" />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-display font-black uppercase italic tracking-tighter text-brand-primary">
            Mesajlarım
          </h1>
        </div>

        {/* Two-panel */}
        <div className="bg-white rounded-2xl border border-brand-primary/5 overflow-hidden grid grid-cols-1 lg:grid-cols-[340px_1fr] min-h-[70vh]">
          {/* Left panel — conversation list */}
          <div
            className={cn(
              'border-r border-brand-primary/5 overflow-y-auto',
              selectedId && mobileOpen ? 'hidden lg:block' : 'block',
            )}
          >
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <MessageSquare size={40} className="text-brand-primary/20 mb-3" />
                <p className="text-xs font-bold text-brand-primary/40">Henüz mesajınız yok.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const unread =
                  user && conv.buyerId === user.id ? conv.unreadBuyer : conv.unreadSeller;
                const isBuyer = user && conv.buyerId === user.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedId(conv.id);
                      setMobileOpen(true);
                    }}
                    className={cn(
                      'w-full text-start p-4 border-b border-brand-primary/5 transition-colors hover:bg-[#F8F8FA]',
                      selectedId === conv.id ? 'bg-[#F0F0FF]' : '',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-accent uppercase">
                          {isBuyer ? 'S' : 'A'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-brand-primary truncate">
                            {isBuyer ? 'Satıcı' : 'Alıcı'}
                          </p>
                          {conv.lastMessageAt && (
                            <span className="text-[10px] text-brand-primary/40 shrink-0">
                              {formatDate(conv.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        {conv.productTitle && (
                          <p className="text-[10px] text-brand-primary/50 mt-0.5 truncate">
                            {conv.productTitle}
                          </p>
                        )}
                        <p
                          className={cn(
                            'text-xs mt-1 truncate',
                            unread > 0 ? 'font-bold text-brand-primary' : 'text-brand-primary/50',
                          )}
                        >
                          {conv.lastMessage || 'Mesaj yok'}
                        </p>
                      </div>
                      {unread > 0 && (
                        <Circle size={10} className="text-accent fill-accent shrink-0 mt-1" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right panel — messages */}
          <div
            className={cn(
              'flex flex-col',
              !selectedId && mobileOpen ? '' : '',
              selectedId && !mobileOpen ? 'hidden lg:flex' : 'flex',
            )}
          >
            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto text-brand-primary/10 mb-4" />
                  <p className="text-sm font-bold text-brand-primary/40">Bir konuşma seçin</p>
                </div>
              </div>
            ) : (
              <>
                {/* Message header */}
                <div className="flex items-center gap-3 p-3 border-b border-brand-primary/5">
                  <button
                    onClick={() => {
                      setSelectedId(null);
                      setMobileOpen(false);
                    }}
                    className="lg:hidden p-1 text-brand-primary/40 hover:text-accent"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-xs font-black text-accent uppercase">
                      {selectedConv && user && selectedConv.buyerId === user.id ? 'S' : 'A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-primary">
                      {selectedConv && user && selectedConv.buyerId === user.id
                        ? 'Satıcı'
                        : 'Alıcı'}
                    </p>
                    {selectedConv?.productTitle && (
                      <p className="text-[10px] text-brand-primary/50">
                        {selectedConv.productTitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-xs text-center text-brand-primary/30 py-8">
                      Henüz mesaj yok. İlk mesajı gönderin.
                    </p>
                  )}
                  {messages.map((msg, i) => (
                    <div
                      key={msg.id ?? i}
                      className={cn('flex', isMe(msg) ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                          isMe(msg)
                            ? 'bg-accent text-white rounded-br-md'
                            : 'bg-[#F0F0F5] text-brand-primary rounded-bl-md',
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        <p
                          className={cn(
                            'text-[9px] mt-1 text-right',
                            isMe(msg) ? 'text-white/60' : 'text-brand-primary/40',
                          )}
                        >
                          {msg.ts ? formatTime(msg.ts) : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Input bar */}
                <div className="border-t border-brand-primary/5 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Mesaj yazın..."
                      className="flex-1 px-4 py-2.5 bg-[#F8F8FA] rounded-xl text-sm
                        outline-none border border-transparent focus:border-accent/30
                        placeholder:text-brand-primary/30 transition-colors"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputText.trim() || sending}
                      className="p-2.5 bg-accent text-white rounded-xl hover:bg-accent/90
                        disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {sending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
