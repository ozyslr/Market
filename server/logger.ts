/**
 * Structured logger — wraps console with levels, timestamps, and JSON formatting.
 * Zero dependencies. In production, outputs JSON lines for log aggregation.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  ts: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: Record<string, unknown>;
}

const isProd = process.env.NODE_ENV === 'production';

function formatLog(entry: LogEntry): string {
  if (isProd) {
    return JSON.stringify(entry);
  }
  const prefix = `[${entry.ts}] ${entry.level.toUpperCase().padEnd(5)} [${entry.component}]`;
  const suffix = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
  return `${prefix} ${entry.message}${suffix}`;
}

function log(level: LogLevel, component: string, message: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    component,
    message,
    ...(data ? { data } : {}),
  };

  const formatted = formatLog(entry);

  switch (level) {
    case 'error': console.error(formatted); break;
    case 'warn':  console.warn(formatted);  break;
    case 'debug': console.debug(formatted); break;
    default:      console.log(formatted);
  }
}

export const logger = {
  info:    (component: string, message: string, data?: Record<string, unknown>) => log('info', component, message, data),
  warn:    (component: string, message: string, data?: Record<string, unknown>) => log('warn', component, message, data),
  error:   (component: string, message: string, data?: Record<string, unknown>) => log('error', component, message, data),
  debug:   (component: string, message: string, data?: Record<string, unknown>) => log('debug', component, message, data),
};
