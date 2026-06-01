import React, { useState } from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';
import { ReorderModal } from './ReorderModal';

interface ReorderButtonProps {
  orderId: string;
  userId: string;
  className?: string;
}

export function ReorderButton({ orderId, userId, className = '' }: ReorderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-center gap-1.5 py-2 px-3 border border-brand-primary/10 dark:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary/60 dark:text-zinc-400 hover:border-accent hover:text-accent transition-all ${className}`}
      >
        <RotateCcw size={12} />
        Tekrar Siparis Ver
      </button>
      <ReorderModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        orderId={orderId}
        userId={userId}
      />
    </>
  );
}
