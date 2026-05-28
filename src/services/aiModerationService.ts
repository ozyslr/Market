/**
 * AI-Powered Content Moderation
 *
 * Uses Gemini to analyze products and reviews for policy violations.
 * Auto-approves safe content, flags suspicious content for manual review.
 */

import { GoogleGenAI } from "@google/genai";
import { logAudit } from './auditLogService';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ModerationResult {
  /** 'approved' = safe, 'flagged' = needs review, 'rejected' = clearly violating */
  verdict: 'approved' | 'flagged' | 'rejected';
  /** Confidence 0-100 */
  confidence: number;
  /** Human-readable reason */
  reason: string;
  /** Specific policy categories flagged */
  flags: string[];
  /** Suggested action */
  suggestedAction: string;
  /** Timestamp */
  analyzedAt: string;
}

export interface ProductModerationInput {
  title: string;
  description: string;
  brand: string;
  category: string;
  price: number;
  images?: string[];
}

export interface ReviewModerationInput {
  productName: string;
  reviewText: string;
  rating: number;
  authorName: string;
}

// ─── Gemini Client ──────────────────────────────────────────────────────────

function getAI(): GoogleGenAI | null {
  try {
    const key = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!key) return null;
    return new GoogleGenAI({ apiKey: key });
  } catch { return null; }
}

// ─── Product Moderation ─────────────────────────────────────────────────────

const PRODUCT_POLICY = `You are Benim Olan's AI content moderator for a Turkish e-commerce marketplace.

Analyze this product listing for policy violations. Check for:
1. Prohibited items (weapons, drugs, counterfeit goods, adult content)
2. Misleading/inaccurate titles or descriptions
3. Inappropriate language or hate speech
4. Suspiciously low/high pricing (potential scam)
5. Brand/trademark violations
6. Poor quality listings (gibberish, spam, test data)

Return ONLY valid JSON in this format:
{
  "verdict": "approved" | "flagged" | "rejected",
  "confidence": 0-100,
  "reason": "Brief explanation in Turkish",
  "flags": ["category1", "category2"],
  "suggestedAction": "What the moderator should do in Turkish"
}

Rules:
- "approved": Clean listing, no issues (confidence >= 80)
- "flagged": Suspicious but not clearly violating (confidence 40-79)
- "rejected": Clear policy violation (any confidence)
- Be strict about illegal items, lenient about minor description issues
- Price check: if price is 0 or >1,000,000 TRY, flag it`;

export async function moderateProduct(input: ProductModerationInput): Promise<ModerationResult | null> {
  const ai = getAI();
  if (!ai) return fallbackModeration(input);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${PRODUCT_POLICY}\n\nProduct to analyze:\n${JSON.stringify(input, null, 2)}`,
    });

    const text = response.text || '';
    const json = extractJson(text);
    if (!json) return fallbackModeration(input);

    return {
      verdict: json.verdict || 'flagged',
      confidence: json.confidence || 50,
      reason: json.reason || 'AI analizi tamamlanamadı.',
      flags: json.flags || [],
      suggestedAction: json.suggestedAction || 'Manuel inceleme önerilir.',
      analyzedAt: new Date().toISOString(),
    };
  } catch {
    return fallbackModeration(input);
  }
}

// ─── Review Moderation ──────────────────────────────────────────────────────

const REVIEW_POLICY = `You are Benim Olan's AI review moderator for a Turkish e-commerce marketplace.

Analyze this product review for policy violations. Check for:
1. Spam/fake reviews (generic text, repeated phrases)
2. Hate speech, harassment, or offensive language
3. Irrelevant content (not about the product)
4. Self-promotion or competitor links
5. Personal information exposure (phone numbers, addresses)

Return ONLY valid JSON:
{
  "verdict": "approved" | "flagged" | "rejected",
  "confidence": 0-100,
  "reason": "Brief explanation in Turkish",
  "flags": ["category"],
  "suggestedAction": "What to do in Turkish"
}`;

export async function moderateReview(input: ReviewModerationInput): Promise<ModerationResult | null> {
  const ai = getAI();
  if (!ai) return fallbackReviewModeration(input);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${REVIEW_POLICY}\n\nReview to analyze:\n${JSON.stringify(input, null, 2)}`,
    });

    const text = response.text || '';
    const json = extractJson(text);
    if (!json) return fallbackReviewModeration(input);

    return {
      verdict: json.verdict || 'flagged',
      confidence: json.confidence || 50,
      reason: json.reason || 'AI analizi tamamlanamadı.',
      flags: json.flags || [],
      suggestedAction: json.suggestedAction || 'Manuel inceleme önerilir.',
      analyzedAt: new Date().toISOString(),
    };
  } catch {
    return fallbackReviewModeration(input);
  }
}

// ─── Batch Moderation ───────────────────────────────────────────────────────

export async function moderateProductBatch(
  products: (ProductModerationInput & { id: string })[],
  onProgress?: (done: number, total: number) => void,
): Promise<Map<string, ModerationResult>> {
  const results = new Map<string, ModerationResult>();

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const result = await moderateProduct(p);
    if (result) results.set(p.id, result);
    onProgress?.(i + 1, products.length);
  }

  return results;
}

// ─── Auto-Apply ─────────────────────────────────────────────────────────────

/**
 * Run AI moderation and auto-approve/reject based on confidence thresholds.
 * Returns the moderation result for logging.
 */
export async function autoModerateProduct(
  product: ProductModerationInput & { id: string },
  actorId: string,
  actorEmail: string,
): Promise<ModerationResult | null> {
  const result = await moderateProduct(product);
  if (!result) return null;

  if (result.verdict === 'rejected') {
    logAudit({
      actorId: 'ai-moderation', actorEmail: 'ai@benimolan.com', actorRole: 'ai',
      action: 'product.reject', entityType: 'product', entityId: product.id,
      entityLabel: product.title,
      details: `AI OTO-RED: ${result.reason} (güven: %${result.confidence})`,
    });
  } else if (result.verdict === 'approved' && result.confidence >= 85) {
    logAudit({
      actorId: 'ai-moderation', actorEmail: 'ai@benimolan.com', actorRole: 'ai',
      action: 'product.approve', entityType: 'product', entityId: product.id,
      entityLabel: product.title,
      details: `AI OTO-ONAY: ${result.reason} (güven: %${result.confidence})`,
    });
  }

  return result;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractJson(text: string): any {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return null;
  } catch { return null; }
}

function fallbackModeration(input: ProductModerationInput): ModerationResult {
  const flags: string[] = [];
  if (!input.title || input.title.length < 3) flags.push('low_quality_title');
  if (input.price === 0) flags.push('zero_price');
  if (input.price > 1000000) flags.push('suspicious_price');
  if (!input.description || input.description.length < 10) flags.push('low_quality_description');

  const verdict = flags.length >= 2 ? 'flagged' : 'approved';
  return {
    verdict,
    confidence: flags.length === 0 ? 90 : 50,
    reason: flags.length > 0 ? `Şüpheli: ${flags.join(', ')}` : 'Temel kurallara uygun.',
    flags,
    suggestedAction: flags.length >= 2 ? 'Manuel inceleme önerilir.' : 'Onaylanabilir.',
    analyzedAt: new Date().toISOString(),
  };
}

function fallbackReviewModeration(input: ReviewModerationInput): ModerationResult {
  const hasSpam = input.reviewText.length < 5 || /^(good|bad|ok|test|ü|a){1,3}$/i.test(input.reviewText);
  return {
    verdict: hasSpam ? 'flagged' : 'approved',
    confidence: hasSpam ? 60 : 85,
    reason: hasSpam ? 'Çok kısa veya spam benzeri yorum.' : 'Temel kurallara uygun.',
    flags: hasSpam ? ['low_quality'] : [],
    suggestedAction: hasSpam ? 'Manuel inceleme önerilir.' : 'Onaylanabilir.',
    analyzedAt: new Date().toISOString(),
  };
}
