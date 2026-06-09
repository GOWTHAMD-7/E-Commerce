// src/types.ts
export interface Product {
    id?: number; // Optional because new products don't have IDs before saving
    name: string;
    description: string;
    price: number;
    stock: number;
}


export interface AuthResponse {
  token: string | null;
  message: string;
}
export interface User {
  email: string;
}