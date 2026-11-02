import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Clock, Trash2, X } from 'lucide-react';

export interface BulkEditBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onBulkStatusUpdate: (status: string) => void;
  onBulkDelete: () => void;
}

export function BulkEditBar({
  selectedIds,
  onClearSelection,
  onBulkStatusUpdate,
  onBulkDelete,
}: BulkEditBarProps) {
  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="flex items-center gap-3 bg-brand-primary px-4 py-2 rounded-2xl shadow-xl ms-4"
        >
          <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
            {selectedIds.length} Selected
          </span>
          <div className="w-px h-4 bg-white/10" />
          {/* Sellers can't self-approve: 'approved' is set by admin moderation only. */}
          <button
            onClick={() => onBulkStatusUpdate('pending')}
            className="p-2 text-white/60 hover:text-green-400 transition-colors"
            title="Onaya gönder"
          >
            <CheckCircle size={14} />
          </button>
          <button
            onClick={() => onBulkStatusUpdate('draft')}
            className="p-2 text-white/60 hover:text-orange-400 transition-colors"
            title="Taslağa al"
          >
            <Clock size={14} />
          </button>
          <button
            onClick={onBulkDelete}
            className="p-2 text-white/60 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onClearSelection}
            className="p-2 text-white/20 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
