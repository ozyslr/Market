import { MainLayout } from '@/components/layout/MainLayout';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqSchema } from '@/components/seo/schemas';

export const metadata = {
  title: 'Destek',
};

const faqs = [
  { question: 'Nasıl sipariş verebilirim?', answer: 'Ürün sayfasına gidip sepete ekleyerek, ardından ödeme adımlarını takip ederek sipariş verebilirsiniz.' },
  { question: 'Siparişimi nasıl takip edebilirim?', answer: 'Hesabınıza giriş yapıp "Siparişlerim" bölümünden sipariş durumunuzu takip edebilirsiniz.' },
  { question: 'İade nasıl yapılır?', answer: 'Siparişlerim sayfasından ilgili sipariş için iade talebi oluşturabilirsiniz.' },
  { question: 'Hangi ödeme yöntemlerini kullanabilirim?', answer: 'Kredi kartı, banka kartı ve havale/EFT ile ödeme yapabilirsiniz.' },
  { question: 'Kargolama ne kadar sürer?', answer: 'Siparişiniz 3-7 iş günü içinde teslim edilir.' },
];

export default function SupportPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Yardım Merkezi</h1>
        <div className="text-center py-20 text-gray-500">
          <p>Yardım merkezi sayfası yakında eklenecek.</p>
        </div>
        <JsonLd data={faqSchema(faqs)} />
      </div>
    </MainLayout>
  );
}
