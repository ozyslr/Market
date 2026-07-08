import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { notifyAdmins } from './notificationService';
import { recordEvent } from './sellerOnboardingService';

// ─── KYC Document type (D-06) ─────────────────────────────────────────────────
// storagePath is stored in Firestore — never a signed URL or public URL (T-03-01).

export interface KycDocument {
  docType: 'identity' | 'tax_certificate' | 'bank_iban';
  storagePath: string;
  uploadedAt: string;
  fileName: string;
}

export interface SellerApplication {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  storeName: string;
  slug: string;
  phone: string;
  origin: string;
  taxId?: string;
  bankIban?: string;
  address?: string;
  firstName?: string;
  lastName?: string;
  businessRegistration?: string;
  /** KYC documents — stored as storagePath refs, never public URLs (D-04) */
  kycDocuments?: KycDocument[];
  /** Stripe Identity verification status — set by webhook (D-05) */
  identityVerificationStatus?: 'pending' | 'verified' | 'requires_input';
  identitySessionId?: string;
  identityVerificationError?: string;
  website?: string;
  socialMedia?: { platform: string; url: string }[];
  productCategories: string[];
  monthlySalesTarget: string;
  experience: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

// ─── hasAllRequiredDocs ───────────────────────────────────────────────────────
// Client-side gate (mirrors server-side check in kycService.ts, T-03-07).

export function hasAllRequiredDocs(app: SellerApplication): boolean {
  const docs = app.kycDocuments ?? [];
  const presentTypes = new Set(docs.map((d) => d.docType));
  return (
    presentTypes.has('identity') &&
    presentTypes.has('tax_certificate') &&
    presentTypes.has('bank_iban')
  );
}

const COL = 'sellerApplications';

export async function submitApplication(
  data: Omit<SellerApplication, 'id' | 'createdAt' | 'status'>,
): Promise<string> {
  const id = `app-${Date.now()}`;
  try {
    // ── Slug uniqueness guard (Pitfall 8) ──────────────────────────────────────
    let slug = data.slug;
    const slugSnap = await getDocs(query(collection(db, COL), where('slug', '==', slug)));
    if (!slugSnap.empty) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    await setDoc(doc(db, COL, id), {
      ...data,
      id,
      slug,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    notifyAdmins(
      'admin_alert',
      'Yeni Satıcı Başvurusu',
      `${data.storeName} — ${data.userEmail} satıcı olmak için başvurdu.`,
      '/admin',
    ).catch(() => {});
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COL);
    throw error;
  }
}

export async function getApplications(
  status?: 'pending' | 'approved' | 'rejected',
): Promise<SellerApplication[]> {
  try {
    const ref = collection(db, COL);
    const q = status ? query(ref, where('status', '==', status)) : ref;
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SellerApplication);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function reviewApplication(
  id: string,
  status: 'approved' | 'rejected',
  adminNote: string,
  reviewedBy: string,
): Promise<void> {
  try {
    // Fetch application to get sellerId for funnel instrumentation
    let sellerId: string | undefined;
    if (status === 'approved') {
      const appSnap = await getDoc(doc(db, COL, id));
      if (appSnap.exists()) {
        sellerId = (appSnap.data() as SellerApplication).userId;
      }
    }

    await updateDoc(doc(db, COL, id), {
      status,
      adminNote,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    });

    // Record KYC approval event (fire-and-forget)
    if (status === 'approved' && sellerId) {
      recordEvent(sellerId, 'kyc_approved').catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${id}`);
    throw error;
  }
}

export async function deleteApplication(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COL}/${id}`);
  }
}
