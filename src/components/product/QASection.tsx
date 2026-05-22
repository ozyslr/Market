import React, { useEffect, useState } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductQuestion } from '@/types';
import { getQuestions, askQuestion, answerQuestion } from '@/services/productQuestionService';
import { QuestionCard } from './QuestionCard';

const QA_PAGE_SIZE = 5;

interface Props {
  productId: string;
  currentUserId?: string;
  currentUserName?: string;
  isSeller: boolean;
  isLoggedIn: boolean;
}

export function QASection({ productId, currentUserId, currentUserName, isSeller, isLoggedIn }: Props) {
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getQuestions(productId)
      .then(setQuestions)
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleAskQuestion() {
    if (!questionText.trim() || !currentUserId || !currentUserName) return;
    setSubmitting(true);
    try {
      const newQ = await askQuestion(productId, currentUserId, currentUserName, questionText.trim());
      setQuestions(prev => [newQ, ...prev]);
      setQuestionText('');
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
    <div className="space-y-6">
      {/* Soru sor */}
      {isLoggedIn ? (
        <div className="flex gap-2">
          <input
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !submitting && handleAskQuestion()}
            placeholder="Ürün hakkında bir soru sorun..."
            className="flex-1 px-4 py-3 bg-[#F8F8FA] rounded-xl text-sm outline-none focus:ring-2 ring-accent/20 border border-transparent focus:border-accent/30"
          />
          <button
            onClick={handleAskQuestion}
            disabled={submitting || !questionText.trim()}
            className="px-6 py-3 bg-accent text-white rounded-xl text-xs font-black disabled:opacity-50 hover:bg-accent/90 transition-colors whitespace-nowrap"
          >
            {submitting ? '...' : 'Soru Sor'}
          </button>
        </div>
      ) : (
        <p className="text-xs text-brand-primary/40 font-bold py-2">
          Soru sormak için <Link to="/auth" className="text-accent underline">giriş yapın</Link>.
        </p>
      )}

      {/* Arama */}
      {questions.length > 3 && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary/30" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Sorular içinde ara..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#F8F8FA] rounded-xl text-sm outline-none focus:ring-2 ring-accent/20"
          />
        </div>
      )}

      {/* Sayaç */}
      {filtered.length > 0 && (
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
          {filtered.length} Soru-Cevap
        </p>
      )}

      {/* Liste */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-brand-secondary/50 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle size={32} className="mx-auto text-brand-primary/10 mb-2" />
          <p className="text-xs font-bold text-brand-primary/30">
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
          className="w-full py-3 border border-brand-primary/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-secondary/50 transition-colors"
        >
          Daha Fazla Göster ({filtered.length - paginated.length} soru)
        </button>
      )}
    </div>
  );
}
