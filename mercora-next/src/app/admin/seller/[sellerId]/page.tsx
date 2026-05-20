'use client';

export default async function AdminSellerViewPage({ params }: { params: Promise<{ sellerId: string }> }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Satıcı Detayı</h1>
      <div className="text-center py-20 text-gray-500">
        <p>Satıcı detayları yakında eklenecek.</p>
      </div>
    </div>
  );
}
