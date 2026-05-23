'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Box,
  Skeleton,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

interface ImageOptimizerProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  showDownload?: boolean;
  showZoom?: boolean;
  placeholder?: 'blur' | 'empty';
  quality?: number;
}

export const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  src,
  alt,
  width = 400,
  height = 300,
  priority = false,
  sizes,
  className,
  onLoad,
  onError,
  showDownload = false,
  showZoom = false,
  placeholder = 'blur',
  quality = 75,
}) => {
  const [isLoading, setIsLoading] = useState(!priority);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = alt || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  }, [src, alt]);

  if (hasError) {
    return (
      <Box
        sx={{
          width: '100%',
          height: 'auto',
          backgroundColor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 1,
          minHeight: height,
        }}
      >
        <span>Failed to load image</span>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        borderRadius: 1,
      }}
    >
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={height}
          sx={{ position: 'absolute', top: 0, left: 0 }}
        />
      )}

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          paddingBottom: `${(height / width) * 100}%`,
          overflow: 'hidden',
          cursor: showZoom ? 'zoom-in' : 'default',
          '&:hover .image-controls': showDownload || showZoom ? { opacity: 1 } : {},
        }}
        onClick={() => showZoom && setIsZoomed(!isZoomed)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          quality={quality}
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          onLoadingComplete={handleLoadingComplete}
          onError={handleError}
          className={className}
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
            transition: 'transform 0.3s ease',
          }}
        />

        {(showDownload || showZoom) && (
          <Box
            className="image-controls"
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              display: 'flex',
              gap: 1,
              opacity: 0,
              transition: 'opacity 0.3s ease',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: 1,
              p: 0.5,
            }}
          >
            {showZoom && (
              <Tooltip title={isZoomed ? 'Reset Zoom' : 'Zoom In'}>
                <IconButton
                  size="small"
                  sx={{ color: 'white' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomed(!isZoomed);
                  }}
                >
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {showDownload && (
              <Tooltip title="Download Image">
                <IconButton
                  size="small"
                  sx={{ color: 'white' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ImageOptimizer;
