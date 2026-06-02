import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  Minimize2,
  Maximize2,
  Zap,
  BrainCircuit,
  Trash2,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { askShoppingAssistant } from '@/lib/gemini';

const QUICK_REPLIES = [
  { label: 'Kargo takibi nasıl yapılır?', icon: '��' },
  { label: 'İade süreci nasıl işler?', icon: '🔄' },
  { label: 'Ödeme yöntemleri neler?', icon: '💳' },
  { label: 'Satıcı olmak istiyorum', icon: '🏪' },
  { label: 'Komisyon oranları nedir?', icon: '📊' },
  { label: 'Hangi kargoyla gönderim?', icon: '🚚' },
];

const STORAGE_KEY = 'benimolan_chat_history';

function loadHistory(): { role: 'bot' | 'user'; text: string }[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs: { role: 'bot' | 'user'; text: string }[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-20)));
  } catch {
    /* empty */
  }
}

export function ShoppingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<{ role: 'bot' | 'user'; text: string }[]>(() => {
    const saved = loadHistory();
    return saved.length > 0
      ? saved
      : [
          {
            role: 'bot',
            text: 'Merhaba! Ben Benim Olan alışveriş asistanınızım. Sipariş, kargo, iade, ödeme veya ürünler hakkında sorularınızı yanıtlayabilirim. Size nasıl yardımcı olabilirim?',
          },
        ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg = text.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await askShoppingAssistant(userMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: response || 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen tekrar deneyin.',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'Geçici bir sorun oluştu. Lütfen tekrar deneyin veya destek ekibiyle iletişime geçin.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { role: 'bot', text: 'Merhaba! Sohbet geçmişi temizlendi. Size nasıl yardımcı olabilirim?' },
    ]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="fixed bottom-8 end-8 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-96 mb-6 bg-white rounded-[2.5rem] shadow-2xl border border-brand-primary/5 flex flex-col overflow-hidden h-[600px]"
          >
            {/* Header */}
            <div className="p-6 bg-brand-primary text-white relative flex items-center justify-between shrink-0">
              <Zap size={100} className="absolute -top-10 -end-10 text-white/5 rotate-12" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                  <BrainCircuit size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest italic">
                    Benim Olan Asistan
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-bold text-white/60 tracking-widest">
                      7/24 AI Destek
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 relative z-10">
                <button
                  onClick={clearChat}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Sohbeti Temizle"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Minimize2 size={16} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '')}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                      msg.role === 'bot' ? 'bg-brand-primary text-white' : 'bg-accent text-white',
                    )}
                  >
                    {msg.role === 'bot' ? (
                      <Bot size={16} />
                    ) : (
                      <span className="text-[11px] font-black">S</span>
                    )}
                  </div>
                  <div
                    className={cn(
                      'text-xs leading-relaxed rounded-2xl px-4 py-3 max-w-[75%]',
                      msg.role === 'bot'
                        ? 'bg-brand-secondary text-brand-primary'
                        : 'bg-accent text-white',
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-brand-primary text-white">
                    <Bot size={16} />
                  </div>
                  <div className="bg-brand-secondary rounded-2xl px-4 py-3">
                    <div className="flex gap-1.5">
                      <div
                        className="w-2 h-2 bg-brand-primary/30 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <div
                        className="w-2 h-2 bg-brand-primary/30 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <div
                        className="w-2 h-2 bg-brand-primary/30 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Replies */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/30 mb-2">
                  Hızlı Sorular
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REPLIES.map((qr, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(qr.label)}
                      className="px-3 py-1.5 bg-brand-secondary/50 hover:bg-accent/10 rounded-xl text-[10px] font-bold text-brand-primary/60 hover:text-accent transition-all"
                    >
                      {qr.icon} {qr.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-brand-primary/5 shrink-0">
              <div className="flex items-center gap-2 bg-brand-secondary rounded-2xl p-1.5 ps-4">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 bg-transparent text-xs font-bold outline-none placeholder:text-brand-primary/20"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-accent text-white rounded-xl disabled:opacity-50 hover:scale-105 transition-all"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized Bar / Closed Button */}
      {isOpen && isMinimized && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-brand-primary text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <BrainCircuit size={18} className="text-accent" />
          <span className="text-xs font-black uppercase tracking-widest">Asistan</span>
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="ms-2 p-1 hover:bg-white/10 rounded"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-gradient-to-br from-accent to-purple-500 rounded-2xl shadow-2xl shadow-accent/25 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Sparkles size={28} className="text-white" />
        </motion.button>
      )}
    </div>
  );
}
