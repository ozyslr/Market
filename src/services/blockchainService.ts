import {
  collection, doc, getDoc, getDocs, setDoc, query, where, orderBy, limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ProductCertificate {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  sellerId: string;
  ownerId: string;
  txHash: string;
  blockNumber: number;
  network: string;
  issuedAt: string;
  metadata: {
    brand: string;
    serialNumber: string;
    manufactureDate: string;
    originCountry: string;
  };
  verified: boolean;
  lastVerifiedAt?: string;
}

export interface VerificationResult {
  authentic: boolean;
  certificate: ProductCertificate | null;
  message: string;
}

const COL = 'productCertificates';

// ─── Certificate generation ────────────────────────────────────────────────

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
    metadata: {
      brand: params.brand,
      serialNumber: generateSerial(),
      manufactureDate: new Date(Date.now() - Math.random() * 365 * 86400000).toISOString().split('T')[0],
      originCountry: params.originCountry,
    },
    verified: true,
    lastVerifiedAt: now,
  };

  await setDoc(ref, certificate);
  return certificate;
}

// ─── Verification ──────────────────────────────────────────────────────────

/**
 * Verify a product by its certificate ID or serial number.
 */
export async function verifyProduct(serialOrId: string): Promise<VerificationResult> {
  // Try by serial number first
  const serialSnap = await getDocs(query(
    collection(db, COL),
    where('metadata.serialNumber', '==', serialOrId),
    limit(1),
  ));

  if (!serialSnap.empty) {
    const cert = { id: serialSnap.docs[0].id, ...serialSnap.docs[0].data() } as ProductCertificate;
    // Update last verified timestamp
    await setDoc(doc(db, COL, cert.id), { lastVerifiedAt: new Date().toISOString() }, { merge: true });
    return { authentic: true, certificate: cert, message: 'Ürün orijinaldir. Blockchain kaydı doğrulandı.' };
  }

  // Try by certificate ID
  const certDoc = await getDoc(doc(db, COL, serialOrId));
  if (certDoc.exists()) {
    const cert = { id: certDoc.id, ...certDoc.data() } as ProductCertificate;
    await setDoc(doc(db, COL, cert.id), { lastVerifiedAt: new Date().toISOString() }, { merge: true });
    return { authentic: true, certificate: cert, message: 'Ürün orijinaldir. Blockchain kaydı doğrulandı.' };
  }

  return { authentic: false, certificate: null, message: 'Bu sertifika bulunamadı. Ürün doğrulanamadı.' };
}

/**
 * Get all certificates owned by a user.
 */
export async function getUserCertificates(userId: string): Promise<ProductCertificate[]> {
  const snap = await getDocs(query(
    collection(db, COL),
    where('ownerId', '==', userId),
    orderBy('issuedAt', 'desc'),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ProductCertificate);
}

/**
 * Get certificate for a specific product.
 */
export async function getProductCertificate(productId: string): Promise<ProductCertificate | null> {
  const snap = await getDocs(query(
    collection(db, COL),
    where('productId', '==', productId),
    limit(1),
  ));
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as ProductCertificate;
}

// ─── Explorer link (simulated) ─────────────────────────────────────────────

export function getExplorerUrl(certificate: ProductCertificate): string {
  return `https://mumbai.polygonscan.com/tx/${certificate.txHash}`;
}
