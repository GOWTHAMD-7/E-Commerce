import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  fetchAddresses, 
  saveAddress, 
  updateAddress, 
  deleteAddress, 
  setDefaultAddress 
} from '../api';
import type { Address } from '../types';
import { Plus, Edit2, Trash2, MapPin, CheckCircle2, ChevronLeft } from 'lucide-react';
import { indiaData } from '../utils/indiaStates';

export default function Addresses() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    isDefault: false
  });

  const availableStates = indiaData.states.map(s => s.state);
  const selectedStateObj = indiaData.states.find(s => s.state === formData.state);
  const availableDistricts = selectedStateObj ? selectedStateObj.districts : [];

  useEffect(() => {
    if (!auth?.user) {
      navigate('/login');
      return;
    }
    loadAddresses();
  }, [auth, navigate]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await fetchAddresses();
      setAddresses(data);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setFormData({
      fullName: '', phoneNumber: '', addressLine1: '', addressLine2: '',
      city: '', state: '', country: 'India', pincode: '', isDefault: false
    });
    setShowModal(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setFormData({
      fullName: addr.fullName, phoneNumber: addr.phoneNumber,
      addressLine1: addr.addressLine1, addressLine2: addr.addressLine2 || '',
      city: addr.city, state: addr.state, country: addr.country,
      pincode: addr.pincode, isDefault: addr.isDefault || false
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress && editingAddress.id) {
        await updateAddress(editingAddress.id, { ...formData, id: editingAddress.id } as Address);
      } else {
        await saveAddress(formData as Address);
      }
      setShowModal(false);
      loadAddresses();
    } catch (err) {
      alert('Failed to save address');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteAddress(id);
        loadAddresses();
      } catch (err) {
        alert('Failed to delete address');
      }
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await setDefaultAddress(id);
      loadAddresses();
    } catch (err) {
      alert('Failed to set default address');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Saved Addresses</h1>
        </div>
        
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add New Address</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Address Digital Wallet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {addresses.map((addr) => (
          <div 
            key={addr.id}
            className={`group relative overflow-hidden rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all duration-300 border ${
              addr.isDefault 
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white border-transparent' 
                : 'bg-white border-slate-200/80 hover:border-indigo-200'
            }`}
          >
            {/* Background Glow for Default */}
            {addr.isDefault && (
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -z-10" />
            )}

            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  addr.isDefault ? 'bg-white/10 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  <MapPin className="w-5 h-5" />
                </div>
                {addr.isDefault && (
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Default
                  </span>
                )}
              </div>
              
              {/* Quick Actions (Appear on Hover on Desktop) */}
              <div className={`flex gap-2 ${addr.isDefault ? 'text-slate-300' : 'text-slate-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                {!addr.isDefault && (
                  <button onClick={() => handleSetDefault(addr.id!)} className="p-2 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition-colors" title="Set as Default">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => openEditModal(addr)} className={`p-2 rounded-lg transition-colors ${addr.isDefault ? 'hover:bg-white/20 hover:text-white' : 'hover:bg-slate-100 hover:text-indigo-600'}`}>
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(addr.id!)} className={`p-2 rounded-lg transition-colors ${addr.isDefault ? 'hover:bg-white/20 hover:text-rose-400' : 'hover:bg-slate-100 hover:text-rose-600'}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 mt-6">
              <span className={`text-lg font-bold ${addr.isDefault ? 'text-white' : 'text-slate-800'}`}>
                {addr.fullName}
              </span>
              <span className={`text-sm ${addr.isDefault ? 'text-slate-300' : 'text-slate-500'}`}>
                {addr.phoneNumber}
              </span>
            </div>
            
            <div className={`mt-4 text-sm font-medium leading-relaxed ${addr.isDefault ? 'text-slate-400' : 'text-slate-500'}`}>
              <p>{addr.addressLine1}</p>
              {addr.addressLine2 && <p>{addr.addressLine2}</p>}
              <p>{addr.city}, {addr.state} {addr.pincode}</p>
              <p>{addr.country}</p>
            </div>
          </div>
        ))}

        {addresses.length === 0 && (
          <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-slate-400">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Addresses Found</h3>
            <p className="text-slate-500 max-w-sm mb-6">You haven't saved any delivery addresses yet. Add one now to make checkout faster!</p>
            <button 
              onClick={openAddModal}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-colors"
            >
              Add Your First Address
            </button>
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-700" placeholder="John Doe" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input required type="text" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-700" placeholder="+1 (555) 000-0000" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Address Line 1</label>
                  <input required type="text" value={formData.addressLine1} onChange={e => setFormData({...formData, addressLine1: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-700" placeholder="123 Main St" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Address Line 2 <span className="text-slate-400 font-medium normal-case">(Optional)</span></label>
                  <input type="text" value={formData.addressLine2} onChange={e => setFormData({...formData, addressLine2: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-700" placeholder="Apt 4B" />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Country</label>
                  <select required value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-700">
                    <option value="India">India</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">State/Province</label>
                  <select required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value, city: ''})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-700">
                    <option value="" disabled>Select State</option>
                    {availableStates.map(stateName => (
                      <option key={stateName} value={stateName}>{stateName}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">District / City</label>
                  <select required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} disabled={!formData.state} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed">
                    <option value="" disabled>Select District</option>
                    {availableDistricts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ZIP / Postal Code</label>
                  <input required type="text" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-700" placeholder="10001" />
                </div>
              </div>
              
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95">
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
