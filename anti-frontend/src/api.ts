import type { Product, AuthResponse, Address } from './types';

// Spring Boot default port is 8080
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
    let url = `${API_BASE_URL}/products`;
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', page.toString());
    if (size !== undefined) params.append('size', size.toString());
    if (params.toString()) {
        url += `?${params.toString()}`;
    }
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products/featured`);
    if (!response.ok) {
        throw new Error(`Failed to fetch featured products: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
}

export async function fetchNewArrivals(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products/new-arrivals`);
    if (!response.ok) {
        throw new Error(`Failed to fetch new arrivals: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
}

export async function fetchTopRatedProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products/top-rated`);
    if (!response.ok) {
        throw new Error(`Failed to fetch top rated products: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
}

export async function fetchMostReviewedProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products/most-reviewed`);
    if (!response.ok) {
        throw new Error(`Failed to fetch most reviewed products: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
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
        let errorMsg = `Failed to login: ${response.statusText}`;
        try {
            const data = await response.json();
            if (data && data.message) {
                errorMsg = data.message;
            }
        } catch (e) {
            // ignore
        }
        throw new Error(errorMsg);
    }

    return response.json(); // Parses the response body as JSON
}

export async function googleLogin(token: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: token }),
    });

    if (!response.ok) {
        let errorMsg = `Failed to login with Google: ${response.statusText}`;
        try {
            const data = await response.json();
            if (data && data.message) {
                errorMsg = data.message;
            }
        } catch (e) {
            // ignore
        }
        throw new Error(errorMsg);
    }

    return response.json();
}


export async function registerUser(name: string, email: string, password: string, role: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role }),
    });

    if (!response.ok) {
        let errorMsg = `Failed to register: ${response.statusText}`;
        try {
            const data = await response.json();
            if (data && data.message) {
                errorMsg = data.message;
            }
        } catch (e) {
            // ignore
        }
        throw new Error(errorMsg);
    }

    return response.json(); // Parses the response body as JSON
}

export async function verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
        let errorMsg = `Failed to verify code: ${response.statusText}`;
        try {
            const data = await response.json();
            if (data && data.message) {
                errorMsg = data.message;
            }
        } catch (e) {
            // ignore
        }
        throw new Error(errorMsg);
    }

    return response.json();
}

export async function resendOtp(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        let errorMsg = `Failed to resend code: ${response.statusText}`;
        try {
            const data = await response.json();
            if (data && data.message) {
                errorMsg = data.message;
            }
        } catch (e) {
            // ignore
        }
        throw new Error(errorMsg);
    }

    return response.json();
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        let errorMsg = `Failed to request password reset: ${response.statusText}`;
        try {
            const data = await response.json();
            if (data && data.message) {
                errorMsg = data.message;
            }
        } catch (e) {
            // ignore
        }
        throw new Error(errorMsg);
    }

    return response.json();
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
    });

    if (!response.ok) {
        let errorMsg = `Failed to reset password: ${response.statusText}`;
        try {
            const data = await response.json();
            if (data && data.message) {
                errorMsg = data.message;
            }
        } catch (e) {
            // ignore
        }
        throw new Error(errorMsg);
    }

    return response.json();
}

export async function createProduct(product:Omit<Product,"id"> ): Promise<Product> {

    const token = localStorage.getItem('jwt_token');
    if (!token) {
        throw new Error('No jwt token found');
    }   

    console.log(product)
    
    const response = await fetch(`${API_BASE_URL}/products`, {
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

    const data = await response.json();
    return sanitizeProduct(data);
}   


export async function updateProduct(product:Product): Promise<Product> {
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        throw new Error('No jwt token found');
    }

    console.log(product)

    const response = await fetch(`${API_BASE_URL}/products/${product.id}`, {
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

    const data = await response.json();
    return sanitizeProduct(data);
}
export async function deleteProduct(id:number): Promise<void> {
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        throw new Error('No jwt token found');
    }

    console.log(id)

    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
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

export async function fetchCart(): Promise<any> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch cart: ${response.statusText}`);
    }
    return response.json();
}

export async function addToBackendCart(productId: number, quantity: number): Promise<any> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
    });
    if (!response.ok) {
        throw new Error(`Failed to add to cart: ${response.statusText}`);
    }
    return response.json();
}

export async function updateBackendCartItem(productId: number, quantity: number): Promise<any> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
    });
    if (!response.ok) {
        throw new Error(`Failed to update cart: ${response.statusText}`);
    }
    return response.json();
}

export async function removeFromBackendCart(productId: number): Promise<any> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/cart/remove/${productId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to remove from cart: ${response.statusText}`);
    }
    return response.json();
}

export async function checkoutBackendCart(addressId: number): Promise<any> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/orders/checkout?addressId=${addressId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Failed to checkout: ${response.statusText}`);
    }
    return response.json();
}

export async function fetchBackendOrders(): Promise<any[]> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }
    return response.json();
}

export async function searchProducts(query: string): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
        throw new Error(`Failed to search products: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
}

export async function fetchSearchSuggestions(query: string): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/products/suggestions?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch search suggestions: ${response.statusText}`);
    }

    return response.json();
}

export async function fetchFavorites(): Promise<Product[]> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/favorites`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch favorites: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
}

export async function addFavoriteToBackend(productId: number): Promise<Product[]> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/favorites/add/${productId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to add favorite: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
}

export async function removeFavoriteFromBackend(productId: number): Promise<Product[]> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/favorites/remove/${productId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to remove favorite: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
}

export async function fetchProductById(id: number): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch product details: ${response.statusText}`);
    }

    const data = await response.json();
    return sanitizeProduct(data);
}

export async function fetchSellerProducts(): Promise<Product[]> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/seller/products`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch seller products: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data.map(sanitizeProduct) : [];
}

export async function fetchSellerSales(): Promise<any[]> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/seller/sales`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch seller sales: ${response.statusText}`);
    }
    return response.json();
}

export async function fetchSellerRevenue(): Promise<{ revenue: number }> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/seller/revenue`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch seller revenue: ${response.statusText}`);
    }
    return response.json();
}

export async function uploadProductImage(file: File): Promise<string> {
    const token = localStorage.getItem('jwt_token');
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: headers,
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.statusText}`);
    }

    return response.text();
}

export async function fetchAddresses(): Promise<Address[]> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/address`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch addresses: ${response.statusText}`);
    }
    return response.json();
}

export async function saveAddress(address: Address): Promise<Address> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/address`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(address),
    });
    if (!response.ok) {
        throw new Error(`Failed to save address: ${response.statusText}`);
    }
    return response.json();
}

export async function updateAddress(id: number, address: Address): Promise<Address> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/address/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(address),
    });
    if (!response.ok) {
        throw new Error(`Failed to update address: ${response.statusText}`);
    }
    return response.json();
}

export async function deleteAddress(id: number): Promise<any> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/address/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to delete address: ${response.statusText}`);
    }
    return response.json();
}

export async function setDefaultAddress(id: number): Promise<Address> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/address/${id}/default`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to set default address: ${response.statusText}`);
    }
    return response.json();
}

export async function requestCancelOrder(orderId: number): Promise<any> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel-request`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        let errorMsg = `Failed to request cancellation: ${response.statusText}`;
        try {
            const txt = await response.text();
            if (txt) errorMsg = txt;
        } catch (e) {
            // ignore
        }
        throw new Error(errorMsg);
    }

    return response.text();
}

export async function confirmCancelOrder(orderId: number, otp: string): Promise<any> {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No jwt token found');

    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel-confirm?otp=${encodeURIComponent(otp)}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        let errorMsg = `Failed to confirm cancellation: ${response.statusText}`;
        try {
            const txt = await response.text();
            if (txt) errorMsg = txt;
        } catch (e) {
            // ignore
        }
        throw new Error(errorMsg);
    }

    return response.text();
}