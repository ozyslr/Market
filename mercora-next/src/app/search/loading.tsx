import { MainLayout } from '@/components/layout/MainLayout';
import { SearchResultsSkeleton } from '@/components/ui/Skeleton';

export default function SearchLoading() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-12 bg-gray-200 rounded-xl mb-6 max-w-xl animate-pulse" />
        <SearchResultsSkeleton count={8} />
      </div>
    </MainLayout>
  );
}
