import { MainLayout } from '@/components/layout/MainLayout';
import { WishlistContent } from '@/components/WishlistContent';

export const metadata = {
  title: 'Favorilerim',
};

export default function WishlistPage() {
  return (
    <MainLayout>
      <WishlistContent />
    </MainLayout>
  );
}
