import React, { useState } from 'react';
import { HelpCircle, ThumbsUp, ThumbsDown, BadgeCheck } from 'lucide-react';
import { ProductQuestion } from '@/types';
import { voteQuestionHelpful } from '@/services/productQuestionService';
import { cn } from '@/lib/utils';

interface Props {
  question: ProductQuestion;
  currentUserId?: string;
  isSeller: boolean;
  onAnswer?: (questionId: string, answer: string) => Promise<void>;
}

const CATEGORY_LABELS = {
  size: 'Beden / Ölçü',
  shipping: 'Kargo / Teslimat',
  stock: 'Stok Bilgisi',
  other: 'Diğer',
} as const;

export function QuestionCard({ question, currentUserId, isSeller, onAnswer }: Props) {
  const [helpfulCount, setHelpfulCount] = useState(question.helpfulCount || 0);
  const [hasVoted, setHasVoted] = useState(
    currentUserId ? (question.helpfulVoters || []).includes(currentUserId) : false,
  );
  const [voting, setVoting] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localAnswer, setLocalAnswer] = useState(
    question.answer
      ? { text: question.answer, by: question.answeredBy || 'Satıcı', at: question.answeredAt || '' }
      : null,
  );
  const [answerHelpfulCount, setAnswerHelpfulCount] = useState(0);
  const [answerHelpfulVoted, setAnswerHelpfulVoted] = useState<'up' | 'down' | null>(null);

  async function handleVote() {
    if (!currentUserId || voting) return;
    setVoting(true);
    try {
      const newCount = await voteQuestionHelpful(question.id, currentUserId);
      setHelpfulCount(newCount);
      setHasVoted(v => !v);
    } finally {
      setVoting(false);
    }
  }

  async function handleAnswer() {
    if (!answerText.trim() || !onAnswer) return;
    setSubmitting(true);
    try {
      await onAnswer(question.id, answerText.trim());
      setLocalAnswer({
        text: answerText.trim(),
        by: 'Satıcı',
        at: new Date().toISOString(),
      });
      setShowAnswerForm(false);
      setAnswerText('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-[#F8F8FA] dark:bg-zinc-900/60 rounded-2xl p-4 border border-brand-primary/5 dark:border-white/5">
      {/* Soru */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-start gap-2 min-w-0">
          <HelpCircle size={14} className="text-accent mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand-primary dark:text-white leading-relaxed break-words">{question.text}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] text-brand-primary/30 dark:text-zinc-500 font-bold">
                {question.userName} · {new Date(question.createdAt).toLocaleDateString('tr-TR')}
              </span>
              {question.category && question.category !== 'other' && (
                <span className="text-[8px] font-black uppercase tracking-wider bg-brand-secondary dark:bg-zinc-800 text-brand-primary/60 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                  {CATEGORY_LABELS[question.category] || question.category}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleVote}
          disabled={!currentUserId || voting}
          className={cn(
            'flex items-center gap-1.5 text-[9px] font-black uppercase transition-colors shrink-0 p-1 rounded hover:bg-brand-secondary dark:hover:bg-zinc-800',
            hasVoted ? 'text-accent' : 'text-brand-primary/30 dark:text-zinc-500 hover:text-accent',
            (!currentUserId || voting) && 'opacity-50 cursor-not-allowed',
          )}
          title="Faydalı"
        >
          <ThumbsUp size={11} fill={hasVoted ? 'currentColor' : 'none'} />
          {helpfulCount > 0 && <span>{helpfulCount}</span>}
        </button>
      </div>

      {/* Cevap */}
      {localAnswer ? (
        <div className="ms-5 ps-3 border-s-4 border-green-400/50 mt-2 bg-green-50/40 dark:bg-green-950/20 rounded-r-xl py-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-bold text-brand-primary/70 dark:text-zinc-300 leading-relaxed">{localAnswer.text}</p>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] text-accent font-bold">
              <BadgeCheck size={11} className="text-accent" />
              {localAnswer.by}
              {localAnswer.at && ` · ${new Date(localAnswer.at).toLocaleDateString('tr-TR')}`}
            </span>
            <span className="text-[8px] font-black uppercase tracking-wider bg-accent/10 text-accent px-1.5 py-0.5 rounded-full border border-accent/20">
              Satıcı
            </span>
            {/* Cevap faydalı mı? */}
            <div className="flex items-center gap-1 ms-auto">
              <button
                onClick={() => {
                  if (answerHelpfulVoted === 'up') {
                    setAnswerHelpfulCount(c => c - 1);
                    setAnswerHelpfulVoted(null);
                  } else {
                    if (answerHelpfulVoted === 'down') setAnswerHelpfulCount(c => Math.max(0, c - 1));
                    setAnswerHelpfulCount(c => c + 1);
                    setAnswerHelpfulVoted('up');
                  }
                }}
                className={cn(
                  'flex items-center gap-0.5 text-[9px] font-black uppercase transition-colors p-0.5 rounded hover:bg-brand-secondary dark:hover:bg-zinc-800',
                  answerHelpfulVoted === 'up' ? 'text-green-600' : 'text-brand-primary/20 dark:text-zinc-600',
                )}
                title="Faydalı"
              >
                <ThumbsUp size={10} fill={answerHelpfulVoted === 'up' ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => {
                  if (answerHelpfulVoted === 'down') {
                    setAnswerHelpfulVoted(null);
                  } else {
                    if (answerHelpfulVoted === 'up') setAnswerHelpfulCount(c => Math.max(0, c - 1));
                    setAnswerHelpfulVoted('down');
                  }
                }}
                className={cn(
                  'flex items-center gap-0.5 text-[9px] font-black uppercase transition-colors p-0.5 rounded hover:bg-brand-secondary dark:hover:bg-zinc-800',
                  answerHelpfulVoted === 'down' ? 'text-red-500' : 'text-brand-primary/20 dark:text-zinc-600',
                )}
                title="Faydalı Değil"
              >
                <ThumbsDown size={10} fill={answerHelpfulVoted === 'down' ? 'currentColor' : 'none'} />
              </button>
              {answerHelpfulCount > 0 && (
                <span className="text-[9px] font-bold text-brand-primary/30 dark:text-zinc-500">{answerHelpfulCount}</span>
              )}
            </div>
          </div>
          {/* Satıcı için tekrar yanıtla */}
          {isSeller && (
            <button
              onClick={() => setShowAnswerForm(true)}
              className="text-[9px] font-black text-accent/60 hover:text-accent transition-colors mt-1"
            >
              Bu soruyu tekrar yanıtla
            </button>
          )}
        </div>
      ) : isSeller ? (
        <>
          {!showAnswerForm ? (
            <button
              onClick={() => setShowAnswerForm(true)}
              className="ms-5 text-[10px] font-black text-accent hover:underline mt-1"
            >
              Yanıtla
            </button>
          ) : (
            <div className="ms-5 mt-2 flex gap-2">
              <input
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                placeholder="Cevabınızı yazın..."
                maxLength={1000}
                className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-brand-primary/10 dark:border-white/10 rounded-xl text-xs outline-none focus:border-accent text-brand-primary dark:text-white"
              />
              <button
                onClick={handleAnswer}
                disabled={submitting || !answerText.trim()}
                className="px-3 py-1.5 bg-accent text-white rounded-xl text-xs font-black disabled:opacity-50"
              >
                Gönder
              </button>
              <button
                onClick={() => setShowAnswerForm(false)}
                className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-brand-primary/10 dark:border-white/10 rounded-xl text-xs font-black text-brand-primary dark:text-white"
              >
                İptal
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="ms-5 text-[10px] text-brand-primary/20 dark:text-zinc-600 font-bold italic mt-1">
          Henüz cevaplanmadı
        </p>
      )}
    </div>
  );
}
