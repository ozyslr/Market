// Bundle budget CI check — enforces per-chunk gzip size budgets.
// Runs after `npm run build`. Reads dist/assets/*.js, gzips each,
// checks against budget tiers, exits 0 (pass) or 1 (fail).
//
// Budgets (gzip bytes):
//   Vendor chunks  (vendor-*)  ≤ 250 KB
//   Main entry     (index-*)   ≤ 350 KB
//   Lazy routes    (other)     ≤ 500 KB

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const assetsDir = join(root, 'dist', 'assets');

// --- helpers ---

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function classify(file) {
  if (file.startsWith('vendor-')) return 'vendor';
  if (file.startsWith('index-')) return 'entry';
  return 'route';
}

function budgetFor(category) {
  switch (category) {
    case 'vendor': return 250 * 1024;  // 250 KB
    case 'entry':  return 350 * 1024;  // 350 KB
    case 'route':  return 500 * 1024;  // 500 KB
    default:       return 500 * 1024;
  }
}

// --- main ---

if (!statSync(assetsDir, { throwIfNoEntry: false })?.isDirectory()) {
  console.error('ERROR: dist/assets/ not found. Run `npm run build` first.');
  process.exit(2);
}

const jsFiles = readdirSync(assetsDir).filter(f => f.endsWith('.js'));

if (jsFiles.length === 0) {
  console.error('ERROR: No .js files found in dist/assets/.');
  process.exit(2);
}

const violations = [];
const results = [];

for (const file of jsFiles.sort()) {
  const filePath = join(assetsDir, file);
  const raw = statSync(filePath).size;
  const gzip = gzipSync(readFileSync(filePath)).length;
  const category = classify(file);
  const budget = budgetFor(category);
  const pct = ((gzip / budget) * 100).toFixed(1);

  results.push({ file, raw, gzip, category, budget, pct });

  if (gzip > budget) {
    violations.push(
      `  ${file}  gzip=${humanSize(gzip)}  budget=${humanSize(budget)}  (${pct}%)  [${category}]`,
    );
  }
}

// Print summary table
console.log('\nBundle Budget Check');
console.log('='.repeat(80));
console.log(
  'File'.padEnd(48) +
  'Raw'.padStart(12) +
  'Gzip'.padStart(12) +
  'Budget'.padStart(10) +
  '%'.padStart(7) +
  '  Category',
);
console.log('-'.repeat(80));

for (const r of results) {
  const flag = r.gzip > r.budget ? ' FAIL' : '     ';
  console.log(
    `${flag} ${r.file.padEnd(43)}` +
    `${humanSize(r.raw).padStart(12)}` +
    `${humanSize(r.gzip).padStart(12)}` +
    `${humanSize(r.budget).padStart(10)}` +
    `${r.pct.padStart(6)}%` +
    `  ${r.category}`,
  );
}

console.log('='.repeat(80));

if (violations.length > 0) {
  console.log(`\n${violations.length} chunk(s) exceed budget:\n`);
  for (const v of violations) console.log(v);
  console.log('');
  process.exit(1);
}

console.log(`\n${results.length} chunks checked. Bundle budget OK.\n`);
process.exit(0);
