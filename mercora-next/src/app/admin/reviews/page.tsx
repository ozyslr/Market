'use client';

import { useState, useEffect } from 'react';
import { Star, Check, X, MessageSquare, Loader2, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { getPendingReviews, reviewItem } from '@/services/moderationService';

interface Review {
  id: string;
  productName: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingReviews(tab === 'pending' ? 'review' : undefined);
      setReviews(data.map((item: any) => ({
        id: item.id,
        productName: item.targetName || 'Urun',
        userName: item.submittedBy || 'Kullanici',
        rating: item.rating || 5,
        comment: item.reason || '',
        createdAt: item.createdAt || new Date().toISOString(),
      })));
    } catch {
      setError('Yorumlar yuklenirken hata olustu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [tab]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await reviewItem(id, 'approved', '');
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError('Onaylama basarisiz.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setActionLoading(id);
    try {
      await reviewItem(id, 'rejected', rejectReason.trim());
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setRejectModal(null);
      setRejectReason('');
    } catch {
      setError('Reddetme basarisiz.');
    } finally {
      setActionLoading(null);
    }
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-6 h-6 text-purple-700" />
          <h1 className="text-2xl font-bold text-gray-900">Yorum Yonetimi</h1>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-1 mb-6 bg-white rounded-lg border border-gray-200 p-1 w-fit">
          <button onClick={() => setTab('pending')} className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === 'pending' ? 'bg-purple-700 text-white' : 'text-gray-600 hover:text-gray-900'}`}>Onay Bekleyenler</button>
          <button onClick={() => setTab('all')} className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === 'all' ? 'bg-purple-700 text-white' : 'text-gray-600 hover:text-gray-900'}`}>Tumu</button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 bg-white rounded-xl border border-gray-200 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Yukleniyor...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 bg-white rounded-xl border border-gray-200 text-gray-500">
            <MessageSquare className="w-10 h-10" />
            <span>{tab === 'pending' ? 'Onay bekleyen yorum yok.' : 'Henuz yorum bulunmuyor.'}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 bg-white rounded-xl border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{review.productName || 'Urun'}</h3>
                    <p className="text-sm text-gray-500">{review.userName || 'Kullanici'} &middot; {new Date(review.createdAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                </div>
                <p className="text-sm text-gray-700 mb-4">{review.comment}</p>
                {tab === 'pending' && (
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={actionLoading === review.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                      Onayla
                    </button>
                    <button
                      onClick={() => setRejectModal(review.id)}
                      disabled={actionLoading === review.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Reddet
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {rejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Reddetme Sebebi</h3>
              <textarea
                placeholder="Reddetme sebebini girin..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-700 focus:border-transparent mb-4"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Iptal</button>
                <button onClick={() => handleReject(rejectModal)} disabled={!rejectReason.trim()} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">Reddet</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
