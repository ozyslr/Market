import React, { useRef, useState } from 'react';
import { Star, X, Upload } from 'lucide-react';

export interface ReviewFormData {
  rating: number;
  comment: string;
  photos: string[];
  categoryRatings: { quality: number; shipping: number; description: number };
}

interface Props {
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel: () => void;
}

const CATEGORY_LABELS = {
  quality: 'Ürün Kalitesi',
  shipping: 'Kargo Hızı',
  description: 'Açıklamaya Uygunluk',
} as const;

const RATING_LABELS = ['', 'Çok Kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];

export function ReviewForm({ onSubmit, onCancel }: Props) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [categoryRatings, setCategoryRatings] = useState({ quality: 0, shipping: 0, description: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      setPhotoError('En fazla 3 fotoğraf ekleyebilirsiniz.');
      return;
    }
    const oversized = files.filter(f => f.size > 500 * 1024);
    if (oversized.length > 0) {
      setPhotoError('Her fotoğraf en fazla 500KB olabilir.');
    } else {
      setPhotoError('');
    }
    const valid = files.filter(f => f.size <= 500 * 1024);
    valid.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setPhotos(prev => [...prev, ev.target!.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ rating, comment: comment.trim(), photos, categoryRatings });
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hoverRating || rating;

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-zinc-900 rounded-[2rem] p-8 border border-gray-200 dark:border-zinc-800 space-y-6">
      <h4 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Değerlendirmenizi Yazın</h4>

      {/* Genel puan */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">Genel Puan</p>
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(i + 1)}
            >
              <Star
                size={32}
                fill={i < displayRating ? '#FF5200' : 'none'}
                className={i < displayRating ? 'text-accent' : 'text-gray-300 dark:text-zinc-700'}
              />
            </button>
          ))}
          <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 ml-2">
            {RATING_LABELS[displayRating]}
          </span>
        </div>
      </div>

      {/* Kategori puanları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map(key => (
          <div key={key}>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-1.5">
              {CATEGORY_LABELS[key]}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCategoryRatings(prev => ({ ...prev, [key]: i + 1 }))}
                >
                  <Star
                    size={18}
                    fill={i < categoryRatings[key] ? '#FF5200' : 'none'}
                    className={i < categoryRatings[key] ? 'text-accent' : 'text-gray-300 dark:text-zinc-700'}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Yorum */}
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Ürün hakkındaki deneyiminizi paylaşın..."
        rows={4}
        required
        className="w-full p-4 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-800 outline-none focus:ring-4 ring-accent/10 text-sm font-medium resize-none text-gray-900 dark:text-white"
      />

      {/* Fotoğraf yükleme */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">
          Fotoğraf Ekle (maks. 3, her biri maks. 500KB)
        </p>
        <div className="flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <div key={i} className="relative w-20 h-20">
              <img
                src={p}
                alt=""
                className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-zinc-800"
              />
              <button
                type="button"
                onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-accent transition-colors"
            >
              <Upload size={16} className="text-gray-400 dark:text-zinc-500" />
              <span className="text-[9px] font-black text-gray-400 dark:text-zinc-500">Ekle</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        {photoError && <p className="text-[10px] text-red-500 font-bold mt-1">{photoError}</p>}
      </div>

      {/* Butonlar */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !comment.trim()}
          className="px-8 py-3 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:bg-brand-primary transition-all flex items-center gap-2"
        >
          {submitting && (
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          )}
          Gönder
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-white dark:bg-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all text-gray-700 dark:text-white"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
