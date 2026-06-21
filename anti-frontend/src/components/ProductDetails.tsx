import { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { fetchProductById } from '../api';
import { renderStockBadge } from './ProductCard';
import ProductCard from './ProductCard';
import { AuthContext } from '../context/AuthContext';

interface ProductDetailsProps {
  products: Product[]; // Mapped for category recommendations matching
  favorites: Product[];
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => Promise<void>;
}

export default function ProductDetails({
  products,
  favorites,
  onToggleFavorite,
  onAddToCart,
  onBuyNow
}: ProductDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [buying, setBuying] = useState(false);

  // Redesign states
  const [activeImage, setActiveImage] = useState<string>('');
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center' });

  // Load product details whenever the URL id changes
  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    setImageError(false);
    setQty(1);

    fetchProductById(Number(id))
      .then((data) => {
        setProduct(data);
        setActiveImage(data.mainImage || data.imageUrl || '');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch product details.');
        setLoading(false);
      });
  }, [id]);

  const handleBuyNow = async () => {
    if (!product || product.id === undefined) return;
    setBuying(true);
    try {
      await onBuyNow(product, qty);
    } catch (err) {
      console.error(err);
    } finally {
      setBuying(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ transformOrigin: 'center' });
  };

  const isFav = product?.id !== undefined && favorites.some(fav => fav.id === product.id);
  const currentUser = auth?.user;
  
  const isOwner = currentUser?.role === 'SELLER' && product?.seller && (
    product.seller.id === currentUser.id || product.seller.email === currentUser.email
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse" style={{ marginTop: '32px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 aspect-square bg-slate-100 rounded-3xl" />
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-8 bg-slate-100 rounded w-3/4" />
            <div className="h-5 bg-slate-100 rounded w-1/3" />
            <div className="h-10 bg-slate-100 rounded w-1/2 mt-4" />
            <div className="h-24 bg-slate-100 rounded w-full mt-4" />
            <div className="h-12 bg-slate-100 rounded-xl w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="loading-container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</span>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Product Not Found</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>{error || "The product you are looking for doesn't exist or was removed."}</p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>Back to Homepage</Link>
      </div>
    );
  }

  // Find related products in the same category
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 8);

  const hasStock = product.stock > 0;

  const primaryImg = product.mainImage || product.imageUrl || '';
  const thumbnails = [];
  if (primaryImg) {
    thumbnails.push({ id: 0, url: primaryImg, label: 'Main View' });
  }
  if (product.images && product.images.length > 0) {
    product.images.forEach((img, idx) => {
      thumbnails.push({ id: idx + 1, url: img, label: `Angle ${idx + 2}` });
    });
  } else if (primaryImg) {
    thumbnails.push(
      { id: 1, url: primaryImg, label: 'Secondary View', style: { filter: 'brightness(1.05) contrast(1.02)' } },
      { id: 2, url: primaryImg, label: 'Cropped Detail', style: { transform: 'scale(1.15) translate(5px, 5px)' } },
      { id: 3, url: primaryImg, label: 'Macro Spec', style: { filter: 'contrast(1.08) saturate(1.05)' } }
    );
  }



  const highlights = [
    'Premium materials and robust build quality.',
    'Aura Quality Certified & Verified authentic vendor dispatch.',
    'Fast delivery tracking coordinates included on shipment.',
    'Eligible for 7-day hassle-free refunds and product replacement.'
  ];

  const specifications = [
    { label: 'Brand Name', value: product.brand || 'Aura Signature' },
    { label: 'Category', value: product.category || 'General Catalog' },
    { label: 'Model Tag', value: product.name },
    { label: 'Merchant', value: product.seller?.storeName || 'Aura Partner Retailer' },
    { label: 'Inventory State', value: product.stock > 0 ? `${product.stock} units available` : 'Out of Stock' },
    { label: 'Warranty Duration', value: '1 Year Limited Manufacturer Warranty' },
    { label: 'Package Weight', value: '230g' },
    { label: 'Dimensions', value: '16.5 x 7.6 x 0.8 cm' },
  ];

  const mockReviews = [
    {
      id: 1,
      author: 'John Doe',
      rating: 5,
      title: 'Absolutely worth the price!',
      date: 'June 10, 2026',
      content: 'This product exceeded my expectations. The build quality feels premium and it was delivered within 24 hours. Highly recommend to anyone looking for a reliable option!',
      verified: true
    },
    {
      id: 2,
      author: 'Jane Smith',
      rating: 4,
      title: 'Great quality, but minor packaging issue',
      date: 'June 08, 2026',
      content: 'The product itself is amazing and works perfectly. The outer cardboard box was slightly bent, but everything inside was safe. Excellent value.',
      verified: true
    },
    {
      id: 3,
      author: 'Alex Carter',
      rating: 5,
      title: 'Amazing seller support!',
      date: 'May 28, 2026',
      content: 'The merchant answered all my queries immediately. Highly authentic product and fast shipping. Aura storefront has been a great shopping experience.',
      verified: true
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-1 py-4" style={{ marginTop: '24px' }}>
      
      {/* Navigation Row */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        {/* Back Arrow Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 w-fit focus:outline-none p-0"
          style={{ padding: '8px 14px' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </button>

        {/* Breadcrumbs */}
        <nav className="text-xs text-slate-500 font-medium">
          <Link to="/" className="hover:text-slate-800 transition-colors">Home</Link>
          <span className="mx-2 text-slate-300">/</span>
          {product.category && (
            <>
              <span className="text-slate-400 capitalize">{product.category}</span>
              <span className="mx-2 text-slate-300">/</span>
            </>
          )}
          <span className="font-bold text-slate-800 line-clamp-1 max-w-[200px] inline-block align-bottom">{product.name}</span>
        </nav>
      </div>

      {/* Main Details Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white p-6 md:p-8 rounded-3xl border border-slate-100/80 shadow-[0_4px_30px_rgba(0,0,0,0.01)] mb-10">
        
        {/* Left Side Column: Images & Gallery */}
        <div className="lg:col-span-5 flex flex-col md:flex-row gap-4">
          
          {/* Gallery Sidebar */}
          {thumbnails.length > 1 && (
            <div className="flex flex-row md:flex-col gap-2.5 order-2 md:order-1 justify-center md:justify-start">
              {thumbnails.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveImage(t.url)}
                  className={`w-14 h-14 rounded-xl border-2 overflow-hidden bg-slate-50/50 flex items-center justify-center p-1.5 transition-all focus:outline-none p-0 ${
                    activeImage === t.url ? 'border-indigo-600 scale-105 shadow-sm' : 'border-slate-100 hover:border-slate-200'
                  }`}
                  style={{ padding: '6px' }}
                >
                  <img src={t.url} alt={t.label} className="w-full h-full object-contain" style={t.style} />
                </button>
              ))}
            </div>
          )}

          {/* Frame of Active Image with Zoom */}
          <div className="flex-1 relative aspect-square rounded-2xl border border-slate-100/80 bg-slate-50/30 flex items-center justify-center overflow-hidden order-1 md:order-2">
            {activeImage && !imageError ? (
              <div 
                className="w-full h-full overflow-hidden flex items-center justify-center relative group"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img 
                  src={activeImage} 
                  alt={product.name} 
                  className="w-full h-full object-contain p-6 cursor-zoom-in transition-transform duration-150 ease-out origin-center hover:scale-[1.8]" 
                  style={zoomStyle}
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 text-slate-300 gap-3">
                <svg className="w-16 h-16 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">No Image</span>
              </div>
            )}

            {/* Floating Heart Button */}
            <button
              type="button"
              className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200/50 text-slate-400 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all shadow-sm z-10 p-0"
              onClick={() => product.id !== undefined && onToggleFavorite(product.id)}
              aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
            >
              {isFav ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-rose-500">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5 text-slate-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Right Side Column: Meta Info & Actions */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Brand */}
            {product.brand && (
              <span className="text-[11px] font-bold text-slate-450 uppercase tracking-widest mb-1.5 block">
                {product.brand}
              </span>
            )}

            {/* Product Title */}
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight mb-2.5">
              {product.name}
            </h1>

            {/* Ratings & Category badges */}
            <div className="flex items-center gap-3.5 mb-5 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 border border-amber-500/15 px-2.5 py-0.5 rounded-full text-xs font-bold">
                <span>{product.rating ? product.rating.toFixed(1) : '0.0'}</span>
                <svg className="w-3.5 h-3.5 fill-current text-amber-500" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </span>
              <span className="text-xs text-slate-400 font-semibold">({product.reviewCount || 0} customer reviews)</span>
              
              {product.category && (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/40 uppercase tracking-wider">
                  {product.category}
                </span>
              )}
            </div>

            <hr className="border-slate-100 mb-5" />

            {/* Pricing Section */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-semibold mb-0.5 uppercase tracking-wider leading-none">Special Store Price</span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-black text-slate-900">${product.price.toFixed(2)}</span>
                  <span className="text-sm text-slate-400 line-through">${(product.price * 1.25).toFixed(2)}</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/30">20% OFF</span>
                </div>
              </div>
              
              <div>
                {renderStockBadge(product.stock)}
              </div>
            </div>

            <hr className="border-slate-100 mb-5" />

            {/* Product Highlights */}
            <div className="mb-5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 block">Store Highlights</span>
              <ul className="list-disc pl-5 text-xs text-slate-500 space-y-1.5 font-medium">
                {highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>

            {/* Delivery Alert Cards */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150/40 flex flex-col gap-3 mb-6">
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Free Express Shipping - Guaranteed Delivery by <strong>Tomorrow, 11 AM</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                <svg className="w-5 h-5 text-indigo-650 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Aura Pay Checkout Security Shield - Encrypted SSL Payment processing</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          {!isOwner ? (
            <div className="flex flex-col gap-4">
              
              {/* Stepper counter */}
              <div className="flex items-center gap-3.5 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchase Quantity:</span>
                <div className="flex items-center bg-slate-100 hover:bg-slate-200/60 rounded-xl p-0.5 transition-colors border border-slate-200/20">
                  <button 
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent p-0"
                    disabled={!hasStock}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5" />
                    </svg>
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-700">{qty}</span>
                  <button 
                    type="button"
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    className="w-8 h-8 flex items-center justify-center font-bold text-slate-650 hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent p-0"
                    disabled={!hasStock}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Add to Cart, Buy Now, Add to Wishlist Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => onAddToCart(product, qty)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl transition-all shadow-sm hover:shadow p-0"
                  disabled={!hasStock}
                  style={{ padding: '12px 20px' }}
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Add to Cart</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl transition-all shadow-sm hover:shadow p-0"
                  disabled={!hasStock || buying}
                  style={{ padding: '12px 20px' }}
                >
                  <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>{buying ? 'Processing...' : 'Buy Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => product.id !== undefined && onToggleFavorite(product.id)}
                  className={`flex-1 sm:flex-initial py-3 px-4 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 focus:outline-none p-0 ${
                    isFav 
                      ? 'bg-rose-50 text-rose-600 border-rose-200/50 hover:bg-rose-100/50' 
                      : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                  }`}
                  style={{ padding: '12px 16px', minWidth: '120px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-4.5 h-4.5 text-rose-500">
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  <span>{isFav ? 'Wishlisted' : 'Wishlist'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-indigo-50/50 text-indigo-700 rounded-2xl border border-indigo-150/40 font-bold text-center text-xs">
              🏪 You are the seller of this product listing. Cart actions are locked.
            </div>
          )}
        </div>
      </div>

      {/* Product Specifications & Full Description Panels */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
        
        {/* Specifications Table */}
        <div className="md:col-span-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-100/80 shadow-[0_4px_30px_rgba(0,0,0,0.01)]">
          <h3 className="text-base font-bold text-slate-800 mb-4 pb-2.5 border-b border-slate-100">Product Specifications</h3>
          <table className="w-full text-xs text-slate-600 border-collapse">
            <tbody>
              {specifications.map((spec, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50/40' : 'bg-white'}>
                  <td className="py-3 px-3 font-semibold text-slate-400 w-1/3 border-b border-slate-100/40">{spec.label}</td>
                  <td className="py-3 px-3 text-slate-800 border-b border-slate-100/40 font-medium">{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detailed Rich Description */}
        <div className="md:col-span-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-100/80 shadow-[0_4px_30px_rgba(0,0,0,0.01)]">
          <h3 className="text-base font-bold text-slate-800 mb-4 pb-2.5 border-b border-slate-100">Product Description</h3>
          <div className="text-xs leading-relaxed text-slate-600 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Experience Aura Premium Design standards</h4>
            <p>
              {product.description || 'No description provided for this premium product.'}
            </p>
            <p>
              Designed with user experience in mind, this item offers excellent longevity, ease of operation, and high efficiency parameters. Every batch undergoes strict QA vetting prior to supplier storage.
            </p>
            <hr className="border-slate-100" />
            <div className="flex items-center gap-2 text-indigo-600 font-bold">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span>Authenticity & Quality Certified by Aura Storefront</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews, Star Distribution, and Comments Panel */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100/80 shadow-[0_4px_30px_rgba(0,0,0,0.01)] mb-10">
        <h3 className="text-base font-bold text-slate-800 mb-6 pb-2.5 border-b border-slate-100">Customer Reviews & Ratings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
          {/* Rating Summary Card */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-8">
            <span className="text-5xl font-black text-slate-800 mb-1">{product.rating ? product.rating.toFixed(1) : '4.5'}</span>
            <div className="flex items-center gap-0.5 text-amber-400 mb-2.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Store Average rating</span>
            <span className="text-xs text-slate-450 font-medium">Based on {product.reviewCount || 120} global customer scores</span>
          </div>

          {/* Histogram distribution */}
          <div className="md:col-span-4 flex flex-col gap-2.5 justify-center">
            {[
              { stars: 5, pct: 72 },
              { stars: 4, pct: 18 },
              { stars: 3, pct: 6 },
              { stars: 2, pct: 3 },
              { stars: 1, pct: 1 },
            ].map((dist) => (
              <div key={dist.stars} className="flex items-center gap-3 text-xs font-semibold text-slate-650">
                <span className="w-10 text-right">{dist.stars} star</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${dist.pct}%` }} />
                </div>
                <span className="w-8 text-slate-400">{dist.pct}%</span>
              </div>
            ))}
          </div>

          {/* Verification Badge panel */}
          <div className="md:col-span-4 bg-slate-50 p-4 rounded-2xl border border-slate-150/40 flex flex-col justify-center gap-2">
            <span className="text-xs font-bold text-slate-700">100% Verified Review Auditing</span>
            <p className="text-[11px] text-slate-500 leading-normal">
              Aura verifies that reviews represent valid merchant purchases. Feedback is aggregated to support consumer purchasing decisions.
            </p>
          </div>
        </div>

        <hr className="border-slate-100 my-6" />

        {/* Mock Reviews Lists */}
        <div className="space-y-6">
          {mockReviews.map((rev) => (
            <div key={rev.id} className="pb-6 border-b border-slate-100 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-indigo-600 border border-indigo-150/30">
                  {rev.author.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-xs font-bold text-slate-750">{rev.author}</span>
                {rev.verified && (
                  <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">
                    Verified Buyer
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-semibold ml-auto">{rev.date}</span>
              </div>

              <div className="flex items-center gap-0.5 text-amber-400 mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-slate-100 fill-current'}`} viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>

              <h4 className="text-xs font-bold text-slate-800 mb-1.5">{rev.title}</h4>
              <p className="text-xs text-slate-550 leading-relaxed">{rev.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal related products slider */}
      {relatedProducts.length > 0 && (
        <section className="mt-12 pt-8 border-t border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Related Products you might like</h3>
          
          <div className="relative">
            {/* Scrollable Row */}
            <div className="flex gap-6 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory scrollbar-none" style={{ scrollbarWidth: 'none' }}>
              {relatedProducts.map((p) => (
                <div key={p.id} className="w-64 flex-shrink-0 snap-start">
                  <ProductCard
                    product={p}
                    isFavorited={favorites.some((fav) => fav.id === p.id)}
                    onToggleFavorite={onToggleFavorite}
                    onAddToCart={onAddToCart}
                    currentUser={currentUser}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
