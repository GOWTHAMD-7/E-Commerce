import { useEffect, useState, type FormEvent } from 'react';
import { createProduct, loadCatalog, loginUser, registerUser } from './api';
import type { CartItem, Product, ProductDraft } from './types';

type Status = 'loading' | 'ready';
type AuthView = 'login' | 'register';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function getInitialCart(): CartItem[] {
  try {
    const raw = localStorage.getItem('northstar-cart');
    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function getProductImageUrl(product: Product): string {
  return `https://source.unsplash.com/featured/900x900/?${encodeURIComponent(product.name)}`;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(getInitialCart);
  const [status, setStatus] = useState<Status>('loading');
  const [source, setSource] = useState<'api' | 'empty'>('empty');
  const [message, setMessage] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('northstar-token') ?? '');
  const [authEmail, setAuthEmail] = useState(() => localStorage.getItem('northstar-email') ?? '');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [newProduct, setNewProduct] = useState<ProductDraft>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
  });
  const [productSaving, setProductSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function boot() {
      setStatus('loading');
      const result = await loadCatalog(apiBaseUrl);

      if (!active) {
        return;
      }

      setProducts(result.products);
      setSource(result.source);
      setMessage(result.error ?? null);
      setStatus('ready');
    }

    boot();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('northstar-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (authToken) {
      localStorage.setItem('northstar-token', authToken);
      localStorage.setItem('northstar-email', authEmail);
    } else {
      localStorage.removeItem('northstar-token');
      localStorage.removeItem('northstar-email');
    }
  }, [authToken, authEmail]);

  const filteredProducts = products.filter((product) => {
    return (
      query.trim().length === 0 ||
      [product.name, product.description].join(' ').toLowerCase().includes(query.toLowerCase())
    );
  });

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = subtotal > 0 ? 12 : 0;
  const total = subtotal + shipping;
  const isSignedIn = authToken.length > 0;

  function openAuth(view: AuthView) {
    setAuthView(view);
    setAuthMessage(null);
    setIsAuthOpen(true);
  }

  function signOut() {
    setAuthToken('');
    setAuthEmail('');
    setCart([]);
    setMessage('You signed out successfully.');
  }

  function addToCart(product: Product) {
    if (!isSignedIn) {
      setAuthMessage('Please sign in first, then you can add products to your cart.');
      openAuth('login');
      return;
    }

    setCart((current) => {
      const existingItem = current.find((item) => item.id === product.id);
      if (existingItem) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const result = await loginUser(apiBaseUrl, loginEmail, loginPassword);
      if (!result.token) {
        throw new Error('Login succeeded but no token was returned.');
      }

      setAuthToken(result.token);
      setAuthEmail(loginEmail);
      setMessage(result.message);
      setIsAuthOpen(false);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const result = await registerUser(apiBaseUrl, registerName, registerEmail, registerPassword);
      if (!result.token) {
        throw new Error('Registration succeeded but no token was returned.');
      }

      setAuthToken(result.token);
      setAuthEmail(registerEmail);
      setMessage(result.message);
      setIsAuthOpen(false);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSignedIn) {
      setAuthMessage('Please sign in before adding a new product.');
      openAuth('login');
      return;
    }

    setProductSaving(true);
    setMessage(null);

    try {
      const created = await createProduct(apiBaseUrl, authToken, newProduct);
      setProducts((current) => [created, ...current]);
      setMessage(`Product "${created.name}" was added successfully.`);
      setNewProduct({ name: '', description: '', price: 0, stock: 0 });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not add product.');
    } finally {
      setProductSaving(false);
    }
  }

  function updateQuantity(productId: number, delta: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(productId: number) {
    setCart((current) => current.filter((item) => item.id !== productId));
  }

  function clearFilters() {
    setQuery('');
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar">
        <div>
          <p className="eyebrow">React storefront practice</p>
          <h1>Northstar Market</h1>
        </div>
        <div className="topbar-actions">
          <span className={`status-pill status-${source}`}>{source === 'api' ? 'Connected' : 'No data'}</span>
          <button
            className="cart-chip"
            type="button"
            onClick={() => document.getElementById('cart-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            Cart {cartItemCount}
          </button>
          {isSignedIn ? (
            <>
              <span className="status-pill status-api">{authEmail}</span>
              <button className="secondary-button" type="button" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <button className="primary-button" type="button" onClick={() => openAuth('login')}>
              Sign in
            </button>
          )}
        </div>
      </header>

      <main className="layout">
        <section className="hero card">
          <div className="hero-copy">
            <p className="eyebrow">Simple, polished, backend-ready</p>
            <h2>Browse as a guest. Sign in when you want to add to cart or create a product.</h2>
            <p>
              This storefront pulls from <span>{apiBaseUrl ?? 'http://localhost:8080'}</span> and reads products
              from <span> /products/all</span>.
            </p>
            <div className="hero-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Browse catalog
              </button>
              <button className="secondary-button" type="button" onClick={clearFilters}>
                Reset search
              </button>
            </div>
          </div>
          <div className="hero-stats">
            <article>
              <strong>{products.length}</strong>
              <span>Products loaded</span>
            </article>
            <article>
              <strong>{cartItemCount}</strong>
              <span>Items in cart</span>
            </article>
            <article>
              <strong>{isSignedIn ? 'Yes' : 'No'}</strong>
              <span>Signed in</span>
            </article>
          </div>
        </section>

        {message ? <div className="notice card">{message}</div> : null}

        <section className="toolbar card" aria-label="Catalog filters">
          <label className="search-box">
            <span>Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products by name or description"
            />
          </label>
          <div className="chips">
            <span className="chip chip-active">All products</span>
          </div>
        </section>

        {isSignedIn ? (
          <section className="card form-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Add product</p>
                <h3>Save a new product to the backend</h3>
              </div>
              <span>JWT protected</span>
            </div>
            <form className="product-form" onSubmit={handleCreateProduct}>
              <label>
                <span>Name</span>
                <input
                  required
                  value={newProduct.name}
                  onChange={(event) => setNewProduct((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Product name"
                />
              </label>
              <label>
                <span>Description</span>
                <textarea
                  required
                  rows={3}
                  value={newProduct.description}
                  onChange={(event) =>
                    setNewProduct((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Short product description"
                />
              </label>
              <label>
                <span>Price</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={newProduct.price}
                  onChange={(event) =>
                    setNewProduct((current) => ({ ...current, price: Number(event.target.value) }))
                  }
                />
              </label>
              <label>
                <span>Stock</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={newProduct.stock}
                  onChange={(event) =>
                    setNewProduct((current) => ({ ...current, stock: Number(event.target.value) }))
                  }
                />
              </label>
              <button className="primary-button" type="submit" disabled={productSaving}>
                {productSaving ? 'Saving...' : 'Add product'}
              </button>
            </form>
          </section>
        ) : null}

        <section id="catalog" className="catalog-grid">
          <div className="catalog-panel card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Catalog</p>
                <h3>{status === 'loading' ? 'Loading products...' : 'Featured products'}</h3>
              </div>
              <span>{filteredProducts.length} results</span>
            </div>

            <div className="product-grid">
              {status === 'loading' ? (
                <div className="empty-state">Fetching products from the backend...</div>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <article key={product.id} className="product-card">
                    <div className="product-image-wrap">
                      <img src={getProductImageUrl(product)} alt={product.name} className="product-image" />
                      <span className="product-badge">Stock {product.stock}</span>
                    </div>
                    <div className="product-body">
                      <div className="product-meta">
                        <h4>{product.name}</h4>
                        <span>{formatPrice(product.price)}</span>
                      </div>
                      <p>{product.description}</p>
                      <div className="product-footer">
                        <span>Stock {product.stock}</span>
                        <span>Backend data</span>
                      </div>
                      <button className="primary-button block-button" type="button" onClick={() => addToCart(product)}>
                        {isSignedIn ? 'Add to cart' : 'Sign in to add'}
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">No products match the current search.</div>
              )}
            </div>
          </div>

          <aside id="cart-panel" className="cart-panel card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Cart</p>
                <h3>Order summary</h3>
              </div>
              <span>{cartItemCount} items</span>
            </div>

            {isSignedIn ? (
              cart.length > 0 ? (
                <>
                  <div className="cart-items">
                    {cart.map((item) => (
                      <article key={item.id} className="cart-item">
                        <img src={getProductImageUrl(item)} alt={item.name} className="cart-thumb" />
                        <div className="cart-item-main">
                          <div>
                            <strong>{item.name}</strong>
                            <p>{formatPrice(item.price)}</p>
                          </div>
                          <div className="cart-controls">
                            <button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label={`Decrease ${item.name}`}>
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label={`Increase ${item.name}`}>
                              +
                            </button>
                            <button type="button" className="ghost-link" onClick={() => removeItem(item.id)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="summary">
                    <div>
                      <span>Subtotal</span>
                      <strong>{formatPrice(subtotal)}</strong>
                    </div>
                    <div>
                      <span>Shipping</span>
                      <strong>{shipping > 0 ? formatPrice(shipping) : 'Free'}</strong>
                    </div>
                    <div className="summary-total">
                      <span>Total</span>
                      <strong>{formatPrice(total)}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-state compact">Your cart is empty. Add a product to see the summary here.</div>
              )
            ) : (
              <div className="empty-state compact">Sign in to use the cart.</div>
            )}
          </aside>
        </section>
      </main>

      {isAuthOpen ? (
        <div className="auth-backdrop" role="presentation" onClick={() => setIsAuthOpen(false)}>
          <div
            className="auth-modal card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Authentication</p>
                <h3 id="auth-title">Sign in to continue</h3>
              </div>
              <button className="ghost-link" type="button" onClick={() => setIsAuthOpen(false)}>
                Close
              </button>
            </div>

            {authMessage ? <div className="notice card">{authMessage}</div> : null}

            <div className="chips auth-tabs">
              <button className={`chip ${authView === 'login' ? 'chip-active' : ''}`} type="button" onClick={() => setAuthView('login')}>
                Login
              </button>
              <button className={`chip ${authView === 'register' ? 'chip-active' : ''}`} type="button" onClick={() => setAuthView('register')}>
                Register
              </button>
            </div>

            {authView === 'login' ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <label>
                  <span>Email</span>
                  <input required type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
                </label>
                <label>
                  <span>Password</span>
                  <input
                    required
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                  />
                </label>
                <button className="primary-button" type="submit" disabled={authLoading}>
                  {authLoading ? 'Signing in...' : 'Login'}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleRegister}>
                <label>
                  <span>Name</span>
                  <input required value={registerName} onChange={(event) => setRegisterName(event.target.value)} />
                </label>
                <label>
                  <span>Email</span>
                  <input required type="email" value={registerEmail} onChange={(event) => setRegisterEmail(event.target.value)} />
                </label>
                <label>
                  <span>Password</span>
                  <input
                    required
                    type="password"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                  />
                </label>
                <button className="primary-button" type="submit" disabled={authLoading}>
                  {authLoading ? 'Creating account...' : 'Register'}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
