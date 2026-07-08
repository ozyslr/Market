import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface FxRates {
  EUR: number;
  [key: string]: number;
}

export interface FxRatesCache {
  rates: FxRates;
  updatedAt: string;
}

const API_URL = 'https://api.exchangerate.host/latest?base=TRY&symbols=EUR';

export async function fetchDailyRates(): Promise<FxRates> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`FX API error: ${res.status}`);
  const data = await res.json();
  if (data.rates?.EUR) {
    return { EUR: data.rates.EUR };
  }
  // Fallback rate (approximate)
  return { EUR: 0.028 };
}

export async function cacheRates(rates: FxRates): Promise<void> {
  const ref = doc(db, 'fxRates', 'TRY');
  await setDoc(ref, {
    rates: { EUR: rates.EUR },
    updatedAt: new Date().toISOString(),
  });
}

export async function getCachedRates(): Promise<FxRatesCache | null> {
  try {
    const ref = doc(db, 'fxRates', 'TRY');
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as FxRatesCache;
  } catch {}
  return null;
}

export async function getEurRate(): Promise<number> {
  const cached = await getCachedRates();
  return cached?.rates?.EUR || 0.028; // fallback
}
