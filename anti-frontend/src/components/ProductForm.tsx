// src/components/ProductForm.tsx
import React, { useState } from 'react';
import { 
  createProduct, 
  updateProduct, 
  uploadProductImage
} from '../api';
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
  const [category, setCategory] = useState(initialProduct?.category || '');
  const [brand, setBrand] = useState(initialProduct?.brand || '');
  const [price, setPrice] = useState(initialProduct?.price !== undefined ? initialProduct.price.toString() : '');
  const [stock, setStock] = useState(initialProduct?.stock !== undefined ? initialProduct.stock.toString() : '');
  const [imageUrl, setImageUrl] = useState(initialProduct?.mainImage || initialProduct?.imageUrl || '');
  
  // Custom Fields (Other Images)
  const [otherImages, setOtherImages] = useState<string[]>(initialProduct?.images || []);

  const [mainUploading, setMainUploading] = useState(false);
  const [othersUploading, setOthersUploading] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Main image handler
  const handleMainFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setMainUploading(true);
    setError(null);

    try {
      const uploadedUrl = await uploadProductImage(file);
      setImageUrl(uploadedUrl);
    } catch (err: any) {
      setError(err.message || 'Main image upload failed');
    } finally {
      setMainUploading(false);
    }
  };

  // Multiple other images handler
  const handleOtherFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setOthersUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error('All uploaded files must be images');
        }
        return await uploadProductImage(file);
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setOtherImages([...otherImages, ...uploadedUrls]);
    } catch (err: any) {
      setError(err.message || 'One or more other images failed to upload');
    } finally {
      setOthersUploading(false);
    }
  };

  const handleRemoveOtherImage = (indexToRemove: number) => {
    setOtherImages(otherImages.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetAsMainImage = (url: string) => {
    const oldMain = imageUrl;
    setImageUrl(url);
    if (oldMain) {
      // Replace the selected url with old main in the list
      setOtherImages(prev => prev.map(img => img === url ? oldMain : img));
    } else {
      // Remove it from other images since it is now main
      setOtherImages(prev => prev.filter(img => img !== url));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

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
      const payload: Product = {
        name,
        description,
        category,
        brand,
        price: priceNum,
        stock: stockNum,
        imageUrl,
        mainImage: imageUrl,
        images: otherImages,
      };

      if (initialProduct?.id !== undefined) {
        payload.id = initialProduct.id;
        const updated = await updateProduct(payload);
        if (onProductUpdated) {
          onProductUpdated(updated);
        }
      } else {
        const newProduct = await createProduct(payload);
        if (onProductCreated) {
          onProductCreated(newProduct);
        }

        // Reset Form
        setName('');
        setDescription('');
        setCategory('');
        setBrand('');
        setPrice('');
        setStock('');
        setImageUrl('');
        setOtherImages([]);
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
        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }} className="text-slate-800">
          {initialProduct ? '✏️ Edit Product Details' : '🆕 Add New Product'}
        </h3>
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn-secondary btn-sm"
            style={{ width: '32px', height: '32px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: '20px' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="prod-name">Product Name</label>
          <input 
            id="prod-name"
            type="text" 
            className="form-input"
            placeholder="e.g., Ultra Zoom DSLR Camera"
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="prod-desc">Description</label>
          <textarea 
            id="prod-desc"
            className="form-input"
            placeholder="Describe the key features, materials, and benefits of your product..."
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            style={{ minHeight: '100px', resize: 'vertical' }}
            required 
          />
        </div>

        {/* 1. Main Image Upload */}
        <div className="form-group">
          <label className="form-label">Main Product Image (Default Thumbnail)</label>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
            }}>
              {mainUploading ? (
                <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
              ) : imageUrl ? (
                <>
                  <img src={imageUrl} alt="Main Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      border: 'none',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove Image"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <div className="text-center text-slate-400">
                  <span style={{ fontSize: '2rem' }}>🖼️</span>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>No Image</div>
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleMainFileChange}
                disabled={mainUploading}
                style={{ fontSize: '0.875rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Upload a primary image or paste a direct image URL below
              </span>
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={mainUploading}
                style={{ fontSize: '0.875rem' }}
              />
            </div>
          </div>
        </div>

        {/* 2. Other Images (Multiple Uploads) */}
        <div className="form-group">
          <label className="form-label">Other Product Images (Gallery)</label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleOtherFilesChange}
                disabled={othersUploading}
                style={{ fontSize: '0.875rem' }}
              />
              {othersUploading && <div className="spinner" style={{ width: '20px', height: '20px' }}></div>}
            </div>

            {otherImages.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                {otherImages.map((url, idx) => (
                  <div key={idx} style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#f8fafc',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }} className="group">
                    <img src={url} alt={`Gallery Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    
                    {/* Hover tools overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(15, 23, 42, 0.65)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      opacity: 0,
                      transition: 'opacity 0.2s'
                    }} className="hover-overlay-btn group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleSetAsMainImage(url)}
                        style={{
                          fontSize: '10px',
                          color: 'white',
                          background: 'var(--color-primary)',
                          border: 'none',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 650
                        }}
                      >
                        Set Main
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveOtherImage(idx)}
                        style={{
                          fontSize: '10px',
                          color: 'white',
                          background: 'rgba(239,68,68,0.9)',
                          border: 'none',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Tip: Hover over thumbnail to swap it with the main image or delete it.
            </span>
          </div>
        </div>

        {/* Brand & Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="prod-category">Category</label>
            <input 
              id="prod-category"
              type="text" 
              className="form-input"
              placeholder="e.g., Electronics"
              value={category} 
              onChange={e => setCategory(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prod-brand">Brand</label>
            <input 
              id="prod-brand"
              type="text" 
              className="form-input"
              placeholder="e.g., Sony"
              value={brand} 
              onChange={e => setBrand(e.target.value)} 
            />
          </div>
        </div>



        {/* Price & Stock */}
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

        {/* Custom style to handle CSS hover transitions for thumbnail overlays */}
        <style dangerouslySetInnerHTML={{__html: `
          .group:hover .hover-overlay-btn {
            opacity: 1 !important;
          }
        `}} />

        {/* Form Action Controls */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel} 
              className="btn-secondary"
              style={{ flex: 1, height: '44px' }}
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            disabled={loading || mainUploading || othersUploading} 
            className="btn-primary"
            style={{ flex: 1, height: '44px' }}
          >
            {loading ? (initialProduct ? 'Updating...' : 'Creating...') : (initialProduct ? 'Save Changes' : 'Publish Product')}
          </button>
        </div>
      </form>
    </div>
  );
}
