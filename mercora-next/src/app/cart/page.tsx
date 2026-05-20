import { MainLayout } from '@/components/layout/MainLayout';
import { CartContent } from '@/components/CartContent';

export const metadata = {
  title: 'Sepetim',
};

export default function CartPage() {
  return (
    <MainLayout>
      <CartContent />
    </MainLayout>
  );
}
