import { MainLayout } from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Görsel Arama',
};

export default function VisualSearchPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Görsel Arama</h1>
        <div className="text-center py-20 text-gray-500">
          <p>Görsel arama yakında eklenecek.</p>
        </div>
      </div>
    </MainLayout>
  );
}
