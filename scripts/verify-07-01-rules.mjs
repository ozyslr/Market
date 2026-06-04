// Verifies the 07-01 trust guarantees that are not covered by unit tests:
//   1. firestore.rules makes the `reviews` collection server-write-only
//      (client create denied) — the core REV-01 security fix.
//   2. ReviewCard renders the "Doğrulanmış Alıcı" verified-buyer badge.
// Exits non-zero (failing the task's <verify>) if either guarantee is missing.

import { readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const rules = readFileSync(new URL('firestore.rules', root), 'utf8');
const reviewCard = readFileSync(
  new URL('src/components/product/ReviewCard.tsx', root),
  'utf8',
);

const failures = [];

// 1. reviews block exists and denies client create.
const reviewsBlock = rules.match(/match\s+\/reviews\/\{[^}]*\}\s*\{([\s\S]*?)\n\s{4}\}/);
if (!reviewsBlock) {
  failures.push('firestore.rules: no `match /reviews/{...}` block found');
} else if (!/allow\s+create:\s*if\s+false/.test(reviewsBlock[1])) {
  failures.push('firestore.rules: reviews block must contain `allow create: if false`');
}

// 2. Verified-buyer badge string, gated on review.verified.
if (!reviewCard.includes('Doğrulanmış Alıcı')) {
  failures.push('ReviewCard.tsx: missing literal "Doğrulanmış Alıcı" badge');
}
if (!/review\.verified/.test(reviewCard)) {
  failures.push('ReviewCard.tsx: badge is not gated on review.verified');
}

if (failures.length > 0) {
  console.error('verify-07-01-rules FAILED:');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}

console.log('verify-07-01-rules OK: reviews create-deny rule + verified badge present');
