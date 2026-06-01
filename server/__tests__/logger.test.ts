import { describe, it, expect, vi } from 'vitest';
import { Writable } from 'stream';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Creates a writable stream that captures pino output in memory. */
function captureStream(): { stream: Writable; lines: string[] } {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _enc: BufferEncoding, cb: (error?: Error | null) => void) {
      lines.push(chunk.toString().trim());
      cb();
    },
  });
  return { stream, lines };
}

/** Re-import logger module with a custom stream and return parsed output. */
async function createTestLogger() {
  const capture = captureStream();
  // Re-import from fresh (untangle any previous module state)
  const mod = await import('../logger.js');
  const testLogger = mod.createLogger(capture.stream);
  return { logger: testLogger, lines: capture.lines, parse: () => capture.lines.map(l => JSON.parse(l)) };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('logger', () => {
  describe('info', () => {
    it('emits a JSON log entry with correct level', async () => {
      const { logger, parse, lines } = await createTestLogger();
      logger.info('auth', 'user logged in');
      const entries = parse();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe(30); // pino numeric level for info
      expect(entries[0].msg).toBe('user logged in');
    });

    it('includes component name and data', async () => {
      const { logger, parse } = await createTestLogger();
      logger.info('cart', 'checkout', { orderId: '123', total: 99 });
      const entry = parse()[0];
      expect(entry.component).toBe('cart');
      expect(entry.data?.orderId).toBe('123');
      expect(entry.data?.total).toBe(99);
    });

    it('emits ISO timestamp', async () => {
      const { logger, parse } = await createTestLogger();
      logger.info('svc', 'ping');
      const entry = parse()[0];
      expect(entry.time).toBeTypeOf('string');
      expect(entry.time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('warn', () => {
    it('emits a JSON log entry with warn level', async () => {
      const { logger, parse } = await createTestLogger();
      logger.warn('payment', 'retry');
      const entry = parse()[0];
      expect(entry.level).toBe(40); // pino numeric level for warn
      expect(entry.msg).toBe('retry');
    });
  });

  describe('error', () => {
    it('emits a JSON log entry with error level', async () => {
      const { logger, parse } = await createTestLogger();
      logger.error('db', 'connection failed');
      const entry = parse()[0];
      expect(entry.level).toBe(50); // pino numeric level for error
      expect(entry.msg).toBe('connection failed');
    });

    it('includes error data', async () => {
      const { logger, parse } = await createTestLogger();
      logger.error('api', 'timeout', { url: '/x', ms: 5000 });
      const entry = parse()[0];
      expect(entry.data?.url).toBe('/x');
      expect(entry.data?.ms).toBe(5000);
    });
  });

  describe('debug', () => {
    it('emits a JSON log entry with debug level', async () => {
      const { logger, parse } = await createTestLogger();
      logger.debug('cache', 'miss');
      const entry = parse()[0];
      expect(entry.level).toBe(20); // pino numeric level for debug
      expect(entry.msg).toBe('miss');
    });
  });

  describe('httpLogger', () => {
    it('exports httpLogger as a function', async () => {
      const mod = await import('../logger.js');
      expect(mod.httpLogger).toBeTypeOf('function');
    });
  });
});
