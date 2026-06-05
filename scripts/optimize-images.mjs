/**
 * optimize-images.mjs — Static image audit for WebP conversion.
 *
 * Scans public/ and src/assets/ for images (.png, .jpg, .jpeg).
 * Flags any >50KB that lack a corresponding .webp sibling.
 * Prints a human-readable report with estimated savings.
 *
 * Usage: node scripts/optimize-images.mjs
 * Exit code: 0 (informational — does not fail builds)
 *
 * No new npm dependencies — uses Node.js built-ins only (fs, path).
 *
 * To convert flagged images to WebP one-time:
 *   1. Install cwebp: https://developers.google.com/speed/webp/download
 *   2. Run: cwebp -q 80 input.png -o output.webp
 *   3. Or use an online converter: https://squoosh.app
 */

import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const SCAN_DIRS = ['public', 'src/assets'];
const IMAGE_EXTENSIONS = /\.(png|jpe?g)$/i;
const SIZE_THRESHOLD_KB = 50; // Only flag images larger than this

/**
 * Recursively collect image files from a directory.
 */
function scanImages(dir) {
  /** @type {Array<{path: string, sizeKB: number, ext: string}>} */
  const results = [];
  const absDir = join(PROJECT_ROOT, dir);

  if (!existsSync(absDir)) {
    console.warn(`  [skip] Directory not found: ${absDir}`);
    return results;
  }

  const queue = [absDir];
  while (queue.length > 0) {
    const current = queue.pop();
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else if (entry.isFile() && IMAGE_EXTENSIONS.test(entry.name)) {
        const stat = statSync(fullPath);
        results.push({
          path: fullPath,
          relPath: fullPath.replace(PROJECT_ROOT + '/', '').replace(/\\/g, '/'),
          sizeKB: Math.round((stat.size / 1024) * 10) / 10,
          ext: extname(entry.name).toLowerCase(),
        });
      }
    }
  }

  return results;
}

/**
 * Check if a WebP sibling exists for a given image file.
 */
function hasWebpSibling(imagePath) {
  const dir = dirname(imagePath);
  const name = basename(imagePath, extname(imagePath));
  return existsSync(join(dir, name + '.webp'));
}

/**
 * Estimate WebP savings. Real-world WebP is typically 25-35% smaller
 * than PNG and 15-25% smaller than JPEG at equivalent quality.
 */
function estimateWebpSavings(sizeKB, ext) {
  const factor = ext === '.png' ? 0.65 : 0.75; // conservative
  return Math.round(sizeKB * factor * 10) / 10;
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log('');
console.log('╔══════════════════════════════════════════════╗');
console.log('║  Image Optimization Audit — WebP Gap Report  ║');
console.log('╚══════════════════════════════════════════════╝');
console.log('');

let totalImages = 0;
let flaggedCount = 0;
let totalWastedKB = 0;
const flagged = [];

for (const dir of SCAN_DIRS) {
  console.log(`📁 ${dir}/`);
  const images = scanImages(dir);

  if (images.length === 0) {
    console.log('   (no raster images found)');
    console.log('');
    continue;
  }

  // Show all images with sizes
  for (const img of images) {
    totalImages++;
    const webpOk = hasWebpSibling(img.path);
    const status = webpOk ? '✅' : img.sizeKB >= SIZE_THRESHOLD_KB ? '⚠️ ' : '  ';
    const savings = estimateWebpSavings(img.sizeKB, img.ext);
    const info = webpOk
      ? 'has .webp'
      : img.sizeKB >= SIZE_THRESHOLD_KB
        ? `~${savings}KB savings possible with WebP`
        : 'under threshold';

    console.log(`   ${status} ${img.sizeKB.toString().padStart(6)} KB  ${img.relPath}  (${info})`);

    if (!webpOk && img.sizeKB >= SIZE_THRESHOLD_KB) {
      flaggedCount++;
      totalWastedKB += savings;
      flagged.push({ ...img, savings });
    }
  }

  console.log('');
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('──────────────────────────────────────────────');
console.log(`Total raster images scanned: ${totalImages}`);
console.log(`Flagged (>${SIZE_THRESHOLD_KB}KB, no .webp): ${flaggedCount}`);
console.log(`Estimated savings if converted: ~${Math.round(totalWastedKB)} KB`);
console.log('');

if (flagged.length > 0) {
  console.log('🔧 To convert flagged images:');
  console.log('');
  console.log('   Option A — cwebp CLI (free, Google):');
  console.log('     # Install from https://developers.google.com/speed/webp/download');
  for (const img of flagged) {
    const out = img.path.replace(img.ext, '.webp');
    const outRel = out.replace(PROJECT_ROOT + '/', '').replace(/\\/g, '/');
    console.log(`     cwebp -q 80 "${img.relPath}" -o "${outRel}"`);
  }
  console.log('');
  console.log('   Option B — squoosh.app (browser-based, free):');
  console.log('     https://squoosh.app — upload each image, convert to WebP at q=80');
  console.log('');
  console.log('   After converting, reference .webp in <picture> tags or serve');
  console.log('   them when Accept: image/webp is present in the request header.');
  console.log('');
} else {
  console.log('✅ All images above threshold have WebP variants. Nothing to do.');
  console.log('');
}

console.log('💡 Tip: Firebase Image Processing extension can auto-generate');
console.log('   WebP + resized variants on upload for dynamic product images.');
console.log('   See docs/image-optimization.md for setup instructions.');
console.log('');
