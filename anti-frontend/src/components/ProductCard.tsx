import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product, User } from '../types';

interface ProductCardProps {
  product: Product;
  isFavorited: boolean;
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  currentUser?: User | null;
  onUpdate?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function renderStars(rating: number = 0, reviewCount: number = 0) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span className="inline-flex items-center gap-0.5 bg-amber-500/10 text-amber-700 border border-amber-500/15 px-2 py-0.5 rounded-full text-[11px] font-bold">
        <span>{rating ? rating.toFixed(1) : '0.0'}</span>
        <svg className="w-3.5 h-3.5 fill-current text-amber-500" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      </span>
      <span className="text-xs text-slate-400 font-medium">({reviewCount})</span>
    </div>
  );
}

export function renderStockBadge(stock: number) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center text-[9px] font-extrabold px-2.5 py-1 rounded-full bg-rose-50/95 text-rose-700 border border-rose-200/50 shadow-sm backdrop-blur-sm tracking-wide uppercase">
        Out of Stock
      </span>
    );
  }
  if (stock <= 15) {
    return (
      <span className="inline-flex items-center text-[9px] font-extrabold px-2.5 py-1 rounded-full bg-amber-50/95 text-amber-700 border border-amber-200/50 shadow-sm backdrop-blur-sm tracking-wide uppercase">
        Only {stock} Left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[9px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50/95 text-emerald-700 border border-emerald-200/50 shadow-sm backdrop-blur-sm tracking-wide uppercase">
      In Stock
    </span>
  );
}

export default function ProductCard({ product, isFavorited, onToggleFavorite, onAddToCart, currentUser, onUpdate, onDelete }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [cardQty, setCardQty] = useState(1);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.id !== undefined) {
      onToggleFavorite(product.id);
    }
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product, cardQty);
    setCardQty(1); // Reset card quantity after adding
  };

  const handleQtyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const hasStock = product.stock > 0;
  
  const isOwner = currentUser?.role === 'SELLER' && product.seller && (
    product.seller.id === currentUser.id || product.seller.email === currentUser.email
  );

  const canModify = currentUser?.role === 'ADMIN' || 
    (currentUser?.role === 'SELLER' && product.seller && (
      product.seller.id === currentUser.id || product.seller.email === currentUser.email
    ));

  return (
    <div className="group relative bg-white border border-slate-100 rounded-[22px] overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col h-full">
      <Link to={`/product/${product.id}`} className="flex flex-col h-full p-4 no-underline text-inherit">
        
        {/* Card Image Wrapper with Shimmer Zoom */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-50/50 border border-slate-100/60 flex items-center justify-center mb-4">
          {(product.mainImage || product.imageUrl) && !imageError ? (
            <img 
              src={product.mainImage || product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 ease-out" 
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 text-slate-350 gap-2">
              <svg className="w-10 h-10 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">No Image</span>
            </div>
          )}

          {/* Absolute stock indicator on card image top-left */}
          <div className="absolute top-3 left-3 z-10">
            {renderStockBadge(product.stock)}
          </div>

          {/* Floating Heart Button */}
          <button
            type="button"
            className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/50 text-slate-400 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all shadow-sm z-10 p-0"
            onClick={handleHeartClick}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorited ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-rose-500" width="20" height="20">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5 text-slate-500" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            )}
          </button>
        </div>

        {/* Brand Label */}
        {product.brand && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
            {product.brand}
          </span>
        )}

        {/* Product Details */}
        <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1.5 group-hover:text-indigo-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed flex-grow">
          {product.description}
        </p>
        
        {/* Ratings & Category */}
        <div className="flex items-center gap-2 mb-2">
          {renderStars(product.rating || 0.0, product.reviewCount || 0)}
          {product.category && (
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/50 uppercase tracking-wider mb-2">
              {product.category}
            </span>
          )}
        </div>

        {/* Price display with discount badges */}
        <div className="mt-auto pt-3.5 border-t border-slate-100">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">${product.price.toFixed(2)}</span>
            <span className="text-xs text-slate-400 line-through">${(product.price * 1.25).toFixed(2)}</span>
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">20% OFF</span>
          </div>
        </div>

        {/* Card Add To Cart Action */}
        {!isOwner && (
          <div onClick={handleQtyClick} className="mt-3 flex items-center gap-2">
            {/* Sleek Quantity Selector */}
            <div className="flex items-center bg-slate-100 hover:bg-slate-200/60 rounded-xl p-0.5 transition-colors border border-slate-200/20">
              <button 
                type="button"
                onClick={() => setCardQty(Math.max(1, cardQty - 1))}
                className="w-7 h-7 flex items-center justify-center font-bold text-slate-600 hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent p-0"
                disabled={!hasStock || cardQty <= 1}
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5" />
                </svg>
              </button>
              <span className="w-5 text-center text-xs font-bold text-slate-700">{cardQty}</span>
              <button 
                type="button"
                onClick={() => setCardQty(Math.min(product.stock, cardQty + 1))}
                className="w-7 h-7 flex items-center justify-center font-bold text-slate-650 hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent p-0"
                disabled={!hasStock || cardQty >= product.stock}
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCartClick}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl transition-all shadow-sm hover:shadow"
              disabled={!hasStock}
            >
              {hasStock ? (
                <>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Add to Cart</span>
                </>
              ) : 'Out of Stock'}
            </button>
          </div>
        )}

        {/* Admin / Seller update / delete controls */}
        {canModify && onUpdate && onDelete && (
          <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button"
              onClick={() => product.id !== undefined && onUpdate(product.id)}
              className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl transition-all shadow-sm"
            >
              Edit
            </button>
            <button 
              type="button"
              onClick={() => product.id !== undefined && onDelete(product.id)}
              className="flex-1 py-2 px-3 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all"
            >
              Delete
            </button>
          </div>
        )}

      </Link>
    </div>
  );
}
