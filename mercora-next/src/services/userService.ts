'use client';

import { collection, query, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-error';
import type { User, UserProfile, Seller, Address } from '@/types';

export async function getUsers() {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    throw error;
  }
}

export async function updateUser(id: string, data: Partial<UserProfile>) {
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

export async function updateProfilePhoto(userId: string, photoURL: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), { photoURL, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    throw error;
  }
}

export async function addAddress(userId: string, address: Omit<Address, 'id'>): Promise<Address> {
  const newAddress: Address = { ...address, id: crypto.randomUUID() };
  try {
    await updateDoc(doc(db, 'users', userId), {
      addresses: arrayUnion(newAddress),
      updatedAt: serverTimestamp(),
    });
    return newAddress;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    throw error;
  }
}

export async function replaceAddress(userId: string, oldAddress: Address, newAddress: Address): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), { addresses: arrayRemove(oldAddress), updatedAt: serverTimestamp() });
    await updateDoc(doc(db, 'users', userId), { addresses: arrayUnion(newAddress), updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    throw error;
  }
}

export async function deleteAddress(userId: string, address: Address): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      addresses: arrayRemove(address),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    throw error;
  }
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      defaultAddressId: addressId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    throw error;
  }
}

export async function suspendUser(userId: string, until: string, reason: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    status: 'suspended',
    suspendedUntil: until,
    adminNote: reason,
  });
}

export async function banUser(userId: string, reason: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    status: 'banned',
    adminNote: reason,
  });
}

export async function unrestrictUser(userId: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    status: 'active',
    suspendedUntil: null,
    adminNote: null,
  });
}

export async function setAdminNote(userId: string, note: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), { adminNote: note });
}
