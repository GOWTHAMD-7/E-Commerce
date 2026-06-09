// src/App.tsx
import { useEffect, useState, useContext } from 'react';
import { fetchProducts, deleteProduct } from './api';
import type { Product } from './types';
import { AuthContext } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import ProductForm from './components/ProductForm';

export default function App() {
  const auth = useContext(AuthContext);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showUpdateProduct, setShowUpdateProduct] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  const handleUpdateClick = (id: number) => {
    console.log('Update clicked for product ID:', id);
    setSelectedProductId(id);
    setShowUpdateProduct(true);
  };

  const handleDeleteClick = async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this product?');
    if (!confirmed) return;

    try {
      await deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };
  
  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Could not connect to server');
        setLoading(false);
      });
  }, []);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  if (!auth) return null;

  if (auth.loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header-nav">
        <h1 className="brand-title">Aura Storefront</h1>

        {auth.user ? (
          <div className="nav-actions">
            <span className="user-badge">
              Logged in: <strong>{auth.user.email}</strong>
            </span>
            <button onClick={auth.logout} className="btn-secondary btn-sm">
              Logout
            </button>
            <button onClick={() => setShowCreateProduct(true)} className="btn-primary btn-sm">
              Add Product
            </button>
          </div>
        ) : (
          <div className="nav-actions">
            <span className="user-badge">Not logged in</span>
            <button onClick={() => setShowLogin(true)} className="btn-primary btn-sm">
              Login
            </button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="hero-banner" style={{ marginTop: '24px' }}>
        <h2 className="hero-title" style={{ margin: 0 }}>Discover Premium Goods</h2>
        <p className="hero-subtitle">
          Explore our curated collection of high-quality products. Enjoy seamless interactions, real-time stock levels, and modern designs.
        </p>
      </section>

      {/* Modals & Forms */}
      {auth.user && showCreateProduct && (
        <div className="modal-overlay" onClick={() => setShowCreateProduct(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <ProductForm
              onProductCreated={(newProduct) => {
                setProducts([...products, newProduct]);
                setShowCreateProduct(false);
              }}
              onCancel={() => setShowCreateProduct(false)}
            />
          </div>
        </div>
      )}

      {auth.user && showUpdateProduct && selectedProduct && (
        <div className="modal-overlay" onClick={() => {
          setShowUpdateProduct(false);
          setSelectedProductId(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <ProductForm
              key={selectedProduct.id}
              initialProduct={selectedProduct}
              onProductUpdated={(updatedProduct) => {
                setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
                setShowUpdateProduct(false);
                setSelectedProductId(null);
              }}
              onCancel={() => {
                setShowUpdateProduct(false);
                setSelectedProductId(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Login Form Modal */}
      {!auth.user && showLogin && (
        <div className="modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <LoginForm onCancel={() => setShowLogin(false)} />
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {viewProduct && (
        <div className="modal-overlay" onClick={() => setViewProduct(null)}>
          <div className="modal-content product-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Product Details</h2>
              <button 
                onClick={() => setViewProduct(null)} 
                className="btn-secondary btn-sm"
                style={{ width: '32px', height: '32px', borderRadius: '50%', padding: 0 }}
              >
                ✕
              </button>
            </div>

            <div className="product-detail-image-placeholder">
              <span style={{ fontSize: '3.5rem' }}>📦</span>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '8px', fontWeight: 500 }}>
                Premium Quality Certified
              </p>
            </div>

            <h3 style={{ fontSize: '1.4rem', marginBottom: '12px', fontWeight: 700 }}>{viewProduct.name}</h3>

            <div className="product-detail-price-stock">
              <span className="product-detail-price">${viewProduct.price.toFixed(2)}</span>
              <span className={`product-stock ${viewProduct.stock > 0 ? 'stock-in' : 'stock-out'}`}>
                {viewProduct.stock > 0 ? `${viewProduct.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            <div className="product-detail-description-section">
              <h4>Description</h4>
              <p className="product-detail-desc">{viewProduct.description || 'No description provided for this product.'}</p>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button onClick={() => setViewProduct(null)} className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                Back to Catalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products list - visible to everyone */}
      <main style={{ marginTop: '32px' }}>
        <h2>Available Products</h2>

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading products...</p>
          </div>
        )}

        {error && (
          <div className="form-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="loading-container">
            <p>No products available. Add some products to see them here.</p>
          </div>
        )}

        <ul className="products-grid">
          {products.map((product) => (
            <li 
              key={product.id} 
              className="product-card"
              onClick={() => setViewProduct(product)}
              style={{ cursor: 'pointer' }}
            >
              <h3 className="product-name">{product.name}</h3>
              <p className="product-desc">{product.description}</p>
              
              <div className="product-meta">
                <span className="product-price">${product.price.toFixed(2)}</span>
                <span className={`product-stock ${product.stock > 0 ? 'stock-in' : 'stock-out'}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              {auth.user && (
                <div className="product-actions" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => product.id !== undefined && handleUpdateClick(product.id)}
                    className="btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    Update
                  </button>
                  <button 
                    onClick={() => product.id !== undefined && handleDeleteClick(product.id)}
                    className="btn-danger btn-sm"
                    style={{ flex: 1 }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}