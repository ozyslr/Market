import { collection, query, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { User, Seller } from '../types';

export async function getUsers() {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    throw error;
  }
}

export async function updateUser(id: string, data: Partial<User>) {
  try {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    const userRef = doc(db, 'users', id);
    await deleteDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    throw error;
  }
}

export async function getSellers() {
  try {
    const snapshot = await getDocs(collection(db, 'sellers'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'sellers');
    throw error;
  }
}

export async function createSeller(sellerId: string, data: Partial<Seller>) {
  try {
    const sellerRef = doc(db, 'sellers', sellerId);
    await setDoc(sellerRef, {
      ...data,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `sellers/${sellerId}`);
    throw error;
  }
}

export async function updateSeller(id: string, data: Partial<Seller>) {
  try {
    const sellerRef = doc(db, 'sellers', id);
    await updateDoc(sellerRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `sellers/${id}`);
    throw error;
  }
}

export async function deleteSeller(id: string) {
  try {
    const sellerRef = doc(db, 'sellers', id);
    await deleteDoc(sellerRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `sellers/${id}`);
    throw error;
  }
}
