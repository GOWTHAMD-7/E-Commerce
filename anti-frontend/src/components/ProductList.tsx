import { useRef } from 'react';
import type { Product, User } from '../types';
import ProductCard from './ProductCard';
import SkeletonCard from './SkeletonCard';

interface ProductListProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  favorites: Product[];
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  currentUser?: User | null;
  onUpdate?: (id: number) => void;
  onDelete?: (id: number) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore: boolean;

  // Homepage sections
  featuredProducts?: Product[];
  newArrivals?: Product[];
  topRated?: Product[];
  mostReviewed?: Product[];
  sectionsLoading?: boolean;
}

interface ProductRowProps {
  title: string;
  icon: string;
  products: Product[];
  isFavorited: (id?: number) => boolean;
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  currentUser?: User | null;
  onUpdate?: (id: number) => void;
  onDelete?: (id: number) => void;
  loading: boolean;
}

function ProductRow({
  title,
  icon,
  products,
  isFavorited,
  onToggleFavorite,
  onAddToCart,
  currentUser,
  onUpdate,
  onDelete,
  loading
}: ProductRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.8;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!loading && (!products || products.length === 0)) return null;

  return (
    <section className="mb-12 relative group">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-xl font-bold text-[#111113] flex items-center gap-2">
          <span>{icon}</span>
          <span>{title}</span>
        </h3>
        
        {!loading && products && products.length > 4 && (
          <div className="flex gap-2">
            <button 
              onClick={() => handleScroll('left')} 
              className="p-2 rounded-full border border-[#6E6E73]/20 bg-white hover:bg-[#FAFAFA] text-[#111113] transition-all active:scale-95 duration-200"
              aria-label={`Scroll ${title} Left`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => handleScroll('right')} 
              className="p-2 rounded-full border border-[#6E6E73]/20 bg-white hover:bg-[#FAFAFA] text-[#111113] transition-all active:scale-95 duration-200"
              aria-label={`Scroll ${title} Right`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <div 
          ref={rowRef}
          className="flex overflow-x-auto gap-6 pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="min-w-[280px] max-w-[280px] snap-start flex-shrink-0">
                <SkeletonCard />
              </div>
            ))
          ) : (
            products.map(product => (
              <div key={product.id} className="min-w-[280px] max-w-[280px] snap-start flex-shrink-0 transition-transform duration-300 hover:-translate-y-1">
                <ProductCard 
                  product={product}
                  isFavorited={isFavorited(product.id)}
                  onToggleFavorite={onToggleFavorite}
                  onAddToCart={onAddToCart}
                  currentUser={currentUser}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default function ProductList({
  products,
  loading,
  error,
  searchQuery,
  favorites,
  onToggleFavorite,
  onAddToCart,
  currentUser,
  onUpdate,
  onDelete,
  hasMore,
  onLoadMore,
  loadingMore,
  featuredProducts = [],
  newArrivals = [],
  topRated = [],
  mostReviewed = [],
  sectionsLoading = false
}: ProductListProps) {
  
  const isFavorited = (id?: number) => {
    if (id === undefined) return false;
    return favorites.some(fav => fav.id === id);
  };

  const isSearching = searchQuery.trim() !== '';

  return (
    <main style={{ marginTop: '32px' }}>
      


      {error && (
        <div className="form-error" style={{ marginBottom: '24px' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {isSearching ? (
        // --- SEARCH RESULTS VIEW ---
        <section className="mt-8">
          <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: 700 }} className="text-slate-800 px-2">
            🔍 Search Results for "{searchQuery}"
          </h2>

          {loading ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 list-none mt-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <li key={i}>
                  <SkeletonCard />
                </li>
              ))}
            </ul>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-20 border border-dashed border-slate-200 bg-white rounded-2xl shadow-sm">
              <span className="text-4xl mb-3">🔍</span>
              <p className="font-semibold text-slate-650">
                No products match "{searchQuery}".
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 list-none mt-6">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard
                    product={product}
                    isFavorited={isFavorited(product.id)}
                    onToggleFavorite={onToggleFavorite}
                    onAddToCart={onAddToCart}
                    currentUser={currentUser}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        // --- STANDARD HOMEPAGE DISCOVERY VIEW ---
        <div className="mt-8">
          
          {/* 1. New Arrivals Shelf */}
          <ProductRow
            title="New Arrivals"
            icon="🆕"
            products={newArrivals}
            isFavorited={isFavorited}
            onToggleFavorite={onToggleFavorite}
            onAddToCart={onAddToCart}
            currentUser={currentUser}
            onUpdate={onUpdate}
            onDelete={onDelete}
            loading={sectionsLoading}
          />

          {/* 2. Top Rated Shelf */}
          <ProductRow
            title="Top Rated Products"
            icon="⭐"
            products={topRated}
            isFavorited={isFavorited}
            onToggleFavorite={onToggleFavorite}
            onAddToCart={onAddToCart}
            currentUser={currentUser}
            onUpdate={onUpdate}
            onDelete={onDelete}
            loading={sectionsLoading}
          />

          {/* 3. Most Reviewed Shelf */}
          <ProductRow
            title="Most Reviewed Products"
            icon="🔥"
            products={mostReviewed}
            isFavorited={isFavorited}
            onToggleFavorite={onToggleFavorite}
            onAddToCart={onAddToCart}
            currentUser={currentUser}
            onUpdate={onUpdate}
            onDelete={onDelete}
            loading={sectionsLoading}
          />

          {/* 4. Placeholder: Recommended For You Section */}
          <section className="mb-12 bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#6E6E73]/20 relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">✨</span>
                <h3 className="text-xl font-bold text-[#111113]">Recommended For You</h3>
              </div>
              <p className="text-[#6E6E73] text-sm sm:text-base mb-5 leading-relaxed">
                Personalized recommendations are currently being tuned. Soon, our AI matching engine will showcase hand-picked products selected just for you based on your browsing preferences.
              </p>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold bg-[#111113] text-white uppercase tracking-wider">
                🚀 Coming Soon
              </span>
            </div>
          </section>

          {/* 5. Featured Products Grid */}
          <section className="mb-12">
            <h3 className="text-xl font-bold text-[#111113] flex items-center gap-2 mb-6 px-2">
              <span>🎯</span>
              <span>Featured Products</span>
            </h3>
            {sectionsLoading ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 list-none">
                {Array.from({ length: 8 }).map((_, i) => (
                  <li key={i}>
                    <SkeletonCard />
                  </li>
                ))}
              </ul>
            ) : featuredProducts && featuredProducts.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 list-none">
                {featuredProducts.map((product) => (
                  <li key={product.id}>
                    <ProductCard
                      product={product}
                      isFavorited={isFavorited(product.id)}
                      onToggleFavorite={onToggleFavorite}
                      onAddToCart={onAddToCart}
                      currentUser={currentUser}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 px-2">No featured products available.</p>
            )}
          </section>

          {/* 6. Explore More Main Catalog Grid */}
          <section className="mt-12 pt-8 border-t border-slate-100">
            <h3 className="text-xl font-bold text-[#111113] flex items-center gap-2 mb-6 px-2">
              <span>📂</span>
              <span>Explore More</span>
            </h3>

            {loading ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 list-none mt-6">
                {[1, 2, 3, 4].map((i) => (
                  <li key={i}>
                    <SkeletonCard />
                  </li>
                ))}
              </ul>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-20 border border-dashed border-slate-200 bg-white rounded-2xl shadow-sm">
                <p className="font-semibold text-slate-650">No products available in the catalog.</p>
              </div>
            ) : (
              <>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 list-none mt-6">
                  {products.map((product) => (
                    <li key={product.id}>
                      <ProductCard
                        product={product}
                        isFavorited={isFavorited(product.id)}
                        onToggleFavorite={onToggleFavorite}
                        onAddToCart={onAddToCart}
                        currentUser={currentUser}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                      />
                    </li>
                  ))}
                </ul>

                {/* Load More Button */}
                {!loading && hasMore && (
                  <div className="flex justify-center items-center mt-12 mb-8">
                    <button
                      onClick={onLoadMore}
                      disabled={loadingMore}
                      className={`px-8 py-3 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 transform active:scale-98 flex items-center gap-3 ${
                        loadingMore
                          ? 'bg-[#FAFAFA] text-[#6E6E73]/50 border border-[#6E6E73]/20 cursor-not-allowed shadow-none'
                          : 'bg-[#111113] hover:bg-[#111113]/90 text-white'
                      }`}
                    >
                      {loadingMore ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-[#111113]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Loading more...</span>
                        </>
                      ) : (
                        <>
                          <span>Load More Products</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

        </div>
      )}
    </main>
  );
}
