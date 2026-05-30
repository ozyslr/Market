import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X,
  MessageCircle,
  Twitter,
  Facebook,
  Share2,
  Copy,
  CheckCircle2,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export function ShareModal({
  isOpen,
  onClose,
  url,
  title,
}: ShareModalProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  // Check if native share is available
  const hasNativeShare =
    typeof navigator !== 'undefined' && 'share' in navigator;

  // Platform share handlers
  const handleWhatsApp = () => {
    window.open(
      'https://wa.me/?text=' + encodeURIComponent(title + ' ' + url),
      '_blank',
      'noopener'
    );
  };

  const handleTwitter = () => {
    window.open(
      'https://twitter.com/intent/tweet?text=' +
        encodeURIComponent(title) +
        '&url=' +
        encodeURIComponent(url),
      '_blank',
      'noopener'
    );
  };

  const handleFacebook = () => {
    window.open(
      'https://www.facebook.com/sharer/sharer.php?u=' +
        encodeURIComponent(url),
      '_blank',
      'noopener'
    );
  };

  const handleNativeShare = async () => {
    try {
      if (hasNativeShare) {
        await navigator.share({ title, url });
      }
    } catch {
      // Silently swallow errors (user cancellation, etc.)
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // Silently swallow errors
      });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Mobile Panel */}
          <motion.div
            className="flex md:hidden fixed bottom-0 inset-x-0 z-50"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full bg-white dark:bg-zinc-900 rounded-t-3xl p-6 pb-8"
              role="dialog" aria-modal="true" aria-label="Paylaş"
              onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary dark:text-white">
                  Paylaş
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Paylaşım menüsünü kapat"
                  className="rounded-lg p-1 hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5 text-brand-primary dark:text-white" />
                </button>
              </div>

              {/* Platform buttons */}
              <div className="space-y-3">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  aria-label="WhatsApp'ta Paylaş"
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-secondary dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-sm font-bold text-brand-primary dark:text-white">
                    WhatsApp'ta Paylaş
                  </span>
                </button>

                {/* Twitter/X */}
                <button
                  type="button"
                  onClick={handleTwitter}
                  aria-label="X'te Paylaş"
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-secondary dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Twitter className="w-5 h-5 text-sky-500" />
                  </div>
                  <span className="text-sm font-bold text-brand-primary dark:text-white">
                    X'te Paylaş
                  </span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={handleFacebook}
                  aria-label="Facebook'ta Paylaş"
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-secondary dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Facebook className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-brand-primary dark:text-white">
                    Facebook'ta Paylaş
                  </span>
                </button>

                {/* Native Share */}
                {hasNativeShare && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    aria-label="Yerel Paylaşım"
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-secondary dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <Share2 className="w-5 h-5 text-brand-primary dark:text-white" />
                    </div>
                    <span className="text-sm font-bold text-brand-primary dark:text-white">
                      Yerel Paylaşım
                    </span>
                  </button>
                )}

                {/* Copy Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  aria-label={
                    copied ? 'Kopyalandı!' : 'Bağlantıyı Kopyala'
                  }
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-secondary dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-brand-primary dark:text-white" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-brand-primary dark:text-white">
                    {copied ? 'Kopyalandı!' : 'Bağlantıyı Kopyala'}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Desktop Panel */}
          <motion.div
            className="hidden md:flex fixed inset-0 z-50 items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Paylaş"
              onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl"
              initial={{ y: 20, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary dark:text-white">
                  Paylaş
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Paylaşım menüsünü kapat"
                  className="rounded-lg p-1 hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5 text-brand-primary dark:text-white" />
                </button>
              </div>

              {/* Platform buttons */}
              <div className="space-y-3">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  aria-label="WhatsApp'ta Paylaş"
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-secondary dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <span className="text-sm font-bold text-brand-primary dark:text-white">
                    WhatsApp'ta Paylaş
                  </span>
                </button>

                {/* Twitter/X */}
                <button
                  type="button"
                  onClick={handleTwitter}
                  aria-label="X'te Paylaş"
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-secondary dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Twitter className="w-5 h-5 text-sky-500" />
                  </div>
                  <span className="text-sm font-bold text-brand-primary dark:text-white">
                    X'te Paylaş
                  </span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={handleFacebook}
                  aria-label="Facebook'ta Paylaş"
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-secondary dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Facebook className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-bold text-brand-primary dark:text-white">
                    Facebook'ta Paylaş
                  </span>
                </button>

                {/* Native Share */}
                {hasNativeShare && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    aria-label="Yerel Paylaşım"
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-secondary dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <Share2 className="w-5 h-5 text-brand-primary dark:text-white" />
                    </div>
                    <span className="text-sm font-bold text-brand-primary dark:text-white">
                      Yerel Paylaşım
                    </span>
                  </button>
                )}

                {/* Copy Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  aria-label={
                    copied ? 'Kopyalandı!' : 'Bağlantıyı Kopyala'
                  }
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-brand-secondary/50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-secondary dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-brand-primary dark:text-white" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-brand-primary dark:text-white">
                    {copied ? 'Kopyalandı!' : 'Bağlantıyı Kopyala'}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
