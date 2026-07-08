import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

// ─── Types ──────────────────────────────────────────────────────────────────────

export type FunnelEvent =
  | 'seller_first_login'
  | 'kyc_submitted'
  | 'kyc_approved'
  | 'first_product_created'
  | 'first_product_published';

export interface FunnelMetrics {
  /** ISO timestamps for each milestone (null if not reached yet) */
  timestamps: Record<FunnelEvent, string | null>;
  /** Durations in hours between consecutive milestones (null if gap cannot be calculated) */
  durations: {
    loginToKycSubmit: number | null;
    kycSubmitToApproval: number | null;
    approvalToFirstProduct: number | null;
    firstProductToPublish: number | null;
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function diffHours(a: string, b: string): number | null {
  try {
    const ms = new Date(b).getTime() - new Date(a).getTime();
    if (Number.isNaN(ms)) return null;
    return Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
  } catch {
    return null;
  }
}

// ─── recordEvent ────────────────────────────────────────────────────────────────

/**
 * Records a funnel event for a seller. Idempotent — only records the first occurrence.
 * Fire-and-forget: errors are caught silently.
 */
export async function recordEvent(sellerId: string, event: FunnelEvent): Promise<void> {
  try {
    // Check if this event already exists for this seller (idempotent)
    const q = query(
      collection(db, 'events'),
      where('sellerId', '==', sellerId),
      where('event', '==', event),
    );
    const existing = await getDocs(q);
    if (!existing.empty) return; // Already recorded — skip

    await addDoc(collection(db, 'events'), {
      sellerId,
      event,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Fire-and-forget — silent failure
    handleFirestoreError(error, OperationType.CREATE, 'events');
  }
}

// ─── getSellerFunnelMetrics ─────────────────────────────────────────────────────

/**
 * Queries all funnel events for a seller and computes milestone durations.
 * Falls back to seller application / user document timestamps for KYC events
 * when instrumentation was added after the seller completed those steps.
 */
export async function getSellerFunnelMetrics(sellerId: string): Promise<FunnelMetrics> {
  try {
    // Query all funnel events for this seller
    const all = await getDocs(query(collection(db, 'events'), where('sellerId', '==', sellerId)));

    const timestamps: Record<string, string | null> = {
      seller_first_login: null,
      kyc_submitted: null,
      kyc_approved: null,
      first_product_created: null,
      first_product_published: null,
    };

    for (const d of all.docs) {
      const data = d.data();
      if (data.event && Object.prototype.hasOwnProperty.call(timestamps, data.event)) {
        // Keep the earliest timestamp in case of duplicates
        if (
          !timestamps[data.event] ||
          new Date(data.timestamp).getTime() < new Date(timestamps[data.event]!).getTime()
        ) {
          timestamps[data.event] = data.timestamp;
        }
      }
    }

    // ── Fallback: derive KYC milestones from seller application if not recorded ─
    if (!timestamps.kyc_submitted || !timestamps.kyc_approved) {
      try {
        const appSnap = await getDocs(
          query(collection(db, 'sellerApplications'), where('userId', '==', sellerId)),
        );
        if (!appSnap.empty) {
          // Use the first application found
          const app = appSnap.docs[0].data();
          if (!timestamps.kyc_submitted && app.createdAt) {
            timestamps.kyc_submitted = app.createdAt;
          }
          // For approved apps, use reviewedAt as kyc_approved
          if (app.status === 'approved') {
            if (!timestamps.kyc_approved && app.reviewedAt) {
              timestamps.kyc_approved = app.reviewedAt;
            } else if (!timestamps.kyc_approved && app.createdAt) {
              // If not yet approved, don't fabricate — leave null
            }
          }
        }
      } catch {
        // Fallback query failed — proceed with whatever timestamps we have
      }
    }

    // ── Derive seller_first_login from user doc if missing ──────────────────────
    if (!timestamps.seller_first_login) {
      try {
        const userSnap = await getDoc(doc(db, 'users', sellerId));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.lastLogin) {
            timestamps.seller_first_login = userData.lastLogin;
          } else if (userData.createdAt) {
            timestamps.seller_first_login = userData.createdAt;
          }
        }
      } catch {
        // Fallback query failed
      }
    }

    // ── Compute durations ────────────────────────────────────────────────────────
    const getTs = (key: string): string | null =>
      (timestamps as Record<string, string | null>)[key] ?? null;

    return {
      timestamps: timestamps as Record<FunnelEvent, string | null>,
      durations: {
        loginToKycSubmit: (() => {
          const a = getTs('seller_first_login');
          const b = getTs('kyc_submitted');
          return a && b ? diffHours(a, b) : null;
        })(),
        kycSubmitToApproval: (() => {
          const a = getTs('kyc_submitted');
          const b = getTs('kyc_approved');
          return a && b ? diffHours(a, b) : null;
        })(),
        approvalToFirstProduct: (() => {
          const a = getTs('kyc_approved');
          const b = getTs('first_product_created');
          return a && b ? diffHours(a, b) : null;
        })(),
        firstProductToPublish: (() => {
          const a = getTs('first_product_created');
          const b = getTs('first_product_published');
          return a && b ? diffHours(a, b) : null;
        })(),
      },
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'events');
    // Return empty metrics on error
    return {
      timestamps: {
        seller_first_login: null,
        kyc_submitted: null,
        kyc_approved: null,
        first_product_created: null,
        first_product_published: null,
      },
      durations: {
        loginToKycSubmit: null,
        kycSubmitToApproval: null,
        approvalToFirstProduct: null,
        firstProductToPublish: null,
      },
    };
  }
}
