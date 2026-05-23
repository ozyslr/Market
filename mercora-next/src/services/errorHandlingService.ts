/**
 * Error Handling Service (STREAM C)
 * Silent error handling and monitoring
 *
 * Features:
 * - Structured error logging
 * - Error classification (user, system, external)
 * - Retry logic for transient failures
 * - Error aggregation and reporting
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
export type ErrorType = 'user' | 'system' | 'external' | 'validation';

export interface ErrorLog {
  id?: string;
  message: string;
  stack?: string;
  context: string; // Component/function where error occurred
  severity: ErrorSeverity;
  type?: ErrorType;
  componentStack?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delayMs: 100,
  backoffMultiplier: 2,
  shouldRetry: (error) => {
    // Retry on network errors, 5xx, and timeouts
    return (
      error instanceof TypeError ||
      error.status >= 500 ||
      error.code === 'ETIMEDOUT'
    );
  },
};

const MONITORING_ENDPOINT = '/api/monitoring/log-error';
const ERROR_QUEUE = 'error_queue';

/**
 * Classify error type
 */
function classifyError(error: any): ErrorType {
  if (error instanceof TypeError || error instanceof SyntaxError) {
    return 'system';
  }
  if (error.status >= 400 && error.status < 500) {
    return 'user';
  }
  if (error.status >= 500) {
    return 'external';
  }
  return 'system';
}

/**
 * Get severity level
 */
function getSeverity(error: any): ErrorSeverity {
  if (error.status >= 500) return 'critical';
  if (error.status >= 400) return 'warning';
  return 'error';
}

/**
 * Log error to monitoring service (silent)
 */
export async function logError(errorLog: ErrorLog): Promise<void> {
  try {
    // Enrich error log
    const enriched: ErrorLog = {
      id: `err_${Date.now()}`,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      ...errorLog,
      type: errorLog.type || classifyError(errorLog),
    };

    // Queue error for batch sending
    if (typeof window !== 'undefined') {
      const queue = JSON.parse(localStorage.getItem(ERROR_QUEUE) || '[]') as ErrorLog[];
      queue.push(enriched);
      localStorage.setItem(ERROR_QUEUE, JSON.stringify(queue.slice(-50))); // Keep last 50
    }

    // Send to monitoring endpoint
    await fetch(MONITORING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched),
    }).catch(() => {
      // Silent fail - don't throw on monitoring errors
      console.error('[errorHandling] Failed to send error log');
    });
  } catch (error) {
    // Silent fail
    console.error('[errorHandling] Error in logError:', error);
  }
}

/**
 * Retry async operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!opts.shouldRetry(error, attempt)) {
        throw error;
      }

      if (attempt < opts.maxRetries) {
        const delay = opts.delayMs * Math.pow(opts.backoffMultiplier, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Wrap function with silent error handling
 */
export function withErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
): (...args: T) => Promise<R | undefined> {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError({
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context,
        severity: 'error',
      });
      return undefined;
    }
  };
}

/**
 * Safe JSON parse with error logging
 */
export function safeJsonParse<T>(
  json: string,
  fallback: T,
  context: string
): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    logError({
      message: 'JSON parse error',
      context,
      severity: 'warning',
      metadata: { input: json.slice(0, 100) },
    });
    return fallback;
  }
}

/**
 * Safe localStorage access
 */
export function safeLocalStorage(
  action: 'get' | 'set' | 'remove',
  key: string,
  value?: string
): string | null {
  try {
    if (typeof window === 'undefined') return null;

    switch (action) {
      case 'get':
        return localStorage.getItem(key);
      case 'set':
        localStorage.setItem(key, value || '');
        return null;
      case 'remove':
        localStorage.removeItem(key);
        return null;
    }
  } catch (error) {
    logError({
      message: `localStorage ${action} error`,
      context: `safeLocalStorage[${key}]`,
      severity: 'warning',
    });
  }
  return null;
}

/**
 * Batch send queued errors
 */
export async function flushErrorQueue(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const queue = JSON.parse(localStorage.getItem(ERROR_QUEUE) || '[]') as ErrorLog[];
    if (queue.length === 0) return;

    await fetch(MONITORING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch: queue }),
    });

    localStorage.removeItem(ERROR_QUEUE);
  } catch (error) {
    console.error('[errorHandling] Failed to flush queue:', error);
  }
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushErrorQueue();
  });
}

export default {
  logError,
  withRetry,
  withErrorHandler,
  safeJsonParse,
  safeLocalStorage,
  flushErrorQueue,
};
