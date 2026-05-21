'use client';

import { collection, addDoc, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';

export interface ProductCertificate {
  id: string;
  productId: string;
  productName: string;
  sellerId: string;
  sellerName: string;
  manufacturer?: string;
  originCountry?: string;
  materialComposition?: string;
  serialNumber: string;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  certifications?: string[];
  verifiedAt: string;
  txHash?: string;
  metadata?: Record<string, string>;
}

export interface CertificateVerification {
  isValid: boolean;
  certificate: ProductCertificate | null;
  message: string;
}

const COL = 'productCertificates';

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

export async function getCertificateByProductId(productId: string): Promise<ProductCertificate | null> {
  try {
    const q = query(
      collection(db, COL),
      where('productId', '==', productId),
      orderBy('verifiedAt', 'desc'),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as ProductCertificate;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return null;
  }
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
      orderBy('verifiedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductCertificate));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}
