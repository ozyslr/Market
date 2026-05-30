import { collection, query, where, getDocs, doc, getDoc, limit, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Category } from '../types';
import { MOCK_PRODUCTS, CATEGORIES } from '../mockData';

export async function getProducts(options?: { categoryId?: string; limit?: number; featured?: boolean; sellerId?: string }) {
  try {
    const productsRef = collection(db, 'products');
    let q = query(productsRef);

    if (options?.categoryId) {
      q = query(q, where('categoryId', '==', options.categoryId));
    }
    if (options?.featured) {
      q = query(q, where('featured', '==', true));
    }
    if (options?.sellerId) {
      q = query(q, where('sellerId', '==', options.sellerId));
    }
    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
    
    // Fallback to mock if empty (e.g. before seeding)
    if (products.length === 0) return MOCK_PRODUCTS;
    
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return MOCK_PRODUCTS; // Graceful fallback
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('slug', '==', slug), limit(1));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Product;
    }
    
    return MOCK_PRODUCTS.find(p => p.slug === slug) || null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return MOCK_PRODUCTS.find(p => p.slug === slug) || null;
  }
}

export async function createProduct(data: Omit<Product, 'id'>) {
  try {
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'products');
    throw error;
  }
}

export async function updateProduct(id: string, data: Partial<Product>) {
  try {
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    throw error;
  }
}

export async function deleteProduct(id: string) {
  try {
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    throw error;
  }
}

export async function getCategories() {
  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
    
    if (categories.length === 0) return CATEGORIES;
    return categories;
  } catch (error) {
    return CATEGORIES;
  }
}

export async function createCategory(data: Partial<Category>) {
  try {
    const docRef = await addDoc(collection(db, 'categories'), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'categories');
    throw error;
  }
}

export async function updateCategory(id: string, data: Partial<Category>) {
  try {
    await updateDoc(doc(db, 'categories', id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `categories/${id}`);
    throw error;
  }
}

export async function deleteCategory(id: string) {
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    throw error;
  }
}
