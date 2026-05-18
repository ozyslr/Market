import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, X, Send, Bot, User, Minimize2, 
  Maximize2, Zap, Globe, ShieldCheck, TrendingUp,
  BrainCircuit, MessageSquare, ArrowRight, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { askShoppingAssistant } from '@/lib/gemini';

export function ShoppingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<{ role: 'bot' | 'user', text: string }[]>([
    { role: 'bot', text: "Welcome to Mercora Global. I am your Strategic Artifact Advisor. I can help you with cross-border logistics, tax compliance, or finding the perfect artisan piece. How shall we begin?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await askShoppingAssistant(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: response || "I've encountered a temporary market disruption. Please try again." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "I've encountered a temporary market disruption. Please try again or contact artifact support." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-96 mb-6 bg-white rounded-[2.5rem] shadow-2xl border border-brand-primary/5 flex flex-col overflow-hidden h-[600px]"
          >
            {/* AI Header */}
            <div className="p-6 bg-brand-primary text-white relative flex items-center justify-between">
              <Zap size={100} className="absolute -top-10 -right-10 text-white/5 rotate-12" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                  <BrainCircuit size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest italic">Mercora Navigator</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-bold text-white/60 tracking-widest">Global Intelligence Active</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 relative z-10">
                <button onClick={() => setIsMinimized(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Minimize2 size={16} /></button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X size={16} /></button>
              </div>
            </div>

            {/* AI Market Intel Bar */}
            <div className="px-6 py-3 bg-brand-secondary/30 flex items-center justify-between border-b border-brand-primary/5 overflow-x-auto no-scrollbar gap-4">
               {[
                 { label: 'Market Pulse', icon: TrendingUp },
                 { label: 'Logistics', icon: Globe },
                 { label: 'Compliance', icon: ShieldCheck }
               ].map((item, i) => (
                 <button key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-brand-primary/5 hover:bg-white transition-all whitespace-nowrap">
                    <item.icon size={12} className="text-accent" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary/60">{item.label}</span>
                 </button>
               ))}
            </div>

            {/* Chat Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-brand-secondary/10">
              {messages.map((msg, idx) => (
                <div key={idx} className={cn(
                  "flex items-start gap-3",
                  msg.role === 'user' ? "flex-row-reverse" : ""
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                    msg.role === 'bot' ? "bg-accent text-white" : "bg-brand-primary text-white"
                  )}>
                    {msg.role === 'bot' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-[11px] font-medium leading-relaxed shadow-sm border",
                    msg.role === 'user' 
                      ? "bg-brand-primary text-white border-brand-primary rounded-tr-none" 
                      : "bg-white text-brand-primary border-brand-primary/5 rounded-tl-none"
                  )}>
                    {msg.text}
                    {msg.role === 'bot' && idx === 0 && (
                      <div className="mt-4 grid grid-cols-1 gap-2">
                        {[
                          "Calculate Customs for UK",
                          "Compare Handmade Silk Rugs",
                          "Setup Merchant Dashboard"
                        ].map(q => (
                          <button 
                            key={q} 
                            onClick={() => setInput(q)}
                            className="text-left px-3 py-2 bg-brand-secondary rounded-lg hover:bg-accent hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-between group"
                          >
                            {q} <ArrowRight size={10} className="group-hover:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 p-4 bg-brand-secondary/50 rounded-2xl border border-brand-primary/5 w-fit">
                   <div className="flex gap-1">
                     <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                     <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                     <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                   </div>
                   <span className="text-[10px] font-black uppercase text-brand-primary/40">Analyzing global feeds...</span>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-6 bg-white border-t border-brand-primary/5">
              <div className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Inquire with Navigator..."
                  className="w-full pl-6 pr-14 py-4 bg-brand-secondary/30 rounded-2xl text-xs font-medium outline-none border-2 border-transparent focus:border-accent transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center hover:bg-accent transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="mt-4 text-[9px] font-black text-brand-primary/20 uppercase tracking-widest text-center flex items-center justify-center gap-1">
                <Info size={10} /> AI insights do not constitute financial advice.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (!isOpen) setIsOpen(true);
          else setIsMinimized(!isMinimized);
        }}
        className={cn(
          "w-16 h-16 rounded-[1.5rem] bg-brand-primary text-white flex items-center justify-center shadow-2xl transition-all relative group",
          isOpen && !isMinimized ? "bg-accent" : "hover:shadow-accent/40"
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen && isMinimized ? (
             <motion.div key="max" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <Maximize2 size={24} />
             </motion.div>
          ) : (
            <motion.div key="spark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Sparkles size={24} className="group-hover:animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black animate-bounce">
            1
          </div>
        )}
      </motion.button>
    </div>
  );
}
