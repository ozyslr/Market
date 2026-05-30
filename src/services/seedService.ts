import { writeBatch, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MOCK_PRODUCTS, MOCK_SELLERS, CATEGORIES } from '../mockData';

export async function seedMarketplace() {
  const batch = writeBatch(db);

  try {
    // Seed Categories
    CATEGORIES.forEach(cat => {
      const catRef = doc(db, 'categories', cat.id);
      batch.set(catRef, cat);
    });

    // Seed Sellers
    MOCK_SELLERS.forEach(seller => {
      const sellerRef = doc(db, 'sellers', seller.id);
      batch.set(sellerRef, seller);
    });

    // Seed Products
    MOCK_PRODUCTS.forEach(product => {
      const prodRef = doc(db, 'products', product.id);
      batch.set(prodRef, product);
    });

    await batch.commit();
    return { success: true, message: 'Marketplace seeded successfully with multi-vendor data.' };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch-seed');
    throw error;
  }
}
