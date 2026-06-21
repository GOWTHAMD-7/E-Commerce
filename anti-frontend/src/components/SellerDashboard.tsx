// src/components/SellerDashboard.tsx
import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  fetchSellerProducts, 
  deleteProduct, 
  fetchSellerSales, 
  fetchSellerRevenue
} from '../api';
import type { Product } from '../types';
import ProductForm from './ProductForm';

interface SellerDashboardProps {
  activeTab: 'dashboard' | 'products' | 'add-product' | 'sales';
}

export default function SellerDashboard({ activeTab }: SellerDashboardProps) {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodData, salesData, revData] = await Promise.all([
        fetchSellerProducts(),
        fetchSellerSales(),
        fetchSellerRevenue()
      ]);
      setProducts(prodData || []);
      setSales(salesData || []);
      setRevenue(revData?.revenue || 0);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load seller dashboard details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.user) {
      loadDashboardData();
    }
  }, [auth?.user]);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this product?');
    if (!confirmed) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      alert('Product deleted successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading dashboard data...</p>
      </div>
    );
  }

  // Calculate statistics
  const totalListings = products.length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 15).length;
  const totalUnitsSold = sales.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '240px 1fr',
      gap: '32px',
      marginTop: '24px',
      alignItems: 'start'
    }}>
      {/* Sidebar Navigation */}
      <aside style={{
        background: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{
          padding: '8px 12px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '12px'
        }}>
          Seller Hub
        </div>
        <button
          onClick={() => { setEditingProduct(null); navigate('/seller/dashboard'); }}
          style={{
            textAlign: 'left',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'dashboard' ? 'var(--color-primary-light)' : 'transparent',
            color: activeTab === 'dashboard' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'dashboard' ? 600 : 500,
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          📊 Overview
        </button>
        <button
          onClick={() => { setEditingProduct(null); navigate('/seller/products'); }}
          style={{
            textAlign: 'left',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'products' ? 'var(--color-primary-light)' : 'transparent',
            color: activeTab === 'products' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'products' ? 600 : 500,
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          📦 My Products
        </button>
        <button
          onClick={() => { setEditingProduct(null); navigate('/seller/add-product'); }}
          style={{
            textAlign: 'left',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'add-product' && !editingProduct ? 'var(--color-primary-light)' : 'transparent',
            color: activeTab === 'add-product' && !editingProduct ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'add-product' && !editingProduct ? 600 : 500,
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          ➕ Add Product
        </button>
        <button
          onClick={() => { setEditingProduct(null); navigate('/seller/sales'); }}
          style={{
            textAlign: 'left',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'sales' ? 'var(--color-primary-light)' : 'transparent',
            color: activeTab === 'sales' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'sales' ? 600 : 500,
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          📈 Sales & Analytics
        </button>
        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '16px', paddingTop: '16px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              textAlign: 'left',
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'var(--transition-fast)',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ← Back to Store
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main style={{
        background: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-md)',
        padding: '32px',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        minHeight: '480px'
      }}>
        {error && (
          <div className="form-error" style={{ marginBottom: '24px' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '24px' }}>Overview Dashboard</h2>
            
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid #bfdbfe'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e40af', textTransform: 'uppercase' }}>Total Revenue</span>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e3a8a', marginTop: '8px' }}>${revenue.toFixed(2)}</h3>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid #a7f3d0'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#065f46', textTransform: 'uppercase' }}>Units Sold</span>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#064e3b', marginTop: '8px' }}>{totalUnitsSold}</h3>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)',
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid #e9d5ff'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b21a8', textTransform: 'uppercase' }}>Active Listings</span>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#581c87', marginTop: '8px' }}>{totalListings}</h3>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #fff5f5, #fee2e2)',
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid #fecaca'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Low / Out of Stock</span>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#7f1d1d', marginTop: '8px' }}>{lowStock + outOfStock}</h3>
              </div>
            </div>

            {/* Sales Graph Mock (Stunning layout using modern CSS) */}
            <div style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              background: '#f8fafc'
            }}>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '20px' }}>Weekly Performance Trends</h4>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                height: '180px',
                padding: '10px 20px',
                borderBottom: '2px solid var(--color-border)',
                gap: '12px'
              }}>
                {[
                  { day: 'Mon', sales: 120, height: '40%' },
                  { day: 'Tue', sales: 340, height: '75%' },
                  { day: 'Wed', sales: 210, height: '55%' },
                  { day: 'Thu', sales: 480, height: '95%' },
                  { day: 'Fri', sales: 290, height: '65%' },
                  { day: 'Sat', sales: 150, height: '45%' },
                  { day: 'Sun', sales: 410, height: '85%' },
                ].map((bar, idx) => (
                  <div key={idx} style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>${bar.sales}</span>
                    <div style={{
                      width: '100%',
                      maxWidth: '32px',
                      height: bar.height,
                      background: 'linear-gradient(to top, var(--color-primary), #818cf8)',
                      borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                      transition: 'height 1s ease',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                    }} className="graph-bar-hover"></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '8px' }}>{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            {editingProduct ? (
              <ProductForm 
                initialProduct={editingProduct}
                onCancel={() => setEditingProduct(null)}
                onProductUpdated={(updated) => {
                  setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
                  setEditingProduct(null);
                  alert('Product updated successfully.');
                }}
              />
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Manage Listings</h2>
                  <button onClick={() => navigate('/seller/add-product')} className="btn-primary">
                    ➕ Add Product
                  </button>
                </div>

                {products.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>You haven't listed any products yet.</p>
                    <button onClick={() => navigate('/seller/add-product')} className="btn-primary">
                      Create Your First Listing
                    </button>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                          <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Product Info</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Price</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Stock</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(product => (
                          <tr key={product.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="table-row-hover">
                            <td style={{ padding: '16px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{product.name}</div>
                              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{product.category || 'No Category'}</div>
                            </td>
                            <td style={{ padding: '16px', fontWeight: 600 }}>${product.price.toFixed(2)}</td>
                            <td style={{ padding: '16px' }}>{product.stock}</td>
                            <td style={{ padding: '16px' }}>
                              {product.stock === 0 ? (
                                <span className="stock-badge stock-out">Out of Stock</span>
                              ) : product.stock <= 15 ? (
                                <span className="stock-badge stock-low">Low Stock</span>
                              ) : (
                                <span className="stock-badge stock-in">In Stock</span>
                              )}
                            </td>
                            <td style={{ padding: '16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => setEditingProduct(product)}
                                  className="btn-secondary btn-sm"
                                  style={{ padding: '6px 12px' }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => product.id !== undefined && handleDelete(product.id)}
                                  className="btn-secondary btn-sm"
                                  style={{ padding: '6px 12px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ADD PRODUCT TAB */}
        {activeTab === 'add-product' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '24px' }}>Add New Product</h2>
            <div style={{ maxWidth: '600px' }}>
              <ProductForm 
                onCancel={() => navigate('/seller/products')}
                onProductCreated={(newProduct) => {
                  setProducts(prev => [...prev, newProduct]);
                  navigate('/seller/products');
                  alert('Product created successfully.');
                }}
              />
            </div>
          </div>
        )}

        {/* SALES TAB */}
        {activeTab === 'sales' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '24px' }}>Sales & Transaction Logs</h2>
            
            {sales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '3rem' }}>📦</span>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '16px' }}>No orders have been placed for your products yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Order ID</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Product</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Quantity</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Unit Price</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Total Earnings</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }} className="table-row-hover">
                        <td style={{ padding: '16px', fontWeight: 700 }}>#{item.id || idx + 1001}</td>
                        <td style={{ padding: '16px', fontWeight: 600 }}>{item.product?.name || 'Unknown Item'}</td>
                        <td style={{ padding: '16px' }}>{item.quantity}</td>
                        <td style={{ padding: '16px' }}>${item.purchasedPrice.toFixed(2)}</td>
                        <td style={{ padding: '16px', fontWeight: 700, color: 'var(--color-success)' }}>
                          ${(item.purchasedPrice * item.quantity).toFixed(2)}
                        </td>
                        <td style={{ padding: '16px', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                          {item.orderDate ? new Date(item.orderDate).toLocaleDateString() : 'Recent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
