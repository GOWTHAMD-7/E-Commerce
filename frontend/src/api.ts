import type { Product } from './types';

export type ProductDraft = {
  name: string;
  description: string;
  price: number;
  stock: number;
};

export type AuthResult = {
  token: string | null;
  message: string;
};

type BackendProduct = {
  id?: number | string;
  name?: string;
  description?: string;
  price?: number | string;
  stock?: number | string;
};

type CatalogResponse = BackendProduct[] | { content?: BackendProduct[] };

const DEFAULT_API_BASE_URL = 'http://localhost:8080';
const FALLBACK_IMAGE_URL =
  'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=80';

function cleanBaseUrl(baseUrl?: string): string {
  const value = baseUrl?.trim() || DEFAULT_API_BASE_URL;
  return value.replace(/\/$/, '');
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeProduct(product: BackendProduct, index: number): Product {
  const id = toNumber(product.id, index + 1);
  const name = product.name ?? `Product ${index + 1}`;
  return {
    id,
    name,
    description: product.description ?? 'No description provided by the backend.',
    price: toNumber(product.price, 0),
    stock: toNumber(product.stock, 0),
  };
}

function extractProducts(payload: CatalogResponse): BackendProduct[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.content ?? [];
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function loadCatalog(baseUrl?: string): Promise<{
  products: Product[];
  source: 'api' | 'empty';
  error?: string;
}> {
  const resolvedBaseUrl = cleanBaseUrl(baseUrl);
  try {
    const response = await fetch(`${resolvedBaseUrl}/products/all`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as CatalogResponse;
    const products = extractProducts(payload).map(normalizeProduct);

    return {
      products,
      source: products.length > 0 ? 'api' : 'empty',
      error:
        products.length === 0
          ? 'The backend returned no products from /products/all.'
          : undefined,
    };
  } catch (error) {
    return {
      products: [],
      source: 'empty',
      error:
        error instanceof Error
          ? `Unable to load products from /products/all: ${error.message}`
          : 'Unable to load products from /products/all.',
    };
  }
}

export async function loginUser(
  baseUrl: string | undefined,
  email: string,
  password: string,
): Promise<AuthResult> {
  const resolvedBaseUrl = cleanBaseUrl(baseUrl);
  const response = await fetch(`${resolvedBaseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await parseJsonResponse<{ token?: string; message?: string }>(response);

  if (!response.ok) {
    throw new Error(payload.message ?? `Login failed with status ${response.status}`);
  }

  return {
    token: payload.token ?? null,
    message: payload.message ?? 'Login successful',
  };
}

export async function registerUser(
  baseUrl: string | undefined,
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const resolvedBaseUrl = cleanBaseUrl(baseUrl);
  const response = await fetch(`${resolvedBaseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  const payload = await parseJsonResponse<{ token?: string; message?: string }>(response);

  if (!response.ok) {
    throw new Error(payload.message ?? `Registration failed with status ${response.status}`);
  }

  return {
    token: payload.token ?? null,
    message: payload.message ?? 'Registration successful',
  };
}

export async function createProduct(
  baseUrl: string | undefined,
  token: string,
  product: ProductDraft,
): Promise<Product> {
  const resolvedBaseUrl = cleanBaseUrl(baseUrl);
  const response = await fetch(`${resolvedBaseUrl}/createProduct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(product),
  });

  const payload = await parseJsonResponse<BackendProduct>(response);

  if (!response.ok) {
    throw new Error(`Create product failed with status ${response.status}`);
  }

  return normalizeProduct(payload, 0);
}
