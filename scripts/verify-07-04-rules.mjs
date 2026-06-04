// Verifies the 07-04 Q&A trust guarantee not covered by unit tests:
//   firestore.rules restricts productQuestions answer-writes to the product's
//   seller (request.auth.token.sellerId == resource.data.sellerId) or admin.
// Exits non-zero (failing the task's <verify>) if the rule is missing.

import { readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const rules = readFileSync(new URL('firestore.rules', root), 'utf8');

const failures = [];

const block = rules.match(/match\s+\/productQuestions\/\{[^}]*\}\s*\{([\s\S]*?)\n\s{4}\}/);
if (!block) {
  failures.push('firestore.rules: no `match /productQuestions/{...}` block found');
} else {
  const body = block[1];
  if (!/request\.auth\.token\.sellerId\s*==\s*resource\.data\.sellerId/.test(body)) {
    failures.push(
      'firestore.rules: productQuestions update must require request.auth.token.sellerId == resource.data.sellerId',
    );
  }
  if (!/allow\s+create:\s*if\s+isFullUser\(\)/.test(body)) {
    failures.push('firestore.rules: productQuestions create should require isFullUser()');
  }
}

if (failures.length > 0) {
  console.error('verify-07-04-rules FAILED:');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}

console.log('verify-07-04-rules OK: productQuestions seller-scoped answer rule present');
