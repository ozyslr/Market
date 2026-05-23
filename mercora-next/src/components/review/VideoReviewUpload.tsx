'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Typography,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { videoProcessingService } from '@/services/videoProcessingService';

interface VideoReviewUploadProps {
  reviewId: string;
  onUploadComplete?: (videoUrl: string) => void;
  onError?: (error: string) => void;
}

export const VideoReviewUpload: React.FC<VideoReviewUploadProps> = ({
  reviewId,
  onUploadComplete,
  onError,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validation = videoProcessingService.validateVideoFile(selectedFile);

    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      setUploadStatus('error');
      onError?.(validation.error || 'Invalid file');
      return;
    }

    setFile(selectedFile);
    setUploadStatus('idle');
    setErrorMessage('');
  }, [onError]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('reviewId', reviewId);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + Math.random() * 30, 90));
      }, 500);

      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadProgress(100);
      setUploadStatus('success');
      onUploadComplete?.(data.videoId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
      setUploadStatus('error');
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [file, reviewId, onUploadComplete, onError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Upload Video Review
        </Typography>

        {uploadStatus === 'success' ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography color="success.main">Video uploaded successfully!</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Your video is being processed and moderated. This typically takes 2-5 minutes.
            </Typography>
          </Box>
        ) : uploadStatus === 'error' ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        ) : null}

        {uploadStatus !== 'success' && (
          <>
            <Box
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
                opacity: isUploading ? 0.6 : 1,
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleInputChange}
                style={{ display: 'none' }}
                disabled={isUploading}
              />

              {isUploading ? (
                <Box>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography variant="body2">Uploading...</Typography>
                </Box>
              ) : (
                <>
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="body2">
                    Drag and drop your video here or click to select
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Max 30MB • MP4, WebM, MOV
                  </Typography>
                </>
              )}
            </Box>

            {file && !isUploading && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  Upload Video
                </Button>
              </Box>
            )}

            {isUploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  {uploadProgress.toFixed(0)}%
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoReviewUpload;
