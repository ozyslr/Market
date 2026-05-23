/**
 * Video Moderation Service (STREAM J)
 * Handles video content moderation (automated + manual)
 */

export interface ModerationFlag {
  type: 'violence' | 'adult' | 'hate_speech' | 'misinformation' | 'copyright' | 'other';
  confidence: number; // 0-1
  description: string;
}

export interface ModerationTask {
  id: string;
  videoId: string;
  reviewId: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  autoFlags: ModerationFlag[];
  moderatorNotes?: string;
  moderatorId?: string;
  createdAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

class VideoModerationService {
  private readonly AUTO_FLAG_THRESHOLD = 0.7; // 70% confidence triggers manual review
  private readonly FORBIDDEN_KEYWORDS = [
    'explicit',
    'inappropriate',
    // Add more keywords as needed
  ];

  /**
   * Run automated moderation on video metadata
   */
  async autoModerateVideo(
    videoId: string,
    title: string,
    description: string,
    duration: number
  ): Promise<ModerationFlag[]> {
    const flags: ModerationFlag[] = [];

    try {
      // Check video duration (too short might be spam)
      if (duration < 5) {
        flags.push({
          type: 'other',
          confidence: 0.6,
          description: 'Video is very short (<5 seconds), may be spam',
        });
      }

      // Check for forbidden keywords
      const combinedText = `${title} ${description}`.toLowerCase();
      for (const keyword of this.FORBIDDEN_KEYWORDS) {
        if (combinedText.includes(keyword)) {
          flags.push({
            type: 'adult',
            confidence: 0.8,
            description: `Contains potentially inappropriate keyword: "${keyword}"`,
          });
        }
      }

      // Check for excessive punctuation or caps (spam indicator)
      const capsRatio = (title.match(/[A-Z]/g) || []).length / title.length;
      if (capsRatio > 0.5) {
        flags.push({
          type: 'other',
          confidence: 0.5,
          description: 'Excessive capitalization, may be spam',
        });
      }

      // Check for suspicious URLs in description
      const urlPattern = /(https?:\/\/[^\s]+)/g;
      const urls = description.match(urlPattern) || [];
      if (urls.length > 2) {
        flags.push({
          type: 'misinformation',
          confidence: 0.6,
          description: `Multiple URLs in description (${urls.length}), possible phishing`,
        });
      }

      return flags;
    } catch (error) {
      console.error('Auto-moderation error:', error);
      return [];
    }
  }

  /**
   * Create moderation task
   */
  async createModerationTask(
    videoId: string,
    reviewId: string,
    autoFlags: ModerationFlag[]
  ): Promise<ModerationTask> {
    const task: ModerationTask = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      videoId,
      reviewId,
      status: 'pending',
      autoFlags,
      createdAt: new Date(),
    };

    try {
      // Only create if high-confidence flags or manual review needed
      const needsReview = autoFlags.some((f) => f.confidence >= this.AUTO_FLAG_THRESHOLD);

      if (needsReview || autoFlags.length > 0) {
        // Save to Firestore
        // db.collection('video_moderation_queue').doc(task.id).set(task)
        console.log(`[Moderation] Task created: ${task.id} with ${autoFlags.length} flags`);
      } else {
        // Auto-approve if no concerning flags
        task.status = 'approved';
        console.log(`[Moderation] Auto-approved video ${videoId}`);
      }

      return task;
    } catch (error) {
      console.error('Create moderation task error:', error);
      throw new Error('Failed to create moderation task');
    }
  }

  /**
   * Get pending moderation tasks
   */
  async getPendingTasks(limit: number = 50): Promise<ModerationTask[]> {
    try {
      // Query Firestore for pending tasks
      // const snapshot = await db
      //   .collection('video_moderation_queue')
      //   .where('status', '==', 'pending')
      //   .orderBy('createdAt', 'asc')
      //   .limit(limit)
      //   .get()

      // Placeholder return
      return [];
    } catch (error) {
      console.error('Get pending tasks error:', error);
      return [];
    }
  }

  /**
   * Approve video after manual review
   */
  async approveVideo(
    taskId: string,
    moderatorId: string,
    notes?: string
  ): Promise<void> {
    try {
      // Update task and video status
      // db.collection('video_moderation_queue').doc(taskId).update({
      //   status: 'approved',
      //   moderatorId,
      //   moderatorNotes: notes,
      //   reviewedAt: new Date(),
      // })

      // Update review video status
      // db.collection('reviews').doc(reviewId).update({
      //   videoStatus: 'approved',
      // })

      console.log(
        `[Moderation] Video approved by ${moderatorId}${notes ? ': ' + notes : ''}`
      );
    } catch (error) {
      console.error('Approve video error:', error);
      throw new Error('Failed to approve video');
    }
  }

  /**
   * Reject video after manual review
   */
  async rejectVideo(
    taskId: string,
    moderatorId: string,
    reason: string,
    notes?: string
  ): Promise<void> {
    try {
      // Valid rejection reasons
      const validReasons = [
        'violence',
        'adult_content',
        'hate_speech',
        'misinformation',
        'copyright_issue',
        'spam',
        'irrelevant',
        'other',
      ];

      if (!validReasons.includes(reason)) {
        throw new Error(`Invalid rejection reason: ${reason}`);
      }

      // Update task and video status
      // db.collection('video_moderation_queue').doc(taskId).update({
      //   status: 'rejected',
      //   moderatorId,
      //   rejectionReason: reason,
      //   moderatorNotes: notes,
      //   reviewedAt: new Date(),
      // })

      // Update review video status
      // db.collection('reviews').doc(reviewId).update({
      //   videoStatus: 'rejected',
      //   videoRejectionReason: reason,
      // })

      console.log(
        `[Moderation] Video rejected by ${moderatorId} for: ${reason}${
          notes ? ' - ' + notes : ''
        }`
      );
    } catch (error) {
      console.error('Reject video error:', error);
      throw new Error('Failed to reject video');
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(days: number = 7): Promise<{
    totalReviewed: number;
    approved: number;
    rejected: number;
    pendingCount: number;
    approvalRate: number;
    avgReviewTimeMinutes: number;
  }> {
    try {
      // Query Firestore for stats
      // const snapshot = await db
      //   .collection('video_moderation_queue')
      //   .where('reviewedAt', '>=', new Date(Date.now() - days * 24 * 60 * 60 * 1000))
      //   .get()

      // Placeholder
      return {
        totalReviewed: 0,
        approved: 0,
        rejected: 0,
        pendingCount: 0,
        approvalRate: 0,
        avgReviewTimeMinutes: 0,
      };
    } catch (error) {
      console.error('Get moderation stats error:', error);
      throw new Error('Failed to get moderation stats');
    }
  }

  /**
   * Get flagged content summary
   */
  getFlaggedContentSummary(flags: ModerationFlag[]): {
    riskLevel: 'low' | 'medium' | 'high';
    summary: string;
    requiresManualReview: boolean;
  } {
    if (flags.length === 0) {
      return {
        riskLevel: 'low',
        summary: 'No flags detected',
        requiresManualReview: false,
      };
    }

    const highConfidenceFlags = flags.filter((f) => f.confidence >= this.AUTO_FLAG_THRESHOLD);
    const maxConfidence = Math.max(...flags.map((f) => f.confidence));

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (highConfidenceFlags.length > 0) {
      riskLevel = maxConfidence > 0.85 ? 'high' : 'medium';
    } else if (maxConfidence > 0.5) {
      riskLevel = 'medium';
    }

    const flagTypes = [...new Set(flags.map((f) => f.type))];
    const summary = `${flags.length} flag(s) detected: ${flagTypes.join(', ')}`;

    return {
      riskLevel,
      summary,
      requiresManualReview: riskLevel !== 'low',
    };
  }
}

export const videoModerationService = new VideoModerationService();
