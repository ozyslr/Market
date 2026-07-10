// server/lib/kycSettings.ts
import { adminDb } from '../../src/lib/firebase-admin.js';
import type { KycSettings } from '../../src/types/kyc.js';
import { DEFAULT_KYC_SETTINGS } from '../../src/types/kyc.js';

export async function getKycSettings(): Promise<KycSettings> {
  if (!adminDb) throw new Error('Firestore not configured');
  const snap = await adminDb.collection('settings').doc('kyc').get();
  if (!snap.exists) {
    await adminDb.collection('settings').doc('kyc').set(DEFAULT_KYC_SETTINGS);
    return { ...DEFAULT_KYC_SETTINGS };
  }
  return { ...DEFAULT_KYC_SETTINGS, ...(snap.data() as Partial<KycSettings>) };
}

export async function updateKycSettings(settings: Partial<KycSettings>): Promise<void> {
  if (!adminDb) throw new Error('Firestore not configured');
  await adminDb.collection('settings').doc('kyc').set(settings, { merge: true });
}
