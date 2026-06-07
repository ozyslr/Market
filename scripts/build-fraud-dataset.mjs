// ─── Fraud Dataset Builder ────────────────────────────────────────────────
// Exports Firestore fraud events + product data as JSON for ML training.
// Usage: node scripts/build-fraud-dataset.mjs [--output fraud-dataset.json]

async function main() {
  const { adminDb } = await import('../src/lib/firebase-admin.js');
  const fs = await import('fs');

  console.log('Building fraud detection dataset...\n');

  // 1. Fetch fraud flags
  console.log('Fetching fraud flags...');
  const flagsSnap = await adminDb.collection('fraudFlags').get();
  const fraudFlags = flagsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // 2. Fetch products
  console.log('Fetching products...');
  const productsSnap = await adminDb.collection('products').get();
  const products = productsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // 3. Fetch sellers
  console.log('Fetching sellers...');
  const sellersSnap = await adminDb.collection('sellers').get();
  const sellers = sellersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // 4. Build labeled dataset
  const dataset = [];
  const flaggedProductIds = new Set(fraudFlags.map((f) => f.productId));

  for (const product of products) {
    const seller = sellers.find((s) => s.id === product.storeId);
    const isFraud = flaggedProductIds.has(product.id);

    dataset.push({
      product_id: product.id,
      label: isFraud ? 1 : 0,
      features: {
        price: product.price || 0,
        old_price: product.oldPrice || product.price,
        discount_percent: product.oldPrice ? (product.oldPrice - product.price) / product.oldPrice : 0,
        description_length: (product.description || '').length,
        image_count: (product.images || []).length,
        category_id: product.categoryId || '',
        seller_age_days: seller ? (Date.now() / 1000 - (seller.createdAt?._seconds || 0)) / 86400 : 0,
        seller_product_count: seller ? (seller.productCount || 0) : 0,
        title_length: (product.title || '').length,
        has_brand: !!(product.brand),
        has_tags: (product.tags || []).length > 0,
        in_stock: (product.stock || 0) > 0,
      },
    });
  }

  const outputFile = process.argv[2] === '--output'
    ? process.argv[3]
    : 'fraud-dataset.json';

  fs.writeFileSync(outputFile, JSON.stringify(dataset, null, 2));
  console.log(`\n✅ Dataset built: ${dataset.length} samples`);
  console.log(`   Fraud: ${dataset.filter((d) => d.label === 1).length}`);
  console.log(`   Legit: ${dataset.filter((d) => d.label === 0).length}`);
  console.log(`   Output: ${outputFile}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
