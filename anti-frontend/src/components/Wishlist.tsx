import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '../types';

interface WishlistProps {
  favorites: Product[];
  handleToggleFavorite: (id: number) => Promise<void>;
  handleAddToCart: (product: Product) => Promise<void>;
}

export default function Wishlist({ favorites, handleToggleFavorite, handleAddToCart }: WishlistProps) {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 m-0">Your Wishlist</h2>
        </div>
      </div>
      
      {favorites.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-rose-400 text-3xl">❤️</div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Favorites Yet</h3>
          <p className="text-slate-500 max-w-sm mb-6">You haven't saved any products. Explore our collection and add your favorites!</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-colors">
            Browse Products
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {favorites.map((product) => (
            <div 
              key={product.id} 
              className="relative bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col sm:flex-row cursor-pointer group"
              onClick={() => product.id !== undefined && navigate(`/product/${product.id}`)}
            >
              <div className="w-full sm:w-40 h-48 sm:h-auto bg-slate-100 relative shrink-0 border-b sm:border-b-0 sm:border-r border-slate-100">
                {product.mainImage || product.imageUrl ? (
                  <img src={product.mainImage || product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="p-5 flex flex-col flex-1 justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-tight">{product.name}</h3>
                  <p className="text-xl font-extrabold text-slate-900 mt-2">${product.price.toFixed(2)}</p>
                  
                  {product.stock === 0 ? (
                    <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200/50 px-2.5 py-1 rounded-lg">Out of Stock</span>
                  ) : (
                    <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-lg">In Stock</span>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); product.id && handleToggleFavorite(product.id); }}
                    className="flex items-center justify-center shrink-0 w-14 h-14 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-500 hover:scale-110 transition-all shadow-sm"
                    title="Remove from favorites"
                  >
                    <Heart className="w-7 h-7 text-rose-600 " />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); product.id && handleAddToCart(product); }}
                    disabled={product.stock === 0}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 font-bold text-sm rounded-xl transition-colors w-full sm:w-auto text-center ${
                      product.stock === 0 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); product.id && navigate(`/product/${product.id}`); }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors w-full sm:w-auto text-center"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
