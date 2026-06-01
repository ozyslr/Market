import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  ShoppingCart,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { getOrderById } from '@/services/orderService';
import {
  validateReorderItems,
  reorderToCart,
  type ReorderValidation,
} from '@/services/reorderService';

interface ReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  userId: string;
}

type ModalState = 'validating' | 'ready' | 'adding' | 'done' | 'error';

export function ReorderModal({ isOpen, onClose, orderId, userId }: ReorderModalProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<ModalState>('validating');
  const [validation, setValidation] = useState<ReorderValidation[]>([]);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset and validate when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setState('validating');
    setErrorMessage(null);
    setResult(null);
    setValidation([]);

    const validate = async () => {
      try {
        const order = await getOrderById(orderId);
        if (!order) {
          setErrorMessage('Siparis bulunamadi');
          setState('error');
          return;
        }
        const items = await validateReorderItems(order);
        setValidation(items);
        setState('ready');
      } catch {
        setErrorMessage('Dogrulama sirasinda bir hata olustu');
        setState('error');
      }
    };
    validate();
  }, [isOpen, orderId]);

  const handleAddToCart = async () => {
    setState('adding');
    try {
      const res = await reorderToCart(userId, orderId);
      setResult(res);
      setState('done');
    } catch {
      setErrorMessage('Sepete eklenirken bir hata olustu');
      setState('error');
    }
  };

  const goToCart = () => {
    onClose();
    navigate('/cart');
  };

  const availableCount = validation.filter((v) => v.available).length;
  const unavailableCount = validation.length - availableCount;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              onClose();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Tekrar Siparis Ver"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ─────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1033]/5">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#1A1033] flex items-center gap-2">
                <RotateCcw size={14} className="text-accent" /> Tekrar Siparis Ver
              </h2>
              <button
                onClick={onClose}
                aria-label="Kapat"
                className="p-2 text-[#1A1033]/30 hover:text-[#1A1033] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Body ───────────────────────────────────── */}
            <div className="px-6 py-5">
              {/* Validating */}
              {state === 'validating' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
                  <p className="text-xs font-bold text-[#1A1033]/50">
                    Urunler kontrol ediliyor...
                  </p>
                </div>
              )}

              {/* Ready — show validation results */}
              {state === 'ready' && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-[#1A1033]/40 uppercase tracking-widest mb-4">
                    Siparisinizdeki Urunler
                  </p>
                  {validation.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F8FA]"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-12 h-12 rounded-xl object-contain bg-white p-1.5 shrink-0"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1A1033] line-clamp-1">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-[#1A1033]/40">
                          {item.quantity} adet &middot; {item.price.toFixed(2)} TL
                        </p>
                      </div>
                      {item.available ? (
                        <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <XCircle size={18} className="text-red-400" />
                          {item.reason && (
                            <span className="text-[9px] text-red-400 font-bold max-w-[80px] leading-tight">
                              {item.reason}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Empty state — all unavailable */}
                  {availableCount === 0 && (
                    <div className="flex flex-col items-center justify-center py-6">
                      <XCircle size={32} className="text-[#1A1033]/20 mb-3" />
                      <p className="text-sm font-black text-[#1A1033]/40 mb-1">
                        Hicbir urun yeniden siparis edilemez
                      </p>
                      <p className="text-xs text-[#1A1033]/30 text-center">
                        Tum urunler stokta yok veya artik satista degil.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Adding to cart */}
              {state === 'adding' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
                  <p className="text-xs font-bold text-[#1A1033]/50">
                    Sepete ekleniyor...
                  </p>
                </div>
              )}

              {/* Done — success */}
              {state === 'done' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart size={28} className="text-green-600" />
                  </div>
                  <p className="text-sm font-black text-[#1A1033] mb-1">
                    Sepete Eklendi!
                  </p>
                  <p className="text-xs text-[#1A1033]/50 text-center max-w-xs">
                    {result?.added} urun basariyla sepete eklendi.
                    {result && result.skipped > 0 && (
                      <>
                        {' '}
                        {result.skipped} urun kullanilamadigi icin atlandi.
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Error state */}
              {state === 'error' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <XCircle size={32} className="text-red-400 mb-3" />
                  <p className="text-sm font-black text-[#1A1033] mb-1">Hata</p>
                  <p className="text-xs text-[#1A1033]/50 text-center">{errorMessage}</p>
                </div>
              )}
            </div>

            {/* ── Footer ─────────────────────────────────── */}
            <div className="px-6 py-4 border-t border-[#1A1033]/5 flex gap-3">
              {state === 'ready' && (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 border border-[#1A1033]/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1A1033]/50 hover:border-[#1A1033]/30 transition-all"
                  >
                    Kapat
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={availableCount === 0}
                    className="flex-1 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart size={12} /> Sepete Ekle
                  </button>
                </>
              )}
              {state === 'done' && (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 border border-[#1A1033]/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1A1033]/50 hover:border-[#1A1033]/30 transition-all"
                  >
                    Kapat
                  </button>
                  <button
                    onClick={goToCart}
                    className="flex-1 py-2.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                  >
                    Sepete Git <ArrowRight size={12} />
                  </button>
                </>
              )}
              {state === 'error' && (
                <button
                  onClick={onClose}
                  className="w-full py-2.5 border border-[#1A1033]/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1A1033]/50 hover:border-[#1A1033]/30 transition-all"
                >
                  Kapat
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
