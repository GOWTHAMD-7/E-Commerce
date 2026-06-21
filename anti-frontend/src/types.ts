// src/types.ts
export interface Product {
    id?: number; // Optional because new products don't have IDs before saving
    name: string;
    description: string;
    price: number;
    stock: number;
    category?: string;
    brand?: string;
    imageUrl?: string;
    mainImage?: string;
    images?: string[];

    rating?: number;
    reviewCount?: number;
    seller?: { id: number; name?: string; email?: string; storeName?: string };
}


export interface AuthResponse {
  token: string | null;
  message: string;
}
export interface User {
  id?: number;
  email: string;
  role?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
}

export interface CartItem {
  id?: number;
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id?: number;
  product: Product;
  quantity: number;
  purchasedPrice: number;
  orderDate?: string;
}

export interface Order {
  id: number;
  user: User;
  orderItems: OrderItem[];
  shippingFullName?: string;
  shippingPhoneNumber?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingCountry?: string;
  shippingPincode?: string;
  status?: 'PENDING' | 'DELIVERED' | 'CANCELLED';
  orderDate?: string;
}

export interface Address {
  id?: number;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}