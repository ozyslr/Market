import { MainLayout } from '@/components/layout/MainLayout';
import { CollectionContent } from '@/components/CollectionContent';

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  return { title: `${type} | Mercora` };
}

export default async function CollectionPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  return (
    <MainLayout>
      <CollectionContent type={type} />
    </MainLayout>
  );
}
