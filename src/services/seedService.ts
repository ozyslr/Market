import { writeBatch, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MOCK_PRODUCTS, MOCK_SELLERS, CATEGORIES } from '../mockData';
import { DEFAULT_SECTIONS } from './cmsService';
import { Coupon } from '../types';

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

    // Seed Homepage Sections
    DEFAULT_SECTIONS.forEach(section => {
      batch.set(doc(db, 'homepage_sections', section.id), section);
    });

    // Seed Demo Coupons
    const demoCoupons: Omit<Coupon, 'id'>[] = [
      { code: 'MERCORA10', discountType: 'percentage', discountValue: 10, usedCount: 0, isActive: true, createdAt: new Date().toISOString(), description: '%10 indirim kuponu' },
      { code: 'ILKALIS50', discountType: 'fixed', discountValue: 50, minOrderAmount: 500, usedCount: 0, isActive: true, createdAt: new Date().toISOString(), description: '500₺ üzeri 50₺ indirim' },
    ];
    demoCoupons.forEach((coupon, i) => {
      batch.set(doc(db, 'coupons', `demo-coupon-${i + 1}`), coupon);
    });

    // Seed Site Settings
    batch.set(doc(db, 'settings', 'global'), {
      id: 'global',
      siteName: 'Mercora',
      maintenanceMode: false,
      contactEmail: 'destek@mercora.com',
    });

    await batch.commit();
    return { success: true, message: 'Marketplace seeded successfully with multi-vendor data.' };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch-seed');
    throw error;
  }
}
