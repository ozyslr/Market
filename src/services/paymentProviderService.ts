import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { PaymentProvider, ProviderKey } from '../types/payment';

const COL = 'paymentProviders';

export async function getPaymentProviders(): Promise<PaymentProvider[]> {
  try {
    const snap = await getDocs(collection(db, COL));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as PaymentProvider);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function getActiveProvidersForRegion(region: string): Promise<PaymentProvider[]> {
  try {
    const q = query(collection(db, COL), where('active', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }) as PaymentProvider)
      .filter(p => p.regions.includes(region) || p.regions.includes('GLOBAL'));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COL);
    return [];
  }
}

export async function savePaymentProvider(
  provider: Omit<PaymentProvider, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PaymentProvider> {
  const now = new Date().toISOString();
  try {
    const docRef = await addDoc(collection(db, COL), { ...provider, createdAt: now, updatedAt: now });
    return { ...provider, id: docRef.id, createdAt: now, updatedAt: now };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COL);
    throw error;
  }
}

export async function updatePaymentProvider(id: string, data: Partial<PaymentProvider>): Promise<void> {
  try {
    await updateDoc(doc(db, COL, id), { ...data, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COL}/${id}`);
    throw error;
  }
}

export async function deletePaymentProvider(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COL}/${id}`);
    throw error;
  }
}
