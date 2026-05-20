import { MainLayout } from '@/components/layout/MainLayout';
import { SearchContent } from '@/components/SearchContent';

interface Props {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, category } = await searchParams;

  return (
    <MainLayout>
      <SearchContent query={q || ''} categoryId={category || ''} />
    </MainLayout>
  );
}
