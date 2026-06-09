import type { Product, AuthResponse } from './types';

// Spring Boot default port is 8080
const API_BASE_URL = 'http://localhost:8080';

export async function fetchProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products/all`);

    if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    return response.json(); // Parses the response body as JSON
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        throw new Error(`Failed to login: ${response.statusText}`);
    }

    return response.json(); // Parses the response body as JSON
}


export async function registerUser(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        throw new Error(`Failed to register: ${response.statusText}`);
    }

    return response.json(); // Parses the response body as JSON
}

export async function createProduct(product:Omit<Product,"id"> ): Promise<Product> {

    const token = localStorage.getItem('jwt_token');
    if (!token) {
        throw new Error('No jwt token found');
    }   

    console.log(product)
    
    const response = await fetch(`${API_BASE_URL}/createProduct`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(product),
    });

    if (!response.ok) {
        throw new Error(`Failed to create product: ${response.statusText}`);
    }

    return response.json(); // Parses the response body as JSON
}   


export async function updateProduct(product:Product): Promise<Product> {
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        throw new Error('No jwt token found');
    }

    console.log(product)

    const response = await fetch(`${API_BASE_URL}/updateProduct`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(product),
    });

    if (!response.ok) {
        throw new Error(`Failed to update product: ${response.statusText}`);
    }

    return response.json();     // Parses the response body as JSON
}
export async function deleteProduct(id:number): Promise<void> {
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        throw new Error('No jwt token found');
    }

    console.log(id)

    const response = await fetch(`${API_BASE_URL}/deleteProduct/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to Delete Product: ${response.statusText}`);
    }

    // Handle potential empty or JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
}