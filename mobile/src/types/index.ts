export type UserRole = 'buyer' | 'seller' | 'admin' | 'moderator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  country: string;
  currency: string;
  photoURL?: string;
}

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  categoryId: string;
  description: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isActive: boolean;
  unit?: string;
  moq?: number;
  estimatedDelivery?: string;
}

export interface CartItem {
  productId: string;
  sellerId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

export interface OrderItem {
  productId: string;
  sellerId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerIds: string[];
  items: OrderItem[];
  total: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  shippingAddress: {
    fullName: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}
