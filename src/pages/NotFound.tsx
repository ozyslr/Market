import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-8">
      <p className="text-8xl font-black text-accent mb-4">404</p>
      <h1 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033] mb-2">
        Sayfa Bulunamadı
      </h1>
      <p className="text-[#1A1033]/40 text-sm mb-8">
        Aradığınız sayfa taşınmış veya silinmiş olabilir.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl font-black text-sm uppercase tracking-wide hover:bg-accent/90 transition-colors"
      >
        <Home size={16} /> Ana Sayfaya Dön
      </Link>
    </div>
  );
}
