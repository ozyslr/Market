// ─── KYC Service ─────────────────────────────────────────────────────────────
// Signed URL generation (upload + admin read), GDPR/KVKK delete, 3-doc gate.
// Admin SDK bypasses Firebase Storage rules — client SDK access to kyc/* is
// blocked by storage.rules (T-03-01).

import { getStorage } from 'firebase-admin/storage';
import { logger } from '../logger.js';

export type KycDocType = 'identity' | 'tax_certificate' | 'bank_iban';

const REQUIRED_DOC_TYPES: KycDocType[] = ['identity', 'tax_certificate', 'bank_iban'];

export interface KycUploadResult {
  uploadUrl: string;
  storagePath: string;
}

// ─── getKycUploadUrl ─────────────────────────────────────────────────────────
// Generates a v4 signed URL for client PUT upload (write action, 10 min TTL).
// Returns storagePath which is what must be stored in Firestore — never the URL.

export async function getKycUploadUrl(
  sellerId: string,
  docType: KycDocType,
  fileName: string,
): Promise<KycUploadResult> {
  const bucket = getStorage().bucket();
  const storagePath = `kyc/${sellerId}/${docType}-${Date.now()}`;
  const file = bucket.file(storagePath);

  try {
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 10 * 60 * 1000,
      contentType: 'application/octet-stream',
    });

    logger.info('kyc', 'Upload URL generated', { sellerId, docType, storagePath });
    return { uploadUrl, storagePath };
  } catch (err) {
    logger.error('kyc', 'Failed to generate upload URL', {
      sellerId,
      docType,
      error: (err as Error).message,
    });
    throw err;
  }
}

// ─── getKycSignedUrl ─────────────────────────────────────────────────────────
// Generates a short-lived (5 min) signed URL for admin document viewing.
// Caller must be admin-authenticated (verifyAdmin middleware).

export async function getKycSignedUrl(storagePath: string): Promise<string> {
  const bucket = getStorage().bucket();
  const file = bucket.file(storagePath);

  try {
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 5 * 60 * 1000,
    });

    logger.info('kyc', 'Signed read URL generated', { storagePath });
    return url;
  } catch (err) {
    logger.error('kyc', 'Failed to generate signed read URL', {
      storagePath,
      error: (err as Error).message,
    });
    throw err;
  }
}

// ─── deleteKycDocuments ──────────────────────────────────────────────────────
// Deletes all KYC documents for a seller (GDPR/KVKK right-to-erasure support).

export async function deleteKycDocuments(sellerId: string): Promise<void> {
  const bucket = getStorage().bucket();

  try {
    await bucket.deleteFiles({ prefix: `kyc/${sellerId}/` });
    logger.info('kyc', 'KYC documents deleted', { sellerId });
  } catch (err) {
    logger.error('kyc', 'Failed to delete KYC documents', {
      sellerId,
      error: (err as Error).message,
    });
    throw err;
  }
}

// ─── hasAllRequiredDocs ──────────────────────────────────────────────────────
// Returns true if the kycDocuments array contains all 3 required docTypes.
// Used as server-side gate before payment account provisioning (T-03-07).

export interface KycDocumentRef {
  docType: KycDocType;
  storagePath: string;
  uploadedAt: string;
  fileName: string;
}

export function hasAllRequiredDocs(kycDocuments: KycDocumentRef[]): boolean {
  const presentTypes = new Set(kycDocuments.map((d) => d.docType));
  return REQUIRED_DOC_TYPES.every((t) => presentTypes.has(t));
}
