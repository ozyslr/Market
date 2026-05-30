import { create } from 'zustand';
import { Product } from '../types';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: (options?: { categoryId?: string; limit?: number; featured?: boolean; sellerId?: string }) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<string>;
  editProduct: (id: string, product: Partial<Product>) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  fetchProducts: async (options) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getProducts(options);
      set({ products: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addProduct: async (productData) => {
    set({ isLoading: true, error: null });
    try {
      const id = await createProduct(productData);
      const newProduct = { ...productData, id } as Product;
      set((state) => ({
        products: [newProduct, ...state.products],
        isLoading: false
      }));
      return id;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  editProduct: async (id, productData) => {
    set({ isLoading: true, error: null });
    try {
      await updateProduct(id, productData);
      set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...productData } : p),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  removeProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteProduct(id);
      set((state) => ({
        products: state.products.filter(p => p.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  }
}));
