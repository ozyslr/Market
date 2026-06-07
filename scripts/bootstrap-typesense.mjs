// ─── Typesense Bootstrap Script ───────────────────────────────────────────────
// Usage: node scripts/bootstrap-typesense.mjs
// Reads all products from Firestore and indexes them into Typesense.
// Requires: TYPESENSE_HOST, TYPESENSE_API_KEY, TYPESENSE_PROTOCOL env vars.

async function main() {
  const { adminDb } = await import('../src/lib/firebase-admin.js');
  const { upsertProduct, deleteAllProducts, initializeCollections, getIndexStatus } =
    await import('../src/services/typesenseService.js');

  console.log('Initializing Typesense collections...');
  await initializeCollections();
  console.log('Collections ready.\n');

  console.log('Fetching products from Firestore...');
  let count = 0;
  let lastDoc = null;
  const BATCH_SIZE = 500;
  const startedAt = Date.now();

  while (true) {
    let query = adminDb.collection('products').orderBy('__name__').limit(BATCH_SIZE);
    if (lastDoc) query = query.startAfter(lastDoc);
    const snapshot = await query.get();

    if (snapshot.empty) break;

    const batch = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      batch.push({
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        price: data.price || 0,
        categoryId: data.categoryId || '',
        brand: data.brand || '',
        rating: data.rating || 0,
        imageUrl: data.images?.[0] || data.imageUrl || '',
        storeId: data.storeId || '',
        language: data.language || 'tr',
        tags: data.tags || [],
        createdAt: data.createdAt?._seconds || Math.floor(Date.now() / 1000),
      });
    }

    await Promise.all(batch.map((p) => upsertProduct(p)));
    count += batch.length;
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`  Indexed ${count} products... (${elapsed}s)`);
  }

  const duration = ((Date.now() - startedAt) / 60_000).toFixed(2);
  console.log(`\n✅ Bootstrap complete: ${count} products indexed in ${duration} minutes`);

  const status = await getIndexStatus();
  console.log('Index status:', JSON.stringify(status.counts, null, 2));
}

main().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
