import React, { useEffect, useRef } from 'react';
import { X, Maximize2, Loader2, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import '@google/model-viewer';

interface Props {
  modelUrl: string;
  productTitle: string;
  open: boolean;
  onClose: () => void;
}

export function ARViewer({ modelUrl, productTitle, open, onClose }: Props) {
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (!open || !viewerRef.current) return;
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleAR = () => {
    if (viewerRef.current?.activateAR) {
      viewerRef.current.activateAR();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-3xl mx-4 bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Smartphone size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">3D / AR Önizleme</h3>
                  <p className="text-[10px] text-zinc-400 truncate max-w-[250px]">{productTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(window as any).navigator?.xr?.isSessionSupported?.('immersive-ar') && (
                  <button
                    onClick={handleAR}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-all"
                  >
                    <Smartphone size={14} /> AR ile Gör
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 3D Viewer */}
            <div className="relative aspect-square md:aspect-[4/3] bg-zinc-950">
              {React.createElement('model-viewer', {
                ref: viewerRef,
                src: modelUrl,
                alt: productTitle,
                ar: true,
                'ar-modes': 'webxr scene-viewer quick-look',
                'camera-controls': true,
                'auto-rotate': true,
                'rotation-per-second': '30deg',
                'shadow-intensity': '1',
                exposure: '0.8',
                style: { width: '100%', height: '100%', display: 'block' },
                'ar-placement': 'floor',
                'ar-scale': 'auto',
              }, React.createElement('div', { slot: 'progress-bar', className: 'hidden' }))}

              {/* Loading fallback */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-3 text-zinc-600">
                  <Loader2 size={32} className="animate-spin" />
                  <p className="text-xs font-medium">3D model yükleniyor...</p>
                </div>
              </div>
            </div>

            {/* Footer controls */}
            <div className="flex items-center justify-center gap-6 px-6 py-4 border-t border-zinc-800 text-xs text-zinc-500">
              <span>🖱 Sürükle — döndür</span>
              <span>🔍 Kaydır — yakınlaştır</span>
              <span>📱 AR destekli cihazda gerçek boyutta gör</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
