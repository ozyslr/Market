export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="flex justify-between items-center">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-200 rounded-xl" />
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-10 bg-gray-200 rounded w-1/3" />
          <div className="h-12 bg-gray-200 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

export function SearchResultsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryListSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="w-24 h-24 bg-gray-200 rounded-xl shrink-0" />
      ))}
    </div>
  );
}
