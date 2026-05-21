'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-bold text-purple-700 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Sayfa Bulunamadı</h2>
        <p className="text-gray-500 mb-8">
          Aradığınız sayfa kaldırılmış, adı değiştirilmiş veya geçici olarak kullanılamıyor olabilir.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-purple-700 text-white rounded-xl font-medium hover:bg-purple-800 transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Geri Git
          </button>
        </div>
      </div>
    </div>
  );
}
