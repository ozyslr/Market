import React, { useState } from 'react';
import { HelpCircle, ThumbsUp } from 'lucide-react';
import { ProductQuestion } from '@/types';
import { voteQuestionHelpful } from '@/services/productQuestionService';
import { cn } from '@/lib/utils';

interface Props {
  question: ProductQuestion;
  currentUserId?: string;
  isSeller: boolean;
  onAnswer?: (questionId: string, answer: string) => Promise<void>;
}

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
    <div className="bg-[#F8F8FA] rounded-2xl p-4">
      {/* Soru */}
      <div className="flex items-start gap-2 mb-2">
        <HelpCircle size={14} className="text-accent mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-brand-primary">{question.text}</p>
          <p className="text-[10px] text-brand-primary/30 mt-0.5">
            {question.userName} · {new Date(question.createdAt).toLocaleDateString('tr-TR')}
          </p>
        </div>
        <button
          onClick={handleVote}
          disabled={!currentUserId || voting}
          className={cn(
            'flex items-center gap-1 text-[9px] font-black uppercase transition-colors shrink-0',
            hasVoted ? 'text-accent' : 'text-brand-primary/30 hover:text-accent',
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
        <div className="ml-5 pl-3 border-l-2 border-accent/30">
          <p className="text-xs font-bold text-brand-primary/70">{localAnswer.text}</p>
          <p className="text-[10px] text-accent font-bold mt-0.5">
            {localAnswer.by}
            {localAnswer.at && ` · ${new Date(localAnswer.at).toLocaleDateString('tr-TR')}`}
          </p>
        </div>
      ) : isSeller ? (
        <>
          {!showAnswerForm ? (
            <button
              onClick={() => setShowAnswerForm(true)}
              className="ml-5 text-[10px] font-black text-accent hover:underline mt-1"
            >
              Yanıtla
            </button>
          ) : (
            <div className="ml-5 mt-2 flex gap-2">
              <input
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                placeholder="Cevabınızı yazın..."
                className="flex-1 px-3 py-1.5 bg-white border border-brand-primary/10 rounded-xl text-xs outline-none focus:border-accent"
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
                className="px-3 py-1.5 bg-white border border-brand-primary/10 rounded-xl text-xs font-black"
              >
                İptal
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="ml-5 text-[10px] text-brand-primary/20 font-bold italic mt-1">
          Henüz cevaplanmadı
        </p>
      )}
    </div>
  );
}
