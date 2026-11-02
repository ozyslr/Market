/**
 * Backfill Seller Claims — one-time script
 *
 * Before quick task 261102-ra8, approving a seller never set the Firebase
 * custom claims that firestore.rules check ({ role: 'seller', sellerId: uid }),
 * so already-approved sellers still cannot create or edit products.
 *
 * This finds every approved seller — sellerApplications.status == 'approved'
 * OR sellers.kycStatus == 'verified' — and runs the same grantSellerAccess()
 * the server now uses on approval. Admins are never downgraded.
 *
 * Run (dry run, prints what would change):
 *   npx tsx scripts/backfill-seller-claims.mjs
 * Apply:
 *   npx tsx scripts/backfill-seller-claims.mjs --apply
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_B64 (or GOOGLE_APPLICATION_CREDENTIALS) in .env.
 * Affected sellers pick up the new claims on next page load (AuthContext
 * force-refreshes the token when profile role and token role disagree).
 */

import { adminAuth, adminDb } from '../src/lib/firebase-admin.ts';
import { grantSellerAccess } from '../server/lib/sellerAccess.ts';

const APPLY = process.argv.includes('--apply');

async function main() {
  if (!adminAuth || !adminDb) {
    console.error('ERROR: Firebase Admin not configured (check service account env vars).');
    process.exit(1);
  }

  const uids = new Set();
  const apps = await adminDb.collection('sellerApplications').where('status', '==', 'approved').get();
  apps.forEach((d) => d.data().userId && uids.add(d.data().userId));
  const verified = await adminDb.collection('sellers').where('kycStatus', '==', 'verified').get();
  verified.forEach((d) => uids.add(d.data().userId ?? d.id));

  console.log(`Found ${uids.size} approved seller(s). Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);

  let changed = 0;
  let skipped = 0;
  let failed = 0;
  for (const uid of uids) {
    try {
      const user = await adminAuth.getUser(uid);
      const claims = user.customClaims ?? {};
      if (claims.role === 'admin') {
        console.log(`  skip  ${uid} (${user.email ?? '-'}) — admin`);
        skipped++;
        continue;
      }
      if (claims.role === 'seller' && claims.sellerId === uid) {
        console.log(`  ok    ${uid} (${user.email ?? '-'}) — already has seller claims`);
        skipped++;
        continue;
      }
      console.log(
        `  ${APPLY ? 'set ' : 'would'} ${uid} (${user.email ?? '-'}) — current role=${claims.role ?? 'none'}`,
      );
      if (APPLY) await grantSellerAccess(adminAuth, adminDb, uid);
      changed++;
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        // Seed/mock sellers (u2, u_bot_1, …) have Firestore docs but no Auth account.
        console.log(`  skip  ${uid} — no Auth user (seed data)`);
        skipped++;
        continue;
      }
      console.error(`  FAIL  ${uid}: ${err.message}`);
      failed++;
    }
  }

  console.log(
    `\n${APPLY ? 'Updated' : 'Would update'}: ${changed}  Skipped: ${skipped}  Failed: ${failed}`,
  );
  if (!APPLY && changed > 0) console.log('Re-run with --apply to write the changes.');
  process.exit(failed > 0 ? 1 : 0);
}

main();
