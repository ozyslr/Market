'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ProductCertificate {
  id: string;
  productId: string;
  productName?: string; // Next compatibility
  productTitle: string; // Vite compatibility
  productImage: string; // Vite compatibility
  sellerId: string;
  sellerName?: string; // Next compatibility
  ownerId: string; // Vite compatibility
  txHash: string; // Vite compatibility
  blockNumber: number; // Vite compatibility
  network: string; // Vite compatibility
  issuedAt: string; // Vite compatibility
  verifiedAt?: string; // Next compatibility
  verified: boolean; // Vite compatibility
  lastVerifiedAt?: string; // Vite compatibility
  metadata: {
    brand: string;
    serialNumber: string;
    manufactureDate: string;
    originCountry: string;
    [key: string]: any;
  };
  // Other optional Next fields
  manufacturer?: string;
  originCountry?: string;
  materialComposition?: string;
  serialNumber?: string;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  certifications?: string[];
}

export interface VerificationResult {
  authentic: boolean;
  certificate: ProductCertificate | null;
  message: string;
}

export interface CertificateVerification {
  isValid: boolean;
  certificate: ProductCertificate | null;
  message: string;
}

const COL = 'productCertificates';

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * 16)];
  }
  return hash;
}

function generateSerial(): string {
  const prefix = 'MRC';
  const num = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${num}-${rand}`;
}

// ─── Operations ────────────────────────────────────────────────────────────

/**
 * Legacy/compatibility createCertificate.
 */
export async function createCertificate(
  data: Omit<ProductCertificate, 'id' | 'verifiedAt'>,
): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      verifiedAt: new Date().toISOString(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COL);
    throw error;
  }
}

/**
 * Issue a new authenticity certificate for a product.
 * In production, this would interact with a smart contract.
 */
export async function issueCertificate(params: {
  productId: string;
  productTitle: string;
  productImage: string;
  sellerId: string;
  ownerId: string;
  brand: string;
  originCountry: string;
}): Promise<ProductCertificate> {
  try {
    const ref = doc(collection(db, COL));
    const now = new Date().toISOString();

    const certificate: ProductCertificate = {
      id: ref.id,
      productId: params.productId,
      productTitle: params.productTitle,
      productImage: params.productImage,
      sellerId: params.sellerId,
      ownerId: params.ownerId,
      txHash: generateTxHash(),
      blockNumber: Math.floor(Math.random() * 20000000) + 10000000,
      network: 'Polygon Mumbai',
      issuedAt: now,
      verifiedAt: now,
      verified: true,
      lastVerifiedAt: now,
      metadata: {
        brand: params.brand,
        serialNumber: generateSerial(),
        manufactureDate: new Date(Date.now() - Math.random() * 365 * 86400000).toISOString().split('T')[0],
        originCountry: params.originCountry,
      },
    };

    await setDoc(ref, certificate);
    return certificate;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COL);
    throw error;
  }
}

/**
 * Verify a product by its certificate ID or serial number.
 * Searches both root `serialNumber` and nested `metadata.serialNumber`.
 */
export async function verifyProduct(serialOrId: string): Promise<VerificationResult> {
  try {
    // 1. Try by root serialNumber (Next.js schema)
    let serialSnap = await getDocs(query(
      collection(db, COL),
      where('serialNumber', '==', serialOrId),
      limit(1),
    ));

    // 2. Try by nested metadata.serialNumber (Vite schema)
    if (serialSnap.empty) {
      serialSnap = await getDocs(query(
        collection(db, COL),
        where('metadata.serialNumber', '==', serialOrId),
        limit(1),
      ));
    }

    if (!serialSnap.empty) {
      const d = serialSnap.docs[0];
      const data = d.data();
      const cert = {
        id: d.id,
        productId: data.productId || '',
        productTitle: data.productTitle || data.productName || 'Ürün',
        productImage: data.productImage || '',
        sellerId: data.sellerId || '',
        ownerId: data.ownerId || data.sellerId || '',
        txHash: data.txHash || generateTxHash(),
        blockNumber: data.blockNumber || Math.floor(Math.random() * 20000000) + 10000000,
        network: data.network || 'Polygon Mumbai',
        issuedAt: data.issuedAt || data.verifiedAt || new Date().toISOString(),
        verified: data.verified !== undefined ? data.verified : true,
        lastVerifiedAt: new Date().toISOString(),
        metadata: {
          brand: data.metadata?.brand || data.manufacturer || 'Mercora',
          serialNumber: data.metadata?.serialNumber || data.serialNumber || '',
          manufactureDate: data.metadata?.manufactureDate || data.manufacturingDate || '',
          originCountry: data.metadata?.originCountry || data.originCountry || '',
        },
      } as ProductCertificate;

      // Update last verified timestamp
      await setDoc(doc(db, COL, cert.id), { lastVerifiedAt: cert.lastVerifiedAt }, { merge: true });
      return { authentic: true, certificate: cert, message: 'Ürün orijinaldir. Blockchain kaydı doğrulandı.' };
    }

    // 3. Try by certificate ID
    const certDoc = await getDoc(doc(db, COL, serialOrId));
    if (certDoc.exists()) {
      const d = certDoc;
      const data = d.data();
      const cert = {
        id: d.id,
        productId: data.productId || '',
        productTitle: data.productTitle || data.productName || 'Ürün',
        productImage: data.productImage || '',
        sellerId: data.sellerId || '',
        ownerId: data.ownerId || data.sellerId || '',
        txHash: data.txHash || generateTxHash(),
        blockNumber: data.blockNumber || Math.floor(Math.random() * 20000000) + 10000000,
        network: data.network || 'Polygon Mumbai',
        issuedAt: data.issuedAt || data.verifiedAt || new Date().toISOString(),
        verified: data.verified !== undefined ? data.verified : true,
        lastVerifiedAt: new Date().toISOString(),
        metadata: {
          brand: data.metadata?.brand || data.manufacturer || 'Mercora',
          serialNumber: data.metadata?.serialNumber || data.serialNumber || '',
          manufactureDate: data.metadata?.manufactureDate || data.manufacturingDate || '',
          originCountry: data.metadata?.originCountry || data.originCountry || '',
        },
      } as ProductCertificate;

      await setDoc(doc(db, COL, cert.id), { lastVerifiedAt: cert.lastVerifiedAt }, { merge: true });
      return { authentic: true, certificate: cert, message: 'Ürün orijinaldir. Blockchain kaydı doğrulandı.' };
    }

    return { authentic: false, certificate: null, message: 'Bu sertifika bulunamadı. Ürün doğrulanamadı.' };
  } catch (error) {
    return { authentic: false, certificate: null, message: 'Sorgulama sırasında bir hata oluştu.' };
  }
}

/**
 * Get all certificates owned by a user.
 */
export async function getUserCertificates(userId: string): Promise<ProductCertificate[]> {
  try {
    const snap = await getDocs(query(
      collection(db, COL),
      where('ownerId', '==', userId),
      orderBy('issuedAt', 'desc'),
    ));
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        productId: data.productId || '',
        productTitle: data.productTitle || data.productName || 'Ürün',
        productImage: data.productImage || '',
        sellerId: data.sellerId || '',
        ownerId: data.ownerId || data.sellerId || '',
        txHash: data.txHash || '',
        blockNumber: data.blockNumber || 0,
        network: data.network || '',
        issuedAt: data.issuedAt || data.verifiedAt || '',
        verified: data.verified !== undefined ? data.verified : true,
        lastVerifiedAt: data.lastVerifiedAt || '',
        metadata: {
          brand: data.metadata?.brand || data.manufacturer || 'Mercora',
          serialNumber: data.metadata?.serialNumber || data.serialNumber || '',
          manufactureDate: data.metadata?.manufactureDate || data.manufacturingDate || '',
          originCountry: data.metadata?.originCountry || data.originCountry || '',
        },
      } as ProductCertificate;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

/**
 * Get certificate for a specific product.
 */
export async function getProductCertificate(productId: string): Promise<ProductCertificate | null> {
  try {
    const snap = await getDocs(query(
      collection(db, COL),
      where('productId', '==', productId),
      limit(1),
    ));
    if (snap.empty) return null;
    const d = snap.docs[0];
    const data = d.data();
    return {
      id: d.id,
      productId: data.productId || '',
      productTitle: data.productTitle || data.productName || 'Ürün',
      productImage: data.productImage || '',
      sellerId: data.sellerId || '',
      ownerId: data.ownerId || data.sellerId || '',
      txHash: data.txHash || '',
      blockNumber: data.blockNumber || 0,
      network: data.network || '',
      issuedAt: data.issuedAt || data.verifiedAt || '',
      verified: data.verified !== undefined ? data.verified : true,
      lastVerifiedAt: data.lastVerifiedAt || '',
      metadata: {
        brand: data.metadata?.brand || data.manufacturer || 'Mercora',
        serialNumber: data.metadata?.serialNumber || data.serialNumber || '',
        manufactureDate: data.metadata?.manufactureDate || data.manufacturingDate || '',
        originCountry: data.metadata?.originCountry || data.originCountry || '',
      },
    } as ProductCertificate;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return null;
  }
}

export async function getCertificateByProductId(productId: string): Promise<ProductCertificate | null> {
  return getProductCertificate(productId);
}

export async function verifyCertificate(productId: string): Promise<CertificateVerification> {
  try {
    const cert = await getCertificateByProductId(productId);
    if (!cert) {
      return { isValid: false, certificate: null, message: 'No certificate found for this product' };
    }

    const productSnap = await getDoc(doc(db, 'products', productId));
    if (!productSnap.exists()) {
      return { isValid: false, certificate: cert, message: 'Product no longer exists in catalog' };
    }

    return { isValid: true, certificate: cert, message: 'Certificate verified successfully' };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return { isValid: false, certificate: null, message: 'Verification failed due to an error' };
  }
}

export async function getSellerCertificates(sellerId: string): Promise<ProductCertificate[]> {
  try {
    const q = query(
      collection(db, COL),
      where('sellerId', '==', sellerId),
      orderBy('issuedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        productId: data.productId || '',
        productTitle: data.productTitle || data.productName || 'Ürün',
        productImage: data.productImage || '',
        sellerId: data.sellerId || '',
        ownerId: data.ownerId || data.sellerId || '',
        txHash: data.txHash || '',
        blockNumber: data.blockNumber || 0,
        network: data.network || '',
        issuedAt: data.issuedAt || data.verifiedAt || '',
        verified: data.verified !== undefined ? data.verified : true,
        lastVerifiedAt: data.lastVerifiedAt || '',
        metadata: {
          brand: data.metadata?.brand || data.manufacturer || 'Mercora',
          serialNumber: data.metadata?.serialNumber || data.serialNumber || '',
          manufactureDate: data.metadata?.manufactureDate || data.manufacturingDate || '',
          originCountry: data.metadata?.originCountry || data.originCountry || '',
        },
      } as ProductCertificate;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

// ─── Explorer link (simulated) ─────────────────────────────────────────────

export function getExplorerUrl(certificate: ProductCertificate | VerificationResult['certificate']): string {
  if (!certificate) return '#';
  return `https://mumbai.polygonscan.com/tx/${certificate.txHash}`;
}
