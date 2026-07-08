import os
m = r"O:\AI\E-tic 2026\mobile"

files = {
    "package.json": """{
  "name": "benim-olan-mobile",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest"
  },
  "dependencies": {
    "react": "19.0.0",
    "react-native": "0.78.0",
    "@react-navigation/native": "^7.x",
    "@react-navigation/bottom-tabs": "^7.x",
    "@react-navigation/native-stack": "^7.x",
    "react-native-screens": "^4.x",
    "react-native-safe-area-context": "^5.x",
    "firebase": "^12.x",
    "@stripe/stripe-react-native": "^0.40.x",
    "zustand": "^5.x",
    "react-native-encrypted-storage": "^4.x"
  },
  "devDependencies": {
    "@types/react": "^19.x",
    "typescript": "~5.8"
  }
}""",

    "tsconfig.json": """{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "lib": ["es2022"],
    "jsx": "react-native",
    "strict": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*"]
}""",

    "src/services/firebase.ts": """import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import EncryptedStorage from 'react-native-encrypted-storage';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || '',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(EncryptedStorage),
});

export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export { app };
""",

    "src/services/api.ts": """import { auth } from './firebase';

const BASE_URL = process.env.API_URL || 'https://benimolan.com/api';

async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  return user ? user.getIdToken() : null;
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(BASE_URL + path, {
    headers: token ? { Authorization: 'Bearer ' + token } : {},
  });
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: JSON.stringify(body),
  });
  return res.json();
}
""",
}

for filename, content in files.items():
    filepath = os.path.join(m, filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Written: {filename}")
