// src/components/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, deleteProduct } from '../api';
import type { Product, User } from '../types';
import ProductForm from './ProductForm';

interface AdminDashboardProps {
  activeTab: 'dashboard' | 'users' | 'products' | 'sellers';
}

// Prepopulate some mock users so the matrix is lively and editable
const INITIAL_MOCK_USERS: User[] = [
  { id: 1, email: 'admin@gmail.com', role: 'ADMIN' },
  { id: 2, email: 'seller@gmail.com', role: 'SELLER' },
  { id: 3, email: 'customer@gmail.com', role: 'CUSTOMER' },
  { id: 4, email: 'alice.smith@gmail.com', role: 'CUSTOMER' },
  { id: 5, email: 'alex.seller@gmail.com', role: 'SELLER' },
  { id: 6, email: 'bob.builder@gmail.com', role: 'CUSTOMER' }
];

export default function AdminDashboard({ activeTab }: AdminDashboardProps) {
  const navigate = useNavigate();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_MOCK_USERS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const prods = await fetchProducts();
      setAllProducts(prods || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch global storefront products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = (userId: number, newRole: 'CUSTOMER' | 'SELLER' | 'ADMIN') => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    alert('User role updated successfully (simulated).');
  };

  const handleDeleteProduct = async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this product from store? (Admin Audit)');
    if (!confirmed) return;
    try {
      await deleteProduct(id);
      setAllProducts(prev => prev.filter(p => p.id !== id));
      alert('Product deleted successfully (Admin Audit).');
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading admin console...</p>
      </div>
    );
  }

  // Calculate high-level stats
  const totalProducts = allProducts.length;
  const lowStockProducts = allProducts.filter(p => p.stock > 0 && p.stock <= 15).length;
  const outOfStockProducts = allProducts.filter(p => p.stock === 0).length;
  const totalSellers = users.filter(u => u.role === 'SELLER').length;
  const totalCustomers = users.filter(u => u.role === 'CUSTOMER').length;

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
          Admin Center
        </div>
        <button
          onClick={() => { setEditingProduct(null); navigate('/admin/dashboard'); }}
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
          🛡️ Overview Hub
        </button>
        <button
          onClick={() => { setEditingProduct(null); navigate('/admin/users'); }}
          style={{
            textAlign: 'left',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'users' ? 'var(--color-primary-light)' : 'transparent',
            color: activeTab === 'users' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'users' ? 600 : 500,
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          👥 User Directory
        </button>
        <button
          onClick={() => { setEditingProduct(null); navigate('/admin/products'); }}
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
          🔍 Audit Products
        </button>
        <button
          onClick={() => { setEditingProduct(null); navigate('/admin/sellers'); }}
          style={{
            textAlign: 'left',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'sellers' ? 'var(--color-primary-light)' : 'transparent',
            color: activeTab === 'sellers' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'sellers' ? 600 : 500,
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          🏪 Seller Verification
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
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '24px' }}>Store Control Overview</h2>
            
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid #bbf7d0'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>Store Listings</span>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#14532d', marginTop: '8px' }}>{totalProducts}</h3>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid #fecaca'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Out of Stock</span>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#7f1d1d', marginTop: '8px' }}>{outOfStockProducts}</h3>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid #bfdbfe'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e40af', textTransform: 'uppercase' }}>Registered Sellers</span>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e3a8a', marginTop: '8px' }}>{totalSellers}</h3>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)',
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid #e9d5ff'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b21a8', textTransform: 'uppercase' }}>Customer base</span>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#581c87', marginTop: '8px' }}>{totalCustomers}</h3>
              </div>
            </div>

            {/* Quick Audit Metrics Panel */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '24px'
            }}>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px' }}>Site Audit Checklist</h4>
              <ul style={{
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Critical Stock Alerts (Out of Stock)</span>
                  <span style={{
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    background: outOfStockProducts > 0 ? 'var(--color-danger-light)' : 'var(--color-success-light)',
                    color: outOfStockProducts > 0 ? 'var(--color-danger)' : 'var(--color-success)'
                  }}>
                    {outOfStockProducts} Products
                  </span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Restock Required Alerts (Low Stock)</span>
                  <span style={{
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    background: 'var(--color-bg-surface-hover)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {lowStockProducts} Products
                  </span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>System Integrity Checks</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.875rem' }}>🟢 Operational</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '24px' }}>User Directory Matrix</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>ID</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Email Address</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Role Permissions</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Modify Access</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="table-row-hover">
                      <td style={{ padding: '16px', fontWeight: 600 }}>{u.id}</td>
                      <td style={{ padding: '16px' }}>{u.email}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          background: u.role === 'ADMIN' ? 'var(--color-danger-light)' : u.role === 'SELLER' ? 'var(--color-primary-light)' : 'var(--color-bg-surface-hover)',
                          color: u.role === 'ADMIN' ? 'var(--color-danger)' : u.role === 'SELLER' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id!, e.target.value as any)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            background: 'white',
                            color: 'var(--color-text-primary)',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          <option value="CUSTOMER">Customer</option>
                          <option value="SELLER">Seller</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  setAllProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
                  setEditingProduct(null);
                  alert('Storefront product updated successfully.');
                }}
              />
            ) : (
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '24px' }}>Product Catalog Auditor</h2>
                
                {allProducts.length === 0 ? (
                  <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '40px 0' }}>No products listed on storefront.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                          <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>ID</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Product details</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Stock</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Price</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Audit Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allProducts.map(product => (
                          <tr key={product.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="table-row-hover">
                            <td style={{ padding: '16px', fontWeight: 600 }}>#{product.id}</td>
                            <td style={{ padding: '16px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{product.name}</div>
                              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Seller: {product.seller?.email || 'System Storefront'}</div>
                            </td>
                            <td style={{ padding: '16px' }}>{product.stock}</td>
                            <td style={{ padding: '16px', fontWeight: 600 }}>${product.price.toFixed(2)}</td>
                            <td style={{ padding: '16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => setEditingProduct(product)}
                                  className="btn-secondary btn-sm"
                                  style={{ padding: '6px 12px' }}
                                >
                                  Override Edit
                                </button>
                                <button
                                  onClick={() => product.id !== undefined && handleDeleteProduct(product.id)}
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

        {/* SELLERS TAB */}
        {activeTab === 'sellers' && (
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '24px' }}>Seller Storefront Verification</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Merchant Info</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Approval Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'right' }}>Security Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { email: 'seller@gmail.com', store: 'Aura Premium Gadgets', status: 'VERIFIED' },
                    { email: 'alex.seller@gmail.com', store: 'Alex Tech Depot', status: 'VERIFIED' },
                    { email: 'bad.seller@store.com', store: 'Cheap Copycats Corp', status: 'FLAGGED' },
                  ].map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }} className="table-row-hover">
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.store}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Owner: {s.email}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          background: s.status === 'VERIFIED' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                          color: s.status === 'VERIFIED' ? 'var(--color-success)' : 'var(--color-danger)'
                        }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button
                          onClick={() => alert(`Status updated for ${s.store} (simulated action).`)}
                          className="btn-secondary btn-sm"
                          style={{
                            padding: '6px 12px',
                            borderColor: s.status === 'VERIFIED' ? 'var(--color-danger)' : 'var(--color-success)',
                            color: s.status === 'VERIFIED' ? 'var(--color-danger)' : 'var(--color-success)'
                          }}
                        >
                          {s.status === 'VERIFIED' ? 'Suspend Store' : 'Approve Merchant'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
