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

/**
 * Custom error class that preserves the original Firestore error info
 * for internal handling while allowing sanitized messages for clients.
 */
export class FirestoreError extends Error {
  public readonly info: FirestoreErrorInfo;
  public readonly userId?: string | null;
  public readonly email?: string | null;

  constructor(info: FirestoreErrorInfo, userId?: string | null, email?: string | null) {
    // In production, expose only a generic message to clients
    const message = process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again.'
      : JSON.stringify(info);
    super(message);
    this.name = 'FirestoreError';
    this.info = info;
    this.userId = userId;
    this.email = email;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  }
  const userId = auth.currentUser?.uid ?? null;
  const email = auth.currentUser?.email ?? null;

  // Always log full details server-side for debugging
  console.error('Firestore Error:', {
    ...errInfo,
    userId,
    email,
  });

  // Throw a custom error: generic message in production, detailed in dev
  throw new FirestoreError(errInfo, userId, email);
}
