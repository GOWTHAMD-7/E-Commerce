// src/App.tsx
import { useEffect, useState, useContext } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { 
  fetchProducts, 
  deleteProduct, 
  fetchCart, 
  addToBackendCart, 
  updateBackendCartItem, 
  removeFromBackendCart, 
  checkoutBackendCart, 
  fetchBackendOrders,
  searchProducts,
  fetchFavorites,
  addFavoriteToBackend,
  removeFavoriteFromBackend,
  fetchAddresses,
  saveAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  fetchFeaturedProducts,
  fetchNewArrivals,
  fetchTopRatedProducts,
  fetchMostReviewedProducts,
  requestCancelOrder,
  confirmCancelOrder
} from './api';
import type { Product, CartItem, Order, Address } from './types';
import { AuthContext } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import ProductList from './components/ProductList';
import ProductDetails from './components/ProductDetails';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './components/Unauthorized';
import SellerDashboard from './components/SellerDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Homepage row states
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [mostReviewed, setMostReviewed] = useState<Product[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState<boolean>(true);

  // Shopping Cart States
  const [cart, setCart] = useState<CartItem[]>([]);

  // Placed Orders States
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Order cancellation states
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOtp, setCancelOtp] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // Favorites States
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Saved Addresses and Checkout States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address-select' | 'order-summary'>('cart');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id'>>({
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
  });

  // Address Modal States
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressEditing, setAddressEditing] = useState<Address | null>(null);
  const [addressAdding, setAddressAdding] = useState(false);
  const [formAddress, setFormAddress] = useState<Omit<Address, 'id'>>({
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
  });

  useEffect(() => {
    if (addressEditing) {
      setFormAddress({
        fullName: addressEditing.fullName || '',
        phoneNumber: addressEditing.phoneNumber || '',
        addressLine1: addressEditing.addressLine1 || '',
        addressLine2: addressEditing.addressLine2 || '',
        city: addressEditing.city || '',
        state: addressEditing.state || '',
        country: addressEditing.country || '',
        pincode: addressEditing.pincode || '',
      });
    } else {
      setFormAddress({
        fullName: '',
        phoneNumber: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
      });
    }
  }, [addressEditing, addressAdding]);

  // Fetch homepage specialized sections once on mount
  useEffect(() => {
    const fetchSections = async () => {
      try {
        setSectionsLoading(true);
        const [featuredData, newArrivalsData, topRatedData, mostReviewedData] = await Promise.all([
          fetchFeaturedProducts(),
          fetchNewArrivals(),
          fetchTopRatedProducts(),
          fetchMostReviewedProducts()
        ]);
        setFeaturedProducts(featuredData);
        setNewArrivals(newArrivalsData);
        setTopRated(topRatedData);
        setMostReviewed(mostReviewedData);
      } catch (err) {
        console.error('Failed to fetch homepage sections:', err);
      } finally {
        setSectionsLoading(false);
      }
    };
    fetchSections();
  }, []);

  // Search / fetch products with debouncing
  useEffect(() => {
    let active = true;
    
    const fetchFn = async () => {
      try {
        if (searchQuery.trim() === '') {
          // Fetch 48 products initially (page 0, size 48).
          // Page size 48 corresponds to two page sizes of 24, which aligns offset for load more.
          const data = await fetchProducts(0, 48);
          if (active) {
            setProducts(data || []);
            setPage(1); // Since we loaded page 0 and page 1 (24 * 2), next page will be 2 (nextPage = page + 1)
            setHasMore(data ? data.length >= 48 : false);
            setLoading(false);
          }
        } else {
          const data = await searchProducts(searchQuery);
          if (active) {
            setProducts(data || []);
            setHasMore(false); // Disable Load More during search
            setLoading(false);
          }
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Error fetching products');
          setLoading(false);
        }
      }
    };

    setLoading(true);
    setError(null);

    // If query is empty, fetch immediately; otherwise debounce it by 300ms
    if (searchQuery.trim() === '') {
      fetchFn();
    } else {
      const delayDebounceFn = setTimeout(() => {
        fetchFn();
      }, 300);
      return () => {
        active = false;
        clearTimeout(delayDebounceFn);
      };
    }

    return () => {
      active = false;
    };
  }, [searchQuery]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || searchQuery.trim() !== '') return;

    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await fetchProducts(nextPage, 24);
      setProducts((prev) => [...prev, ...(data || [])]);
      setPage(nextPage);
      setHasMore(data ? data.length >= 24 : false);
    } catch (err: any) {
      console.error('Failed to load more products:', err);
      alert(err.message || 'Failed to load more products');
    } finally {
      setLoadingMore(false);
    }
  };

  // Fetch cart, orders, and favorites on login / session restoration
  useEffect(() => {
    if (auth?.user) {
      // Load backend cart & stats for standard customer or seller
      if (auth.user.role === 'CUSTOMER' || auth.user.role === 'SELLER') {
        fetchCart()
          .then((data) => {
            setCart(data.cart || []);
          })
          .catch((err) => {
            console.error('Failed to load cart from backend:', err);
          });

        fetchBackendOrders()
          .then((data) => {
            setOrders(data || []);
          })
          .catch((err) => {
            console.error('Failed to load orders from backend:', err);
          });

        fetchFavorites()
          .then((data) => {
            setFavorites(data || []);
          })
          .catch((err) => {
            console.error('Failed to load favorites from backend:', err);
          });

        fetchAddresses()
          .then((data) => {
            setAddresses(data || []);
            const def = data?.find((a: Address) => a.isDefault) || data?.[0];
            if (def && def.id) {
              setSelectedAddressId(def.id);
            }
          })
          .catch((err) => {
            console.error('Failed to load addresses from backend:', err);
          });
      }
    } else {
      // Clear local states on logout
      setCart([]);
      setOrders([]);
      setFavorites([]);
      setAddresses([]);
      setCheckoutStep('cart');
      setSelectedAddressId(null);
    }
  }, [auth?.user]);

  // Redirect to home if user is logged in and visits /login or /register
  useEffect(() => {
    if (auth?.user && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
      navigate('/');
    }
  }, [auth?.user, navigate]);

  const handleToggleFavorite = async (productId: number) => {
    if (!auth?.user) {
      navigate('/login');
      alert('Please login to add products to your favorites.');
      return;
    }

    const isFav = favorites.some(fav => fav.id === productId);
    try {
      if (isFav) {
        const updated = await removeFavoriteFromBackend(productId);
        setFavorites(updated || []);
      } else {
        const updated = await addFavoriteToBackend(productId);
        setFavorites(updated || []);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update favorites');
    }
  };

  // Shopping Cart Helpers
  const handleAddToCart = async (product: Product, quantityToAdd: number = 1) => {
    if (!auth?.user) {
      navigate('/login');
      alert('Please login first to add items to your cart.');
      return;
    }
    if (product.id === undefined) return;
    if (product.stock <= 0) {
      alert('Sorry, this product is out of stock.');
      return;
    }

    try {
      const existingItem = cart.find(item => item.product.id === product.id);
      const totalRequested = (existingItem?.quantity || 0) + quantityToAdd;
      if (totalRequested > product.stock) {
        alert(`Cannot add. Only ${product.stock} items are in stock, and you already have ${existingItem?.quantity || 0} in your cart.`);
        return;
      }
      
      const data = await addToBackendCart(product.id, quantityToAdd);
      setCart(data.cart || []);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart');
    }
  };

  const handleUpdateCartQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    try {
      const item = cart.find(i => i.product.id === productId);
      if (item && quantity > item.product.stock) {
        alert(`Cannot update quantity. Only ${item.product.stock} items are in stock.`);
        return;
      }
      
      const data = await updateBackendCartItem(productId, quantity);
      setCart(data.cart || []);
    } catch (err: any) {
      alert(err.message || 'Failed to update quantity');
    }
  };

  const handleRemoveFromCart = async (productId: number) => {
    try {
      const data = await removeFromBackendCart(productId);
      setCart(data.cart || []);
    } catch (err: any) {
      alert(err.message || 'Failed to remove item');
    }
  };

  const handleCheckout = async (addressId: number) => {
    if (cart.length === 0 || checkoutLoading) return;
    
    setCheckoutLoading(true);
    try {
      const order = await checkoutBackendCart(addressId);
      alert(`Thank you for your purchase! Order #${order.id} placed successfully.`);
      
      setCart([]);
      setCheckoutStep('cart');
      setSelectedAddressId(null);
      navigate('/orders');

      const ordersData = await fetchBackendOrders();
      setOrders(ordersData || []);

      const productsData = await fetchProducts(0, 48);
      setProducts(productsData);
      setPage(1);
      setHasMore(productsData ? productsData.length >= 48 : false);
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleRequestCancel = async (orderId: number) => {
    setCancelError(null);
    setCancelSuccessMsg(null);
    setCancelOtp('');
    setCancellingOrderId(orderId);
    setCancelLoading(true);

    try {
      await requestCancelOrder(orderId);
      setCancelSuccessMsg("Verification OTP code sent to your email. Please check your inbox (or backend logs in dev mode) and enter the 6-digit code below.");
      setShowCancelModal(true);
    } catch (err: any) {
      alert(err.message || "Failed to request cancellation");
      setCancellingOrderId(null);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cancellingOrderId === null) return;
    setCancelError(null);
    setCancelLoading(true);

    try {
      await confirmCancelOrder(cancellingOrderId, cancelOtp);
      alert("Order cancelled successfully!");
      setShowCancelModal(false);
      setCancellingOrderId(null);
      setCancelOtp('');
      
      // Refresh orders and products
      const ordersData = await fetchBackendOrders();
      setOrders(ordersData || []);
      
      const productsData = await fetchProducts(0, 48);
      setProducts(productsData);
    } catch (err: any) {
      setCancelError(err.message || "Invalid code or cancellation failed");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleBuyNow = async (product: Product, quantity: number) => {
    if (!auth?.user) {
      navigate('/login');
      alert('Please login first to purchase products.');
      return;
    }

    try {
      const data = await addToBackendCart(product.id!, quantity);
      setCart(data.cart || []);
      
      navigate('/cart');
      setCheckoutStep('address-select');
      const def = addresses.find(a => a.isDefault) || addresses[0];
      if (def && def.id) {
        setSelectedAddressId(def.id);
      }
      if (addresses.length === 0) {
        setShowNewAddressForm(true);
      }
    } catch (err: any) {
      alert(err.message || 'Buy Now failed');
    }
  };

  const handleDeleteClick = async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this product?');
    if (!confirmed) return;

    try {
      await deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
      setCart((prevCart) => prevCart.filter(item => item.product.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  // Address Management Handlers
  const handleSetDefaultAddress = async (id: number) => {
    try {
      await setDefaultAddress(id);
      const data = await fetchAddresses();
      setAddresses(data || []);
      setSelectedAddressId(id);
    } catch (err: any) {
      alert(err.message || 'Failed to set default address');
    }
  };

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await saveAddress(formAddress as Address);
      if (saved.id) {
        await setDefaultAddress(saved.id);
      }
      const data = await fetchAddresses();
      setAddresses(data || []);
      if (saved.id) {
        setSelectedAddressId(saved.id);
      }
      setAddressAdding(false);
      setShowAddressModal(false);
      alert('Address added and set as default!');
    } catch (err: any) {
      alert(err.message || 'Failed to add address');
    }
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressEditing || !addressEditing.id) return;
    try {
      await updateAddress(addressEditing.id, formAddress as Address);
      const data = await fetchAddresses();
      setAddresses(data || []);
      setAddressEditing(null);
      alert('Address updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update address');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this address?');
    if (!confirmed) return;
    try {
      await deleteAddress(id);
      const data = await fetchAddresses();
      setAddresses(data || []);
      if (selectedAddressId === id) {
        const nextDefault = data?.find((a: Address) => a.isDefault) || data?.[0];
        setSelectedAddressId(nextDefault ? nextDefault.id! : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete address');
    }
  };

  const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
  const totalCartDistinctItems = cart.length;
  const isCartValid = cart.every(item => item.product && item.product.stock > 0 && item.quantity <= item.product.stock);

  if (!auth) return null;

  if (auth.loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-[#E5E5E7] px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 rounded-b-2xl shadow-sm transition-all duration-300">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 className="text-[2.2rem] font-bold tracking-[-0.03em] text-[#111113]" style={{ fontFamily: '"Playfair Display", "Cormorant Garamond", serif' }}>
            Sellora
          </h1>
        </Link>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
          {/* Cart, Favorites, Orders Buttons: only for CUSTOMER or SELLER */}
          {auth.user && (auth.user.role === 'CUSTOMER' || auth.user.role === 'SELLER') && (
            <>
              {/* Deliver to Badge */}
              <button 
                onClick={() => {
                  setAddressAdding(false);
                  setAddressEditing(null);
                  setShowAddressModal(true);
                }} 
                className="relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-[#111113] bg-white hover:bg-[#FAFAFA] border border-[#6E6E73]/20 rounded-xl transition-all duration-200 group text-left"
              >
                <svg className="w-5 h-5 text-slate-500 group-hover:text-[#111113] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-[9px] text-[#6E6E73] font-bold uppercase tracking-wider leading-none">Deliver to</span>
                  <span className="text-xs font-extrabold text-[#111113] leading-tight">
                    {defaultAddress ? `${defaultAddress.city} ${defaultAddress.pincode}` : 'Add Address'}
                  </span>
                </div>
              </button>

              {/* Orders Button */}
              <button 
                onClick={() => navigate('/orders')} 
                className="relative flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#111113] bg-white hover:bg-[#FAFAFA] border border-[#6E6E73]/20 rounded-xl transition-all duration-200 group"
              >
                <svg className="w-5 h-5 text-slate-500 group-hover:text-[#111113] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="hidden sm:inline">Orders</span>
                {orders.length > 0 && (
                  <span className="flex h-4 min-w-4 px-1.5 items-center justify-center text-[9px] font-bold text-white bg-[#111113] rounded-full ring-2 ring-white absolute -top-1.5 -right-1.5">
                    {orders.length}
                  </span>
                )}
              </button>

              {/* Favorites Button */}
              <button 
                onClick={() => navigate('/favorites')} 
                className="relative flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-[#111113] bg-white hover:bg-[#FAFAFA] border border-[#6E6E73]/20 rounded-xl transition-all duration-200 group"
              >
                <div className="relative">
                  <svg className="w-5 h-5 text-slate-500 group-hover:text-rose-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {favorites.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center text-[9px] font-bold text-white bg-[#111113] rounded-full ring-2 ring-white">
                      {favorites.length}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline">Wishlist</span>
              </button>

              {/* Cart Button */}
              <button 
                onClick={() => navigate('/cart')} 
                className="relative flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-[#111113] hover:bg-[#111113]/90 rounded-xl transition-all duration-200 group"
              >
                <div className="relative">
                  <svg className="w-5 h-5 text-indigo-100 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {totalCartDistinctItems > 0 && (
                    <span className="absolute -top-2.5 -right-2 flex h-4 min-w-4 px-1 items-center justify-center text-[9px] font-extrabold text-[#111113] bg-white rounded-full ring-2 ring-[#111113]">
                      {totalCartDistinctItems}
                    </span>
                  )}
                </div>
                <span>Cart</span>
              </button>
            </>
          )}

          {auth.user && auth.user.role === 'SELLER' && (
            <button 
              onClick={() => navigate('/seller/dashboard')} 
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all duration-200 hover:shadow-sm"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Seller Hub
            </button>
          )}

          {auth.user && auth.user.role === 'ADMIN' && (
            <button 
              onClick={() => navigate('/admin/dashboard')} 
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#111113] bg-white hover:bg-[#FAFAFA] border border-[#6E6E73]/20 rounded-xl transition-all duration-200"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin Hub
            </button>
          )}

          {auth.user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(prev => !prev)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[#111113] text-white font-extrabold text-sm border-2 border-[#111113]/10 transition-all focus:outline-none"
                title="User Menu"
              >
                {auth.user.email.substring(0, 2).toUpperCase()}
              </button>
              
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2.5 w-60 bg-white border border-[#E5E5E7] rounded-2xl shadow-xl py-3 z-50 text-left">
                  <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#FAFAFA] text-[#111113] border border-[#6E6E73]/10 flex items-center justify-center font-bold text-xs">
                      {auth.user.email.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-slate-700 truncate">{auth.user.email}</span>
                      <span className="text-[10px] text-[#6E6E73] font-bold uppercase tracking-wider mt-0.5">{auth.user.role}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 px-1.5 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        alert('Account Settings & Profile settings coming soon!');
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Account Settings
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        auth.logout();
                        navigate('/');
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-all"
                    >
                      <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate('/login')} 
                  className="px-4.5 py-2 text-sm font-semibold text-white bg-[#111113] hover:bg-[#111113]/90 rounded-xl transition-all duration-200"
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate('/register')} 
                  className="px-4.5 py-2 text-sm font-semibold text-[#111113] bg-white hover:bg-[#FAFAFA] border border-[#6E6E73]/20 rounded-xl transition-all duration-200"
                >
                  Register
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Routes panel wrapper */}
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <>
              {/* Hero Section */}
              <section className="relative overflow-hidden bg-[#111113] text-white rounded-3xl my-8 px-8 py-16 sm:px-12 sm:py-24 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/10">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-[100px]"></div>
                
                <div className="relative max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
                  <span className="inline-flex items-center gap-1.5 px-4.5 py-1 text-[10px] font-bold text-white bg-white/10 border border-white/20 rounded-full uppercase tracking-widest">
                    ✨ Summer Collection 2026
                  </span>
                  <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight" style={{ fontFamily: '"Playfair Display", "Cormorant Garamond", serif' }}>
                    Discover Premium Goods
                  </h2>
                  <p className="text-[#E5E5E7]/70 text-sm sm:text-base max-w-xl leading-relaxed">
                    Explore our curated collection of high-quality products. Enjoy seamless interactions, real-time stock levels, and modern designs tailored for you.
                  </p>
                  <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-[#E5E5E7]/50 font-medium pt-6 border-t border-white/10 w-full mt-2 tracking-wider">
                    <span className="flex items-center gap-1.5">
                      🚀 Free Shipping
                    </span>
                    <span className="hidden sm:inline text-white/20">•</span>
                    <span className="flex items-center gap-1.5">
                      🔒 Secure Checkout
                    </span>
                    <span className="hidden sm:inline text-white/20">•</span>
                    <span className="flex items-center gap-1.5">
                      🤝 24/7 Support
                    </span>
                  </div>
                </div>
              </section>

              <ProductList
                products={products}
                loading={loading}
                error={error}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onAddToCart={handleAddToCart}
                currentUser={auth.user}
                onUpdate={() => navigate(`/admin/products`)}
                onDelete={handleDeleteClick}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
                loadingMore={loadingMore}
                featuredProducts={featuredProducts}
                newArrivals={newArrivals}
                topRated={topRated}
                mostReviewed={mostReviewed}
                sectionsLoading={sectionsLoading}
              />
            </>
          } 
        />
        
        <Route 
          path="/product/:id" 
          element={
            <ProductDetails
              products={products}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
            />
          } 
        />

        <Route 
          path="/login" 
          element={
            <LoginForm initialRegister={false} onCancel={() => navigate('/')} />
          } 
        />

        <Route 
          path="/register" 
          element={
            <LoginForm initialRegister={true} onCancel={() => navigate('/')} />
          } 
        />


        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Customer/Seller Routes */}
        <Route element={<ProtectedRoute allowedRoles={['CUSTOMER', 'SELLER']} />}>
          <Route 
            path="/cart" 
            element={
              <div style={{ maxWidth: '800px', margin: '40px auto', padding: '32px', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
                {checkoutStep === 'address-select' ? (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-extrabold text-slate-800 m-0">Delivery Details</h2>
                      <button onClick={() => setCheckoutStep('cart')} className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-all focus:outline-none">
                        ← Back to Cart
                      </button>
                    </div>

                    {/* Saved Addresses list */}
                    {addresses.length > 0 && !showNewAddressForm && (
                      <div className="flex flex-col gap-4 mb-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-bold text-slate-800 m-0">Select a Shipping Address</h3>
                          <button 
                            onClick={() => {
                              setNewAddress({
                                fullName: '',
                                phoneNumber: '',
                                addressLine1: '',
                                addressLine2: '',
                                city: '',
                                state: '',
                                country: '',
                                pincode: '',
                              });
                              setShowNewAddressForm(true);
                            }} 
                            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
                          >
                            ➕ Add New Address
                          </button>
                        </div>
                        <div className="flex flex-col gap-3">
                          {addresses.map((addr) => {
                            const isSelected = selectedAddressId === addr.id;
                            return (
                              <div 
                                key={addr.id} 
                                className={`p-5 border rounded-2xl cursor-pointer flex justify-between items-center gap-4 transition-all ${
                                  isSelected 
                                    ? 'border-2 border-indigo-600 bg-indigo-50/10 shadow-sm' 
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/30'
                                }`}
                                onClick={() => setSelectedAddressId(addr.id!)}
                              >
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-800 text-sm">{addr.fullName}</span>
                                    {addr.isDefault && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-600 mt-1">
                                    {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                                  </p>
                                  <p className="text-xs text-slate-650">
                                    {addr.city}, {addr.state}, {addr.country} - {addr.pincode}
                                  </p>
                                  <p className="text-[11px] font-semibold text-slate-500 mt-1">
                                    Phone: {addr.phoneNumber}
                                  </p>
                                </div>
                                <div className="shrink-0">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAddressId(addr.id!);
                                      setCheckoutStep('order-summary');
                                    }}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-bold text-xs transition-all shadow-sm shadow-indigo-100"
                                  >
                                    Deliver to this address
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* New Address form wrapper */}
                    {(addresses.length === 0 || showNewAddressForm) && (
                      <div className="border border-slate-200/80 p-6 rounded-2xl bg-slate-50/40">
                        <h4 className="text-base font-bold text-slate-800 mb-4 text-left">Add a new shipping address</h4>
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          try {
                            const saved = await saveAddress(newAddress as Address);
                            if (addresses.length === 0 || !addresses.some(a => a.isDefault)) {
                              await setDefaultAddress(saved.id!);
                            }
                            const data = await fetchAddresses();
                            setAddresses(data || []);
                            setShowNewAddressForm(false);
                            setSelectedAddressId(saved.id!);
                            alert('Address saved successfully!');
                            setCheckoutStep('order-summary');
                          } catch (err: any) {
                            alert(err.message || 'Failed to save address');
                          }
                        }} className="flex flex-col gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5 text-left">
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full Name</label>
                              <input 
                                type="text" 
                                required 
                                className="px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                value={newAddress.fullName}
                                onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 text-left">
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phone Number</label>
                              <input 
                                type="text" 
                                required 
                                className="px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                value={newAddress.phoneNumber}
                                onChange={(e) => setNewAddress({ ...newAddress, phoneNumber: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 text-left">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Address Line 1</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="Street address, P.O. box, company name"
                              className="px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                              value={newAddress.addressLine1}
                              onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                            />
                          </div>

                          <div className="flex flex-col gap-1.5 text-left">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Address Line 2 (Optional)</label>
                            <input 
                              type="text" 
                              placeholder="Apartment, suite, unit, building, floor, etc."
                              className="px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                              value={newAddress.addressLine2 || ''}
                              onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5 text-left">
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">City</label>
                              <input 
                                type="text" 
                                required 
                                className="px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                value={newAddress.city}
                                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 text-left">
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">State / Province / Region</label>
                              <input 
                                type="text" 
                                required 
                                className="px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                value={newAddress.state}
                                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5 text-left">
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Country</label>
                              <input 
                                type="text" 
                                required 
                                className="px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                value={newAddress.country}
                                onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 text-left">
                              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pincode / ZIP</label>
                              <input 
                                type="text" 
                                required 
                                className="px-3.5 py-2.5 bg-white border border-slate-250 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                value={newAddress.pincode}
                                onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-2">
                            {addresses.length > 0 && (
                              <button 
                                type="button" 
                                onClick={() => setShowNewAddressForm(false)} 
                                className="px-4 py-2 border border-slate-200 text-slate-650 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-all focus:outline-none"
                              >
                                Cancel
                              </button>
                            )}
                            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-sm rounded-xl transition-all shadow-sm focus:outline-none shadow-indigo-100">
                              Save Address & Continue
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ) : checkoutStep === 'order-summary' ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Order Summary & Placement</h2>
                      <button onClick={() => setCheckoutStep('address-select')} className="btn-secondary btn-sm" style={{ padding: '8px 14px' }}>← Change Address</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      {/* Left Side: Selected address & Order items */}
                      <div className="md:col-span-8 flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Address Panel */}
                        <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Delivery Shipping Address</h4>
                          {(() => {
                            const addr = addresses.find(a => a.id === selectedAddressId);
                            if (!addr) return <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>No address selected.</p>;
                            return (
                              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: '4px' }}>{addr.fullName}</div>
                                <div>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</div>
                                <div>{addr.city}, {addr.state}, {addr.country} - {addr.pincode}</div>
                                <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: 600 }}>Phone: {addr.phoneNumber}</div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Order Items */}
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                          <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                            <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Review Items</h4>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {cart.map((item) => (
                              <div key={item.id || item.product.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--color-border)' }} className="last:border-b-0">
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.product.name}</span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>${item.product.price.toFixed(2)} each</span>
                                  {item.product.stock === 0 ? (
                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md mt-1 border border-rose-200/50 animate-pulse uppercase tracking-wide">
                                      This product is no longer available.
                                    </span>
                                  ) : item.quantity > item.product.stock ? (
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1 border border-amber-200/50 animate-pulse uppercase tracking-wide">
                                      Only {item.product.stock} items available.
                                    </span>
                                  ) : null}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Qty: {item.quantity}</span>
                                  <div style={{ fontWeight: 700, fontSize: '0.875rem', marginTop: '2px' }}>${(item.product.price * item.quantity).toFixed(2)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Total Summary Panel */}
                      <div className="md:col-span-4">
                        <div style={{ padding: '20px', background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                          <h4 style={{ margin: '0 0 16px 0', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Payment Summary</h4>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                            <span>Subtotal</span>
                            <span>${cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                            <span>Shipping</span>
                            <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>FREE</span>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginBottom: '20px' }}>
                            <span>Order Total</span>
                            <span style={{ color: 'var(--color-primary)' }}>${cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)}</span>
                          </div>

                          <button 
                            onClick={() => selectedAddressId && handleCheckout(selectedAddressId)}
                            className="btn-primary" 
                            disabled={checkoutLoading || !isCartValid}
                            style={{ 
                              width: '100%', 
                              padding: '12px 16px', 
                              fontWeight: 700, 
                              opacity: (checkoutLoading || !isCartValid) ? 0.6 : 1, 
                              cursor: (checkoutLoading || !isCartValid) ? 'not-allowed' : 'pointer' 
                            }}
                          >
                            {checkoutLoading ? 'Placing Order...' : 'Place Order'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-extrabold text-slate-800 m-0">Your Shopping Cart</h2>
                      <button onClick={() => navigate(-1)} className="px-3.5 py-2 text-sm font-semibold text-slate-700 bg-slate-50/50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl transition-all duration-200 hover:shadow-sm">
                        ← Back
                      </button>
                    </div>
                    {cart.length === 0 ? (
                      <div className="empty-cart-view" style={{ padding: '40px 0', textAlign: 'center' }}>
                        <span style={{ fontSize: '3rem' }}>🛒</span>
                        <p style={{ marginTop: '12px', color: 'var(--color-text-secondary)' }}>Your cart is empty.</p>
                        <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '20px', padding: '10px 20px' }}>
                          Continue Shopping
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="cart-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {cart.map((item) => (
                            <div key={item.id || item.product.id} className="cart-item-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                              <div className="cart-item-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span className="cart-item-name" style={{ fontWeight: 600 }}>{item.product.name}</span>
                                <span className="cart-item-price" style={{ color: 'var(--color-text-secondary)' }}>${(item.product.price * item.quantity).toFixed(2)}</span>
                                {item.product.stock === 0 ? (
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md mt-1 border border-rose-200/50 animate-pulse uppercase tracking-wide w-fit">
                                    This product is no longer available.
                                  </span>
                                ) : item.quantity > item.product.stock ? (
                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1 border border-amber-200/50 animate-pulse uppercase tracking-wide w-fit">
                                    Only {item.product.stock} items available.
                                  </span>
                                ) : null}
                              </div>
                              <div className="cart-item-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div className="quantity-controller" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <button 
                                    onClick={() => item.product.id !== undefined && handleUpdateCartQuantity(item.product.id, item.quantity - 1)}
                                    className="quantity-btn"
                                    style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    -
                                  </button>
                                  <span className="quantity-display">{item.quantity}</span>
                                  <button 
                                    onClick={() => item.product.id !== undefined && handleUpdateCartQuantity(item.product.id, item.quantity + 1)}
                                    className="quantity-btn"
                                    style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    +
                                  </button>
                                </div>
                                <button 
                                  onClick={() => item.product.id !== undefined && handleRemoveFromCart(item.product.id)}
                                  className="cart-remove-btn"
                                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                  title="Remove Item"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {!isCartValid && (
                          <div className="text-xs font-semibold text-rose-650 bg-rose-50/50 border border-rose-200/40 px-4 py-2.5 rounded-xl mt-4 text-left flex items-center gap-2">
                            <span>⚠️</span>
                            <span>Please update quantities or remove unavailable products before checking out.</span>
                          </div>
                        )}
                        <div className="cart-footer" style={{ marginTop: '24px', borderTop: '1px solid var(--color-border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="cart-total-row">
                            <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>Total Price: </span>
                            <span className="cart-total-price" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                              ${cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)}
                            </span>
                          </div>
                          <button 
                            onClick={() => {
                              const def = addresses.find(a => a.isDefault) || addresses[0];
                              if (def && def.id) {
                                setSelectedAddressId(def.id);
                              }
                              if (addresses.length === 0) {
                                setShowNewAddressForm(true);
                              } else {
                                setShowNewAddressForm(false);
                              }
                              setCheckoutStep('address-select');
                            }} 
                            className="btn-primary" 
                            disabled={!isCartValid}
                            style={{ 
                              padding: '12px 24px',
                              opacity: !isCartValid ? 0.6 : 1,
                              cursor: !isCartValid ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Proceed to Checkout
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            } 
          />
          
          <Route 
            path="/favorites" 
            element={
              <div style={{ maxWidth: '800px', margin: '40px auto', padding: '32px', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-extrabold text-slate-800 m-0">Your Favorites</h2>
                  <button onClick={() => navigate(-1)} className="px-3.5 py-2 text-sm font-semibold text-slate-700 bg-slate-50/50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl transition-all duration-200 hover:shadow-sm">
                    ← Back
                  </button>
                </div>
                {favorites.length === 0 ? (
                  <div className="empty-cart-view" style={{ padding: '40px 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '3.0rem' }}>❤️</span>
                    <p style={{ marginTop: '12px', color: 'var(--color-text-secondary)' }}>No favorited products yet.</p>
                    <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '20px' }}>
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="cart-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {favorites.map((product) => (
                      <div 
                        key={product.id} 
                        className="cart-item-row" 
                        style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                        onClick={() => product.id !== undefined && navigate(`/product/${product.id}`)}
                      >
                        <div className="cart-item-info">
                          <span className="cart-item-name" style={{ fontWeight: 600 }}>{product.name}</span>
                          <div className="cart-item-price" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>${product.price.toFixed(2)}</div>
                        </div>
                        <div className="cart-item-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => product.id !== undefined && handleToggleFavorite(product.id)}
                            className="cart-remove-btn"
                            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-danger)' }}
                            aria-label="Remove favorite"
                          >
                            ❤️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            } 
          />

          <Route 
            path="/orders" 
            element={
              <div style={{ maxWidth: '800px', margin: '40px auto', padding: '32px', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-extrabold text-slate-800 m-0">Your Placed Orders</h2>
                  <button onClick={() => navigate(-1)} className="px-3.5 py-2 text-sm font-semibold text-slate-700 bg-slate-50/50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl transition-all duration-200 hover:shadow-sm">
                    ← Back
                  </button>
                </div>
                {orders.length === 0 ? (
                  <div className="empty-orders-view" style={{ padding: '40px 0', textAlign: 'center' }}>
                    <span style={{ fontSize: '3rem' }}>📦</span>
                    <p style={{ marginTop: '12px', color: 'var(--color-text-secondary)' }}>You haven't placed any orders yet.</p>
                    <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '20px' }}>
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {orders.map((order) => {
                      const canCancel = (o: Order) => {
                        if (o.status !== 'PENDING') return false;
                        if (!o.orderDate) return false;
                        const placedTime = new Date(o.orderDate).getTime();
                        const nowTime = new Date().getTime();
                        const diffMin = (nowTime - placedTime) / (1000 * 60);
                        return diffMin < 5;
                      };

                      return (
                        <div key={order.id} className="order-row" style={{ padding: '20px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                          <div className="order-header-row" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '12px' }}>
                            <span className="order-id" style={{ fontWeight: 700 }}>Order #{order.id}</span>
                            <span className="order-date" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                              {order.orderDate
                                ? new Date(order.orderDate).toLocaleString()
                                : 'Recent'}
                            </span>
                          </div>
                          <div className="order-items-summary" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {order.orderItems && order.orderItems.map((item, idx) => (
                              <div key={idx} className="order-item-summary-line" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{item.product.name} <strong style={{ color: 'var(--color-text-muted)' }}>x{item.quantity}</strong></span>
                                <span>${(item.purchasedPrice * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          {order.shippingFullName && (
                            <div style={{ 
                              marginTop: '16px', 
                              paddingTop: '16px', 
                              borderTop: '1px dashed var(--color-border)',
                              fontSize: '0.875rem',
                              color: 'var(--color-text-secondary)',
                              textAlign: 'left'
                            }}>
                              <div style={{ fontWeight: 650, color: 'var(--color-text-primary)', marginBottom: '6px', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Ship to:</div>
                              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{order.shippingFullName}</div>
                              <div style={{ marginTop: '2px' }}>{order.shippingAddressLine1}{order.shippingAddressLine2 ? `, ${order.shippingAddressLine2}` : ''}</div>
                              <div>{order.shippingCity}, {order.shippingState}, {order.shippingCountry} - {order.shippingPincode}</div>
                              <div style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Phone: {order.shippingPhoneNumber}</div>
                            </div>
                          )}
                          <div className="order-footer-row" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginTop: '12px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              {(() => {
                                let bg = '#fef7e0'; // yellow for PENDING
                                let fg = '#b06000';
                                let txt = order.status || 'PENDING';
                                if (txt === 'DELIVERED') {
                                  bg = '#e6f4ea';
                                  fg = '#137333';
                                } else if (txt === 'CANCELLED') {
                                  bg = '#fce8e6';
                                  fg = '#c5221f';
                                }
                                return (
                                  <span 
                                    className="order-status-badge" 
                                    style={{ background: bg, color: fg, padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}
                                  >
                                    {txt}
                                  </span>
                                );
                              })()}

                              {canCancel(order) && (
                                <button
                                  type="button"
                                  onClick={() => order.id !== undefined && handleRequestCancel(order.id)}
                                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-750 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow active:scale-95 transition-all focus:outline-none"
                                  style={{ backgroundColor: '#dc2626' }}
                                >
                                  Cancel Order
                                </button>
                              )}
                            </div>
                            <span className="order-total-sum" style={{ fontWeight: 700 }}>
                              Total: $
                              {order.orderItems
                                ? order.orderItems.reduce((sum, item) => sum + item.purchasedPrice * item.quantity, 0).toFixed(2)
                                : '0.00'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Cancel OTP Modal */}
                {showCancelModal && cancellingOrderId !== null && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.45)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                  }}>
                    <div style={{
                      backgroundColor: 'white',
                      padding: '32px',
                      borderRadius: '24px',
                      maxWidth: '440px',
                      width: '100%',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                      border: '1px solid #f1f5f9',
                      textAlign: 'center'
                    }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Confirm Cancellation</h3>
                      
                      {cancelSuccessMsg && (
                        <p style={{ fontSize: '0.85rem', color: '#0f766e', background: '#f0fdfa', padding: '12px', borderRadius: '12px', border: '1px solid #ccfbf1', marginBottom: '16px', lineHeight: 1.5 }}>
                          {cancelSuccessMsg}
                        </p>
                      )}

                      {cancelError && (
                        <p style={{ fontSize: '0.85rem', color: '#b91c1c', background: '#fef2f2', padding: '12px', borderRadius: '12px', border: '1px solid #fee2e2', marginBottom: '16px' }}>
                          ⚠️ {cancelError}
                        </p>
                      )}

                      <form onSubmit={handleConfirmCancel}>
                        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>Verification Code</label>
                          <input
                            type="text"
                            required
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            pattern="\d{6}"
                            className="form-input"
                            value={cancelOtp}
                            onChange={(e) => setCancelOtp(e.target.value.trim())}
                            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', padding: '10px' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCancelModal(false);
                              setCancellingOrderId(null);
                              setCancelOtp('');
                              setCancelError(null);
                            }}
                            className="btn-secondary"
                            style={{ flex: 1 }}
                            disabled={cancelLoading}
                          >
                            Dismiss
                          </button>
                          <button
                            type="submit"
                            className="btn-primary"
                            style={{ flex: 1, backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                            disabled={cancelLoading}
                          >
                            {cancelLoading ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        </div>
                      </form>

                      <div style={{ marginTop: '20px', fontSize: '0.875rem' }}>
                        <span style={{ color: '#64748b' }}>Didn't receive the code? </span>
                        <button
                          type="button"
                          disabled={cancelLoading}
                          onClick={() => cancellingOrderId && handleRequestCancel(cancellingOrderId)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: cancelLoading ? '#94a3b8' : 'var(--color-primary)',
                            fontWeight: 600,
                            padding: '0 4px',
                            cursor: cancelLoading ? 'not-allowed' : 'pointer',
                            textDecoration: cancelLoading ? 'none' : 'underline'
                          }}
                        >
                          {cancelLoading ? 'Resending...' : 'Resend Code'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            } 
          />
        </Route>

        {/* Protected Seller Only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['SELLER']} />}>
          <Route path="/seller/dashboard" element={<SellerDashboard activeTab="dashboard" />} />
          <Route path="/seller/products" element={<SellerDashboard activeTab="products" />} />
          <Route path="/seller/add-product" element={<SellerDashboard activeTab="add-product" />} />
          <Route path="/seller/sales" element={<SellerDashboard activeTab="sales" />} />
        </Route>

        {/* Protected Admin Only Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard activeTab="dashboard" />} />
          <Route path="/admin/users" element={<AdminDashboard activeTab="users" />} />
          <Route path="/admin/products" element={<AdminDashboard activeTab="products" />} />
          <Route path="/admin/sellers" element={<AdminDashboard activeTab="sellers" />} />
        </Route>
      </Routes>

      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl mx-auto overflow-hidden border border-slate-100 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-extrabold text-slate-800">
                {addressEditing ? 'Edit Shipping Address' : addressAdding ? 'Add New Address' : 'Select Delivery Location'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddressModal(false);
                  setAddressEditing(null);
                  setAddressAdding(false);
                }}
                className="px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all font-semibold text-sm focus:outline-none"
              >
                <span>Close</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {addressEditing || addressAdding ? (
                <form onSubmit={addressEditing ? handleUpdateAddress : handleAddNewAddress} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. John Doe"
                        className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={formAddress.fullName}
                        onChange={(e) => setFormAddress({ ...formAddress, fullName: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phone Number</label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="e.g. 9876543210"
                        className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={formAddress.phoneNumber}
                        onChange={(e) => setFormAddress({ ...formAddress, phoneNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Address Line 1</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Street address, P.O. box, company name"
                      className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      value={formAddress.addressLine1}
                      onChange={(e) => setFormAddress({ ...formAddress, addressLine1: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Address Line 2 (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="Apartment, suite, unit, building, floor, etc."
                      className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      value={formAddress.addressLine2 || ''}
                      onChange={(e) => setFormAddress({ ...formAddress, addressLine2: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">City</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Chennai"
                        className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={formAddress.city}
                        onChange={(e) => setFormAddress({ ...formAddress, city: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">State</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Tamil Nadu"
                        className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={formAddress.state}
                        onChange={(e) => setFormAddress({ ...formAddress, state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Country</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. India"
                        className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={formAddress.country}
                        onChange={(e) => setFormAddress({ ...formAddress, country: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pincode</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. 600042"
                        className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={formAddress.pincode}
                        onChange={(e) => setFormAddress({ ...formAddress, pincode: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        setAddressEditing(null);
                        setAddressAdding(false);
                      }} 
                      className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-all focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-750 transition-all focus:outline-none shadow-sm shadow-indigo-200"
                    >
                      {addressEditing ? 'Save Changes' : 'Save & Set Default'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Addresses</span>
                    <button 
                      onClick={() => setAddressAdding(true)} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-150 rounded-xl text-xs font-bold transition-all"
                    >
                      ➕ Add Address
                    </button>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                      <span className="text-3xl">📍</span>
                      <p className="text-sm font-semibold text-slate-550 mt-2">No addresses saved yet</p>
                      <p className="text-xs text-slate-450 mt-0.5">Add a delivery address to get started</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
                      {addresses.map((addr) => {
                        const isDefault = addr.isDefault;
                        return (
                          <div 
                            key={addr.id}
                            className={`p-4 rounded-2xl border transition-all flex justify-between items-start gap-4 ${
                              isDefault 
                                ? 'border-2 border-indigo-600 bg-indigo-50/10' 
                                : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/30'
                            }`}
                          >
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-800 text-sm">{addr.fullName}</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1.5 break-words">
                                {addr.addressLine1}
                                {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                              </p>
                              <p className="text-xs text-slate-650">
                                {addr.city}, {addr.state}, {addr.country} - {addr.pincode}
                              </p>
                              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                                Phone: {addr.phoneNumber}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              {!isDefault ? (
                                <button 
                                  onClick={() => handleSetDefaultAddress(addr.id!)}
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline px-2 py-1 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all"
                                >
                                  Make Default
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 px-2 py-1 rounded bg-emerald-50 border border-emerald-200">
                                  Default
                                </span>
                              )}
                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={() => setAddressEditing(addr)}
                                  className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-2 py-1 hover:bg-slate-100 rounded transition-all"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteAddress(addr.id!)}
                                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 hover:bg-rose-50 rounded transition-all"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}