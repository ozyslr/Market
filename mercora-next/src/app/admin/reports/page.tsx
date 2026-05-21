'use client';
import { useState } from 'react';
import { FileText, Download, BarChart3, Users, Package, Receipt, AlertCircle } from 'lucide-react';

const reports = [
  { id: 'sales', name: 'Satis Raporu', description: 'Donem bazinda satis performansi, gelir ve siparis analizi.', icon: BarChart3 },
  { id: 'users', name: 'Kullanici Raporu', description: 'Kayit, aktif kullanici ve segmentasyon istatistikleri.', icon: Users },
  { id: 'products', name: 'Urun Raporu', description: 'En cok satilan, goruntulenen ve stokta olan urunler.', icon: Package },
  { id: 'tax', name: 'Vergi Raporu', description: 'Donem vergi hesaplamalari ve KDV ozetleri.', icon: Receipt },
];

export default function ReportsPage() {
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  const handleView = (name: string) => {
    setComingSoon(name);
    setTimeout(() => setComingSoon(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Tumunu Indir
          </button>
        </div>

        {comingSoon && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-800"><strong>{comingSoon}</strong> raporu cok yakinda kullanima sunulacaktir.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reports.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <r.icon className="w-6 h-6 text-purple-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{r.name}</h3>
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{r.description}</p>
                  <button
                    onClick={() => handleView(r.name)}
                    className="mt-3 text-sm text-purple-700 font-medium hover:text-purple-800 transition-colors"
                  >
                    Goruntule &rarr;
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
