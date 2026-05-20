import { MainLayout } from '@/components/layout/MainLayout';
import { ProductDetailSkeleton } from '@/components/ui/Skeleton';

export default function ProductLoading() {
  return (
    <MainLayout>
      <ProductDetailSkeleton />
    </MainLayout>
  );
}
