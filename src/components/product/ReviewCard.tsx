import React, { useState } from 'react';
import { Star, ThumbsUp, ChevronDown, ChevronUp, X, Store, Pencil, Trash2 } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';
import { Review } from '@/types';
import { voteReviewHelpful, addSellerResponse } from '@/services/reviewService';
import { cn } from '@/lib/utils';

interface Props {
  review: Review;
  currentUserId?: string;
  isSeller: boolean;
  currentUserName?: string;
  onDelete?: () => void;
  onEdit?: (data: { rating: number; comment: string }) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  quality: 'Kalite',
  shipping: 'Kargo',
  description: 'Uygunluk',
};

export function ReviewCard({ review, currentUserId, isSeller, currentUserName, onDelete, onEdit }: Props) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0);
  const [hasVoted, setHasVoted] = useState(
    currentUserId ? (review.helpfulVoters || []).includes(currentUserId) : false,
  );
  const [voting, setVoting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [localResponse, setLocalResponse] = useState(review.sellerResponse);
  const [showFullComment, setShowFullComment] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editComment, setEditComment] = useState(review.comment);
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOwner = !!currentUserId && currentUserId === review.userId;

  async function handleSaveEdit() {
    if (!editComment.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      await onEdit?.({ rating: editRating, comment: editComment.trim() });
      setIsEditing(false);
    } finally {
      setSavingEdit(false);
    }
  }

  const isLongComment = review.comment.length > 300;
  const displayedComment =
    isLongComment && !showFullComment ? review.comment.slice(0, 300) + '...' : review.comment;

  async function handleVote() {
    if (!currentUserId || voting) return;
    setVoting(true);
    try {
      const newCount = await voteReviewHelpful(review.id, currentUserId);
      setHelpfulCount(newCount);
      setHasVoted(v => !v);
    } finally {
      setVoting(false);
    }
  }

  async function handleReply() {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await addSellerResponse(review.id, replyText.trim(), currentUserName || 'Satıcı');
      setLocalResponse({
        text: replyText.trim(),
        createdAt: new Date().toISOString(),
        sellerName: currentUserName || 'Satıcı',
      });
      setShowReplyForm(false);
      setReplyText('');
    } finally {
      setSubmittingReply(false);
    }
  }

  return (
    <div className="pb-8 border-b border-brand-primary/5 last:border-0">
      {/* Başlık */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center font-black text-accent uppercase text-sm shrink-0">
            {review.userName.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-black text-brand-primary">{review.userName}</p>
            <p className="text-[10px] text-brand-primary/30 font-bold">
              {review.createdAt.split('T')[0]}
            </p>
          </div>
        </div>
        {review.verified && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-full border border-green-200">
            <CheckCircle2 size={11} />
            <span className="text-[9px] font-black uppercase tracking-widest">Onaylı Alıcı</span>
          </div>
        )}
      </div>

      {/* Yıldızlar + kategori puanları */}
      <div className="flex flex-wrap items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            fill={i < review.rating ? '#FBBF24' : 'none'}
            className={i < review.rating ? 'text-yellow-400' : 'text-brand-primary/10'}
          />
        ))}
        {review.categoryRatings &&
          Object.entries(review.categoryRatings).map(([key, val]) =>
            val && val > 0 ? (
              <span key={key} className="ms-2 text-[9px] font-bold text-brand-primary/40 bg-brand-secondary/50 px-2 py-0.5 rounded-lg">
                {CATEGORY_LABELS[key] ?? key}: {val}/5
              </span>
            ) : null,
          )}
      </div>

      {/* Yorum metni veya düzenleme formu */}
      {isEditing ? (
        <div className="space-y-3 mb-3">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setEditRating(i + 1)}
                aria-label={`${i + 1} yıldız`}
              >
                <Star
                  size={20}
                  fill={i < editRating ? '#FBBF24' : 'none'}
                  className={i < editRating ? 'text-yellow-400' : 'text-brand-primary/20'}
                />
              </button>
            ))}
          </div>
          <textarea
            value={editComment}
            onChange={e => setEditComment(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full px-3 py-2 bg-white border border-brand-primary/10 rounded-xl text-sm outline-none focus:border-accent resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={savingEdit || !editComment.trim()}
              className="px-4 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-50"
            >
              {savingEdit ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button
              type="button"
              onClick={() => { setIsEditing(false); setEditRating(review.rating); setEditComment(review.comment); }}
              className="px-4 py-2 border border-brand-primary/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-brand-primary/50"
            >
              İptal
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-brand-primary/70 leading-relaxed font-medium mb-2">
            {displayedComment}
          </p>
          {isLongComment && (
            <button
              onClick={() => setShowFullComment(v => !v)}
              className="flex items-center gap-1 text-[10px] font-black text-accent mb-3"
            >
              {showFullComment ? (
                <><ChevronUp size={12} /> Daha az göster</>
              ) : (
                <><ChevronDown size={12} /> Devamını oku</>
              )}
            </button>
          )}
        </>
      )}

      {/* Fotoğraflar */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {review.photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setLightboxPhoto(photo)}
              className="w-20 h-20 rounded-xl overflow-hidden border border-brand-primary/10 hover:border-accent transition-colors"
            >
              <img src={photo} alt="Yorum fotoğrafı" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Aksiyonlar */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleVote}
          disabled={!currentUserId || voting}
          className={cn(
            'flex items-center gap-2 text-[10px] font-black uppercase transition-colors',
            hasVoted ? 'text-accent' : 'text-brand-primary/40 hover:text-accent',
            (!currentUserId || voting) && 'opacity-50 cursor-not-allowed',
          )}
        >
          <ThumbsUp size={13} fill={hasVoted ? 'currentColor' : 'none'} />
          Yararlı ({helpfulCount})
        </button>
        {isSeller && !localResponse && (
          <button
            onClick={() => setShowReplyForm(v => !v)}
            className="text-[10px] font-black uppercase text-brand-primary/40 hover:text-accent transition-colors"
          >
            Yanıtla
          </button>
        )}
        {isOwner && !isEditing && (
          <>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              aria-label="Yorumu düzenle"
              className="flex items-center gap-1 text-[10px] font-black uppercase text-brand-primary/40 hover:text-accent transition-colors"
            >
              <Pencil size={11} /> Düzenle
            </button>
            {confirmDelete ? (
              <span className="flex items-center gap-2 text-[10px] font-black uppercase">
                <span className="text-red-500">Silinsin mi?</span>
                <button
                  type="button"
                  onClick={() => onDelete?.()}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  Evet
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-brand-primary/40 hover:text-brand-primary transition-colors"
                >
                  İptal
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="Yorumu sil"
                className="flex items-center gap-1 text-[10px] font-black uppercase text-brand-primary/40 hover:text-red-500 transition-colors"
              >
                <Trash2 size={11} /> Sil
              </button>
            )}
          </>
        )}
      </div>

      {/* Satıcı yanıt formu */}
      {showReplyForm && (
        <div className="mt-3 ms-4 flex gap-2">
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Satıcı yanıtı..."
            maxLength={1000}
            className="flex-1 px-3 py-2 bg-white border border-brand-primary/10 rounded-xl text-xs outline-none focus:border-accent"
          />
          <button
            onClick={handleReply}
            disabled={submittingReply || !replyText.trim()}
            className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-black disabled:opacity-50"
          >
            Gönder
          </button>
          <button
            onClick={() => setShowReplyForm(false)}
            className="px-3 py-2 bg-white border border-brand-primary/10 rounded-xl text-xs font-black"
          >
            İptal
          </button>
        </div>
      )}

      {/* Satıcı yanıtı */}
      {localResponse && (
        <div className="mt-3 ms-4 ps-3 border-s-2 border-accent/30 bg-accent/5 rounded-e-xl py-2 pe-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Store size={11} className="text-accent" />
            <span className="text-[9px] font-black uppercase text-accent tracking-widest">Satıcı Yanıtı</span>
            <span className="text-[9px] text-brand-primary/30 font-bold">
              · {localResponse.createdAt.split('T')[0]}
            </span>
          </div>
          <p className="text-xs font-bold text-brand-primary/70">{localResponse.text}</p>
        </div>
      )}

      {/* Fotoğraf lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-4 end-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxPhoto(null)}
          >
            <X size={18} />
          </button>
          <img
            src={lightboxPhoto}
            alt="Büyük görünüm"
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
