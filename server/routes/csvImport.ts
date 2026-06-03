// ─── CSV bulk import / export routes (SEL-05) ─────────────────────────────────
// POST /api/products/csv-import  — multipart CSV, per-row Zod + category validation,
//   SSRF-safe server-side image fetch to Firebase Storage, partial import (D-07/D-08/D-09).
// GET  /api/products/csv-export  — seller's products as UTF-8 BOM CSV.
import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import Papa from 'papaparse';
import { z } from 'zod';
import { logger } from '../logger.js';

export interface CsvImportRouteDeps {
  adminDb: Firestore | null;
  verifyFirebaseToken?: (req: any, res: any, next: any) => void;
}

// ─── csvRowSchema (Plan 03-03 — defined here; not yet present in schemas.ts) ──
const csvRowSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(200),
  price: z.coerce.number().finite().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
  category: z.string().trim().min(1, 'category is required'),
  image_url: z.string().trim().min(1, 'at least 1 image_url is required'),
  description: z.string().max(5000).optional(),
  brand: z.string().optional(),
});

interface RowError {
  row: number;
  field: string;
  reason: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const FIRESTORE_BATCH_LIMIT = 500;
// SSRF: block localhost, loopback, RFC1918 private ranges, AWS IMDS link-local.
const SSRF_BLOCK = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.)/i;

/**
 * Fetch an external image URL and persist it to Firebase Storage.
 * SSRF-hardened: scheme + private-IP + content-type + size guards (T-03-12/T-03-13).
 * Returns the storage path on success; throws with a human-readable reason on failure.
 */
async function fetchImageToStorage(imageUrl: string, destPath: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    throw new Error(`Invalid image URL: "${imageUrl}"`);
  }

  const isProd = process.env.NODE_ENV === 'production';
  if (url.protocol !== 'https:' && (isProd || url.protocol !== 'http:')) {
    throw new Error('HTTPS required for image URLs');
  }
  if (SSRF_BLOCK.test(url.hostname)) {
    throw new Error('Private URLs not allowed');
  }

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    throw new Error(`Image fetch failed (HTTP ${response.status})`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`URL did not return an image (content-type: ${contentType || 'unknown'})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
    throw new Error('Image exceeds 5 MB limit');
  }

  const bucket = getStorage().bucket();
  await bucket.file(destPath).save(Buffer.from(arrayBuffer), { contentType });
  return destPath;
}

/** Read a multipart/form-data request body and return the first file field as a Buffer. */
function readMultipartFile(req: any): Promise<{ buffer: Buffer; size: number }> {
  return new Promise((resolve, reject) => {
    const contentType: string = req.headers['content-type'] || '';
    const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
    if (!match) {
      reject(new Error('Missing multipart boundary'));
      return;
    }
    const boundary = match[1] || match[2];
    const chunks: Buffer[] = [];
    let total = 0;
    let aborted = false;

    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_FILE_SIZE && !aborted) {
        aborted = true;
        reject(new Error('FILE_TOO_LARGE'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('error', reject);
    req.on('end', () => {
      if (aborted) return;
      try {
        const raw = Buffer.concat(chunks);
        const delimiter = Buffer.from(`--${boundary}`);
        const parts = splitBuffer(raw, delimiter);
        for (const part of parts) {
          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd === -1) continue;
          const header = part.slice(0, headerEnd).toString('utf-8');
          if (!/filename=/i.test(header)) continue;
          // Body is between the blank line and the trailing CRLF before the next boundary.
          let body = part.slice(headerEnd + 4);
          if (
            body.length >= 2 &&
            body[body.length - 2] === 0x0d &&
            body[body.length - 1] === 0x0a
          ) {
            body = body.slice(0, body.length - 2);
          }
          resolve({ buffer: body, size: body.length });
          return;
        }
        reject(new Error('No file field found in upload'));
      } catch (err) {
        reject(err as Error);
      }
    });
  });
}

function splitBuffer(buf: Buffer, delimiter: Buffer): Buffer[] {
  const out: Buffer[] = [];
  let start = 0;
  let idx = buf.indexOf(delimiter, start);
  while (idx !== -1) {
    if (idx > start) out.push(buf.slice(start, idx));
    start = idx + delimiter.length;
    idx = buf.indexOf(delimiter, start);
  }
  if (start < buf.length) out.push(buf.slice(start));
  return out;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 80);
}

export function registerCsvImportRoutes(app: Express, deps: CsvImportRouteDeps) {
  const { adminDb, verifyFirebaseToken } = deps;
  const guards = verifyFirebaseToken ? [verifyFirebaseToken] : [];

  // ─── POST /api/products/csv-import ──────────────────────────────────────────
  app.post('/api/products/csv-import', ...guards, async (req: any, res: any) => {
    try {
      if (!adminDb) {
        return res.status(503).json({ error: 'Database not configured' });
      }
      const sellerId: string = req.uid;
      if (!sellerId) {
        return res.status(401).json({ error: 'Unauthenticated' });
      }

      // 1-2. Read + size guard.
      let file: { buffer: Buffer; size: number };
      try {
        file = await readMultipartFile(req);
      } catch (err: any) {
        if (err?.message === 'FILE_TOO_LARGE') {
          return res.status(400).json({ error: 'CSV exceeds 10 MB limit' });
        }
        return res.status(400).json({ error: err?.message || 'Invalid upload' });
      }
      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ error: 'CSV exceeds 10 MB limit' });
      }

      const csvString = file.buffer.toString('utf-8').replace(/^\uFEFF/, '');

      // 3. Build platform category set once (D-09 / T-03-14).
      const platformCategorySet = new Set<string>();
      const catSnap = await adminDb.collection('categories').get();
      catSnap.forEach((doc) => {
        const data = doc.data() as Record<string, any>;
        platformCategorySet.add(doc.id.toLowerCase());
        if (typeof data.slug === 'string') platformCategorySet.add(data.slug.toLowerCase());
        if (typeof data.name === 'string') platformCategorySet.add(data.name.toLowerCase());
      });

      // 4. Parse.
      const parsed = Papa.parse<Record<string, string>>(csvString, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
      });

      const errors: RowError[] = [];
      const validRows: Record<string, any>[] = [];

      for (let i = 0; i < parsed.data.length; i++) {
        const rowNum = i + 2; // +1 for header, +1 for 1-based
        const raw = parsed.data[i];

        // 5. Per-row Zod validation.
        const result = csvRowSchema.safeParse(raw);
        if (!result.success) {
          for (const issue of result.error.issues) {
            errors.push({
              row: rowNum,
              field: issue.path.join('.') || '(row)',
              reason: issue.message,
            });
          }
          continue;
        }

        // 6. Category taxonomy check (D-09).
        const categoryValue = result.data.category;
        if (!platformCategorySet.has(categoryValue.toLowerCase())) {
          errors.push({
            row: rowNum,
            field: 'category',
            reason: `Unknown category: "${categoryValue}"`,
          });
          continue;
        }

        // 7. Image fetch (D-08) — pipe-separated, take first 5, min 1 success.
        const imageUrls = result.data.image_url
          .split('|')
          .map((u) => u.trim())
          .filter(Boolean)
          .slice(0, 5);

        const storedImages: string[] = [];
        let lastImageError = 'No valid image_url provided';
        for (let j = 0; j < imageUrls.length; j++) {
          const ext = (imageUrls[j].split('.').pop() || 'jpg').split(/[?#]/)[0].slice(0, 5);
          const destPath = `products/${sellerId}/${Date.now()}-${rowNum}-${j}.${ext}`;
          try {
            storedImages.push(await fetchImageToStorage(imageUrls[j], destPath));
          } catch (imgErr: any) {
            lastImageError = imgErr?.message || 'Image fetch failed';
          }
        }
        if (storedImages.length === 0) {
          errors.push({ row: rowNum, field: 'image_url', reason: lastImageError });
          continue;
        }

        // 8. Collect valid product (sellerId from token, never CSV — T-03-16).
        validRows.push({
          title: result.data.title,
          slug: slugify(result.data.title),
          price: result.data.price,
          stock: result.data.stock,
          categoryId: categoryValue,
          images: storedImages,
          description: result.data.description ?? '',
          brand: result.data.brand ?? '',
          sellerId,
          status: 'pending',
          rating: 0,
          reviewsCount: 0,
          createdAt: new Date().toISOString(),
        });
      }

      // 8b. Firestore batch writes (chunks of 500).
      for (let i = 0; i < validRows.length; i += FIRESTORE_BATCH_LIMIT) {
        const batch = adminDb.batch();
        for (const product of validRows.slice(i, i + FIRESTORE_BATCH_LIMIT)) {
          batch.set(adminDb.collection('products').doc(), product);
        }
        await batch.commit();
      }

      logger.info('csv-import', 'Import complete', {
        sellerId,
        imported: validRows.length,
        skipped: errors.length,
      });

      // 9. Respond.
      return res.json({ imported: validRows.length, skipped: errors.length, errors });
    } catch (err: any) {
      logger.error('csv-import', 'Import failed', { error: err?.message });
      return res.status(500).json({ error: err?.message || 'CSV import failed' });
    }
  });

  // ─── GET /api/products/csv-export ───────────────────────────────────────────
  app.get('/api/products/csv-export', ...guards, async (req: any, res: any) => {
    try {
      if (!adminDb) {
        return res.status(503).json({ error: 'Database not configured' });
      }
      const sellerId: string = req.uid;
      if (!sellerId) {
        return res.status(401).json({ error: 'Unauthenticated' });
      }

      // T-03-15: scope strictly to the authenticated seller's products.
      const snap = await adminDb.collection('products').where('sellerId', '==', sellerId).get();
      const rows = snap.docs.map((doc) => {
        const d = doc.data() as Record<string, any>;
        return {
          title: d.title ?? '',
          price: d.price ?? '',
          stock: d.stock ?? '',
          category: d.categoryId ?? d.category ?? '',
          image_url: Array.isArray(d.images) ? d.images.join('|') : '',
          description: d.description ?? '',
          brand: d.brand ?? '',
        };
      });

      const csv = Papa.unparse(rows, {
        header: true,
        columns: ['title', 'price', 'stock', 'category', 'image_url', 'description', 'brand'],
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="products-export.csv"');
      return res.send('\uFEFF' + csv); // BOM for Excel
    } catch (err: any) {
      logger.error('csv-export', 'Export failed', { error: err?.message });
      return res.status(500).json({ error: err?.message || 'CSV export failed' });
    }
  });
}
