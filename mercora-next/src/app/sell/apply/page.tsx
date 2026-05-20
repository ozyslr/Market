import { MainLayout } from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Satıcı Başvurusu',
};

export default function SellerApplyPage() {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Satıcı Başvurusu</h1>
        <div className="text-center py-20 text-gray-500">
          <p>Satıcı başvuru formu yakında eklenecek.</p>
        </div>
      </div>
    </MainLayout>
  );
}
