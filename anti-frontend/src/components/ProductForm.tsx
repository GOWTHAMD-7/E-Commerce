// src/components/ProductForm.tsx
import React, { useState } from 'react';
import { createProduct, updateProduct } from '../api';
import type { Product } from '../types';

interface ProductFormProps {
  initialProduct?: Product;
  onProductCreated?: (newProduct: Product) => void;
  onProductUpdated?: (updatedProduct: Product) => void;
  onCancel?: () => void;
}

export default function ProductForm({
  initialProduct,
  onProductCreated,
  onProductUpdated,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState(initialProduct?.name || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [price, setPrice] = useState(initialProduct?.price !== undefined ? initialProduct.price.toString() : '');
  const [stock, setStock] = useState(initialProduct?.stock !== undefined ? initialProduct.stock.toString() : '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    // Client-side validations
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be a positive number');
      setLoading(false);
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setError('Stock cannot be negative');
      setLoading(false);
      return;
    }

    try {
      if (initialProduct?.id !== undefined) {
        const updated = await updateProduct({
          id: initialProduct.id,
          name,
          description,
          price: priceNum,
          stock: stockNum,
        });
        
        if (onProductUpdated) {
          onProductUpdated(updated);
        }
      } else {
        const newProduct = await createProduct({
          name,
          description,
          price: priceNum,
          stock: stockNum,
        });
        
        // Notify parent to append the product to the list
        if (onProductCreated) {
          onProductCreated(newProduct);
        }

        // Clear the form
        setName('');
        setDescription('');
        setPrice('');
        setStock('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{initialProduct ? 'Update Product' : 'Add Product'}</h3>
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn-secondary btn-sm"
            style={{ width: '32px', height: '32px', borderRadius: '50%', padding: 0 }}
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="form-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="prod-name">Product Name</label>
          <input 
            id="prod-name"
            type="text" 
            className="form-input"
            placeholder="e.g., Wireless Headset"
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="prod-desc">Description</label>
          <textarea 
            id="prod-desc"
            className="form-input"
            placeholder="Describe the product details..."
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            style={{ minHeight: '80px', resize: 'vertical' }}
            required 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="prod-price">Price ($)</label>
            <input 
              id="prod-price"
              type="number" 
              step="0.01" 
              className="form-input"
              placeholder="0.00"
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prod-stock">Stock Count</label>
            <input 
              id="prod-stock"
              type="number" 
              className="form-input"
              placeholder="0"
              value={stock} 
              onChange={e => setStock(e.target.value)} 
              required 
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel} 
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary"
            style={{ flex: 1 }}
          >
            {loading ? (initialProduct ? 'Updating...' : 'Creating...') : (initialProduct ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  );
}
