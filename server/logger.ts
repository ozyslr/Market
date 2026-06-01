/**
 * Structured logger — wraps pino with component-level logging.
 *
 * API (backward-compatible):
 *   logger.info(component, message, data?)
 *   logger.error(component, message, data?)
 *   logger.warn(component, message, data?)
 *   logger.debug(component, message, data?)
 *
 * Also exports `httpLogger` — pino-http Express middleware for automatic
 * HTTP request/response logging.
 */

import pino from 'pino';
import pinoHttp from 'pino-http';
import { Writable } from 'stream';

// ─── Pino instance factory ───────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === 'production';

const defaults = {
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  formatters: {
    bindings: isProd ? undefined : () => ({}),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

/**
 * Create a component-level logging wrapper backed by pino.
 * Accepts an optional writable stream (defaults to stdout).
 */
export function createLogger(destination?: Writable) {
  const dest = destination ?? pino.destination(1);
  const instance = pino(defaults, dest);
  return {
    info:  (component: string, message: string, data?: Record<string, unknown>) => instance.info({ component, ...(data ? { data } : {}) }, message),
    warn:  (component: string, message: string, data?: Record<string, unknown>) => instance.warn({ component, ...(data ? { data } : {}) }, message),
    error: (component: string, message: string, data?: Record<string, unknown>) => instance.error({ component, ...(data ? { data } : {}) }, message),
    debug: (component: string, message: string, data?: Record<string, unknown>) => instance.debug({ component, ...(data ? { data } : {}) }, message),
  };
}

const pinoInstance = pino(defaults, pino.destination(1));

export const logger = createLogger();

// ─── HTTP request logging middleware ─────────────────────────────────────────

export const httpLogger = pinoHttp({
  logger: pinoInstance,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["stripe-signature"]'],
    censor: '[REDACTED]',
  },
  autoLogging: {
    ignore: (req) => req.url === '/api/health',
  },
});
