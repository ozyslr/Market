# Feedback Components Integration Guide

**Referans:** 02-feedback-ux-specification.md  
**Odak:** Component API'ları, prop interfaces, state management

---

## 1. ReviewForm Video Integration

### 1.1 Component Props Interface

```typescript
// src/components/product/ReviewForm.tsx
export interface ReviewFormProps {
  productId: string;
  sellerId: string;
  onSubmit: (review: ReviewWithVideo) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export interface ReviewWithVideo {
  rating: number;
  text: string;
  images: File[];
  videoFile?: File; // NEW
  videoDuration?: number; // NEW
  category?: 'quality' | 'shipping' | 'fit';
}
```

### 1.2 State Management

```typescript
const [formData, setFormData] = useState<ReviewWithVideo>({
  rating: 0,
  text: '',
  images: [],
});

const [videoFile, setVideoFile] = useState<File | null>(null);
const [videoPreview, setVideoPreview] = useState<string | null>(null);
const [videoError, setVideoError] = useState<string>('');
const [videoMetadata, setVideoMetadata] = useState({
  duration: 0,
  size: 0,
});

const [isSubmitting, setIsSubmitting] = useState(false);
```

### 1.3 Video Validation Utilities

```typescript
// src/utils/videoValidation.ts
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_VIDEO_DURATION = 30; // seconds

export interface VideoValidationError {
  field: 'type' | 'size' | 'duration' | 'encoding';
  message: string;
  value: string | number;
}

export const validateVideoFile = (
  file: File,
  videoDuration: number
): VideoValidationError[] => {
  const errors: VideoValidationError[] = [];

  // Type check
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    errors.push({
      field: 'type',
      message: 'Only MP4 and WebM formats are supported',
      value: file.type,
    });
  }

  // Size check
  if (file.size > MAX_VIDEO_SIZE) {
    errors.push({
      field: 'size',
      message: `Video size must be less than 50MB (your file: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
      value: file.size,
    });
  }

  // Duration check
  if (videoDuration > MAX_VIDEO_DURATION) {
    errors.push({
      field: 'duration',
      message: `Video must be shorter than 30 seconds (your video: ${Math.round(videoDuration)}s)`,
      value: videoDuration,
    });
  }

  return errors;
};

export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load video metadata'));
    };
  });
};
```

### 1.4 Submission Handler

```typescript
const handleVideoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setVideoError('');

  try {
    // Get video duration
    const duration = await getVideoDuration(file);
    setVideoMetadata({ duration, size: file.size });

    // Validate
    const errors = validateVideoFile(file, duration);
    if (errors.length > 0) {
      setVideoError(errors[0].message);
      return;
    }

    // Set file and preview
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, videoFile: file }));
  } catch (error) {
    setVideoError('Failed to process video. Please try another file.');
  }
};

const handleRemoveVideo = () => {
  if (videoPreview) {
    URL.revokeObjectURL(videoPreview);
  }
  setVideoFile(null);
  setVideoPreview(null);
  setFormData((prev) => ({ ...prev, videoFile: undefined }));
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!formData.rating) {
    alert('Please select a rating');
    return;
  }
  if (!formData.text.trim() || formData.text.length < 10) {
    alert('Review must be at least 10 characters');
    return;
  }

  setIsSubmitting(true);
  try {
    await onSubmit(formData);
    // Success notification handled by parent
  } catch (error) {
    console.error('Failed to submit review:', error);
    alert('Failed to submit review. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 2. ReviewCard Video Player Integration

### 2.1 Video Player Component

```typescript
// src/components/product/VideoPlayer.tsx
export interface VideoPlayerProps {
  src: string;
  thumbnail?: string;
  duration?: number;
  maxWidth?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  thumbnail,
  duration,
  maxWidth = '100%',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-player" style={{ maxWidth }}>
      <div className="video-container">
        <video
          ref={videoRef}
          src={src}
          poster={thumbnail}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          style={{
            width: '100%',
            height: 'auto',
            backgroundColor: '#000',
          }}
        />
        <button
          className="play-button"
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>

      <div className="controls">
        <div className="progress-bar">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              if (videoRef.current) {
                videoRef.current.currentTime = parseFloat(e.target.value);
              }
            }}
          />
        </div>
        <div className="time-display">
          {formatTime(currentTime)} / {formatTime(duration || 0)}
        </div>
      </div>

      <span className="video-badge">Video</span>
    </div>
  );
};
```

### 2.2 ReviewCard Update

```typescript
// src/components/product/ReviewCard.tsx (Updated)
export interface ReviewCardProps {
  review: Review;
  onHelpfulClick: (reviewId: string, isHelpful: boolean) => Promise<void>;
  onSellerReplyClick?: (reviewId: string) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onHelpfulClick,
  onSellerReplyClick,
}) => {
  const [isMarkingHelpful, setIsMarkingHelpful] = useState(false);
  const [userHelpfulVote, setUserHelpfulVote] = useState<
    boolean | null
  >(null);

  const handleHelpfulClick = async (helpful: boolean) => {
    setIsMarkingHelpful(true);
    try {
      await onHelpfulClick(review.id, helpful);
      setUserHelpfulVote(helpful);
    } finally {
      setIsMarkingHelpful(false);
    }
  };

  return (
    <article className="review-card" data-review-id={review.id}>
      {/* Header */}
      <div className="review-header">
        <div className="author-info">
          <span className="rating">
            {Array.from({ length: review.rating }).map((_, i) => '⭐')}
          </span>
          <span className="author-name">{review.authorName}</span>
          {review.verifiedPurchase && (
            <span className="verified-badge">✓ Verified Buyer</span>
          )}
        </div>
        <time className="review-date">
          {new Date(review.createdAt).toLocaleDateString()}
        </time>
      </div>

      {/* Title and text */}
      <h3 className="review-title">{review.title}</h3>
      <p className="review-text">{review.text}</p>

      {/* Category badges */}
      {review.category && (
        <span className="category-badge">{review.category}</span>
      )}

      {/* Images gallery */}
      {review.images && review.images.length > 0 && (
        <div className="images-gallery">
          {review.images.map((img, idx) => (
            <img
              key={idx}
              src={img.url}
              alt={`Review image ${idx + 1}`}
              className="review-image"
            />
          ))}
        </div>
      )}

      {/* Video player (NEW) */}
      {review.videoUrl && (
        <div className="video-section">
          <VideoPlayer
            src={review.videoUrl}
            duration={review.videoDuration}
          />
        </div>
      )}

      {/* Footer: helpful votes and seller reply */}
      <div className="review-footer">
        <div className="helpful-section">
          <button
            className={`helpful-btn ${userHelpfulVote === true ? 'active' : ''}`}
            onClick={() => handleHelpfulClick(true)}
            disabled={isMarkingHelpful}
          >
            👍 Helpful ({review.helpfulCount})
          </button>
          <button
            className={`unhelpful-btn ${userHelpfulVote === false ? 'active' : ''}`}
            onClick={() => handleHelpfulClick(false)}
            disabled={isMarkingHelpful}
          >
            👎 Not Helpful ({review.unhelpfulCount})
          </button>
        </div>

        {review.sellerReply && (
          <div className="seller-reply">
            <p className="reply-label">Seller Reply:</p>
            <p className="reply-text">{review.sellerReply}</p>
            <time className="reply-date">
              {new Date(review.sellerReplyDate).toLocaleDateString()}
            </time>
          </div>
        )}

        {onSellerReplyClick && !review.sellerReply && (
          <button
            className="reply-btn"
            onClick={() => onSellerReplyClick(review.id)}
          >
            Reply as Seller
          </button>
        )}
      </div>
    </article>
  );
};
```

---

## 3. Moderation Service Integration

### 3.1 Moderation Result Types

```typescript
// src/types.ts
export interface ModerationCheckResult {
  id: string;
  category:
    | 'spam'
    | 'profanity'
    | 'fraud'
    | 'irrelevant'
    | 'clean';
  score: number; // 0-1
  confidence: number; // 0-1
  approved: boolean;
  flagged: boolean;
  reasons: string[];
}

export interface Review {
  // ... existing fields ...
  status: 'pending' | 'approved' | 'flagged' | 'rejected';
  moderationResults?: ModerationCheckResult[];
  moderationNotes?: string;
  moderatedAt?: Date;
  moderatedBy?: string;
}
```

### 3.2 Claude API Integration

```typescript
// src/services/claudeModeration.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const performModerationAnalysis = async (
  review: Review
): Promise<ModerationCheckResult[]> => {
  const results: ModerationCheckResult[] = [];

  // 1. Spam Detection
  results.push(await detectSpam(review));

  // 2. Profanity Detection
  results.push(await detectProfanity(review));

  // 3. Fraud Detection
  results.push(await detectFraud(review));

  // 4. Relevance Check
  results.push(await checkRelevance(review));

  return results;
};

const detectSpam = async (review: Review): Promise<ModerationCheckResult> => {
  const response = await client.messages.create({
    model: 'claude-3-haiku-20250101',
    max_tokens: 100,
    system: `You are a content moderation expert. Analyze the review for SPAM characteristics:
- Repetitive content
- Commercial promotion (links, shop names, etc.)
- Off-topic content
- Keyword stuffing

Return JSON: { "isSpam": boolean, "score": 0-1, "reasons": ["reason1"] }`,
    messages: [
      {
        role: 'user',
        content: `Review Text: ${review.text}\n\nProduct: ${review.productTitle}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  try {
    const parsed = JSON.parse(content.text);
    return {
      id: review.id,
      category: 'spam',
      score: 1 - parsed.score, // Invert for scoring (0 = spam, 1 = clean)
      confidence: 0.85,
      approved: !parsed.isSpam,
      flagged: false,
      reasons: parsed.reasons,
    };
  } catch {
    return {
      id: review.id,
      category: 'spam',
      score: 0.5,
      confidence: 0.3,
      approved: true,
      flagged: true,
      reasons: ['Failed to analyze, flagging for human review'],
    };
  }
};

const detectProfanity = async (
  review: Review
): Promise<ModerationCheckResult> => {
  // Use simple profanity list first (fast path)
  const PROFANITY_LIST = await loadProfanityList();
  const textLower = review.text.toLowerCase();

  const foundWords = PROFANITY_LIST.filter((word) =>
    new RegExp(`\\b${word}\\b`).test(textLower)
  );

  if (foundWords.length > 0) {
    return {
      id: review.id,
      category: 'profanity',
      score: 0.1,
      confidence: 0.95,
      approved: false,
      flagged: false,
      reasons: [`Contains profanity: ${foundWords.join(', ')}`],
    };
  }

  // Secondary AI check for subtle cases
  const response = await client.messages.create({
    model: 'claude-3-haiku-20250101',
    max_tokens: 50,
    system: `Analyze for offensive/inappropriate language that violates platform policy.
Return: { "hasOffensiveContent": boolean, "severity": "high"|"medium"|"low"|"none" }`,
    messages: [{ role: 'user', content: review.text }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    return {
      id: review.id,
      category: 'profanity',
      score: 0.5,
      confidence: 0.3,
      approved: true,
      flagged: true,
      reasons: ['Could not analyze, flagging for human review'],
    };
  }

  const parsed = JSON.parse(content.text);
  return {
    id: review.id,
    category: 'profanity',
    score: parsed.hasOffensiveContent ? 0.2 : 0.9,
    confidence: parsed.hasOffensiveContent ? 0.8 : 0.9,
    approved: !parsed.hasOffensiveContent,
    flagged: false,
    reasons: parsed.hasOffensiveContent
      ? [`Contains inappropriate content (${parsed.severity})`]
      : [],
  };
};

const detectFraud = async (review: Review): Promise<ModerationCheckResult> => {
  // Check review patterns
  const fraudPatterns = [
    { regex: /http|www|\.(com|net)/gi, name: 'external links' },
    { regex: /\b(\w)\1{3,}\b/g, name: 'character repetition' },
    { regex: /[A-Z]{6,}/g, name: 'excessive caps' },
  ];

  const matches = fraudPatterns.reduce((sum, pattern) => {
    return sum + (review.text.match(pattern.regex) || []).length;
  }, 0);

  const fraudScore = Math.min(matches / 5, 1);

  // Check if user reviews multiple products from same seller
  const userReviews = await countUserReviewsForSeller(
    review.userId,
    review.sellerId
  );

  const suspiciousActivity = userReviews > 10;

  const finalScore = Math.max(fraudScore, suspiciousActivity ? 0.7 : 0);

  return {
    id: review.id,
    category: 'fraud',
    score: 1 - finalScore,
    confidence: 0.75,
    approved: finalScore < 0.5,
    flagged: finalScore >= 0.5,
    reasons:
      finalScore > 0.5
        ? ['Pattern matches potential fake review behavior']
        : [],
  };
};

const checkRelevance = async (
  review: Review
): Promise<ModerationCheckResult> => {
  // Use semantic similarity
  const productKeywords = extractKeywords(review.productTitle);
  const reviewKeywords = extractKeywords(review.text);

  const overlap = productKeywords.filter((kw) =>
    reviewKeywords.includes(kw)
  ).length;

  const relevanceScore =
    overlap / Math.max(productKeywords.length, 1);

  return {
    id: review.id,
    category: relevanceScore > 0.3 ? 'clean' : 'irrelevant',
    score: relevanceScore,
    confidence: 0.7,
    approved: relevanceScore > 0.3,
    flagged: false,
    reasons:
      relevanceScore <= 0.3
        ? ['Review does not appear to be about the product']
        : [],
  };
};

const extractKeywords = (text: string): string[] => {
  const words = text
    .toLowerCase()
    .match(/\b\w+\b/g) || [];
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'is',
    'was',
    'to',
    'for',
    'of',
    'in',
  ]);
  return words.filter((w) => !stopWords.has(w));
};

const loadProfanityList = async (): Promise<string[]> => {
  // Load from file/cache
  return [
    'offensive_word_1',
    'offensive_word_2',
    // ... actual profanity list
  ];
};

const countUserReviewsForSeller = async (
  userId: string,
  sellerId: string
): Promise<number> => {
  const snapshot = await firestore
    .collection('reviews')
    .where('userId', '==', userId)
    .where('sellerId', '==', sellerId)
    .count()
    .get();
  return snapshot.data().count;
};
```

---

## 4. Seller Reviews Page Component Structure

### 4.1 Directory Structure

```
mercora-next/src/
├── app/
│   └── seller/
│       └── [id]/
│           ├── layout.tsx
│           ├── page.tsx (seller profile)
│           └── reviews/
│               ├── layout.tsx
│               └── page.tsx (NEW)
├── components/
│   └── seller/
│       ├── SellerReviewsPage.tsx (NEW - orchestrator)
│       ├── SellerRatingSummary.tsx (NEW)
│       ├── SellerPerformanceMetrics.tsx (NEW)
│       └── SellerReviewFilters.tsx (NEW)
└── services/
    └── sellerReviewService.ts (NEW)
```

### 4.2 SellerReviewService

```typescript
// src/services/sellerReviewService.ts
export interface SellerReviewStats {
  sellerId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  avgShipSpeed: number;
  compliance: number;
  responseRate: number;
  lastUpdated: Date;
}

export const getSellerReviewStats = async (
  sellerId: string
): Promise<SellerReviewStats> => {
  // Use pre-calculated document or calculate on-the-fly
  const statsDoc = await firestore
    .collection('sellers')
    .doc(sellerId)
    .collection('stats')
    .doc('reviews')
    .get();

  if (statsDoc.exists && isStatsCurrentDay(statsDoc.data())) {
    return statsDoc.data() as SellerReviewStats;
  }

  // Recalculate
  return await calculateSellerReviewStats(sellerId);
};

const calculateSellerReviewStats = async (
  sellerId: string
): Promise<SellerReviewStats> => {
  const reviews = await firestore
    .collection('reviews')
    .where('sellerId', '==', sellerId)
    .where('status', '==', 'approved')
    .get();

  const reviewDocs = reviews.docs.map((doc) => doc.data() as Review);

  if (reviewDocs.length === 0) {
    return {
      sellerId,
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      avgShipSpeed: 0,
      compliance: 100,
      responseRate: 0,
      lastUpdated: new Date(),
    };
  }

  const avgRating =
    reviewDocs.reduce((sum, r) => sum + r.rating, 0) /
    reviewDocs.length;

  const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviewDocs.forEach((r) => {
    ratingDist[r.rating]++;
  });

  // Get order metrics
  const orders = await firestore
    .collection('orders')
    .where('sellerId', '==', sellerId)
    .where('status', '==', 'delivered')
    .limit(1000)
    .get();

  const shipSpeeds = orders.docs
    .map((doc) => {
      const data = doc.data() as any;
      const shippedDate = data.shippedAt?.toDate?.();
      const deliveredDate = data.deliveredAt?.toDate?.();
      if (shippedDate && deliveredDate) {
        return (
          (deliveredDate.getTime() - shippedDate.getTime()) /
          (1000 * 60 * 60 * 24)
        );
      }
      return 0;
    })
    .filter((s) => s > 0);

  const avgShipSpeed =
    shipSpeeds.reduce((a, b) => a + b, 0) / shipSpeeds.length || 0;

  const stats: SellerReviewStats = {
    sellerId,
    totalReviews: reviewDocs.length,
    averageRating: avgRating,
    ratingDistribution: ratingDist,
    avgShipSpeed,
    compliance: 98.5, // From seller profile or orders
    responseRate: 95, // From support tickets
    lastUpdated: new Date(),
  };

  // Cache for 24h
  await firestore
    .collection('sellers')
    .doc(sellerId)
    .collection('stats')
    .doc('reviews')
    .set(stats);

  return stats;
};

const isStatsCurrentDay = (data: any): boolean => {
  const lastUpdated = data.lastUpdated?.toDate?.();
  if (!lastUpdated) return false;
  const dayAgo = new Date();
  dayAgo.setDate(dayAgo.getDate() - 1);
  return lastUpdated > dayAgo;
};

export const getSellerReviews = async (
  sellerId: string,
  filters: SellerReviewFilters,
  page: number = 1
): Promise<{ reviews: Review[]; totalCount: number }> => {
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  let query = firestore
    .collection('reviews')
    .where('sellerId', '==', sellerId)
    .where('status', '==', 'approved');

  // Apply filters
  if (filters.rating) {
    query = query.where('rating', '==', filters.rating);
  }
  if (filters.verifiedOnly) {
    query = query.where('verifiedPurchase', '==', true);
  }
  if (filters.withImages) {
    // This is tricky in Firestore - may need to filter client-side
    // or maintain separate collection
  }

  // Count total
  const countSnapshot = await query.count().get();
  const totalCount = countSnapshot.data().count;

  // Sort and paginate
  const sortField = filters.sort === 'recent' ? 'createdAt' : 'helpfulCount';
  const sortDirection = filters.sort === 'recent' ? 'desc' : 'desc';

  const snapshot = await query
    .orderBy(sortField, sortDirection as any)
    .offset(offset)
    .limit(pageSize)
    .get();

  return {
    reviews: snapshot.docs.map((doc) => doc.data() as Review),
    totalCount,
  };
};

export interface SellerReviewFilters {
  sort: 'recent' | 'helpful';
  rating?: number;
  verifiedOnly: boolean;
  withImages: boolean;
}
```

---

## 5. CSS/Styling Guide

### 5.1 Video Player Styles

```css
/* src/styles/video-player.css */
.video-player {
  border-radius: 8px;
  overflow: hidden;
  background-color: #000;
  margin: 12px 0;
}

.video-container {
  position: relative;
  aspect-ratio: 16 / 9;
  background-color: #000;
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  font-size: 28px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.play-button:hover {
  background-color: rgba(255, 255, 255, 1);
}

.controls {
  padding: 12px;
  background-color: #222;
}

.progress-bar input {
  width: 100%;
  height: 4px;
  accent-color: #ff6b6b;
}

.time-display {
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}

.video-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
```

### 5.2 Seller Reviews Page Styles

```css
/* src/styles/seller-reviews.css */
.seller-rating-summary {
  display: grid;
  grid-template-columns: 1fr 2fr 1.5fr;
  gap: 24px;
  padding: 24px;
  background-color: #f9f9f9;
  border-radius: 12px;
  margin-bottom: 32px;
}

.overall-rating {
  text-align: center;
}

.overall-rating h2 {
  font-size: 40px;
  margin: 0;
}

.rating-distribution {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rating-row {
  display: grid;
  grid-template-columns: 30px 1fr 50px;
  align-items: center;
  gap: 12px;
}

.bar {
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.bar .fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffed4e);
  transition: width 0.3s;
}

.performance-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.metric-card {
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  text-align: center;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #ff6b6b;
}

.metric-label {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.seller-badge {
  padding: 8px 16px;
  background-color: #fff;
  border: 2px solid;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
}

.seller-badge.gold {
  border-color: #ffd700;
  color: #b8860b;
}

.seller-badge.platinum {
  border-color: #e5e4e2;
  color: #696969;
}

@media (max-width: 768px) {
  .seller-rating-summary {
    grid-template-columns: 1fr;
  }
}
```

---

**Referans Dosyaları:**  
- 02-feedback-ux-specification.md
- src/services/reviewService.ts
- src/components/product/ReviewForm.tsx
- src/components/product/ReviewCard.tsx

**Teknoloji Stack:**
- React 18+
- TypeScript 4.9+
- Firebase (Firestore + Storage)
- Claude API (Haiku model)
- Tailwind CSS / Custom CSS
