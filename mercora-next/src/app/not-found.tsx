import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';

export default function NotFound() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-black text-gray-200 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Sayfa Bulunamadı</h2>
        <p className="text-gray-500 mb-8">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link
          href="/"
          className="inline-block bg-purple-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-800 transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </MainLayout>
  );
}
