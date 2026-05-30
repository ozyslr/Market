import React from 'react';
import { Star, Trash2, MessageSquare, BadgeCheck } from 'lucide-react';
import { useReviewStore } from '@/store/useReviewStore';

export function AdminReviews() {
  const reviews = useReviewStore((s) => s.reviews);
  const removeReview = useReviewStore((s) => s.removeReview);

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-4 italic">Toplam Yorum</p>
          <h4 className="text-4xl font-display font-black tracking-tighter text-[#1A1033]">{reviews.length}</h4>
        </div>
        <div className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-4 italic">Ortalama Puan</p>
          <h4 className="text-4xl font-display font-black tracking-tighter text-[#FF5200] flex items-center gap-2">{avgRating} <Star size={28} className="fill-[#FF5200] text-[#FF5200]" /></h4>
        </div>
        <div className="bg-white rounded-[3rem] p-10 border border-[#F8F8FA] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1033]/30 mb-4 italic">Onaylı Yorum</p>
          <h4 className="text-4xl font-display font-black tracking-tighter text-green-600">{reviews.filter((r) => r.verified).length}</h4>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] p-12 border border-[#F8F8FA] shadow-sm">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center"><MessageSquare size={24} /></div>
          <h3 className="text-2xl font-display font-black uppercase italic tracking-tighter text-[#1A1033]">Yorum Moderasyonu</h3>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare size={40} className="mx-auto text-[#1A1033]/10 mb-4" />
            <p className="text-sm font-bold text-[#1A1033]/30 italic">Henüz değerlendirme yok.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-6 bg-[#F8F8FA] rounded-2xl p-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-black text-sm text-[#1A1033]">{r.userName}</span>
                    {r.verified && <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-600"><BadgeCheck size={12} /> Onaylı</span>}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={13} className={i <= r.rating ? 'fill-[#FF5200] text-[#FF5200]' : 'text-[#1A1033]/15'} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-[#1A1033]/30 uppercase tracking-widest">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <p className="text-sm text-[#1A1033]/60 italic leading-relaxed">{r.comment}</p>
                  {r.productId && <p className="text-[10px] font-bold text-[#1A1033]/20 uppercase tracking-widest mt-2">Ürün: {r.productId}</p>}
                </div>
                <button onClick={() => removeReview(r.id)} className="p-2.5 text-[#1A1033]/40 hover:text-red-500 transition-colors shrink-0"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
