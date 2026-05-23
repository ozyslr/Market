/**
 * Video Upload API Endpoint (STREAM J - Phase 3)
 * POST /api/videos/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { videoProcessingService } from '@/services/videoProcessingService';
import { videoModerationService } from '@/services/videoModerationService';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const reviewId = formData.get('reviewId') as string;

    if (!file || !reviewId) {
      return NextResponse.json(
        { error: 'Missing file or reviewId' },
        { status: 400 }
      );
    }

    // Validate video file
    const validation = videoProcessingService.validateVideoFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Create video URL (in production: upload to Cloud Storage)
    const videoUrl = `gs://bucket/${reviewId}/${file.name}`;

    // Extract metadata
    const metadata = await videoProcessingService.extractMetadata(videoUrl);

    // Create transcoding job
    const job = await videoProcessingService.createTranscodingJob(
      reviewId,
      videoUrl,
      ['720p', '480p', '240p']
    );

    // Run auto-moderation
    const title = formData.get('title') as string || '';
    const description = formData.get('description') as string || '';
    const autoFlags = await videoModerationService.autoModerateVideo(
      videoUrl,
      title,
      description,
      metadata.duration || 0
    );

    // Create moderation task
    const moderationTask = await videoModerationService.createModerationTask(
      videoUrl,
      reviewId,
      autoFlags
    );

    return NextResponse.json(
      {
        success: true,
        videoId: videoUrl,
        job,
        moderation: moderationTask,
        metadata,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}
