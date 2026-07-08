// Checkout rate-lock utility
const LOCK_KEY = 'benimolan_checkout_lock';
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface RateLock {
  rate: number;
  expiresAt: number;
}

export function lockRate(rate: number): void {
  const lock: RateLock = { rate, expiresAt: Date.now() + LOCK_DURATION_MS };
  try {
    sessionStorage.setItem(LOCK_KEY, JSON.stringify(lock));
  } catch {}
}

export function getLockedRate(): number | null {
  try {
    const raw = sessionStorage.getItem(LOCK_KEY);
    if (!raw) return null;
    const lock: RateLock = JSON.parse(raw);
    if (Date.now() > lock.expiresAt) {
      sessionStorage.removeItem(LOCK_KEY);
      return null;
    }
    return lock.rate;
  } catch {
    return null;
  }
}

export function clearLockedRate(): void {
  try {
    sessionStorage.removeItem(LOCK_KEY);
  } catch {}
}

export function getLockRemainingMs(): number {
  try {
    const raw = sessionStorage.getItem(LOCK_KEY);
    if (!raw) return 0;
    const lock: RateLock = JSON.parse(raw);
    return Math.max(0, lock.expiresAt - Date.now());
  } catch {
    return 0;
  }
}
