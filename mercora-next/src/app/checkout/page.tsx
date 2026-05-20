import { MainLayout } from '@/components/layout/MainLayout';
import { CheckoutContent } from '@/components/CheckoutContent';

export const metadata = {
  title: 'Ödeme',
};

export default function CheckoutPage() {
  return (
    <MainLayout>
      <CheckoutContent />
    </MainLayout>
  );
}
