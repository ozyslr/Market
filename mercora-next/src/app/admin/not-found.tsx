import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-purple-700 mb-2">404</h1>
        <p className="text-gray-500 mb-4">Bu admin sayfası bulunamadı.</p>
        <Link href="/admin" className="text-purple-700 font-medium hover:underline">
          Dashboard'a Dön
        </Link>
      </div>
    </div>
  );
}
