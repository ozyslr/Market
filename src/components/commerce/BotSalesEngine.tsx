import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Zap, Globe, Package } from 'lucide-react';

const BOT_NAMES = ['MCR-GlobalBot', 'Nexus-Alpha', 'ArtisanFlow-01', 'ZenithBot', 'CyberAgent-X'];
const CITIES = ['London Hub', 'Istanbul Hub', 'Tokyo Hub', 'New York Hub', 'Berlin Hub'];
const PRODUCTS = [
  'Nexus Flow Pro', 'Kyoto Zen Lamp', 'Ceramic Artifact', 
  'Premium Audio Set', 'Cyber Deck-G1', 'Silk Scarf [Artisan]'
];

export function BotSalesEngine() {
  const [notifications, setNotifications] = useState<{
    id: number;
    bot: string;
    item: string;
    location: string;
    price: string;
  }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger a random bot sale every 10-25 seconds
      if (Math.random() > 0.7) {
        const newSale = {
          id: Date.now(),
          bot: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
          item: PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)],
          location: CITIES[Math.floor(Math.random() * CITIES.length)],
          price: (Math.random() * 500 + 50).toFixed(2),
        };

        setNotifications(prev => [newSale, ...prev.slice(0, 2)]);
        
        // Auto-remove after 6 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== newSale.id));
        }, 6000);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-10 start-10 z-[10000] flex flex-col gap-4 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="bg-brand-primary/95 backdrop-blur-md border border-white/10 p-5 rounded-[2rem] shadow-2xl flex items-center gap-5 w-80 pointer-events-auto"
          >
            <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-accent/20">
              <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-accent">LIVE TRADE</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{n.location}</span>
              </div>
              <p className="text-xs font-black text-white leading-tight">
                {n.bot} <span className="text-green-500 italic">sold</span> {n.item}
              </p>
              <p className="text-[10px] font-bold text-white/40 mt-1">Value: £{n.price}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
