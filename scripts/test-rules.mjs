// Tests firestore.rules against the Firebase Rules API (projects.test) without deploying.
// Run: npm run test:rules   (uses $TOKEN, else your `gcloud auth print-access-token`)
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const rulesPath = process.argv[2] || 'firestore.rules';
const token = process.env.TOKEN || execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
const P = '/databases/(default)/documents';

const anon = (uid) => ({ uid, token: { firebase: { sign_in_provider: 'anonymous' } } });
const user = (uid) => ({ uid, token: { firebase: { sign_in_provider: 'password' }, email_verified: true } });
const seller = (uid) => ({ uid, token: { firebase: { sign_in_provider: 'password' }, role: 'seller', sellerId: uid } });

const order = { userId: 'b1', sellerIds: ['s1'], status: 'shipped', total: 100 };
const warehouseMock = [{ function: 'get', args: [{ anyValue: {} }], result: { value: { data: { sellerId: 's1' } } } }];

const T = (name, expectation, req, resource, functionMocks) => ({
  name,
  tc: { expectation, request: req, ...(resource ? { resource: { data: resource } } : {}), ...(functionMocks ? { functionMocks } : {}) },
});
const get = (auth, path) => ({ auth, path: P + path, method: 'get' });
const list = (auth, path) => ({ auth, path: P + path, method: 'list' });
const write = (method, auth, path, data) => ({ auth, path: P + path, method, resource: { data } });

const NOW = '2026-11-06T10:00:00Z';
const priceWrite = (auth, data) => ({ ...write('create', auth, '/price_history/h1', data), time: NOW });
const productOfS1 = [{ function: 'get', args: [{ anyValue: {} }], result: { value: { data: { sellerId: 's1' } } } }];

const cases = [
  T('guest reads own order', 'ALLOW', get(anon('b1'), '/orders/o1'), order),
  T('other user reads order', 'DENY', get(user('x'), '/orders/o1'), order),
  T('seller reads order with own items', 'ALLOW', get(seller('s1'), '/orders/o1'), order),
  T('other seller reads order', 'DENY', get(seller('s2'), '/orders/o1'), order),
  T('buyer creates order client-side', 'DENY', write('create', user('b1'), '/orders/o2', { ...order, status: 'paid' })),
  T('seller ships with tracking', 'ALLOW', write('update', seller('s1'), '/orders/o1', { ...order, status: 'shipped', trackingNumber: 'T1', carrier: 'PTT' }), { ...order, status: 'paid' }),
  T('seller edits order total', 'DENY', write('update', seller('s1'), '/orders/o1', { ...order, total: 1 }), order),
  T('seller marks refunded', 'DENY', write('update', seller('s1'), '/orders/o1', { ...order, status: 'refunded' }), order),
  T('buyer confirms delivery', 'ALLOW', write('update', user('b1'), '/orders/o1', { ...order, status: 'delivered' }), order),
  T('buyer marks own order paid', 'DENY', write('update', user('b1'), '/orders/o1', { ...order, status: 'paid' }), { ...order, status: 'pending' }),

  T('notify another user', 'ALLOW', write('create', user('a'), '/notifications/n1', { userId: 'b', type: 'order_status', title: 't', message: 'm', link: null, read: false, createdAt: 'x' })),
  T('notification with extra field', 'DENY', write('create', user('a'), '/notifications/n1', { userId: 'b', type: 't', title: 't', message: 'm', read: false, createdAt: 'x', admin: true })),
  T('read someone else notification', 'DENY', get(user('a'), '/notifications/n1'), { userId: 'b' }),
  T('mark own notification read', 'ALLOW', write('update', user('b'), '/notifications/n1', { userId: 'b', title: 't', read: true }), { userId: 'b', title: 't', read: false }),
  T('rewrite own notification title', 'DENY', write('update', user('b'), '/notifications/n1', { userId: 'b', title: 'x', read: false }), { userId: 'b', title: 't', read: false }),

  T('buyer reads a coupon', 'DENY', get(user('b1'), '/coupons/c1'), { sellerId: 's1', code: 'X' }),
  T('seller reads own coupon', 'ALLOW', get(seller('s1'), '/coupons/c1'), { sellerId: 's1', code: 'X' }),
  T('seller creates coupon for other seller', 'DENY', write('create', seller('s1'), '/coupons/c2', { sellerId: 's2' })),

  T('own price alert', 'ALLOW', write('create', user('u1'), '/priceAlerts/u1_p1', { userId: 'u1', productId: 'p1' })),
  T('price alert under other uid id', 'DENY', write('create', user('u1'), '/priceAlerts/u2_p1', { userId: 'u1', productId: 'p1' })),
  T('own stock alert list', 'ALLOW', get(user('u1'), '/stockAlerts/u1_p1'), { userId: 'u1' }),

  T('support ticket open', 'ALLOW', write('create', user('u1'), '/support_tickets/t1', { userId: 'u1', status: 'open' })),
  T('support reply', 'ALLOW', write('update', user('u1'), '/support_tickets/t1', { userId: 'u1', status: 'open', messages: [1, 2] }), { userId: 'u1', status: 'open', messages: [1] }),
  T('buyer closes ticket status', 'DENY', write('update', user('u1'), '/support_tickets/t1', { userId: 'u1', status: 'closed' }), { userId: 'u1', status: 'open' }),

  T('warehouse stock for own warehouse', 'ALLOW', write('create', seller('s1'), '/warehouseStock/w1_p1', { sellerId: 's1', warehouseId: 'w1', productId: 'p1', quantity: 3 }), null, warehouseMock),
  T('warehouse stock read by other seller', 'DENY', get(seller('s2'), '/warehouseStock/w1_p1'), { sellerId: 's1' }),
  T('stock movement read own', 'ALLOW', get(seller('s1'), '/stockMovements/m1'), { sellerId: 's1' }),

  T('api key revoke', 'ALLOW', write('update', seller('s1'), '/apiKeys/k1', { sellerId: 's1', isActive: false }), { sellerId: 's1', isActive: true }),
  T('api key re-activate', 'DENY', write('update', seller('s1'), '/apiKeys/k1', { sellerId: 's1', isActive: true }), { sellerId: 's1', isActive: false }),
  T('integration keys read by other seller', 'DENY', get(seller('s2'), '/sellerIntegrations/i1'), { sellerId: 's1', apiKey: 'x' }),
  T('invoice create own', 'ALLOW', write('create', seller('s1'), '/invoices/i1', { sellerId: 's1' })),

  T('returns created client-side', 'DENY', write('create', user('b1'), '/returns/r1', { buyerId: 'b1', sellerId: 's1' })),
  T('certificate public verify', 'ALLOW', get(null, '/productCertificates/c1'), { sellerId: 's1' }),
  T('seller tiers read signed-in', 'ALLOW', get(user('u1'), '/sellerTiers/gold'), { rate: 1 }),
  T('paymentClaims read by buyer', 'DENY', get(user('b1'), '/paymentClaims/pi_1'), { uid: 'b1' }),
  T('seller saves own feed config', 'ALLOW', write('create', seller('s1'), '/sellers/s1/feedConfigs/f1', { url: 'https://x' })),
  T('seller writes other seller import job', 'DENY', write('create', seller('s1'), '/sellers/s2/importJobs/j1', { status: 'queued' })),
  T('seller writes other subcollection', 'DENY', write('create', seller('s1'), '/sellers/s1/payouts/p1', { amount: 1 })),
  T('guest subscribes newsletter', 'ALLOW', write('create', anon('g1'), '/newsletterSubscribers/a@b.com', { email: 'a@b.com', source: 'footer', createdAt: 'x' })),
  T('newsletter email mismatch', 'DENY', write('create', anon('g1'), '/newsletterSubscribers/a@b.com', { email: 'c@d.com', source: 'footer', createdAt: 'x' })),
  T('newsletter list read', 'DENY', get(user('u1'), '/newsletterSubscribers/a@b.com'), { email: 'a@b.com' }),

  T('price history public read', 'ALLOW', get(null, '/price_history/h1'), { productId: 'p1', price: 10 }),
  T('buyer writes price history', 'DENY', write('create', user('b1'), '/price_history/h1', { productId: 'p1', price: 1, recordedAt: 'x' })),
  T('seller writes own product price history', 'ALLOW', priceWrite(seller('s1'), { productId: 'p1', price: 10, recordedAt: NOW }), null, productOfS1),
  T('competitor writes fake price history', 'DENY', priceWrite(seller('s2'), { productId: 'p1', price: 1, recordedAt: NOW }), null, productOfS1),
  T('price history with backdated time', 'DENY', priceWrite(seller('s1'), { productId: 'p1', price: 10, recordedAt: '2020-01-01T00:00:00Z' }), null, productOfS1),
  T('price history extra field', 'DENY', priceWrite(seller('s1'), { productId: 'p1', price: 10, recordedAt: NOW, note: 'y' }), null, productOfS1),
  T('price history non-number price', 'DENY', priceWrite(seller('s1'), { productId: 'p1', price: '10', recordedAt: NOW }), null, productOfS1),
];

const res = await fetch(
  'https://firebaserules.googleapis.com/v1/projects/market-ecommerce-app:test',
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-goog-user-project': 'market-ecommerce-app' },
    body: JSON.stringify({
      source: { files: [{ name: 'firestore.rules', content: readFileSync(rulesPath, 'utf8') }] },
      testSuite: { testCases: cases.map((c) => c.tc) },
    }),
  },
);
const body = await res.json();
if (!res.ok) {
  console.log('HTTP', res.status, JSON.stringify(body).slice(0, 2000));
  process.exit(1);
}
if (body.issues?.length) console.log('ISSUES', JSON.stringify(body.issues, null, 1).slice(0, 3000));
let fail = 0;
(body.testResults || []).forEach((r, i) => {
  const ok = r.state === 'SUCCESS';
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${cases[i].name}${ok ? '' : '  ' + JSON.stringify(r.debugMessages || r.errorPosition || '')}`);
});
console.log(`\n${cases.length - fail}/${cases.length} passed`);
process.exit(fail ? 1 : 0);
