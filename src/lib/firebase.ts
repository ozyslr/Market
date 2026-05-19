import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Connectivity Test
async function testConnection() {
  try {
    const path = 'system/connection-test';
    await getDocFromServer(doc(db, path));
    console.log('Firebase connection established.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase is offline. Please check your configuration.");
    } else {
      console.warn("Firebase connection test skipped (likely unauthenticated):", error instanceof Error ? error.message : error);
    }
  }
}

if (process.env.NODE_ENV !== 'production') {
  testConnection();
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  }
  // Log full details server-side for debugging, but only throw minimal info
  if (process.env.NODE_ENV !== 'production') {
    console.error('Firestore Error (dev):', {
      ...errInfo,
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    });
  } else {
    console.error('Firestore Error:', errInfo);
  }
  throw new Error(JSON.stringify(errInfo));
}
