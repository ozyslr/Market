// Mercora Next API base URL
// Production: https://mercora-next.vercel.app
// Local dev: http://localhost:3000 (or your local IP for device testing)
export const API_BASE_URL = 'https://mercora-next.vercel.app';

// iyzico callback redirect patterns (used by WebView to detect payment result)
export const IYZICO_CALLBACK_PATTERNS = {
  success: 'iyzico_status=success',
  failed: 'iyzico_status=failed',
  error: 'iyzico_status=error',
} as const;
