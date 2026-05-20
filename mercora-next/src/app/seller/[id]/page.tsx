import { MainLayout } from '@/components/layout/MainLayout';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Satıcı | Mercora` };
}

export default async function SellerStorePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Satıcı Mağazası</h1>
        <div className="text-center py-20 text-gray-500">
          <p>Satıcı mağazası yakında eklenecek.</p>
        </div>
      </div>
    </MainLayout>
  );
}
