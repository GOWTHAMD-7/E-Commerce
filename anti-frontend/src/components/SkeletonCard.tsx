export default function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-[22px] p-4 flex flex-col animate-pulse h-full shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
      {/* Image Skeleton */}
      <div className="aspect-square w-full bg-slate-100 rounded-2xl mb-4" />
      
      {/* Brand Skeleton */}
      <div className="h-2.5 bg-slate-100 rounded w-1/4 mb-2" />
      
      {/* Name Skeleton */}
      <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
      
      {/* Description Skeleton */}
      <div className="h-3 bg-slate-100 rounded w-full mb-1.5" />
      <div className="h-3 bg-slate-100 rounded w-5/6 mb-3.5" />
      
      {/* Ratings Skeleton */}
      <div className="flex items-center gap-1.5 mb-4">
        <div className="h-5 bg-slate-100 rounded-full w-12" />
        <div className="h-3 bg-slate-100 rounded w-10" />
      </div>
      
      {/* Price Skeleton */}
      <div className="border-t border-slate-100 pt-3.5 mt-auto flex items-center justify-between">
        <div className="h-5 bg-slate-100 rounded w-24" />
      </div>

      {/* Button Skeleton */}
      <div className="flex gap-2 mt-3">
        <div className="h-8 bg-slate-100 rounded-xl w-16" />
        <div className="h-8 bg-slate-100 rounded-xl flex-1" />
      </div>
    </div>
  );
}
