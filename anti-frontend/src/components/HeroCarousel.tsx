import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Zap, ChevronLeft, ChevronRight, ShieldCheck, Truck, Headphones, Star, ShoppingBag, Flame, Tag } from 'lucide-react';
import type { Product } from '../types';

interface HeroCarouselProps {
  products?: Product[];
  onSelectCategory?: (category: string) => void;
  onAddToCart?: (product: Product, quantity: number) => void;
}

const HERO_SLIDES = [
  {
    id: 'slide-1',
    badge: '⚡ FLASH SALE • UP TO 70% OFF',
    title: 'Next-Gen Tech & Premium Gadgets',
    subtitle: 'Unbeatable discounts on flagship smartphones, wireless earbuds, smartwatches & high-performance laptops.',
    category: 'Electronics',
    bgGradient: 'from-[#0F172A] via-[#1E1B4B] to-[#311042]',
    accentColor: 'from-indigo-500 to-purple-500',
    btnBg: 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    tags: ['Flagship Smartphones', 'Noise-Canceling Audio', 'Smart Wearables'],
    featuredProducts: [
      { name: 'Wireless Noise-Canceling Headphones', price: 199.99, oldPrice: 349.99, rating: 4.9, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80' },
      { name: 'Ultra-Slim Pro Smartwatch', price: 149.99, oldPrice: 249.99, rating: 4.8, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80' }
    ]
  },
  {
    id: 'slide-2',
    badge: '🌟 NEW SEASON FESTIVAL • FLAT 50% OFF',
    title: 'Elevate Your Everyday Style',
    subtitle: 'Discover curated luxury apparel, designer footwear, and modern fashion accessories crafted for confidence.',
    category: 'Fashion',
    bgGradient: 'from-[#1A0B2E] via-[#2D1236] to-[#4A153A]',
    accentColor: 'from-rose-500 to-pink-500',
    btnBg: 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
    tags: ['Designer Apparel', 'Luxury Footwear', 'Bags & Accessories'],
    featuredProducts: [
      { name: 'Classic Urban Leather Jacket', price: 129.99, oldPrice: 229.99, rating: 4.9, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&q=80' },
      { name: 'Minimalist Fashion Sneakers', price: 89.99, oldPrice: 149.99, rating: 4.7, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&q=80' }
    ]
  },
  {
    id: 'slide-3',
    badge: '🏡 BIG HOME RENEWAL • UP TO 60% OFF',
    title: 'Transform Your Living Space',
    subtitle: 'Smart home appliances, modern decor, ergonomic furniture & kitchen tools crafted for comfort.',
    category: 'Home & Kitchen',
    bgGradient: 'from-[#062C26] via-[#0D3B34] to-[#124E43]',
    accentColor: 'from-emerald-500 to-teal-500',
    btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
    tags: ['Smart Kitchen Appliances', 'Modern Lighting', 'Ergonomic Decor'],
    featuredProducts: [
      { name: 'Smart Espresso & Coffee Maker', price: 179.99, oldPrice: 299.99, rating: 4.9, image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=300&q=80' },
      { name: 'Ambient Warm Living Room Lamp', price: 69.99, oldPrice: 119.99, rating: 4.8, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300&q=80' }
    ]
  }
];

export default function HeroCarousel({ onSelectCategory }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play carousel every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className="w-full my-6 flex flex-col gap-6">

      {/* 2. Main Flipkart / Amazon Style Hero Banner Carousel */}
      <div className={`relative w-full rounded-3xl overflow-hidden bg-gradient-to-r ${slide.bgGradient} text-white shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-white/10 transition-all duration-700`}>
        
        {/* Background Ambient Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 min-h-[420px]">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 flex flex-col gap-5 text-left">
            
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-[11px] font-extrabold text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-full uppercase tracking-wider shadow-xs">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {slide.badge}
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
              {slide.title}
            </h2>

            <p className="text-slate-200/90 text-sm sm:text-base leading-relaxed max-w-xl">
              {slide.subtitle}
            </p>

            {/* Feature Tag Chips */}
            <div className="flex flex-wrap gap-2 my-1">
              {slide.tags.map((t, idx) => (
                <span key={idx} className="text-[11px] font-bold px-3 py-1 bg-white/10 text-white rounded-lg border border-white/10 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-indigo-300" />
                  {t}
                </span>
              ))}
            </div>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onSelectCategory && onSelectCategory(slide.category)}
                className={`px-6 py-3.5 rounded-2xl font-extrabold text-xs tracking-wider uppercase shadow-lg hover:shadow-2xl transition-all duration-300 active:scale-95 flex items-center gap-2 cursor-pointer border-none ${slide.btnBg}`}
              >
                <span>Shop {slide.category} Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-xs font-semibold text-white/80 bg-white/5 px-4 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                <span>Offers Expire Soon</span>
              </div>
            </div>

          </div>

          {/* Right Hero Product Cards Display */}
          <div className="lg:col-span-5 flex flex-col gap-4 relative">
            <div className="relative rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 p-4 shadow-2xl hover:scale-102 transition-transform duration-500">
              <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-white/5 flex items-center justify-center relative mb-3">
                <img 
                  src={slide.image} 
                  alt={slide.title} 
                  className="w-full h-full object-cover rounded-xl hover:scale-105 transition-transform duration-700" 
                />
                <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                  HOT DEAL
                </span>
              </div>

              {/* Mini Product Cards Preview */}
              <div className="grid grid-cols-2 gap-2.5">
                {slide.featuredProducts.map((fp, i) => (
                  <div key={i} className="bg-white/10 rounded-xl p-2.5 border border-white/15 backdrop-blur-sm flex items-center gap-2.5">
                    <img src={fp.image} alt={fp.name} className="w-10 h-10 rounded-lg object-cover bg-white" />
                    <div className="overflow-hidden text-left">
                      <p className="text-[11px] font-bold text-white truncate">{fp.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-extrabold text-amber-300">${fp.price}</span>
                        <span className="text-[10px] text-white/60 line-through">${fp.oldPrice}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Carousel Navigation Arrows & Indicators */}
        <button
          onClick={() => setCurrentSlide(prev => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 cursor-pointer z-20"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 cursor-pointer z-20"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slide Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {HERO_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer border-none ${idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />  
          ))}
        </div>

      </div>

      {/* 3. Flipkart Trust Feature Badges Ticker */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Truck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-extrabold text-slate-800">Free Fast Delivery</h4>
            <p className="text-[10px] text-slate-400 font-medium">On orders above $49</p>
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
