import { MainLayout } from '@/components/layout/MainLayout';
import Link from 'next/link';

export const metadata = {
  title: 'Mercorada Sat',
};

export default function SellPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Mercorada Satış Yapın</h1>
        <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
          Küresel alıcılara ulaşın, işinizi büyütün. Mercora ile dünyanın dört bir yanındaki müşterilere ürünlerinizi sunun.
        </p>
        <Link
          href="/sell/apply"
          className="inline-block bg-purple-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-800 transition-colors"
        >
          Satıcı Ol
        </Link>
        <div className="grid grid-cols-3 gap-8 mt-16">
          {[
            { title: 'Küresel Pazar', desc: '100+ ülkede milyonlarca alıcı' },
            { title: 'Kolay Yönetim', desc: 'Güçlü satıcı paneli ile ürünlerinizi yönetin' },
            { title: 'Hızlı Ödeme', desc: 'Satışlarınızı haftalık olarak alın' },
          ].map(item => (
            <div key={item.title} className="text-center">
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
