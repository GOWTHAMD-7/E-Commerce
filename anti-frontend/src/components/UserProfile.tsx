import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Package, MapPin, Heart, Settings, LogOut } from 'lucide-react';
import type { Order, Product } from '../types';

interface UserProfileProps {
  orders: Order[];
  favorites: Product[];
}

export default function UserProfile({ orders, favorites }: UserProfileProps) {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  if (!auth?.user) return null;

  const latestOrder = orders.length > 0 ? orders[0] : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center md:justify-between gap-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-100/40 to-indigo-100/40 blur-3xl -z-10 rounded-full" />
        
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg border-4 border-white shrink-0">
            {auth.user.email.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
              Hello, {auth.user.email.split('@')[0]}!
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-1.5">
              <span className="text-sm font-medium text-slate-500">{auth.user.email}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60">
                {auth.user.role}
              </span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => { auth.logout(); navigate('/'); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-semibold text-sm rounded-xl border border-slate-200 shadow-sm transition-colors active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Orders Card (Spans 2 columns on lg) */}
        <div 
          onClick={() => navigate('/orders')}
          className="lg:col-span-2 group bg-white border border-slate-200/60 hover:border-slate-300 rounded-[2rem] p-6 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -z-10 transition-transform group-hover:scale-150 duration-700" />
          
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-800 transition-colors">
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 mb-2">My Orders</h2>
          <p className="text-sm font-medium text-slate-500 mb-6">Track, return, or buy things again.</p>
          
          {latestOrder ? (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latest Order</span>
                <span className="font-semibold text-slate-700">Order #{latestOrder.id}</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                latestOrder.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
                latestOrder.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-200/50' :
                'bg-amber-50 text-amber-700 border-amber-200/50'
              }`}>
                {latestOrder.status || 'PENDING'}
              </span>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium text-slate-500 flex items-center justify-center h-16">
              No recent orders
            </div>
          )}
        </div>

        {/* Favorites Card */}
        <div 
          onClick={() => navigate('/favorites')}
          className="group bg-white border border-slate-200/60 hover:border-slate-300 rounded-[2rem] p-6 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -z-10 transition-transform group-hover:scale-150 duration-700" />
          
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-800 transition-colors">
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 mb-2">Wishlist</h2>
          <p className="text-sm font-medium text-slate-500 mb-6">Items you've liked.</p>
          
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between h-16">
            <span className="font-semibold text-slate-700">{favorites.length} items saved</span>
          </div>
        </div>

        {/* Addresses Card */}
        <div 
          onClick={() => navigate('/addresses')}
          className="group bg-white border border-slate-200/60 hover:border-slate-300 rounded-[2rem] p-6 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -z-10 transition-transform group-hover:scale-150 duration-700" />
          
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-800 transition-colors">
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 mb-2">Addresses</h2>
          <p className="text-sm font-medium text-slate-500">Manage delivery locations.</p>
        </div>

        {/* Account Settings Card (Spans 2 columns on lg) */}
        <div 
          onClick={() => { alert('Account Settings coming soon!'); }}
          className="lg:col-span-2 group bg-white border border-slate-200/60 hover:border-slate-300 rounded-[2rem] p-6 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-100 rounded-full blur-3xl -z-10 transition-transform group-hover:scale-150 duration-700" />
          
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
              <Settings className="w-6 h-6" />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-800 transition-colors">
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 mb-2">Account Settings</h2>
          <p className="text-sm font-medium text-slate-500">Update password or personal info.</p>
        </div>

      </div>
    </div>
  );
}
