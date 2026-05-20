import { MainLayout } from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Siparişlerim',
};

export default function OrdersPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Siparişlerim</h1>
        <div className="text-center py-20 text-gray-500">
          <p>Sipariş geçmişiniz burada görünecek.</p>
          <p className="text-sm mt-2">Firebase entegrasyonu tamamlandığında siparişlerinizi görüntüleyebileceksiniz.</p>
        </div>
      </div>
    </MainLayout>
  );
}
