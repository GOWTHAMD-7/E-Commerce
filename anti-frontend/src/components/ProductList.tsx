import { useRef, useState, useEffect } from 'react';
import type { Product, User } from '../types';
import ProductCard from './ProductCard';
import SkeletonCard from './SkeletonCard';
import { fetchProductsByCategory, fetchFeaturedProducts } from '../api';
import { 
  Sparkles, 
  Star, 
  Eye, 
  Target, 
  ShoppingBag, 
  Laptop, 
  Shirt, 
  Home as HomeIcon, 
  BookOpen, 
  Dumbbell, 
  Sparkles as BeautyIcon, 
  Car, 
  ShoppingCart, 
  Tag, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Search,
  Zap
} from 'lucide-react';

export function CategoryLucideIcon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const lower = name.toLowerCase();
  if (lower.includes('electronic') || lower.includes('laptop') || lower.includes('phone')) {
    return <Laptop className={`${className} text-blue-500`} />;
  }
  if (lower.includes('cloth') || lower.includes('fashion') || lower.includes('wear')) {
    return <Shirt className={`${className} text-pink-500`} />;
  }
  if (lower.includes('home') || lower.includes('kitchen')) {
    return <HomeIcon className={`${className} text-emerald-500`} />;
  }
  if (lower.includes('book')) {
    return <BookOpen className={`${className} text-amber-600`} />;
  }
  if (lower.includes('sport') || lower.includes('fitness') || lower.includes('outdoor')) {
    return <Dumbbell className={`${className} text-orange-500`} />;
  }
  if (lower.includes('beauty')) {
    return <BeautyIcon className={`${className} text-purple-500`} />;
  }
  if (lower.includes('auto')) {
    return <Car className={`${className} text-red-500`} />;
  }
  if (lower.includes('groc') || lower.includes('food')) {
    return <ShoppingCart className={`${className} text-green-600`} />;
  }
  return <Tag className={`${className} text-indigo-500`} />;
}

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
  mostViewed?: Product[];
  sectionsLoading?: boolean;
  categories?: string[];
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
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

const CATEGORY_ICON_MAP: Record<string, string> = {
  electronics: '📱',
  clothing: '👗',
  fashion: '👗',
  'home & kitchen': '🏠',
  home: '🏠',
  kitchen: '🍳',
  books: '📚',
  'sports & outdoors': '⚽',
  sports: '⚽',
  beauty: '✨',
  toys: '🧸',
  automotive: '🚗',
  grocery: '🛒'
};

function getCategoryIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return '🏷️';
}

function CategoryQuickNav({ categories }: { categories: { name: string; icon: string }[] }) {
  const scrollToCategory = (categoryName: string) => {
    const id = `category-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-10 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
      <div className="flex items-center gap-3 min-w-max px-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#6E6E73] mr-1 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-400" /> Quick Jump:
        </span>
        {categories.map(cat => (
          <button
            key={cat.name}
            onClick={() => scrollToCategory(cat.name)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-900 hover:text-white text-[#111113] rounded-full border border-[#E5E5E7] text-xs font-semibold shadow-2xs transition-all duration-200 active:scale-95 group focus:outline-none"
          >
            <CategoryLucideIcon name={cat.name} className="w-4 h-4" />
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface CategoryProductRowProps {
  category: string;
  icon: string;
  isFavorited: (id?: number) => boolean;
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  currentUser?: User | null;
  onUpdate?: (id: number) => void;
  onDelete?: (id: number) => void;
  onSelectCategory?: (category: string) => void;
}

function CategoryProductRow({
  category,
  icon,
  isFavorited,
  onToggleFavorite,
  onAddToCart,
  currentUser,
  onUpdate,
  onDelete,
  onSelectCategory
}: CategoryProductRowProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const loadInitial = async () => {
      try {
        setLoading(true);
        // Strictly fetch only top 10 products for the horizontal shelf
        const data = await fetchProductsByCategory(category, 0, 10);
        if (isMounted) {
          setProducts((data || []).slice(0, 10));
        }
      } catch (err) {
        console.error(`Failed to load products for category ${category}`, err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadInitial();
    return () => { isMounted = false; };
  }, [category]);

  const handleArrowScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!loading && products.length === 0) return null;

  const categoryId = `category-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  return (
    <section id={categoryId} className="mb-14 relative group scroll-mt-24">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
            <CategoryLucideIcon name={category} className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#111113] tracking-tight flex items-center gap-2">
              <span>{category}</span>
            </h3>
            <p className="text-xs text-[#6E6E73] font-medium flex items-center gap-2 mt-0.5">
              <span>Explore top picks in {category}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                {loading ? 'Loading...' : `${products.length} Products`}
              </span>
            </p>
          </div>
        </div>

        {/* Scroll & Category Navigator Controls */}
        {!loading && (
          <div className="flex items-center gap-2.5">
            {onSelectCategory && (
              <button
                onClick={() => onSelectCategory(category)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-200 transition-all duration-200 active:scale-95 shadow-2xs"
              >
                <span>View products in {category}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {products.length > 3 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleArrowScroll('left')}
                  className="p-2.5 rounded-full border border-[#6E6E73]/20 bg-white hover:bg-[#FAFAFA] text-[#111113] transition-all active:scale-95 duration-200 shadow-xs"
                  aria-label={`Scroll ${category} Left`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleArrowScroll('right')}
                  className="p-2.5 rounded-full border border-[#6E6E73]/20 bg-white hover:bg-[#FAFAFA] text-[#111113] transition-all active:scale-95 duration-200 shadow-xs"
                  aria-label={`Scroll ${category} Right`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Horizontal Carousel Container */}
      <div className="relative">
        <div
          ref={rowRef}
          className="flex overflow-x-auto gap-6 pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth px-2 items-stretch"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[280px] max-w-[280px] snap-start flex-shrink-0">
                <SkeletonCard />
              </div>
            ))
          ) : (
            <>
              {products.map(product => (
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
              ))}

              {/* View All Category Action Card */}
              {onSelectCategory && (
                <div
                  onClick={() => onSelectCategory(category)}
                  className="min-w-[240px] max-w-[240px] snap-start flex-shrink-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#111113] via-slate-900 to-indigo-950 text-white rounded-3xl shadow-md text-center hover:scale-102 transition-all duration-300 group cursor-pointer border border-white/10"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center text-xl mb-3 shadow-inner group-hover:bg-indigo-500 transition-colors">
                    🔍
                  </div>
                  <h4 className="font-extrabold text-white text-sm mb-1">View All {category}</h4>
                  <p className="text-xs text-slate-300/80 mb-4 leading-relaxed">Click to see full {category} catalog!</p>
                  <button className="px-4 py-2 bg-white text-[#111113] rounded-full text-xs font-bold shadow-xs group-hover:bg-indigo-400 group-hover:text-white transition-all flex items-center gap-1.5">
                    <span>Explore Category</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function ModernGradientSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const dotDimensions = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-2.5 h-2.5';
  
  return (
    <div className={`relative flex items-center justify-center ${dimensions}`}>
      {/* Outer Rotating Gradient Ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 animate-spin opacity-90 shadow-md" />
      {/* Inner Mask Container */}
      <div className="absolute inset-[2.5px] rounded-full bg-white flex items-center justify-center">
        {/* Center Pulsing Glow Dot */}
        <div className={`${dotDimensions} rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse shadow-sm`} />
      </div>
    </div>
  );
}

interface FeaturedProductsSectionProps {
  initialProducts: Product[];
  isFavorited: (id?: number) => boolean;
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  currentUser?: User | null;
  onUpdate?: (id: number) => void;
  onDelete?: (id: number) => void;
  sectionsLoading: boolean;
}

function FeaturedProductsSection({
  initialProducts,
  isFavorited,
  onToggleFavorite,
  onAddToCart,
  currentUser,
  onUpdate,
  onDelete,
  sectionsLoading
}: FeaturedProductsSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState<number>(0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      const initialCount = initialProducts.length >= 4 ? Math.floor(initialProducts.length / 4) * 4 : initialProducts.length;
      const validInitial = initialProducts.slice(0, initialCount);
      setProducts(validInitial);
      setPage(0);
      setHasMore(initialProducts.length > validInitial.length);
    } else {
      fetchFeaturedProducts(0, 16).then(data => {
        if (data && data.length > 0) {
          const initialCount = data.length >= 4 ? Math.floor(data.length / 4) * 4 : data.length;
          setProducts(data.slice(0, initialCount));
          setHasMore(data.length >= 16);
        } else {
          setHasMore(false);
        }
      }).catch(() => setHasMore(false));
    }
  }, [initialProducts]);

  const loadMoreFeatured = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      
      // Minimum 1 second timer for smooth loading animation
      const [newItems] = await Promise.all([
        fetchFeaturedProducts(nextPage, 12),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);

      if (newItems && newItems.length > 0) {
        setProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = newItems.filter(p => !existingIds.has(p.id));
          if (uniqueNew.length === 0) {
            setHasMore(false);
            return prev;
          }
          let combined = [...prev, ...uniqueNew];
          // If there are more pages left, keep complete rows of 4. If end reached, show all!
          if (newItems.length >= 12) {
            const remainder = combined.length % 4;
            if (remainder !== 0) {
              const completeRowsCount = Math.floor(combined.length / 4) * 4;
              combined = combined.slice(0, completeRowsCount);
            }
          }
          return combined;
        });
        setPage(nextPage);
        if (newItems.length < 12) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more featured products:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Directional scroll lock during loading animation: Blocks scroll DOWN past loader, but allows scrolling UP freely!
  useEffect(() => {
    if (!loadingMore) return;

    const maxScrollY = window.scrollY;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0 && window.scrollY >= maxScrollY - 20) {
        e.preventDefault();
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      if (currentY < touchStartY && window.scrollY >= maxScrollY - 20) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', 'Space', 'End'].includes(e.code) && window.scrollY >= maxScrollY - 20) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadingMore]);

  useEffect(() => {
    if (!hasMore || sectionsLoading) return;

    let isTriggered = false;

    const triggerLoad = () => {
      if (!isTriggered && hasMore && !loadingMore) {
        isTriggered = true;
        loadMoreFeatured();
      }
    };

    const handleWindowScroll = () => {
      if (isTriggered || loadingMore || !hasMore) return;
      const scrollPosition = window.innerHeight + window.scrollY;
      const bottomThreshold = document.documentElement.offsetHeight - 100;
      if (scrollPosition >= bottomThreshold) {
        triggerLoad();
      }
    };

    const currentSentinel = sentinelRef.current;
    let observer: IntersectionObserver | null = null;

    if (currentSentinel) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            triggerLoad();
          }
        },
        { rootMargin: '50px' }
      );
      observer.observe(currentSentinel);
    }

    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, [hasMore, loadingMore, page, sectionsLoading]);

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-xl font-bold text-[#111113] flex items-center gap-2">
          <span>🎯</span>
          <span>Featured Products</span>
        </h3>
        <span className="text-xs font-semibold text-[#6E6E73] bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">
          {products.length} Products Loaded
        </span>
      </div>

      {sectionsLoading ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 list-none">
          {Array.from({ length: 16 }).map((_, i) => (
            <li key={i}>
              <SkeletonCard />
            </li>
          ))}
        </ul>
      ) : products && products.length > 0 ? (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 list-none">
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

          {/* Skeleton Loaders & Spinner while fetching next 3 rows */}
          {loadingMore && (
            <div className="mt-6">
              <div className="flex items-center justify-center py-6">
                <ModernGradientSpinner size="md" />
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 list-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <li key={`skel-feat-${i}`}>
                    <SkeletonCard />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sentinel element for scroll detection */}
          {hasMore && <div ref={sentinelRef} className="h-10 my-2" />}
        </>
      ) : (
        <p className="text-slate-500 px-2">No featured products available.</p>
      )}
    </section>
  );
}

interface PaginatedCatalogViewProps {
  title: string;
  query: string;
  allProducts: Product[];
  loading: boolean;
  isFavorited: (id?: number) => boolean;
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  currentUser?: User | null;
  onUpdate?: (id: number) => void;
  onDelete?: (id: number) => void;
}

function PaginatedCatalogView({
  title,
  query,
  allProducts,
  loading,
  isFavorited,
  onToggleFavorite,
  onAddToCart,
  currentUser,
  onUpdate,
  onDelete
}: PaginatedCatalogViewProps) {
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [page, setPage] = useState<number>(0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      const initialCount = allProducts.length >= 16 
        ? 16 
        : (allProducts.length >= 4 ? Math.floor(allProducts.length / 4) * 4 : allProducts.length);
      setDisplayedProducts(allProducts.slice(0, initialCount));
      setPage(0);
      setHasMore(allProducts.length > initialCount);
    } else {
      setDisplayedProducts([]);
      setHasMore(false);
    }
  }, [allProducts, query]);

  const loadMoreCatalogItems = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const startIndex = displayedProducts.length;
      const endIndex = startIndex + 12;

      // 1-second minimum timer for smooth loading animation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const nextBatch = allProducts.slice(startIndex, endIndex);

      if (nextBatch.length > 0) {
        setDisplayedProducts(prev => {
          let combined = [...prev, ...nextBatch];
          // If there are more items remaining in the catalog, round to complete rows of 4. If end reached, show all!
          if (endIndex < allProducts.length) {
            const remainder = combined.length % 4;
            if (remainder !== 0) {
              const completeRowsCount = Math.floor(combined.length / 4) * 4;
              combined = combined.slice(0, completeRowsCount);
            }
          }
          return combined;
        });
        setPage(nextPage);
        if (endIndex >= allProducts.length) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more catalog products:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Directional scroll lock during loading animation: Blocks scroll DOWN past loader, but allows scrolling UP freely!
  useEffect(() => {
    if (!loadingMore) return;

    const maxScrollY = window.scrollY;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0 && window.scrollY >= maxScrollY - 20) {
        e.preventDefault();
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      if (currentY < touchStartY && window.scrollY >= maxScrollY - 20) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', 'Space', 'End'].includes(e.code) && window.scrollY >= maxScrollY - 20) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadingMore]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    let isTriggered = false;

    const triggerLoad = () => {
      if (!isTriggered && hasMore && !loadingMore) {
        isTriggered = true;
        loadMoreCatalogItems();
      }
    };

    const handleWindowScroll = () => {
      if (isTriggered || loadingMore || !hasMore) return;
      const scrollPosition = window.innerHeight + window.scrollY;
      const bottomThreshold = document.documentElement.offsetHeight - 100;
      if (scrollPosition >= bottomThreshold) {
        triggerLoad();
      }
    };

    const currentSentinel = sentinelRef.current;
    let observer: IntersectionObserver | null = null;

    if (currentSentinel) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            triggerLoad();
          }
        },
        { rootMargin: '50px' }
      );
      observer.observe(currentSentinel);
    }

    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, [hasMore, loadingMore, page, loading, allProducts]);

  return (
    <section className="mt-8 mb-16">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-2xl font-black text-[#111113] tracking-tight flex items-center gap-2.5">
          <CategoryLucideIcon name={query || title} className="w-7 h-7" />
          <span>{title}</span>
        </h2>
        <span className="text-xs font-semibold text-[#6E6E73] bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200/60 shadow-2xs">
          {displayedProducts.length} of {allProducts.length} Products
        </span>
      </div>

      {loading ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 list-none mt-6">
          {Array.from({ length: 16 }).map((_, i) => (
            <li key={i}>
              <SkeletonCard />
            </li>
          ))}
        </ul>
      ) : displayedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-20 border border-dashed border-slate-200 bg-white rounded-3xl shadow-xs mt-6">
          <Search className="w-10 h-10 text-slate-400 mb-3" />
          <p className="font-semibold text-slate-700">No products match "{query}".</p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 list-none mt-6">
            {displayedProducts.map((product) => (
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

          {/* Skeleton Loaders & Option 1 Spinner while fetching next 3 rows */}
          {loadingMore && (
            <div className="mt-6">
              <div className="flex items-center justify-center py-6">
                <ModernGradientSpinner size="md" />
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 list-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <li key={`skel-catalog-${i}`}>
                    <SkeletonCard />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sentinel element for scroll detection */}
          {hasMore && <div ref={sentinelRef} className="h-10 my-2" />}
        </>
      )}
    </section>
  );
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
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleScroll('right')} 
              className="p-2 rounded-full border border-[#6E6E73]/20 bg-white hover:bg-[#FAFAFA] text-[#111113] transition-all active:scale-95 duration-200"
              aria-label={`Scroll ${title} Right`}
            >
              <ChevronRight className="w-5 h-5" />
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
            products.slice(0, 15).map(product => (
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
  mostViewed = [],
  sectionsLoading = false,
  categories = [],
  activeCategory = '',
  onSelectCategory
}: ProductListProps) {
  
  const isFavorited = (id?: number) => {
    if (id === undefined) return false;
    return favorites.some(fav => fav.id === id);
  };

  const isSearching = searchQuery.trim() !== '' || activeCategory.trim() !== '';
  const catalogTitle = searchQuery.trim() !== '' ? `Search Results for "${searchQuery}"` : `${activeCategory} Catalog`;
  const catalogQuery = searchQuery.trim() !== '' ? searchQuery : activeCategory;

  // Determine 5 category shelves (using backend categories or fallbacks)
  const defaultFiveCategories = [
    { name: 'Electronics', icon: '📱' },
    { name: 'Clothing', icon: '👗' },
    { name: 'Home & Kitchen', icon: '🏠' },
    { name: 'Books', icon: '📚' },
    { name: 'Sports & Outdoors', icon: '⚽' }
  ];

  const categoryListToRender = (() => {
    const validBackendCategories = (categories || []).filter(c => c && c.trim() !== '');
    
    if (validBackendCategories.length >= 5) {
      return validBackendCategories.slice(0, 5).map(cat => ({
        name: cat,
        icon: getCategoryIcon(cat)
      }));
    }

    const result = validBackendCategories.map(cat => ({
      name: cat,
      icon: getCategoryIcon(cat)
    }));

    for (const def of defaultFiveCategories) {
      if (result.length >= 5) break;
      const alreadyExists = result.some(r => r.name.toLowerCase().includes(def.name.toLowerCase()) || def.name.toLowerCase().includes(r.name.toLowerCase()));
      if (!alreadyExists) {
        result.push(def);
      }
    }

    return result;
  })();

  return (
    <main style={{ marginTop: '32px' }}>

      {error && (
        <div className="form-error" style={{ marginBottom: '24px' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {isSearching ? (
        // --- PAGINATED CATALOG / SEARCH RESULTS VIEW ---
        <PaginatedCatalogView
          title={catalogTitle}
          query={catalogQuery}
          allProducts={products}
          loading={loading}
          isFavorited={isFavorited}
          onToggleFavorite={onToggleFavorite}
          onAddToCart={onAddToCart}
          currentUser={currentUser}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ) : (
        // --- STANDARD HOMEPAGE DISCOVERY VIEW ---
        <div className="mt-8">
          
          {/* 0. Quick-Jump Category Filter Bar */}
          <CategoryQuickNav categories={categoryListToRender} />

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

          {/* 3. Most Viewed Shelf */}
          <ProductRow
            title="Most Viewed Products"
            icon="👀"
            products={mostViewed}
            isFavorited={isFavorited}
            onToggleFavorite={onToggleFavorite}
            onAddToCart={onAddToCart}
            currentUser={currentUser}
            onUpdate={onUpdate}
            onDelete={onDelete}
            loading={sectionsLoading}
          />

          {/* 3. 5 Horizontal Scroll Category Shelves with 10-Item Endless Batch Loading */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h2 className="text-2xl font-black text-[#111113] tracking-tight mb-8 px-2 flex items-center gap-2.5">
              <ShoppingBag className="w-6 h-6 text-indigo-600" />
              <span>Browse By Category</span>
            </h2>

            {categoryListToRender.map(cat => (
              <CategoryProductRow
                key={cat.name}
                category={cat.name}
                icon={cat.icon}
                isFavorited={isFavorited}
                onToggleFavorite={onToggleFavorite}
                onAddToCart={onAddToCart}
                currentUser={currentUser}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onSelectCategory={onSelectCategory}
              />
            ))}
          </div>

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

          {/* 5. Featured Products Grid (Initial 4 rows = 16 items, dynamic scroll loads 3 rows = 12 items) */}
          <FeaturedProductsSection
            initialProducts={featuredProducts}
            isFavorited={isFavorited}
            onToggleFavorite={onToggleFavorite}
            onAddToCart={onAddToCart}
            currentUser={currentUser}
            onUpdate={onUpdate}
            onDelete={onDelete}
            sectionsLoading={sectionsLoading}
          />



        </div>
      )}
    </main>
  );
}
