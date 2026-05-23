'use client';

import React, { useEffect, useState } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { ProductQuestion } from '@/types';
import { getProductQuestions, askQuestion, answerQuestion } from '@/services/productQuestionService';
import { QuestionCard } from './QuestionCard';

const QA_PAGE_SIZE = 5;

interface Props {
  productId: string;
  currentUserId?: string;
  currentUserName?: string;
  isSeller: boolean;
  isLoggedIn: boolean;
}

const CATEGORY_LABELS = {
  size: 'Beden / Ölçü',
  shipping: 'Kargo / Teslimat',
  stock: 'Stok Bilgisi',
  other: 'Diğer',
} as const;

export function QASection({ productId, currentUserId, currentUserName, isSeller, isLoggedIn }: Props) {
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState<'size' | 'shipping' | 'stock' | 'other'>('other');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getProductQuestions(productId)
      .then(setQuestions)
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleAskQuestion() {
    if (!questionText.trim() || !currentUserId || !currentUserName) return;
    setSubmitting(true);
    try {
      // askQuestion returns string (doc ID) in Next.js service
      const docId = await askQuestion({
        productId,
        userId: currentUserId,
        userName: currentUserName,
        text: questionText.trim(),
        category,
      });
      const newQ: ProductQuestion = {
        id: docId,
        productId,
        userId: currentUserId,
        userName: currentUserName,
        text: questionText.trim(),
        category,
        createdAt: new Date().toISOString(),
      };
      setQuestions(prev => [newQ, ...prev]);
      setQuestionText('');
      setCategory('other');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAnswer(questionId: string, answer: string) {
    await answerQuestion(questionId, answer, currentUserName || 'Satıcı');
    setQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? { ...q, answer, answeredBy: currentUserName || 'Satıcı', answeredAt: new Date().toISOString() }
          : q,
      ),
    );
  }

  const filtered = questions.filter(q => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return q.text.toLowerCase().includes(s) || (q.answer || '').toLowerCase().includes(s);
  });

  const paginated = filtered.slice(0, page * QA_PAGE_SIZE);

  return (
    <div className="space-y-6 mt-6">
      {/* Soru sor */}
      {isLoggedIn ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !submitting && handleAskQuestion()}
              placeholder="Ürün hakkında bir soru sorun..."
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 ring-accent/20 border border-transparent focus:border-accent/30 text-gray-900 dark:text-white"
            />
            <button
              onClick={handleAskQuestion}
              disabled={submitting || !questionText.trim()}
              className="px-6 py-3 bg-accent text-white rounded-xl text-xs font-black disabled:opacity-50 hover:bg-accent/90 transition-colors whitespace-nowrap"
            >
              {submitting ? '...' : 'Soru Sor'}
            </button>
          </div>
          {/* Kategori Seçici */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500">Konu:</span>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                    category === cat
                      ? 'bg-accent/15 text-accent border border-accent/35'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold py-2">
          Soru sormak için <Link href="/auth" className="text-accent underline">giriş yapın</Link>.
        </p>
      )}

      {/* Arama */}
      {questions.length > 3 && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Sorular içinde ara..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl text-sm outline-none focus:ring-2 ring-accent/20 text-gray-900 dark:text-white"
          />
        </div>
      )}

      {/* Sayaç */}
      {filtered.length > 0 && (
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
          {filtered.length} Soru-Cevap
        </p>
      )}

      {/* Liste */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-zinc-800/50 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle size={32} className="mx-auto text-gray-400 dark:text-zinc-500 mb-2" />
          <p className="text-xs font-bold text-gray-400 dark:text-zinc-500">
            {search
              ? 'Aramanıza uygun soru bulunamadı.'
              : 'Henüz soru sorulmamış. İlk soran sen ol!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map(q => (
            <QuestionCard
              key={q.id}
              question={q}
              currentUserId={currentUserId}
              isSeller={isSeller}
              onAnswer={isSeller ? handleAnswer : undefined}
            />
          ))}
        </div>
      )}

      {/* Daha fazla */}
      {paginated.length < filtered.length && (
        <button
          onClick={() => setPage(p => p + 1)}
          className="w-full py-3 border border-gray-200 dark:border-zinc-800 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-800 dark:text-white"
        >
          Daha Fazla Göster ({filtered.length - paginated.length} soru)
        </button>
      )}
    </div>
  );
}
