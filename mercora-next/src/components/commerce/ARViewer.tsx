'use client';

import { useState } from 'react';
import { X, RotateCw, Maximize2, Minimize2, Box } from 'lucide-react';

interface ARViewerProps {
  imageUrl: string;
  productName: string;
  onClose: () => void;
}

export function ARViewer({ imageUrl, productName, onClose }: ARViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black flex flex-col ${isFullscreen ? '' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-2">
          <Box size={20} />
          <span className="text-sm font-medium">AR View — {productName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRotate}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Rotate"
          >
            <RotateCw size={18} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close AR"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-900 rounded-2xl overflow-hidden">
        {/* Placeholder 3D scene — in production, integrate ModelViewer or Three.js */}
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={productName}
            style={{ transform: `rotateY(${rotation}deg)` }}
            className="max-w-full max-h-[70vh] object-contain transition-transform duration-500"
          />
          <p className="text-white/50 text-xs mt-4">
            AR mode — drag to rotate, pinch to zoom
          </p>
        </div>

        {/* AR Instructions Overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 text-white/70 text-xs">
          Point your camera at a flat surface
        </div>
      </div>
    </div>
  );
}

// Standalone placeholder for product pages — just a button that opens AR
export function ARLaunchButton({ imageUrl, productName }: { imageUrl: string; productName: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-purple-400 hover:text-purple-700 transition-colors"
      >
        <Box size={16} />
        View in AR
      </button>
      {isOpen && <ARViewer imageUrl={imageUrl} productName={productName} onClose={() => setIsOpen(false)} />}
    </>
  );
}
