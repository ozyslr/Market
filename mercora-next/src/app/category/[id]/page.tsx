import { MainLayout } from '@/components/layout/MainLayout';
import { CategoryContent } from '@/components/CategoryContent';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `${id} | Mercora` };
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <MainLayout>
      <CategoryContent categoryId={id} />
    </MainLayout>
  );
}
