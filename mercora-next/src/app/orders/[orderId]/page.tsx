import { cacheLife } from 'next/cache';
import { MainLayout } from '@/components/layout/MainLayout';

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  'use cache';
  cacheLife('hours');

  const { orderId } = await params;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sipariş Detayı</h1>
        <div className="text-center py-20 text-gray-500">
          <p>Sipariş detayları yakında eklenecek.</p>
          <p className="text-sm mt-2">Sipariş ID: {orderId}</p>
        </div>
      </div>
    </MainLayout>
  );
}
