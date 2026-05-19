import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;

let adminDb: FirebaseFirestore.Firestore | null = null;

if (serviceAccountBase64) {
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
    );

    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }
    adminDb = getFirestore();
    console.log('Firebase Admin initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin init failed:', error);
  }
} else {
  console.warn(
    'FIREBASE_SERVICE_ACCOUNT_B64 not set. Webhook Firestore updates will be disabled.'
  );
}

export { adminDb };
