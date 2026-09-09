import axios from 'axios';
import type { Product, AuthResponse, Address } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Axios instance with default config
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    withCredentials: true, // Enables automatic HttpOnly cookie transmission
});

// Response Interceptor: Format error messages cleanly
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        let message = error.message || 'An unexpected network error occurred';
        if (error.response && error.response.data) {
            if (typeof error.response.data === 'string') {
                message = error.response.data;
            } else if (error.response.data.message) {
                message = error.response.data.message;
            }
        }
        return Promise.reject(new Error(message));
    }
);

export function sanitizeProduct(product: Product): Product {
    if (!product) return product;

    let mainImage = product.mainImage || product.imageUrl || '';
    let images = product.images || [];

    if (mainImage) {
        mainImage = mainImage.trim();
        if (mainImage.startsWith('[') && mainImage.endsWith(']')) {
            try {
                const arr = JSON.parse(mainImage);
                if (Array.isArray(arr) && arr.length > 0) {
                    mainImage = arr[0];
                    if (images.length === 0) {
                        images = arr;
                    }
                }
            } catch (e) {
                const match = mainImage.match(/"([^"]+)"/g);
                if (match) {
                    const parsedUrls = match.map(m => m.replace(/^"|"$/g, ''));
                    mainImage = parsedUrls[0];
                    if (images.length === 0) {
                        images = parsedUrls;
                    }
                }
            }
        }
        mainImage = mainImage.replace(/^"|"$/g, '').trim();
    }

    if (images && images.length > 0) {
        images = images.map(img => img.replace(/^"|"$/g, '').trim()).filter(Boolean);
    }

    return {
        ...product,
        mainImage,
        imageUrl: mainImage,
        images,
    };
}

export async function fetchProducts(page?: number, size?: number): Promise<Product[]> {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;

    const response = await apiClient.get('/products', { params });
    const data = response.data;
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
}

export async function fetchProductsByCategory(category: string, page: number = 0, size: number = 10): Promise<Product[]> {
    if (!category || category.trim() === '') return [];
    
    let categoryProducts: Product[] = [];

    // 1. Try dedicated category pagination endpoint first
    try {
        const response = await apiClient.get('/products/category', {
            params: {
                name: category,
                category: category,
                page,
                size
            }
        });
        if (Array.isArray(response.data) && response.data.length > 0) {
            categoryProducts = response.data.map(sanitizeProduct);
        }
    } catch (err) {
        console.warn('Dedicated category endpoint error:', err);
    }

    // If we got enough items (>= size), return immediately
    if (categoryProducts.length >= size) {
        return categoryProducts.slice(0, size);
    }

    // 2. If strict category match returned fewer items, supplement using search query endpoint
    try {
        const searchRes = await apiClient.get('/products', {
            params: { query: category }
        });
        if (Array.isArray(searchRes.data) && searchRes.data.length > 0) {
            const searchProducts = searchRes.data.map(sanitizeProduct);
            const existingIds = new Set(categoryProducts.map(p => p.id));
            
            for (const p of searchProducts) {
                if (!existingIds.has(p.id)) {
                    categoryProducts.push(p);
                    existingIds.add(p.id);
                    if (categoryProducts.length >= size) break;
                }
            }
        }
    } catch (err) {
        console.warn(`Fallback search for category ${category} error:`, err);
    }

    return categoryProducts.slice(0, size);
}

export async function fetchCategories(): Promise<string[]> {
    const response = await apiClient.get('/products/categories');
    return Array.isArray(response.data) ? response.data : [];
}

export async function fetchFeaturedProducts(page: number = 0, size: number = 12): Promise<Product[]> {
    let result: Product[] = [];

    try {
        const response = await apiClient.get('/products/featured', {
            params: { page, size }
        });
        if (Array.isArray(response.data) && response.data.length > 0) {
            result = response.data.map(sanitizeProduct);
        }
    } catch (err) {
        console.warn('Backend /products/featured param fetch warning:', err);
    }

    // Fallback: If returned items are fewer than requested size, fill from general catalog
    if (result.length < size) {
        try {
            const response = await apiClient.get('/products', {
                params: { page, size }
            });
            if (Array.isArray(response.data) && response.data.length > 0) {
                const fallbackItems = response.data.map(sanitizeProduct);
                const existingIds = new Set(result.map(p => p.id));
                for (const item of fallbackItems) {
                    if (result.length >= size) break;
                    if (!existingIds.has(item.id)) {
                        result.push(item);
                        existingIds.add(item.id);
                    }
                }
            }
        } catch (err) {
            console.warn('Fallback general products fetch warning:', err);
        }
    }

    return result.slice(0, size);
}

export async function fetchNewArrivals(): Promise<Product[]> {
    const response = await apiClient.get('/products/new-arrivals');
    const data = response.data;
    return Array.isArray(data) ? data.slice(0, 15).map(sanitizeProduct) : [];
}

export async function fetchTopRatedProducts(): Promise<Product[]> {
    const response = await apiClient.get('/products/top-rated');
    const data = response.data;
    return Array.isArray(data) ? data.slice(0, 15).map(sanitizeProduct) : [];
}

export async function fetchMostReviewedProducts(): Promise<Product[]> {
    const response = await apiClient.get('/products/most-reviewed');
    const data = response.data;
    return Array.isArray(data) ? data.slice(0, 15).map(sanitizeProduct) : [];
}

export async function fetchMostViewedProducts(): Promise<Product[]> {
    const response = await apiClient.get('/products/most-viewed');
    const data = response.data;
    return Array.isArray(data) ? data.slice(0, 15).map(sanitizeProduct) : [];
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
}

export async function googleLogin(token: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/google', { idToken: token });
    return response.data;
}

export async function registerUser(name: string, email: string, password: string, role: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', { name, email, password, role });
    return response.data;
}

export async function verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/verify-otp', { email, otp });
    return response.data;
}

export async function resendOtp(email: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/resend-otp', { email });
    return response.data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
}

export async function createProduct(product: Omit<Product, "id">): Promise<Product> {
    const response = await apiClient.post('/products', product);
    return sanitizeProduct(response.data);
}

export async function updateProduct(product: Product): Promise<Product> {
    const response = await apiClient.put(`/products/${product.id}`, product);
    return sanitizeProduct(response.data);
}

export async function deleteProduct(id: number): Promise<void> {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
}

export async function fetchCart(): Promise<any> {
    const response = await apiClient.get('/api/cart');
    return response.data;
}

export async function addToBackendCart(productId: number, quantity: number): Promise<any> {
    const response = await apiClient.post('/api/cart/add', { productId, quantity });
    return response.data;
}

export async function updateBackendCartItem(productId: number, quantity: number): Promise<any> {
    const response = await apiClient.put('/api/cart/update', { productId, quantity });
    return response.data;
}

export async function removeFromBackendCart(productId: number): Promise<any> {
    const response = await apiClient.delete(`/api/cart/remove/${productId}`);
    return response.data;
}

export async function checkoutBackendCart(addressId: number): Promise<any> {
    const response = await apiClient.post(`/api/orders/checkout`, null, {
        params: { addressId }
    });
    return response.data;
}

export async function fetchBackendOrders(): Promise<any[]> {
    const response = await apiClient.get('/api/orders');
    return response.data;
}

export async function searchProducts(query: string): Promise<Product[]> {
    const response = await apiClient.get('/products', {
        params: { query }
    });
    const data = response.data;
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
}

export async function fetchSearchSuggestions(query: string): Promise<string[]> {
    const response = await apiClient.get('/products/suggestions', {
        params: { query }
    });
    return response.data;
}

export async function fetchFavorites(): Promise<Product[]> {
    const response = await apiClient.get('/api/favorites');
    const data = response.data;
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
}

export async function addFavoriteToBackend(productId: number): Promise<Product[]> {
    const response = await apiClient.post(`/api/favorites/add/${productId}`);
    const data = response.data;
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
}

export async function removeFavoriteFromBackend(productId: number): Promise<Product[]> {
    const response = await apiClient.delete(`/api/favorites/remove/${productId}`);
    const data = response.data;
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
}

export async function fetchProductById(id: number): Promise<Product> {
    const response = await apiClient.get(`/products/${id}`);
    return sanitizeProduct(response.data);
}

export async function fetchSellerProducts(): Promise<Product[]> {
    const response = await apiClient.get('/seller/products');
    const data = response.data;
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
}

export async function fetchSellerSales(): Promise<any[]> {
    const response = await apiClient.get('/seller/sales');
    return response.data;
}

export async function fetchSellerRevenue(): Promise<{ revenue: number }> {
    const response = await apiClient.get('/seller/revenue');
    return response.data;
}

export async function uploadProductImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
}

export async function fetchAddresses(): Promise<Address[]> {
    const response = await apiClient.get('/api/address');
    return response.data;
}

export async function saveAddress(address: Address): Promise<Address> {
    const response = await apiClient.post('/api/address', address);
    return response.data;
}

export async function updateAddress(id: number, address: Address): Promise<Address> {
    const response = await apiClient.put(`/api/address/${id}`, address);
    return response.data;
}

export async function deleteAddress(id: number): Promise<any> {
    const response = await apiClient.delete(`/api/address/${id}`);
    return response.data;
}

export async function setDefaultAddress(id: number): Promise<Address> {
    const response = await apiClient.put(`/api/address/${id}/default`);
    return response.data;
}

export async function requestCancelOrder(orderId: number): Promise<any> {
    const response = await apiClient.post(`/api/orders/${orderId}/cancel-request`);
    return response.data;
}

export async function confirmCancelOrder(orderId: number, otp: string): Promise<any> {
    const response = await apiClient.post(`/api/orders/${orderId}/cancel-confirm`, null, {
        params: { otp }
    });
    return response.data;
}

export async function fetchProductReviews(productId: number): Promise<any[]> {
    try {
        const response = await apiClient.get(`/api/reviews/products/${productId}`);
        return Array.isArray(response.data) ? response.data : [];
    } catch (e) {
        return [];
    }
}

export async function createProductReview(productId: number, rating: number, comment: string): Promise<any> {
    const response = await apiClient.post(`/api/reviews/products/${productId}`, { rating, comment });
    return response.data;
}

export async function logoutUser(): Promise<{ message: string }> {
    try {
        const response = await apiClient.post('/auth/logout');
        localStorage.removeItem('jwt_token');
        return response.data;
    } catch (e) {
        localStorage.removeItem('jwt_token');
        return { message: 'Logged out' };
    }
}