/**
 * Video Processing Service (STREAM J)
 * Handles video upload, transcoding, and HLS playlist generation
 */

export interface VideoMetadata {
  duration: number;
  resolution: string;
  fileSize: number;
  thumbnail: string;
  bitrates: string[];
}

export interface VideoProcessingJob {
  id: string;
  reviewId: string;
  status: 'queued' | 'transcoding' | 'generating_playlist' | 'complete' | 'failed';
  bitrates: string[];
  progress: number; // 0-100
  hlsPlaylistUrl?: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

class VideoProcessingService {
  private readonly MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
  private readonly SUPPORTED_FORMATS = ['video/mp4', 'video/webm', 'video/quicktime'];
  private readonly BITRATE_PRESETS: Record<string, { resolution: string; bitrate: string; width: number; height: number }> = {
    '720p': {
      resolution: '1280x720',
      bitrate: '2500k',
      width: 1280,
      height: 720,
    },
    '480p': {
      resolution: '854x480',
      bitrate: '1000k',
      width: 854,
      height: 480,
    },
    '240p': {
      resolution: '426x240',
      bitrate: '500k',
      width: 426,
      height: 240,
    },
  };

  /**
   * Validate video file before upload
   */
  validateVideoFile(file: File): { valid: boolean; error?: string } {
    if (!this.SUPPORTED_FORMATS.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported format. Supported: MP4, WebM`,
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large. Max 30MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Generate video thumbnail at specified time
   */
  async generateThumbnail(
    videoUrl: string,
    timeSeconds: number = 3
  ): Promise<string> {
    try {
      // In production, use ffmpeg.wasm or Cloud Functions
      // This is a placeholder for thumbnail generation
      const canvas = document.createElement('canvas') as any;
      const ctx = canvas.getContext('2d');

      canvas.width = 320;
      canvas.height = 180;

      // Placeholder: return data URL
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return ''; // Fallback to default thumbnail
    }
  }

  /**
   * Create transcoding job for video
   */
  async createTranscodingJob(
    reviewId: string,
    videoUrl: string,
    bitrates: string[] = ['720p', '480p', '240p']
  ): Promise<VideoProcessingJob> {
    const job: VideoProcessingJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reviewId,
      status: 'queued',
      bitrates,
      progress: 0,
      createdAt: new Date(),
    };

    try {
      // In production, trigger Cloud Task or message queue
      // For now, simulate queuing
      await this.queueTranscodingTask(job, videoUrl);
      return job;
    } catch (error) {
      console.error('Create transcoding job error:', error);
      throw new Error('Failed to queue video transcoding');
    }
  }

  /**
   * Queue transcoding task (Cloud Tasks, Bull, etc.)
   */
  private async queueTranscodingTask(
    job: VideoProcessingJob,
    videoUrl: string
  ): Promise<void> {
    // Placeholder for Cloud Tasks integration
    // In production:
    // 1. Create Cloud Task with job.id and videoUrl
    // 2. Point to /api/videos/process endpoint
    // 3. Handle async processing with retry policy

    console.log(`[Queue] Transcoding job ${job.id} for video ${videoUrl}`);
    console.log(`[Job] Status: ${job.status}, Bitrates: ${job.bitrates.join(', ')}`);
  }

  /**
   * Update job progress
   */
  async updateJobProgress(
    jobId: string,
    progress: number,
    status?: 'transcoding' | 'generating_playlist' | 'complete'
  ): Promise<void> {
    try {
      // Update to Firestore
      // db.collection('video_processing_jobs').doc(jobId).update({
      //   progress,
      //   status: status || 'transcoding',
      //   updatedAt: new Date(),
      // })

      console.log(`[Progress] Job ${jobId}: ${progress}% ${status ? `(${status})` : ''}`);
    } catch (error) {
      console.error('Update job progress error:', error);
    }
  }

  /**
   * Generate HLS playlist (.m3u8) from transcoded variants
   */
  async generateHLSPlaylist(
    jobId: string,
    bitrates: string[],
    basePath: string
  ): Promise<string> {
    try {
      const playlistLines: string[] = ['#EXTM3U', '#EXT-X-VERSION:3'];

      // Add variant streams (adaptive bitrate)
      for (const bitrate of bitrates) {
        const preset = this.BITRATE_PRESETS[bitrate];
        if (!preset) continue;

        playlistLines.push(
          `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(preset.bitrate)},RESOLUTION=${preset.resolution}`
        );
        playlistLines.push(`${basePath}/stream-${bitrate}.m3u8`);
      }

      const playlist = playlistLines.join('\n');

      // In production, save to Cloud Storage
      // await storage.bucket().file(`${jobId}/playlist.m3u8`).save(playlist)

      return `${basePath}/playlist.m3u8`;
    } catch (error) {
      console.error('Generate HLS playlist error:', error);
      throw new Error('Failed to generate HLS playlist');
    }
  }

  /**
   * Get bitrate presets for transcoding
   */
  getBitratePresets(): Record<string, { resolution: string; bitrate: string }> {
    return Object.entries(this.BITRATE_PRESETS).reduce(
      (acc, [key, value]) => {
        acc[key] = { resolution: value.resolution, bitrate: value.bitrate };
        return acc;
      },
      {} as Record<string, { resolution: string; bitrate: string }>
    );
  }

  /**
   * Extract video metadata (duration, resolution)
   */
  async extractMetadata(videoUrl: string): Promise<Partial<VideoMetadata>> {
    try {
      const video = document.createElement('video') as any;

      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          resolve({
            duration: video.duration,
            resolution: `${video.videoWidth}x${video.videoHeight}`,
          });
        };

        video.onerror = () => {
          resolve({ duration: 0, resolution: 'unknown' });
        };

        video.src = videoUrl;
      });
    } catch (error) {
      console.error('Extract metadata error:', error);
      return { duration: 0, resolution: 'unknown' };
    }
  }

  /**
   * Calculate storage and cost for transcoding
   */
  calculateTranscodingCost(fileSizeMB: number, durationSeconds: number): {
    storageCostUSD: number;
    transcodingCostUSD: number;
    totalCostUSD: number;
  } {
    // Rough estimates
    const storagePerGB = 0.02; // $0.02 per GB per month
    const transcodingPerGBMin = 0.075; // $0.075 per GB-minute

    const storageCost = (fileSizeMB / 1024) * storagePerGB;
    const transcodingCost = (fileSizeMB / 1024) * (durationSeconds / 60) * transcodingPerGBMin;

    return {
      storageCostUSD: parseFloat(storageCost.toFixed(4)),
      transcodingCostUSD: parseFloat(transcodingCost.toFixed(4)),
      totalCostUSD: parseFloat((storageCost + transcodingCost).toFixed(4)),
    };
  }
}

export const videoProcessingService = new VideoProcessingService();
