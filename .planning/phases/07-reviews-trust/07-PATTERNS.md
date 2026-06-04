# Phase 7: Reviews & Trust - Pattern Map

**Mapped:** 2026-06-04
**Files analyzed:** 12 new/modified files
**Analogs found:** 11 / 12

## File Classification

| New/Modified File                          | Role      | Data Flow               | Closest Analog                                         | Match Quality |
| ------------------------------------------ | --------- | ----------------------- | ------------------------------------------------------ | ------------- |
| `src/services/reviewService.ts`            | service   | CRUD + request-response | `src/services/reviewService.ts` (self — modify)        | self          |
| `src/services/sellerRatingService.ts`      | service   | CRUD + transform        | `src/services/reviewService.ts` (`computeReviewStats`) | role-match    |
| `src/services/productQuestionService.ts`   | service   | CRUD + event-driven     | `src/services/notificationService.ts` + self           | role-match    |
| `server/routes/reviews.ts` (NEW)           | route     | request-response        | `server/routes/orders.ts`                              | exact         |
| `server/services/emailService.ts`          | service   | request-response        | `server/services/emailService.ts` (self — extend)      | self          |
| `src/components/product/ReviewSection.tsx` | component | CRUD                    | self (modify)                                          | self          |
| `src/components/product/ReviewForm.tsx`    | component | request-response        | self (modify)                                          | self          |
| `src/components/product/ReviewCard.tsx`    | component | request-response        | self (modify)                                          | self          |
| `src/components/product/RatingSummary.tsx` | component | transform               | self (modify)                                          | self          |
| `src/components/product/QASection.tsx`     | component | event-driven            | self (modify)                                          | self          |
| `src/components/product/SellerCard.tsx`    | component | request-response        | self (modify)                                          | self          |
| `firestore.rules`                          | config    | —                       | `firestore.rules` (self — extend)                      | self          |

---

## Pattern Assignments

### `src/services/reviewService.ts` — modify `addReview`, add `getSellerReviewStats`

**Self-modify.** Key gaps to close:

**Current `addReview` signature** (lines 15-28):

```typescript
export async function addReview(
  review: Omit<Review, 'id' | 'status'>,
  requireApproval = false,
): Promise<Review> {
  try {
    const status = requireApproval ? ('pending' as const) : ('approved' as const);
    const fullReview = { ...review, status };
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), fullReview);
    return { ...fullReview, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, REVIEWS_COLLECTION);
    throw error;
  }
}
```

**D-01 change:** Remove `addReview` from client path entirely. Review writes now go through `POST /api/reviews` (server route). The client calls the Express endpoint; the endpoint verifies `Delivered` SubOrder via Admin SDK, then writes via Admin SDK with `verified: true` and `status: 'approved'`.

**`computeReviewStats` to lift to seller scope** (lines 149-172):

```typescript
export function computeReviewStats(reviews: Review[]): ReviewStats {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let qualitySum = 0, shippingSum = 0, descSum = 0, catCount = 0;
  reviews.forEach(r => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    if (r.categoryRatings) {
      qualitySum += r.categoryRatings.quality || 0;
      shippingSum += r.categoryRatings.shipping || 0;
      descSum += r.categoryRatings.description || 0;
      catCount++;
    }
  });
  return {
    total: reviews.length,
    distribution,
    avgCategoryRatings: { ... },
  };
}
```

New function `getSellerReviewStats(sellerId: string)` queries `reviews` collection with `where('sellerId', '==', sellerId)` and `where('status', '==', 'approved')`, then passes results through `computeReviewStats`. Same try/catch + graceful-return pattern as `getReviewStats`.

**`checkUserReview` reuse for dedup** (lines 68-82):

```typescript
export async function checkUserReview(productId: string, userId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('productId', '==', productId),
      where('userId', '==', userId),
      where('status', '==', 'approved'),
      limit(1),
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
}
```

The new server endpoint calls the Admin SDK equivalent of this before writing.

**`uploadReviewPhoto` (lines 193-203):** Already implemented. Enforce max-5 guard on the client before calling; the server endpoint validates `photos.length <= 5`.

---

### `src/services/sellerRatingService.ts` — add `getSellerStarSummary`

**Analog:** `src/services/reviewService.ts` `computeReviewStats` pattern.

**New export interface** (mirror `ReviewStats`):

```typescript
export interface SellerStarSummary {
  average: number; // weighted mean of approved reviews
  total: number;
  distribution: Record<number, number>; // { 1:n, 2:n, 3:n, 4:n, 5:n }
}
```

**Implementation pattern** — mirror `getReviewStats` but scope by `sellerId`:

```typescript
export async function getSellerStarSummary(sellerId: string): Promise<SellerStarSummary> {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('sellerId', '==', sellerId),
      where('status', '==', 'approved'),
    );
    const snap = await getDocs(q);
    const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
    const stats = computeReviewStats(reviews);
    const weightedSum = Object.entries(stats.distribution).reduce(
      (sum, [star, count]) => sum + Number(star) * count,
      0,
    );
    const average = stats.total > 0 ? weightedSum / stats.total : 0;
    return {
      average: Math.round(average * 10) / 10,
      total: stats.total,
      distribution: stats.distribution,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'reviews');
    return { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }
}
```

Import `computeReviewStats` from `reviewService` (or inline identical logic). **`calcSellerPerformance` stays untouched.**

---

### `src/services/productQuestionService.ts` — wire notifications into `askQuestion`

**Self-modify.** No new functions; add notification calls.

**Current `askQuestion`** (lines 23-40) — no notification call after `addDoc`.

**Pattern to add** — copy `createNotification` call from `approveReview` in `reviewService.ts` (lines 126-133):

```typescript
// After addDoc succeeds, notify the seller (fire-and-forget):
import { createNotification } from './notificationService';

// inside askQuestion, after ref = await addDoc(...):
// 1. Look up product to get sellerId
const productSnap = await getDoc(doc(db, 'products', productId));
if (productSnap.exists()) {
  const sellerId: string = productSnap.data().sellerId;
  // in-app
  await createNotification(
    sellerId,
    'new_question',
    'Yeni Soru',
    `"${text.slice(0, 60)}" — Bir alıcı ürününüz için soru sordu.`,
    `/seller/questions`,
  );
  // email — call server emailService via fetch or pass sellerId for server-side use
}
```

The email notification follows the `server/services/emailService.ts` send pattern (see Shared Patterns below). Because `productQuestionService` is a client-side service, the email is best triggered server-side via a dedicated endpoint or by having the client call `POST /api/reviews/notify-seller-question` — planner decides. The in-app notification via `createNotification` is the primary wiring.

**`answerQuestion` seller-only guard** (lines 42-52): The client already passes `answeredBy`; the Firestore rule (see `firestore.rules` section) is the enforcement layer. No service-layer change needed beyond the rule.

---

### `server/routes/reviews.ts` (NEW)

**Analog:** `server/routes/orders.ts` — exact match on DI pattern.

**Deps interface** (copy from `orders.ts` lines 19-25):

```typescript
type Middleware = (req: any, res: any, next: any) => any;

export interface ReviewRouteDeps {
  adminDb: any;
  verifyFirebaseToken: Middleware;
}
```

**Route registration function** (copy from `orders.ts` lines 58-70):

```typescript
export function registerReviewRoutes(app: Express, deps: ReviewRouteDeps) {
  const { adminDb, verifyFirebaseToken } = deps;

  app.post(
    '/api/reviews',
    verifyFirebaseToken,
    validate(submitReviewSchema),
    async (req: any, res: any) => {
      try {
        const { productId, rating, comment, photos, categoryRatings } = req.body;
        const userId: string = req.uid;

        // 1. Verify delivered SubOrder
        const subOrdersSnap = await adminDb
          .collection('subOrders')
          .where('userId', '==', userId)
          .where('productIds', 'array-contains', productId)
          .where('status', '==', 'delivered')
          .limit(1)
          .get();
        if (subOrdersSnap.empty) {
          return res
            .status(403)
            .json({ error: 'Yalnızca teslim alınan ürünler için yorum yapabilirsiniz.' });
        }

        // 2. Dedup check
        // ...

        // 3. Write review via admin SDK with verified: true, status: 'approved'
        // ...

        res.status(201).json({ data: review });
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    },
  );
}
```

**Zod validation schema** — copy pattern from `orders.ts` lines 29-54:

```typescript
import { z } from 'zod';
import { validate } from '../lib/validate.js';

const submitReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000),
  photos: z.array(z.string().url()).max(5).optional(),
  categoryRatings: z
    .object({
      quality: z.number().min(1).max(5),
      shipping: z.number().min(1).max(5),
      description: z.number().min(1).max(5),
    })
    .optional(),
});
```

**Registration in `server.ts`** — mirrors `registerOrderRoutes`:

```typescript
import { registerReviewRoutes } from './server/routes/reviews.js';
registerReviewRoutes(app, { adminDb, verifyFirebaseToken });
```

---

### `server/services/emailService.ts` — add `sendNewQuestionEmail`

**Self-extend.** Follow existing send function pattern (lines 1-50):

```typescript
// Existing pattern for all send functions:
export async function sendNewQuestionEmail(
  to: string,
  sellerName: string,
  productName: string,
  questionText: string,
  questionLink: string,
): Promise<void> {
  const client = await getResendClient();
  if (!client) return; // graceful degradation — key not set
  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Yeni Soru: ${productName}`,
      html: newQuestionHtml(sellerName, productName, questionText, questionLink),
    });
  } catch (err: any) {
    logger.error('email', 'sendNewQuestionEmail failed', { error: err.message });
  }
}
```

Add `newQuestionHtml` template to `server/services/emailTemplates.ts` following the existing template pattern (branded HTML, Turkish copy).

---

### `firestore.rules` — add reviews + productQuestions rules

**Self-extend.** Copy the `ledger` server-only pattern (lines 79-83) for review writes, and the `products` seller-scoped update pattern (lines 48-54) for Q&A answers.

**Reviews collection** — writes server-only, reads public for approved:

```
// --- REVIEWS (Phase 7) -----------------------------------------------
// Writes go through the server (Admin SDK) — client direct write denied.
match /reviews/{reviewId} {
  allow read: if resource.data.status == 'approved' || isAdmin();
  allow create: if false;   // server Admin SDK only
  allow update: if isAdmin();  // moderation: approve/reject
  allow delete: if isAdmin();
}
```

**productQuestions collection** — questions by any signed-in user, answers only by the product's seller:

```
// --- PRODUCT QUESTIONS (Phase 7) -------------------------------------
match /productQuestions/{questionId} {
  allow read: if true;
  allow create: if isFullUser();  // any logged-in buyer can ask
  allow update: if isSignedIn() && (
    // only the product's seller may write the answer fields
    request.auth.token.sellerId == resource.data.sellerId ||
    isAdmin()
  );
  allow delete: if isAdmin();
}
```

---

### UI Components (ReviewSection, ReviewForm, ReviewCard, RatingSummary, QASection, SellerCard)

All are self-modifications of existing files. Key patterns to follow:

**Named export + local Props interface** (project-wide convention from CLAUDE.md):

```typescript
interface Props {
  // ...
}
export function ReviewCard({ review, onHelpful }: Props) { ... }
```

**"Doğrulanmış Alıcı" badge** — add to `ReviewCard.tsx` alongside `review.verified`:

```typescript
{review.verified && (
  <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
    <CheckCircle size={12} /> Doğrulanmış Alıcı
  </span>
)}
```

**Photo gallery in ReviewCard** — map `review.photos[]` using `<img>` tags; max-5 enforced upstream. Lightbox via `useState` index pattern (no new library needed).

**RatingSummary** — add `SellerStarSummary` prop variant alongside existing product `ReviewStats`. Distribution bars already present; reuse same render for seller scope.

**QASection** — after `askQuestion` resolves, the notification is fire-and-forget in the service layer; no UI change needed for notification. Add seller answer display under each question card (already partially in `QuestionCard.tsx`).

**SellerCard** — consume `getSellerStarSummary(sellerId)` on mount; display average + total count + star distribution using `RatingSummary` component or inline.

---

## Shared Patterns

### Authentication (server routes)

**Source:** `server/routes/orders.ts` lines 19-25, 58-59
**Apply to:** `server/routes/reviews.ts`

```typescript
type Middleware = (req: any, res: any, next: any) => any;
export interface ReviewRouteDeps {
  adminDb: any;
  verifyFirebaseToken: Middleware;
}
export function registerReviewRoutes(app: Express, deps: ReviewRouteDeps) {
  const { adminDb, verifyFirebaseToken } = deps;
  app.post('/api/reviews', verifyFirebaseToken, validate(schema), async (req: any, res: any) => {
    // req.uid is set by verifyFirebaseToken
  });
}
```

### Service Error Handling

**Source:** `src/services/reviewService.ts` lines 19-27, 30-44
**Apply to:** All new/modified service functions

```typescript
try {
  // ... Firestore operation
} catch (error) {
  handleFirestoreError(error, OperationType.LIST, 'collectionName');
  return []; // reads: degrade gracefully
  // writes: throw error after handleFirestoreError
}
```

### In-App Notification

**Source:** `src/services/notificationService.ts` lines 27-47
**Apply to:** `productQuestionService.ts` `askQuestion`

```typescript
await createNotification(
  userId,
  'new_question', // NotificationType — add to union in notificationService.ts
  'Yeni Soru',
  'Bir alıcı ürününüz için soru sordu.',
  `/seller/questions`,
);
```

Note: Add `'new_question'` to the `NotificationType` union in `src/services/notificationService.ts` line 7.

### Server Email (graceful degradation)

**Source:** `server/services/emailService.ts` lines 23-42
**Apply to:** New `sendNewQuestionEmail` function

```typescript
const client = await getResendClient();
if (!client) return; // graceful no-op when RESEND_API_KEY absent
try {
  await client.emails.send({ from: FROM_ADDRESS, to, subject, html });
} catch (err: any) {
  logger.error('email', 'send failed', { error: err.message });
}
```

### Zod Validation in Server Routes

**Source:** `server/routes/orders.ts` lines 29-54, `server/lib/validate.js`
**Apply to:** `server/routes/reviews.ts`

```typescript
import { z } from 'zod';
import { validate } from '../lib/validate.js';
const schema = z.object({ ... });
app.post('/api/reviews', verifyFirebaseToken, validate(schema), async (req, res) => { ... });
```

---

## No Analog Found

| File                            | Role   | Data Flow | Reason                                                                                                                     |
| ------------------------------- | ------ | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| `src/components/seo/schemas.ts` | config | transform | Existing file — add `aggregateRating` JSON-LD field. No review-specific analog; follow existing schema shape in that file. |

---

## Metadata

**Analog search scope:** `src/services/`, `server/routes/`, `server/services/`, `src/components/product/`, `firestore.rules`
**Files scanned:** 10 source files read directly
**Pattern extraction date:** 2026-06-04
