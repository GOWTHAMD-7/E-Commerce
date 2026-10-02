import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, ChevronLeft, ChevronRight, ShieldCheck, Truck, Headphones, Flame, Star, ShoppingBag } from 'lucide-react';
import type { Product } from '../types';
import { fetchTopRatedProducts, sanitizeProduct } from '../api';

interface HeroCarouselProps {
  onSelectCategory?: (category: string) => void;
  onAddToCart?: (product: Product, quantity: number) => void;
}

// A pool of beautiful dark gradient themes that rotate between slides
const SLIDE_THEMES = [
  {
    bgGradient: 'from-[#0F172A] via-[#1E1B4B] to-[#311042]',
    accentColor: 'from-indigo-500 to-purple-500',
    btnBg: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white',
    glowColor: 'bg-indigo-500/20',
    badgeEmoji: '⚡',
    badgeText: 'TOP RATED • BEST SELLER',
  },
  {
    bgGradient: 'from-[#1A0B2E] via-[#2D1236] to-[#4A153A]',
    accentColor: 'from-rose-500 to-pink-500',
    btnBg: 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white',
    glowColor: 'bg-rose-500/20',
    badgeEmoji: '🌟',
    badgeText: 'HIGHLY RATED • POPULAR PICK',
  },
  {
    bgGradient: 'from-[#062C26] via-[#0D3B34] to-[#124E43]',
    accentColor: 'from-emerald-500 to-teal-500',
    btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white',
    glowColor: 'bg-emerald-500/20',
    badgeEmoji: '🏆',
    badgeText: 'CUSTOMER FAVOURITE',
  },
  {
    bgGradient: 'from-[#1A1200] via-[#2E1F00] to-[#3D2900]',
    accentColor: 'from-amber-500 to-orange-500',
    btnBg: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white',
    glowColor: 'bg-amber-500/20',
    badgeEmoji: '🔥',
    badgeText: 'HOT PICK • TRENDING NOW',
  },
  {
    bgGradient: 'from-[#001A2E] via-[#00294A] to-[#003560]',
    accentColor: 'from-sky-500 to-cyan-500',
    btnBg: 'bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white',
    glowColor: 'bg-sky-500/20',
    badgeEmoji: '💎',
    badgeText: 'PREMIUM CHOICE',
  },
];

// Skeleton placeholder while loading
function HeroSkeleton() {
  return (
    <div className="w-full my-6 flex flex-col gap-6">
      <div className="relative w-full rounded-3xl overflow-hidden bg-slate-800 min-h-[420px] animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 min-h-[420px]">
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="h-6 w-48 bg-white/10 rounded-full" />
            <div className="h-12 w-3/4 bg-white/10 rounded-2xl" />
            <div className="h-5 w-full bg-white/10 rounded-xl" />
            <div className="h-5 w-2/3 bg-white/10 rounded-xl" />
            <div className="flex gap-3 mt-2">
              <div className="h-12 w-40 bg-white/10 rounded-2xl" />
              <div className="h-12 w-36 bg-white/10 rounded-2xl" />
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-white/10 aspect-[4/3] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroCarousel({ onSelectCategory, onAddToCart }: HeroCarouselProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetchTopRatedProducts(6)
      .then(data => {
        setProducts(data.map(sanitizeProduct));
      })
      .catch(() => {
        // silently fail — skeleton just stays hidden
      })
      .finally(() => setLoading(false));
  }, []);

  const goNext = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % products.length);
  }, [products.length]);

  const goPrev = useCallback(() => {
    setCurrentSlide(prev => (prev === 0 ? products.length - 1 : prev - 1));
  }, [products.length]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (products.length === 0 || isPaused) return;
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [products.length, isPaused, goNext]);

  if (loading) return <HeroSkeleton />;
  if (products.length === 0) return null;

  const product = products[currentSlide];
  const theme = SLIDE_THEMES[currentSlide % SLIDE_THEMES.length];
  const hasImage = !!(product.mainImage || product.imageUrl);
  const imageUrl = product.mainImage || product.imageUrl || '';

  const stars = product.rating ?? 0;
  const reviewCount = product.reviewCount ?? 0;

  return (
    <div className="w-full my-6 flex flex-col gap-6">

      {/* Main Hero Banner */}
      <div
        className={`relative w-full rounded-3xl overflow-hidden bg-gradient-to-r ${theme.bgGradient} text-white shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-white/10 transition-all duration-700`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Ambient Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-[120px] pointer-events-none" />
        <div className={`absolute -bottom-32 -right-32 w-96 h-96 ${theme.glowColor} rounded-full blur-[120px] pointer-events-none`} />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 min-h-[420px]">

          {/* Left: Product Info */}
          <div className="lg:col-span-7 flex flex-col gap-5 text-left">

            {/* Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-[11px] font-extrabold text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-full uppercase tracking-wider shadow-xs">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {theme.badgeEmoji} {theme.badgeText}
              </span>
            </div>

            {/* Product Name */}
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md line-clamp-2">
              {product.name}
            </h2>

            {/* Description */}
            {product.description && (
              <p className="text-slate-200/90 text-sm sm:text-base leading-relaxed max-w-xl line-clamp-2">
                {product.description}
              </p>
            )}

            {/* Rating & Info Chips */}
            <div className="flex flex-wrap gap-2 my-1">
              {stars > 0 && (
                <span className="text-[11px] font-bold px-3 py-1 bg-white/10 text-white rounded-lg border border-white/10 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {stars.toFixed(1)} stars{reviewCount > 0 ? ` (${reviewCount} reviews)` : ''}
                </span>
              )}
              {product.category && (
                <span className="text-[11px] font-bold px-3 py-1 bg-white/10 text-white rounded-lg border border-white/10">
                  {product.category}
                </span>
              )}
              {product.brand && (
                <span className="text-[11px] font-bold px-3 py-1 bg-white/10 text-white rounded-lg border border-white/10">
                  {product.brand}
                </span>
              )}
            </div>

            {/* Price & CTA */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex flex-col">
                <span className="text-3xl font-black text-white tracking-tight">
                  ₹{product.price.toFixed(2)}
                </span>
              </div>

              <Link
                to={`/product/${product.id}`}
                className={`px-6 py-3.5 rounded-2xl font-extrabold text-xs tracking-wider uppercase shadow-lg hover:shadow-2xl transition-all duration-300 active:scale-95 flex items-center gap-2 no-underline ${theme.btnBg}`}
              >
                <span>View Product</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {onAddToCart && product.stock > 0 && (
                <button
                  onClick={() => onAddToCart(product, 1)}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-2xl font-extrabold text-xs tracking-wider uppercase bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              )}

              {product.category && onSelectCategory && (
                <button
                  onClick={() => onSelectCategory(product.category!)}
                  className="flex items-center gap-2 text-xs font-semibold text-white/80 bg-white/5 px-4 py-3 rounded-2xl border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                  <span>See all {product.category}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Product Image */}
          <div className="lg:col-span-5 flex flex-col gap-4 relative">
            <div className="relative rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 p-4 shadow-2xl hover:scale-[1.02] transition-transform duration-500">
              <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-white/5 flex items-center justify-center relative mb-3">
                {hasImage ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain rounded-xl hover:scale-105 transition-transform duration-700 bg-white/5 p-2"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                    <ShoppingBag className="w-16 h-16" />
                    <span className="text-xs font-semibold uppercase tracking-wider">No Image</span>
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                  HOT DEAL
                </span>
              </div>

              {/* Mini product info panel */}
              <div className="bg-white/10 rounded-xl p-3 border border-white/15 backdrop-blur-sm">
                <p className="text-[11px] font-bold text-white truncate">{product.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-extrabold text-amber-300">₹{product.price.toFixed(2)}</span>
                  {stars > 0 && (
                    <span className="text-[10px] text-white/70 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      {stars.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 cursor-pointer z-20"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 cursor-pointer z-20"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slide Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {products.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer border-none ${idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Truck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-extrabold text-slate-800">Free Fast Delivery</h4>
            <p className="text-[10px] text-slate-400 font-medium">On orders above ₹999</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-extrabold text-slate-800">100% Genuine Goods</h4>
            <p className="text-[10px] text-slate-400 font-medium">Direct brand warranty</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Zap className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-extrabold text-slate-800">Instant Easy Returns</h4>
            <p className="text-[10px] text-slate-400 font-medium">7-day hassle-free policy</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Headphones className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-extrabold text-slate-800">24/7 VIP Support</h4>
            <p className="text-[10px] text-slate-400 font-medium">Dedicated agent helpline</p>
          </div>
        </div>
      </div>

    </div>
  );
}
