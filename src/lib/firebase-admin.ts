import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import webConfig from '../../firebase-applet-config.json';

// This module is imported (and executed) before server.ts calls dotenv.config(),
// so load .env here first — otherwise FIREBASE_SERVICE_ACCOUNT_B64 reads as undefined.
dotenv.config();

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;

// getStorage().bucket() (KYC docs, CSV import) needs a default bucket on the app.
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || webConfig.storageBucket;

let adminDb: FirebaseFirestore.Firestore | null = null;
let adminAuth: ReturnType<typeof getAuth> | null = null;

if (serviceAccountBase64) {
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'),
    );

    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
        storageBucket,
      });
    }
    adminDb = getFirestore();
    adminAuth = getAuth();
    console.log('Firebase Admin initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin init failed:', error);
  }
} else if (process.env.K_SERVICE) {
  // Running on Cloud Run: use the service's own identity (Application Default
  // Credentials) so no service-account key has to be stored as a secret.
  try {
    if (!getApps().length) {
      initializeApp({ projectId: webConfig.projectId, storageBucket });
    }
    adminDb = getFirestore();
    adminAuth = getAuth();
    console.log('Firebase Admin initialized with Application Default Credentials.');
  } catch (error) {
    console.error('Firebase Admin ADC init failed:', error);
  }
} else {
  console.warn('FIREBASE_SERVICE_ACCOUNT_B64 not set. Webhook Firestore updates will be disabled.');
}

export { adminDb, adminAuth };
