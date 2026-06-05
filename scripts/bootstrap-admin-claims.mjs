/**
 * Bootstrap Admin Claims — one-time script
 *
 * Sets role=admin + adminRole=super-admin custom claims for the owner.
 * Run: npx tsx scripts/bootstrap-admin-claims.mjs <UID>
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_B64 env var in .env file.
 *
 * This is needed because Firestore rules isAdmin() reads from
 * custom claims (request.auth.token.role), not the Firestore profile.
 * Without custom claims, all admin Firestore operations are denied.
 */

import { adminAuth } from '../src/lib/firebase-admin.ts';

async function main() {
  const uid = process.argv[2];

  if (!uid) {
    console.error('Usage: node scripts/bootstrap-admin-claims.mjs <USER_UID>');
    console.error('');
    console.error('Find your UID: Firebase Console → Authentication → Users → copy User UID');
    console.error('Or check the browser console: auth.currentUser.uid');
    process.exit(1);
  }

  if (!adminAuth) {
    console.error('ERROR: Firebase Admin Auth not configured.');
    console.error('Check GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT env vars.');
    process.exit(1);
  }

  try {
    const user = await adminAuth.getUser(uid);
    console.log(`Found user: ${user.email} (${user.uid})`);

    await adminAuth.setCustomUserClaims(uid, {
      role: 'admin',
      adminRole: 'super-admin',
    });

    console.log('✅ Custom claims set: role=admin, adminRole=super-admin');
    console.log('');
    console.log('IMPORTANT: The user must sign out and sign back in for claims to take effect.');
    console.log('Firebase ID tokens are cached — new claims only appear in fresh tokens.');
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

main();
