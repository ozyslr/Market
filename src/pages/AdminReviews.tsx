import React, { useState, useEffect } from 'react';
import { getAllReviews, approveReview, rejectReview } from '@/services/reviewService';
import { Review } from '@/types';
import { Star, CheckCircle, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    getAllReviews().then(data => { setReviews(data); setLoading(false); });
  }, []);

  const handleApprove = async (id: string) => {
    setActing(id);
    try {
      await approveReview(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, verified: true } : r));
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Bu yorumu silmek istiyor musunuz?')) return;
    setActing(id);
    try {
      await rejectReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } finally {
      setActing(null);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="bg-white rounded-[3.5rem] p-8 lg:p-12 border border-[#F8F8FA] shadow-sm">
      <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033] mb-8">Ürün Değerlendirmeleri</h3>

      {reviews.length === 0 ? (
        <p className="text-center py-16 text-[#1A1033]/30 font-bold">Henüz yorum yok</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className={cn('p-5 rounded-2xl border transition-colors', review.verified ? 'bg-green-50 border-green-100' : 'bg-[#F8F8FA] border-transparent')}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {review.userAvatar && <img src={review.userAvatar} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" alt={review.userName} />}
                    <div>
                      <p className="text-xs font-black text-[#1A1033]">{review.userName}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={10} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-[#1A1033]/20'} />
                        ))}
                      </div>
                    </div>
                    {review.verified && <span className="text-[9px] font-black uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Onaylı</span>}
                  </div>
                  <p className="text-sm text-[#1A1033]/70 leading-relaxed">{review.comment}</p>
                  <p className="text-[10px] text-[#1A1033]/30 mt-1">{new Date(review.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!review.verified && (
                    <button onClick={() => handleApprove(review.id)} disabled={acting === review.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase disabled:opacity-40 hover:bg-green-600 transition-colors">
                      <CheckCircle size={11} /> Onayla
                    </button>
                  )}
                  <button onClick={() => handleReject(review.id)} disabled={acting === review.id}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
