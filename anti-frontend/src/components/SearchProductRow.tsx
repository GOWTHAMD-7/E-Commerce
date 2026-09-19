import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product, User } from '../types';
import { Heart, ShoppingBag } from 'lucide-react';
import { renderStars, renderStockBadge } from './ProductCard';

interface SearchProductRowProps {
  product: Product;
  isFavorited: boolean;
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  currentUser?: User | null;
  onUpdate?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function SearchProductRow({
  product,
  isFavorited,
  onToggleFavorite,
  onAddToCart,
  currentUser,
  onUpdate,
  onDelete
}: SearchProductRowProps) {
  const [imageError, setImageError] = useState(false);

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
    onAddToCart(product, 1);
  };

  const hasStock = product.stock > 0;
  
  const canModify = currentUser?.role === 'ADMIN' || 
    (currentUser?.role === 'SELLER' && product.seller && (
      product.seller.id === currentUser.id || product.seller.email === currentUser.email
    ));

  return (
    <div className="group bg-white border border-slate-100 rounded-[22px] overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500">
      <Link to={`/product/${product.id}`} className="flex flex-col md:flex-row no-underline text-inherit">
        
        {/* Left Side: Product Image */}
        <div className="relative w-full md:w-64 shrink-0 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 flex items-center justify-center p-4">
          <div className="relative aspect-square w-full md:w-56 overflow-hidden rounded-xl">
            {(product.mainImage || product.imageUrl) && !imageError ? (
              <img 
                src={product.mainImage || product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
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
          </div>

          <div className="absolute top-4 left-4 z-10">
            {renderStockBadge(product.stock)}
          </div>

          <button
            type="button"
            className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/60 text-slate-400 hover:text-rose-500 hover:scale-105 active:scale-95 transition-all shadow-sm z-10 p-0"
            onClick={handleHeartClick}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
          </button>
        </div>

        {/* Right Side: Product Details */}
        <div className="flex flex-col p-6 flex-grow">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {product.brand && (
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {product.brand}
              </span>
            )}
            {product.category && (
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                {product.category}
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>

          <div className="mb-4">
            {renderStars(product.rating, product.reviewCount)}
          </div>

          <p className="text-sm text-slate-500 line-clamp-3 mb-6 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">₹{product.price.toFixed(2)}</span>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {canModify && onUpdate && onDelete && (
                <div className="flex gap-2 mr-auto sm:mr-4">
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdate(product.id!); }}
                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-xl transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(product.id!); }}
                    className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
              <button
                onClick={handleAddToCartClick}
                disabled={!hasStock}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all focus:outline-none ${
                  hasStock 
                    ? 'bg-[#111113] hover:bg-[#222225] text-white hover:shadow-md active:scale-95' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{hasStock ? 'Add to Cart' : 'Out of Stock'}</span>
              </button>
            </div>
          </div>
        </div>

      </Link>
    </div>
  );
}
