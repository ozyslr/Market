'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: 'market-ecommerce-app',
  appId: '1:284101292710:web:e4516dfad25dba26c37a67',
  apiKey: 'AIzaSyAmc7e1d6h4--wAFdELjBuooWbvvF6KfSg',
  authDomain: 'market-ecommerce-app.firebaseapp.com',
  storageBucket: 'market-ecommerce-app.firebasestorage.app',
  messagingSenderId: '284101292710',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export { firebaseConfig };
