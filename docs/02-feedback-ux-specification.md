# Feedback UX Specification: P0 Geri Bildirim Sistemleri

**Versiyon:** 1.0  
**Tarih:** 2026-05-23  
**Rol:** UX/UI Tasarımcısı 2  
**Sprint Hedefi:** Sprint 1-2'de 2-3 P0 özellik uygulaması

---

## 1. Mevcut Durum Analizi

### 1.1 Mercora Feedback Altyapısı (5.0/10)

Mercora şu geri bildirim bileşenlerine sahiptir:

| Bileşen | Durum | Teknik |
|---------|-------|--------|
| Ürün Yorum Sistemi | Var | ReviewSection, ReviewCard, ReviewForm, ReviewFilters |
| Soru-Cevap | Var | QASection, QuestionCard |
| Moderasyon (Manual) | Var | AdminReviews, status: pending/approved/rejected |
| Satıcı Degerlendirme | Var | sellerRatingService (Silver/Gold/Platinum) |
| Live Chat | Var | LiveChatWidget |
| Destek Biletleri | Var | UserSupport, AdminSupport |
| Iade Yönetimi | Var | returnService |

### 1.2 P0 Eksiklikleri (Hemen Yapılmalı)

| # | Eksik Özellik | Etki | Sprint |
|---|---|---|---|
| 1 | Video yorum destegi | +%40 engagement | S1 |
| 2 | AI yorum moderasyonu | -%80 moderasyon yükü | S1 |
| 3 | Otomatik yorum isteme | +3-5x yorum sayısı | S2 |
| 4 | Satıcı puanlama sayfası | +buyer trust | S2 |

---

## 2. P0-1: Video Yorum Destegi

### 2.1 Kullanıcı Akışı

```
User Journey: Video Yorumu Oluşturma

1. Ürün Sayfası → ReviewForm Aç
2. Star Rating Seç (1-5)
3. Metin Yorum Yaz
4. [YENI] "Video Ekle" Toggle → Video Upload
5. Video Seç (max 30sn, WebM/MP4, 50MB)
6. Video Preview
7. Submit → reviewService.createReview()
   - Video dosyası → Firebase Storage
   - Review metadata → Firestore
8. Moderation Queue → Pending
9. Admin Onayı → Approved
10. ProductCard/ReviewCard'da Video Player
```

### 2.2 Ekran Tasarımları

**2.2.1 ReviewForm - Video Upload Section**
```
┌─────────────────────────────────────┐
│ Review Form                         │
├─────────────────────────────────────┤
│ ⭐⭐⭐⭐⭐  Rating                    │
│                                     │
│ [Metin Yorum Textarea]              │
│ (min 10 char, max 500)              │
│                                     │
│ 📸 Photo Upload (max 3)             │
│ [Upload] [Preview 1][Preview 2]    │
│                                     │
│ 🎬 Video Upload (NEW)               │
│ ☐ Add Video                         │
│   [Upload Video]                    │
│   Max 30 seconds, WebM/MP4          │
│   Max file: 50MB                    │
│                                     │
│ [Cancel]        [Submit Review]    │
└─────────────────────────────────────┘
```

**2.2.2 ReviewCard - Video Playback**
```
┌────────────────────────────────────┐
│ ⭐⭐⭐⭐⭐ John D. | Verified Buyer │
│ "Excellent Quality Product"         │
│                                    │
│ 📷 [Image 1] [Image 2] [Image 3] │
│                                    │
│ [▶ 0:15 Video]                    │
│  Video Thumbnail with Play Button  │
│                                    │
│ 👍 123 👎 2    Satıcı Yanıtı: ✓   │
└────────────────────────────────────┘
```

### 2.3 Component Integration

**ReviewForm Component Modifications:**

```typescript
// src/components/product/ReviewForm.tsx
interface ReviewFormProps {
  productId: string;
  onSubmit: (review: ReviewWithVideo) => void;
}

interface ReviewWithVideo extends Review {
  videoFile?: File;
  videoDuration?: number;
  videoUrl?: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onSubmit }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateVideoFile(file)) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const validateVideoFile = (file: File): boolean => {
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    const ALLOWED_TYPES = ['video/mp4', 'video/webm'];
    return (
      file.size <= MAX_SIZE &&
      ALLOWED_TYPES.includes(file.type)
    );
  };

  const handleSubmit = async (formData: ReviewFormData) => {
    const reviewData: ReviewWithVideo = {
      ...formData,
      videoFile,
    };
    onSubmit(reviewData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Rating, Text, Photos as before */}
      
      <div className="video-section">
        <label>
          <input
            type="checkbox"
            onChange={(e) => {
              if (e.target.checked) {
                fileInputRef.current?.click();
              } else {
                setVideoFile(null);
              }
            }}
          />
          Add Video (optional, max 30 seconds)
        </label>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm"
          onChange={handleVideoSelect}
          style={{ display: 'none' }}
        />
        
        {videoPreview && (
          <video src={videoPreview} style={{ maxWidth: '100%' }} />
        )}
      </div>
    </form>
  );
};
```

**ReviewCard Video Player:**

```typescript
// src/components/product/ReviewCard.tsx
interface ReviewCardProps {
  review: ReviewWithVideo;
  onHelpfulClick: (helpful: boolean) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onHelpfulClick }) => {
  const [videoPlaying, setVideoPlaying] = useState(false);

  return (
    <div className="review-card">
      <div className="review-header">
        <span className="rating">{'⭐'.repeat(review.rating)}</span>
        <span className="author">{review.authorName}</span>
        {review.verifiedPurchase && <span className="badge">Verified Buyer</span>}
      </div>

      <p className="review-text">{review.text}</p>

      {review.images && review.images.length > 0 && (
        <div className="images-gallery">
          {review.images.map((img) => (
            <img key={img.id} src={img.url} alt="review" />
          ))}
        </div>
      )}

      {review.videoUrl && (
        <div className="video-container">
          <video
            src={review.videoUrl}
            controls
            style={{ maxWidth: '100%', borderRadius: '8px' }}
          />
          <span className="video-badge">Video</span>
        </div>
      )}

      <div className="review-footer">
        <button onClick={() => onHelpfulClick(true)}>👍 {review.helpfulCount}</button>
        <button onClick={() => onHelpfulClick(false)}>👎 {review.unhelpfulCount}</button>
      </div>
    </div>
  );
};
```

### 2.4 reviewService Modifikasyonları

```typescript
// src/services/reviewService.ts
export const createReviewWithVideo = async (
  review: ReviewWithVideo
): Promise<string> => {
  const reviewId = generateId();
  let videoUrl: string | undefined;

  // 1. Video dosyasını Firebase Storage'a yükle
  if (review.videoFile) {
    videoUrl = await uploadVideoToStorage(
      review.videoFile,
      `reviews/${review.productId}/${reviewId}`
    );
  }

  // 2. Yorum metadata'sını Firestore'a yaz
  const reviewData: Review = {
    id: reviewId,
    productId: review.productId,
    userId: getCurrentUserId(),
    rating: review.rating,
    text: review.text,
    images: review.images,
    videoUrl, // Yeni alan
    status: 'pending', // Moderasyona gönderin
    createdAt: new Date(),
    helpfulCount: 0,
  };

  await firestore.collection('reviews').doc(reviewId).set(reviewData);
  
  // 3. Moderasyon kuyruğuna ekle
  await addToModerationQueue(reviewId, 'video_review');

  return reviewId;
};

const uploadVideoToStorage = async (
  file: File,
  path: string
): Promise<string> => {
  const ref = storage.ref(path);
  const snapshot = await ref.put(file);
  return await snapshot.ref.getDownloadURL();
};
```

---

## 3. P0-2: AI Yorum Moderasyonu

### 3.1 Moderasyon Akışı

```
AI Moderation Workflow

1. User submits review (createReview)
2. reviewService.createReview() calls moderateReview()
3. AI Analysis:
   - Spam Detection (keywords, patterns)
   - Profanity Detection (offensive language)
   - Fraud Detection (seller manipulation, fake reviews)
   - Relevance Check (is it about product?)
4. Decision:
   - Score >= 0.8 → APPROVED
   - 0.5-0.8 → FLAGGED FOR HUMAN REVIEW
   - < 0.5 → REJECTED (spam/fraud)
5. Firestore: status = approved/flagged/rejected
6. Admin Dashboard: Flagged reviews untuk human approval
7. Notification: User bilgilendir (approved/rejected)
```

### 3.2 AI Moderation Service

```typescript
// src/services/moderationService.ts
interface ModerationResult {
  approved: boolean;
  flagged: boolean;
  score: number; // 0-1
  reasons: string[];
  category: 'spam' | 'profanity' | 'fraud' | 'irrelevant' | 'clean';
}

export const moderateReview = async (
  review: Review
): Promise<ModerationResult> => {
  const analyses = await Promise.all([
    detectSpam(review.text),
    detectProfanity(review.text),
    detectFraud(review),
    checkRelevance(review),
  ]);

  const scores = analyses.map((a) => a.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Flagged: controversial items need human review
  const flaggedReasons = analyses
    .filter((a) => a.confidence > 0.7 && !a.approved)
    .map((a) => a.reason);

  return {
    approved: avgScore >= 0.8,
    flagged: avgScore >= 0.5 && avgScore < 0.8,
    score: avgScore,
    reasons: flaggedReasons,
    category: categorizeReview(analyses),
  };
};

const detectSpam = async (text: string) => {
  // Use Claude API for spam detection
  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20250101',
    max_tokens: 100,
    system: SPAM_DETECTION_PROMPT,
    messages: [{ role: 'user', content: text }],
  });

  return parseResponse(response);
};

const detectProfanity = async (text: string) => {
  // List-based + AI hybrid approach
  const badWords = loadProfanityList();
  const hasBadWords = badWords.some((word) =>
    new RegExp(`\\b${word}\\b`, 'i').test(text)
  );

  if (hasBadWords) {
    return {
      approved: false,
      score: 0.1,
      confidence: 0.95,
      reason: 'Contains offensive language',
    };
  }

  // AI secondary check
  return await callClaudeForProfanity(text);
};

const detectFraud = async (review: Review) => {
  // Seller manipulation: same user reviewing multiple seller products
  // Fake review patterns: excessive capitalization, emojis, links
  
  const userReviewCount = await countUserReviewsToSeller(
    review.userId,
    review.sellerId
  );

  const fraudPatterns = [
    /@|#|http/gi, // Links/mentions
    /\b(\w)\1{3,}\b/g, // Repeated chars (LOOOOOVE)
    /[A-Z]{5,}/g, // Excessive caps
  ];

  const patternMatches = fraudPatterns.reduce(
    (sum, regex) => sum + (text.match(regex) || []).length,
    0
  );

  const fraudScore = Math.min(patternMatches / 10, 1);

  return {
    approved: fraudScore < 0.3,
    score: 1 - fraudScore,
    confidence: 0.8,
    reason: fraudScore > 0.3 ? 'Potential fake review pattern' : null,
  };
};

const checkRelevance = async (review: Review) => {
  // Is review about the product?
  const product = await getProduct(review.productId);
  
  // Use semantic similarity
  return await compareSemanticSimilarity(review.text, product.title);
};
```

### 3.3 Updated ReviewService

```typescript
export const createReview = async (
  review: ReviewWithVideo
): Promise<string> => {
  const reviewId = generateId();
  let videoUrl: string | undefined;

  // 1. Upload video if present
  if (review.videoFile) {
    videoUrl = await uploadVideoToStorage(review.videoFile, ...);
  }

  // 2. Create review object
  const reviewData: Review = {
    id: reviewId,
    productId: review.productId,
    userId: getCurrentUserId(),
    rating: review.rating,
    text: review.text,
    images: review.images,
    videoUrl,
    status: 'pending',
    createdAt: new Date(),
  };

  // 3. AI MODERATION (NEW)
  const moderationResult = await moderateReview(reviewData);

  if (moderationResult.approved) {
    reviewData.status = 'approved';
  } else if (moderationResult.flagged) {
    reviewData.status = 'flagged';
    // Add to admin dashboard
    await flagReviewForHumanReview(reviewId, moderationResult.reasons);
  } else {
    reviewData.status = 'rejected';
    // Notify user - review did not meet guidelines
    await notifyUserReviewRejected(review.userId, moderationResult.reasons);
    return null; // Don't save rejected reviews
  }

  // 4. Save to Firestore
  await firestore.collection('reviews').doc(reviewId).set(reviewData);

  // 5. Notify user
  await createNotification({
    userId: review.userId,
    type: 'review_' + reviewData.status,
    message: `Your review has been ${reviewData.status}`,
  });

  return reviewId;
};
```

### 3.4 Admin Moderation Dashboard

```typescript
// src/pages/AdminModerationDashboard.tsx
const AdminModerationDashboard = () => {
  const [flaggedReviews, setFlaggedReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    flagged: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadFlaggedReviews();
    loadModerationStats();
  }, []);

  return (
    <div className="moderation-dashboard">
      <div className="stats">
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Flagged by AI" value={stats.flagged} />
        <StatCard label="Approved" value={stats.approved} />
        <StatCard label="Rejected" value={stats.rejected} />
      </div>

      <div className="flagged-reviews">
        <h2>AI-Flagged Reviews for Human Review</h2>
        {flaggedReviews.map((review) => (
          <div key={review.id} className="flagged-item">
            <h4>{review.text.substring(0, 50)}...</h4>
            <p className="reasons">
              Flagged: {review.moderationReasons.join(', ')}
            </p>
            <button onClick={() => approveReview(review.id)}>Approve</button>
            <button onClick={() => rejectReview(review.id)}>Reject</button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 4. P0-3: Otomatik Yorum İsteme

### 4.1 Trigger Akışı

```
Automatic Review Request Workflow

1. Order Status → "delivered" (shipped service confirms)
2. System schedules task: 3 days after delivery
3. Cron Job (daily 9 AM):
   - Check orders with status='delivered' AND days_since_delivery >= 3
   - Check if review already exists (skip if yes)
4. Send Review Request:
   - Email: "How was your purchase of [Product]?"
   - Push Notification: "Share your experience"
   - In-app Badge: "Review pending"
5. Click → ReviewForm opens with product pre-filled
6. User submits → createReview (with moderation)
```

### 4.2 Implementation

```typescript
// src/services/reviewRequestService.ts
export const scheduleReviewRequests = async () => {
  // Runs daily via Cloud Scheduler
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const deliveredOrders = await firestore
    .collection('orders')
    .where('status', '==', 'delivered')
    .where('deliveredAt', '<=', threeDaysAgo)
    .where('reviewRequestSent', '==', false)
    .get();

  for (const orderDoc of deliveredOrders.docs) {
    const order = orderDoc.data() as Order;
    
    // Check if review already exists
    const existingReview = await firestore
      .collection('reviews')
      .where('userId', '==', order.userId)
      .where('productId', '==', order.productId)
      .limit(1)
      .get();

    if (existingReview.empty) {
      await sendReviewRequest(order);
      
      // Mark as sent
      await orderDoc.ref.update({ reviewRequestSent: true });
    }
  }
};

const sendReviewRequest = async (order: Order) => {
  const product = await getProduct(order.productId);
  const user = await getUser(order.userId);

  // 1. Email
  await sendEmail({
    to: user.email,
    subject: `How was your purchase of ${product.name}?`,
    template: 'review-request-email',
    variables: {
      productName: product.name,
      reviewUrl: `/product/${order.productId}#review-form`,
      userName: user.firstName,
    },
  });

  // 2. Push Notification
  await sendPushNotification({
    userId: order.userId,
    title: 'Share Your Experience',
    body: `Tell us what you think about ${product.name}`,
    action: `navigate_to_product_${order.productId}`,
  });

  // 3. In-app Badge (via notificationService)
  await createNotification({
    userId: order.userId,
    type: 'review_request',
    productId: order.productId,
    message: `Review ${product.name}`,
    actionUrl: `/product/${order.productId}#review-form`,
  });

  // Log request
  await firestore.collection('reviewRequests').add({
    userId: order.userId,
    orderId: order.id,
    productId: product.id,
    sentAt: new Date(),
    status: 'sent',
  });
};
```

### 4.3 Cloud Scheduler Setup

```yaml
# firebase/cloud-scheduler-config.yaml
scheduledJobs:
  - name: "daily-review-request"
    description: "Send review requests 3 days after delivery"
    schedule: "0 9 * * *" # 9 AM daily
    timeZone: "Europe/Istanbul"
    httpTarget:
      uri: "https://us-central1-mercora.cloudfunctions.net/scheduleReviewRequests"
      httpMethod: POST
      oidcToken:
        serviceAccountEmail: "mercora@appspot.gserviceaccount.com"
```

---

## 5. P0-4: Satıcı Puanlama Sayfası

### 5.1 Sayfa Yapısı

```
URL: /seller/:sellerId/seller-reviews

Route: mercora-next/src/app/seller/[id]/reviews/page.tsx

Components:
├── SellerRatingSummary
│   ├── Overall Rating (4.5/5.0)
│   ├── Star Distribution (5★: 60%, 4★: 25%, 3★: 10%, ...)
│   ├── Performance Metrics Card
│   │   ├── Rating (4.5/5)
│   │   ├── Ship Speed (2.1 days avg)
│   │   ├── Compliance (98.5%)
│   │   └── Response Rate (95%)
│   └── Trust Badge (Gold Seller, Verified)
├── ReviewFilters
│   ├── Sort: Most Recent, Most Helpful, Highest, Lowest
│   ├── Filter: All, Verified Purchase, With Images
│   └── Rating Filter: 5★, 4★, 3★, 2★, 1★
└── ReviewList
    ├── ReviewCard (same as product reviews)
    └── Pagination (10 per page)
```

### 5.2 Ekran Tasarımı

```
┌─────────────────────────────────────────────┐
│ Seller: [Seller Name]                       │
├─────────────────────────────────────────────┤
│                                             │
│ ⭐⭐⭐⭐☆ 4.5/5.0 (2,341 reviews)           │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 5★ ████████████████░░░░░░░░ 60% (1,404)│ │
│ │ 4★ ██████░░░░░░░░░░░░░░░░░░ 25% (585)  │ │
│ │ 3★ ███░░░░░░░░░░░░░░░░░░░░░░ 10% (234) │ │
│ │ 2★ █░░░░░░░░░░░░░░░░░░░░░░░░  3% (70)  │ │
│ │ 1★ ░░░░░░░░░░░░░░░░░░░░░░░░░  2% (48)  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Performance Metrics                      │ │
│ │ ┌──────────────┬──────────────┐         │ │
│ │ │ Avg Rating   │ 4.5/5.0      │         │ │
│ │ ├──────────────┼──────────────┤         │ │
│ │ │ Ship Speed   │ 2.1 days     │         │ │
│ │ ├──────────────┼──────────────┤         │ │
│ │ │ Compliance   │ 98.5%        │         │ │
│ │ ├──────────────┼──────────────┤         │ │
│ │ │ Response     │ 95%          │         │ │
│ │ └──────────────┴──────────────┘         │ │
│ │ Status: Gold Seller                     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Sort: [Most Recent ▼] Filter: [All ▼]    │
│ ☐ Verified Purchase  ☐ With Images       │
│ Rating: [All ▼]                           │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ⭐⭐⭐⭐⭐ John Doe | Verified Buyer   │ │
│ │ "Great seller, fast shipping"          │ │
│ │ Apr 20, 2026                           │ │
│ │ 👍 45 👎 1                              │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [< Previous]  Page 1 of 50  [Next >]     │
└─────────────────────────────────────────────┘
```

### 5.3 Implementation

```typescript
// mercora-next/src/app/seller/[id]/reviews/page.tsx
import { SellerReviewsPage } from '@/components/seller/SellerReviewsPage';

export default function Page({ params }: { params: { id: string } }) {
  return <SellerReviewsPage sellerId={params.id} />;
}

// src/components/seller/SellerReviewsPage.tsx
interface SellerReviewsPageProps {
  sellerId: string;
}

export const SellerReviewsPage: React.FC<SellerReviewsPageProps> = ({
  sellerId,
}) => {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<SellerReviewStats | null>(null);
  const [filters, setFilters] = useState({
    sort: 'recent',
    rating: null,
    verifiedOnly: false,
    withImages: false,
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadSellerData();
    loadReviewStats();
    loadReviews();
  }, [sellerId, filters, page]);

  const loadSellerData = async () => {
    const sellerDoc = await getDoc(
      doc(firestore, 'sellers', sellerId)
    );
    setSeller(sellerDoc.data() as Seller);
  };

  const loadReviewStats = async () => {
    // Query all reviews for seller, aggregate
    const statsData = await calculateSellerReviewStats(sellerId);
    setStats(statsData);
  };

  const loadReviews = async () => {
    let query = firestore
      .collection('reviews')
      .where('sellerId', '==', sellerId)
      .where('status', '==', 'approved');

    if (filters.rating) {
      query = query.where('rating', '==', filters.rating);
    }
    if (filters.verifiedOnly) {
      query = query.where('verifiedPurchase', '==', true);
    }
    if (filters.withImages) {
      query = query.where('images', '!=', []);
    }

    // Sorting
    const sortField =
      filters.sort === 'recent' ? 'createdAt' : 'helpfulCount';
    const sortDirection = filters.sort === 'recent' ? 'desc' : 'desc';
    query = query.orderBy(sortField, sortDirection);

    const ITEMS_PER_PAGE = 10;
    query = query.limit(ITEMS_PER_PAGE).offset((page - 1) * ITEMS_PER_PAGE);

    const snapshot = await query.get();
    setReviews(snapshot.docs.map((doc) => doc.data() as Review));
  };

  if (!seller || !stats) return <div>Loading...</div>;

  return (
    <div className="seller-reviews-page">
      <h1>{seller.name} Reviews</h1>

      <SellerRatingSummary
        stats={stats}
        sellerStatus={seller.status}
      />

      <ReviewFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      <div className="review-list">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(stats.totalReviews / 10)}
        onPageChange={setPage}
      />
    </div>
  );
};

// src/components/seller/SellerRatingSummary.tsx
interface SellerReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  avgShipSpeed: number;
  compliance: number;
  responseRate: number;
}

const SellerRatingSummary: React.FC<{
  stats: SellerReviewStats;
  sellerStatus: 'silver' | 'gold' | 'platinum';
}> = ({ stats, sellerStatus }) => {
  const ratingPercentages = {
    5: (stats.ratingDistribution[5] / stats.totalReviews) * 100,
    4: (stats.ratingDistribution[4] / stats.totalReviews) * 100,
    3: (stats.ratingDistribution[3] / stats.totalReviews) * 100,
    2: (stats.ratingDistribution[2] / stats.totalReviews) * 100,
    1: (stats.ratingDistribution[1] / stats.totalReviews) * 100,
  };

  return (
    <div className="seller-rating-summary">
      <div className="overall-rating">
        <h2>{stats.averageRating.toFixed(1)}/5.0</h2>
        <StarRating rating={stats.averageRating} />
        <p>({stats.totalReviews.toLocaleString()} reviews)</p>
      </div>

      <div className="rating-distribution">
        {[5, 4, 3, 2, 1].map((stars) => (
          <div key={stars} className="rating-row">
            <span>{stars}★</span>
            <div className="bar">
              <div
                className="fill"
                style={{ width: `${ratingPercentages[stars]}%` }}
              />
            </div>
            <span>{ratingPercentages[stars].toFixed(0)}%</span>
          </div>
        ))}
      </div>

      <div className="performance-metrics">
        <MetricCard
          label="Avg Rating"
          value={stats.averageRating.toFixed(1)}
          unit="/5.0"
        />
        <MetricCard
          label="Ship Speed"
          value={stats.avgShipSpeed.toFixed(1)}
          unit="days"
        />
        <MetricCard
          label="Compliance"
          value={stats.compliance.toFixed(1)}
          unit="%"
        />
        <MetricCard
          label="Response"
          value={stats.responseRate.toFixed(0)}
          unit="%"
        />
      </div>

      <div className={`seller-badge ${sellerStatus}`}>
        {sellerStatus.toUpperCase()} SELLER
      </div>
    </div>
  );
};
```

### 5.4 Database Schema Addition

```typescript
// Firestore: sellers/{sellerId}/reviewStats document
interface SellerReviewStats {
  sellerId: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  avgShipSpeed: number; // days
  compliance: number; // percentage
  responseRate: number; // percentage
  lastUpdated: Date;
}

// Index: reviews collection
// Composite Index: sellerId + status + createdAt
// Composite Index: sellerId + rating + status
// Composite Index: sellerId + verifiedPurchase + status
```

---

## 6. Sprint Planning

### Sprint 1 (2 weeks)

**P0-1: Video Yorum Destegi**
- ReviewForm video upload component (3 days)
- Firebase Storage integration (2 days)
- ReviewCard video player component (2 days)
- Testing + fixes (2 days)

**P0-2: AI Yorum Moderasyonu**
- moderationService implementation (4 days)
- Claude API integration (2 days)
- Admin dashboard flagged reviews UI (2 days)
- Testing + tuning (2 days)

### Sprint 2 (2 weeks)

**P0-3: Otomatik Yorum İsteme**
- reviewRequestService + scheduler (3 days)
- Email template setup (1 day)
- Push notification integration (2 days)
- Testing (2 days)

**P0-4: Satıcı Puanlama Sayfası**
- SellerReviewsPage component (3 days)
- SellerRatingSummary component (2 days)
- Database aggregations/indices (2 days)
- Testing + optimization (2 days)

---

## 7. Moderation Workflow Diagram

```
User Review Submission
         ↓
  Create Review Object
         ↓
  AI Moderation Analysis
      ↙    ↓    ↘
  Clean  Flagged  Spam
    ↓       ↓       ↓
Approve  Human    Reject
         Review    ↓
         Review    Notify User
           ↓       (Rejected)
         Admin DB
           ↓
    [Approve/Reject]
           ↓
        Update Status
           ↓
      Notify User
           ↓
    Display on Product
```

---

## 8. Teknik Bağımlılıklar

| Bileşen | Teknoloji | API |
|---------|-----------|-----|
| Video Upload | Firebase Storage | uploadVideoToStorage() |
| Video Playback | HTML5 Video | <video> tag |
| AI Moderation | Claude API | anthropic.messages.create() |
| Scheduler | Cloud Functions | Cloud Scheduler trigger |
| Notifications | Firebase Cloud Messaging | sendPushNotification() |
| Database | Firestore | Composite indices |
| Email | SendGrid/Firebase | sendEmail() |

---

## 9. Çıktı Dosyaları

- `/mercora-next/src/components/product/ReviewForm.tsx` (Güncellenecek)
- `/mercora-next/src/components/product/ReviewCard.tsx` (Güncellenecek)
- `/src/services/reviewService.ts` (Güncellenecek)
- `/src/services/moderationService.ts` (Yeni)
- `/src/services/reviewRequestService.ts` (Yeni)
- `/mercora-next/src/app/seller/[id]/reviews/page.tsx` (Yeni)
- `/src/components/seller/SellerReviewsPage.tsx` (Yeni)
- `/src/components/seller/SellerRatingSummary.tsx` (Yeni)

---

**Hazırlayan:** UX/UI Tasarımcısı 2  
**Onay:** PM, Backend Lead  
**Durum:** Sprint 1 Başlamaya Hazır
