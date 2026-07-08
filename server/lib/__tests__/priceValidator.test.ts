/**
 * Standalone test for price validation logic.
 * Run: npx tsx server/lib/__tests__/priceValidator.test.ts
 *
 * Tests the core validation math without needing Firestore —
 * uses a mock adminDb that returns known prices.
 */
import { validatePrices, type PriceCheckItem } from '../priceValidator.js';

// ─── Mock Firestore ──────────────────────────────────────────────────────
// Simulates product documents with price fields.

interface MockProductDoc {
  price?: number;
  basePrice?: number;
}

function makeMockDb(prices: Record<string, number>) {
  const db: any = {
    collection: (_name: string) => ({
      doc: (id: string) => ({
        get: async () => {
          const price = prices[id];
          if (price === undefined) {
            return { exists: false, id, data: () => null as any };
          }
          return {
            exists: true,
            id,
            data: () => ({ price, basePrice: price }) as MockProductDoc,
          };
        },
      }),
    }),
  };
  return db;
}

// ─── Test runner ─────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err: any) {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     ${err.message}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

// ─── Tests ───────────────────────────────────────────────────────────────

console.log('\n🔍 Price Validator Tests\n');

await test('exact price match passes', async () => {
  const db = makeMockDb({ prod1: 100, prod2: 50 });
  const items: PriceCheckItem[] = [
    { productId: 'prod1', quantity: 2, price: 100 },
    { productId: 'prod2', quantity: 1, price: 50 },
  ];
  const result = await validatePrices(db, items);
  assert(result.valid === true, `Expected valid=true, got ${result.valid}: ${result.reason}`);
  assert(result.serverTotal === 250, `Expected serverTotal=250, got ${result.serverTotal}`);
});

await test('minor price deviation (0.5%) passes tolerance', async () => {
  const db = makeMockDb({ prod1: 100 });
  const items: PriceCheckItem[] = [
    { productId: 'prod1', quantity: 1, price: 100.50 }, // 0.5% deviation
  ];
  const result = await validatePrices(db, items);
  assert(result.valid === true, `0.5% deviation should pass: ${result.reason}`);
});

await test('large price deviation (>1%) fails', async () => {
  const db = makeMockDb({ prod1: 100 });
  const items: PriceCheckItem[] = [
    { productId: 'prod1', quantity: 1, price: 80 }, // 20% deviation
  ];
  const result = await validatePrices(db, items);
  assert(result.valid === false, '20% deviation should fail');
  assert(result.reason!.includes('Price mismatch'), `Expected mismatch reason, got: ${result.reason}`);
});

await test('small absolute difference (4 units) passes tolerance', async () => {
  const db = makeMockDb({ prod1: 100 });
  const items: PriceCheckItem[] = [
    { productId: 'prod1', quantity: 1, price: 104 }, // 4 units diff, 4% but <5 unit min
  ];
  const result = await validatePrices(db, items);
  assert(result.valid === true, `4-unit diff should pass (under 5-unit floor): ${result.reason}`);
});

await test('absolute difference of 6 units fails', async () => {
  const db = makeMockDb({ prod1: 100 });
  const items: PriceCheckItem[] = [
    { productId: 'prod1', quantity: 1, price: 106 }, // 6 units diff, >5 unit min
  ];
  const result = await validatePrices(db, items);
  // 6 > 5 (min absolute diff) AND 6% > 1% (ratio) => should fail
  assert(result.valid === false, `6-unit diff should fail: ${result.reason}`);
});

await test('product not found fails', async () => {
  const db = makeMockDb({ prod1: 100 });
  const items: PriceCheckItem[] = [
    { productId: 'nonexistent', quantity: 1, price: 50 },
  ];
  const result = await validatePrices(db, items);
  assert(result.valid === false, 'Missing product should fail');
  assert(result.reason!.includes('not found'), `Expected "not found", got: ${result.reason}`);
});

await test('empty items fails', async () => {
  const db = makeMockDb({});
  const result = await validatePrices(db, []);
  assert(result.valid === false, 'Empty items should fail');
});

await test('multiple quantities calculate correctly', async () => {
  const db = makeMockDb({ prod1: 25, prod2: 10 });
  const items: PriceCheckItem[] = [
    { productId: 'prod1', quantity: 4, price: 25 },
    { productId: 'prod2', quantity: 10, price: 10 },
  ];
  const result = await validatePrices(db, items);
  assert(result.valid === true, `Expected valid, got: ${result.reason}`);
  assert(result.serverTotal === 200, `Expected serverTotal=200, got ${result.serverTotal}`);
});

await test('duplicate product IDs are handled', async () => {
  // Same product appears twice — should batch fetch once, sum correctly
  const db = makeMockDb({ prod1: 10 });
  const items: PriceCheckItem[] = [
    { productId: 'prod1', quantity: 1, price: 10 },
    { productId: 'prod1', quantity: 2, price: 10 },
  ];
  const result = await validatePrices(db, items);
  assert(result.valid === true, `Expected valid, got: ${result.reason}`);
  assert(result.serverTotal === 30, `Expected serverTotal=30, got ${result.serverTotal}`);
});

await test('large order with 1% deviation passes', async () => {
  const db = makeMockDb({ prod1: 1000 });
  const items: PriceCheckItem[] = [
    { productId: 'prod1', quantity: 100, price: 1010 }, // 1% exactly
  ];
  const result = await validatePrices(db, items);
  // 1% of 100,000 = 1000, diff = 1000 which equals tolerance
  assert(result.valid === true, `1% deviation should pass at scale: ${result.reason}`);
});

// ─── Results ─────────────────────────────────────────────────────────────

console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests\n`);

if (failed > 0) process.exit(1);
