import React, { useState, useEffect } from 'react';
import { db, Product, Order, ShopSettings, DEFAULT_SETTINGS, INITIAL_PRODUCTS } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  ShieldCheck, 
  Lock, 
  LogOut, 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Check, 
  X, 
  ExternalLink,
  Flame,
  CreditCard,
  Phone,
  MessageSquare,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface AdminPanelProps {
  onBackToShop: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToShop }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('mpx_admin_auth') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin Data State
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Modals & Forms
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    category: 'FREE FIRE',
    price: 990,
    oldPrice: 1200,
    soldCount: 15,
    duration: '30 Days',
    badge: '🔥 HOT',
    description: '',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    status: 'active'
  });

  const [settingsSaved, setSettingsSaved] = useState(false);

  // 1. Admin Login Handler (Requested Credentials: MPX10X7X & MPX7X10X)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'MPX10X7X' && password === 'MPX7X10X') {
      sessionStorage.setItem('mpx_admin_auth', 'true');
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('ইউজারনেম অথবা পাসওয়ার্ড ভুল! সঠিক তথ্য প্রদান করুন।');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('mpx_admin_auth');
    setIsAuthenticated(false);
  };

  // 2. Load Firestore Data
  useEffect(() => {
    if (!isAuthenticated) return;

    // Load Orders
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubOrders = onSnapshot(q, (snapshot) => {
        const orderList: Order[] = [];
        snapshot.forEach((doc) => {
          orderList.push({ id: doc.id, ...doc.data() } as Order);
        });
        setOrders(orderList);
        setLoadingOrders(false);
      }, (err) => {
        console.warn('Orders query fallback', err);
        setLoadingOrders(false);
      });

      // Load Products
      const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is empty initially, seed with initial products
          INITIAL_PRODUCTS.forEach(async (p) => {
            await setDoc(doc(db, 'products', p.id), p);
          });
          setProducts(INITIAL_PRODUCTS);
        } else {
          const prodList: Product[] = [];
          snapshot.forEach((doc) => {
            prodList.push({ id: doc.id, ...doc.data() } as Product);
          });
          setProducts(prodList);
        }
        setLoadingProducts(false);
      }, (err) => {
        console.warn('Products fallback to defaults', err);
        setProducts(INITIAL_PRODUCTS);
        setLoadingProducts(false);
      });

      // Load Settings
      const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as ShopSettings);
        } else {
          setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS);
          setSettings(DEFAULT_SETTINGS);
        }
      });

      return () => {
        unsubOrders();
        unsubProducts();
        unsubSettings();
      };
    } catch (e) {
      console.error(e);
    }
  }, [isAuthenticated]);

  // Order Actions
  const handleUpdateOrderStatus = async (orderId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (err) {
      console.error(err);
      alert('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে!');
    }
  };

  // Product Actions
  const handleSaveNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    try {
      await addDoc(collection(db, 'products'), newProduct);
      setIsAddProductOpen(false);
      setNewProduct({
        name: '',
        category: 'FREE FIRE',
        price: 990,
        oldPrice: 1200,
        soldCount: 10,
        duration: '30 Days',
        badge: '🔥 HOT',
        description: '',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
        status: 'active'
      });
    } catch (err) {
      console.error(err);
      alert('প্রোডাক্ট তৈরি করতে সমস্যা হয়েছে!');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await updateDoc(doc(db, 'products', editingProduct.id), {
        name: editingProduct.name,
        price: Number(editingProduct.price),
        oldPrice: Number(editingProduct.oldPrice || 0),
        soldCount: Number(editingProduct.soldCount),
        category: editingProduct.category,
        badge: editingProduct.badge || '',
        duration: editingProduct.duration,
        description: editingProduct.description,
        status: editingProduct.status
      });
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      alert('প্রোডাক্ট আপডেট করতে সমস্যা হয়েছে!');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত এই প্রোডাক্টটি ডিলিট করতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      console.error(err);
      alert('প্রোডাক্ট ডিলিট করতে সমস্যা হয়েছে!');
    }
  };

  // Settings Actions
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err) {
      console.error(err);
      alert('সেটিংস সেভ করতে সমস্যা হয়েছে!');
    }
  };

  // ----------------------------------------------------
  // LOGIN FORM VIEW
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07080c] flex flex-col items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
        <div className="w-full max-w-md bg-[#0e111a] border border-orange-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative glow-orange">
          <button 
            onClick={onBackToShop}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-orange-400 mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>শপে ফিরে যান</span>
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500 font-black text-2xl mx-auto mb-3 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white font-heading">MPX SHOP Admin 4209</h1>
            <p className="text-xs text-slate-400 mt-1">অ্যাডমিন প্যানেলে প্রবেশ করতে পাসওয়ার্ড দিন</p>
          </div>

          {loginError && (
            <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">ইউজারনেম (Username)</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="MPX10X7X"
                className="w-full bg-[#141824] border border-slate-700/70 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-orange-500 transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">পাসওয়ার্ড (Password)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#141824] border border-slate-700/70 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-orange-500 transition font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-98 mt-2"
            >
              <Lock className="w-4 h-4" />
              <span>লগইন করুন</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ADMIN DASHBOARD VIEW
  // ----------------------------------------------------
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const approvedCount = orders.filter(o => o.status === 'approved').length;
  const totalRevenue = orders
    .filter(o => o.status === 'approved')
    .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0c0e15]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToShop}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">শপে যান</span>
          </button>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-black text-white text-sm font-heading">
              M
            </span>
            <span className="font-bold text-base sm:text-lg font-heading text-white">MPX SHOP Admin 4209</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            সরাসরি যুক্ত
          </span>
          <button
            onClick={handleLogout}
            className="py-1.5 px-3 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-5 mb-8">
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-4 sm:p-5">
            <span className="text-xs text-slate-400 font-medium">মোট অর্ডার</span>
            <div className="text-2xl font-bold text-white font-heading mt-1">{orders.length}</div>
          </div>
          <div className="bg-[#0f111a] border border-amber-500/30 rounded-2xl p-4 sm:p-5 glow-orange-sm">
            <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> পেন্ডিং অর্ডার
            </span>
            <div className="text-2xl font-bold text-amber-400 font-heading mt-1">{pendingCount}</div>
          </div>
          <div className="bg-[#0f111a] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 glow-emerald">
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> সম্পূর্ণ অর্ডার
            </span>
            <div className="text-2xl font-bold text-emerald-400 font-heading mt-1">{approvedCount}</div>
          </div>
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-4 sm:p-5">
            <span className="text-xs text-slate-400 font-medium">মোট বিক্রয় (Approved)</span>
            <div className="text-2xl font-bold text-orange-400 font-heading mt-1">{totalRevenue} ৳</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ইনস্ট্যান্ট অর্ডারসমূহ ({orders.length})</span>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>প্রোডাক্ট ম্যানেজমেন্ট ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>শপ সেটিংস ও নোটিস</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: ORDERS LIST */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-base font-semibold">কোনো অর্ডার এখনো পাওয়া যায়নি</p>
                <p className="text-xs text-slate-500 mt-1">কাস্টমাররা বিকাশ/নগদে অর্ডার করলেই সাথে সাথে এখানে দেখা যাবে।</p>
              </div>
            ) : (
              <div className="bg-[#0f111a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#151824] text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3.5 sm:p-4">অর্ডার ও তারিখ</th>
                        <th className="p-3.5 sm:p-4">পণ্য ও মূল্য</th>
                        <th className="p-3.5 sm:p-4">পেমেন্ট মাধ্যম ও নাম্বার</th>
                        <th className="p-3.5 sm:p-4">TrxID / কন্টাক্ট</th>
                        <th className="p-3.5 sm:p-4 text-center">স্ক্রিনশট</th>
                        <th className="p-3.5 sm:p-4">স্ট্যাটাস</th>
                        <th className="p-3.5 sm:p-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {orders.map((order) => {
                        const dateStr = order.createdAt?.toDate 
                          ? order.createdAt.toDate().toLocaleString('bn-BD') 
                          : 'সম্প্রতি';

                        return (
                          <tr key={order.id} className="hover:bg-slate-800/30 transition">
                            <td className="p-3.5 sm:p-4 font-mono">
                              <span className="text-orange-400 font-bold block">#{order.id.slice(-6)}</span>
                              <span className="text-[11px] text-slate-400">{dateStr}</span>
                            </td>

                            <td className="p-3.5 sm:p-4">
                              <strong className="text-white block font-medium">{order.productName}</strong>
                              <span className="text-emerald-400 font-bold font-mono">{order.amount} ৳</span>
                            </td>

                            <td className="p-3.5 sm:p-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold mb-1 ${
                                order.paymentMethod === 'bKash' ? 'bg-[#e2136e]/20 text-[#e2136e]' : 'bg-[#f7941d]/20 text-[#f7941d]'
                              }`}>
                                {order.paymentMethod}
                              </span>
                              <div className="font-mono text-xs text-slate-300 font-bold">
                                {order.senderNumber}
                              </div>
                            </td>

                            <td className="p-3.5 sm:p-4">
                              <div className="font-mono text-xs text-amber-400 uppercase font-semibold">
                                {order.trxId || 'N/A'}
                              </div>
                              <div className="text-xs text-sky-400 flex items-center gap-1 mt-0.5">
                                <MessageSquare className="w-3 h-3" />
                                <span>{order.customerContact}</span>
                              </div>
                            </td>

                            <td className="p-3.5 sm:p-4 text-center">
                              {order.screenshotUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedScreenshot(order.screenshotUrl)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-orange-500/20 text-orange-400 border border-slate-700 transition inline-flex items-center gap-1 text-xs font-semibold"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>দেখুন</span>
                                </button>
                              ) : (
                                <span className="text-slate-500 text-xs">নেই</span>
                              )}
                            </td>

                            <td className="p-3.5 sm:p-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                order.status === 'approved' 
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                                  : order.status === 'rejected'
                                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              }`}>
                                {order.status === 'approved' && <Check className="w-3 h-3" />}
                                {order.status === 'rejected' && <X className="w-3 h-3" />}
                                {order.status === 'pending' && <Clock className="w-3 h-3 animate-pulse" />}
                                <span className="capitalize">{order.status}</span>
                              </span>
                            </td>

                            <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                              {order.status === 'pending' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'approved')}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition shadow"
                                    title="Approve Order"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>অনুমোদন</span>
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'rejected')}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-bold flex items-center gap-1 transition"
                                    title="Reject Order"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500">প্রসেসড</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PRODUCTS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white font-heading">শপের সকল প্রোডাক্ট তালিকা</h3>
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন প্রোডাক্ট যোগ করুন</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => (
                <div key={p.id} className="bg-[#0f111a] border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                  <div className="h-40 relative bg-slate-900 overflow-hidden">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] font-bold text-orange-400 border border-orange-500/30">
                      {p.category}
                    </div>
                    {p.badge && (
                      <div className="absolute top-3 right-3 bg-orange-500 text-white px-2 py-0.5 rounded text-[11px] font-bold">
                        {p.badge}
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base font-heading mb-1">{p.name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">{p.description}</p>
                      
                      <div className="flex items-center justify-between text-xs mb-3 font-mono">
                        <div>
                          <span className="text-orange-400 font-bold text-base">{p.price} ৳</span>
                          {p.oldPrice && <span className="text-slate-500 line-through ml-1.5">{p.oldPrice} ৳</span>}
                        </div>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" /> {p.soldCount} Sold
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                        <span>এডিট করুন</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: SHOP SETTINGS & POPUP NOTICE */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-[#0f111a] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-lg font-bold text-white font-heading mb-1 flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-500" />
              <span>শপ পেমেন্ট ও নোটিস কন্ট্রোল</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              এখানে পরিবর্তন করলে তা লাইভ ওয়েবসাইটে সাথে সাথে পরিবর্তন হয়ে যাবে।
            </p>

            {settingsSaved && (
              <div className="p-3 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>সেটিংস সফলভাবে সংরক্ষিত হয়েছে!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">বিকাশ পার্সোনাল নাম্বার</label>
                  <input
                    type="text"
                    required
                    value={settings.bkashNumber}
                    onChange={(e) => setSettings({ ...settings, bkashNumber: e.target.value })}
                    className="w-full bg-[#141824] border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">নগদ পার্সোনাল নাম্বার</label>
                  <input
                    type="text"
                    required
                    value={settings.nagadNumber}
                    onChange={(e) => setSettings({ ...settings, nagadNumber: e.target.value })}
                    className="w-full bg-[#141824] border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">হোয়াটসঅ্যাপ নাম্বার (বা লিংক)</label>
                  <input
                    type="text"
                    required
                    value={settings.whatsappNumber}
                    onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                    placeholder="+8801700000000"
                    className="w-full bg-[#141824] border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">টেলিগ্রাম ইউজারনেম (বা লিংক)</label>
                  <input
                    type="text"
                    required
                    value={settings.telegramUsername}
                    onChange={(e) => setSettings({ ...settings, telegramUsername: e.target.value })}
                    placeholder="@mpx_support"
                    className="w-full bg-[#141824] border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-orange-400 uppercase tracking-wider">পপ-আপ নোটিস সেটিংস</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-slate-400">নোটিস অন/অফ:</span>
                    <input
                      type="checkbox"
                      checked={settings.showPopup}
                      onChange={(e) => setSettings({ ...settings, showPopup: e.target.checked })}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">নোটিশের শিরোনাম (Title)</label>
                    <input
                      type="text"
                      value={settings.popupNoticeTitle}
                      onChange={(e) => setSettings({ ...settings, popupNoticeTitle: e.target.value })}
                      className="w-full bg-[#141824] border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">নোটিশের মূল বার্তা (Message)</label>
                    <textarea
                      rows={3}
                      value={settings.popupNoticeMessage}
                      onChange={(e) => setSettings({ ...settings, popupNoticeMessage: e.target.value })}
                      className="w-full bg-[#141824] border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-98 mt-4"
              >
                <Save className="w-4 h-4" />
                <span>পরিবর্তন সংরক্ষণ করুন</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Screenshot Zoom Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-[9900] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[#0e111a] border border-slate-800 rounded-2xl p-4 relative flex flex-col items-center">
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-bold text-white mb-3">পেমেন্টের সম্পূর্ণ স্ক্রিনশট (ImgBB)</h4>
            <div className="max-h-[75vh] overflow-auto rounded-xl border border-slate-800">
              <img src={selectedScreenshot} alt="Payment Proof" className="max-w-full h-auto object-contain" />
            </div>
            <a
              href={selectedScreenshot}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-xs text-orange-400 hover:underline flex items-center gap-1"
            >
              <span>ব্রাউজারে নতুন ট্যাবে খুলুন</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-[9800] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-md w-full bg-[#0e111a] border border-slate-800 rounded-2xl p-6 relative my-8">
            <button
              onClick={() => setIsAddProductOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white font-heading mb-4">নতুন প্রোডাক্ট যোগ করুন</h3>

            <form onSubmit={handleSaveNewProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">প্রোডাক্টের নাম</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="FREE FIRE VIP MOD"
                  className="w-full bg-[#141824] border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">মূল্য (টাকা)</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="w-full bg-[#141824] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">আগের মূল্য (ঐচ্ছিক)</label>
                  <input
                    type="number"
                    value={newProduct.oldPrice || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, oldPrice: Number(e.target.value) })}
                    className="w-full bg-[#141824] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">ক্যাটাগরি</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    placeholder="FREE FIRE"
                    className="w-full bg-[#141824] border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Sold সংখ্যা</label>
                  <input
                    type="number"
                    value={newProduct.soldCount}
                    onChange={(e) => setNewProduct({ ...newProduct, soldCount: Number(e.target.value) })}
                    className="w-full bg-[#141824] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">ইমেজ লিংক (URL)</label>
                <input
                  type="text"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#141824] border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">বিবরণ (Description)</label>
                <textarea
                  rows={2}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full bg-[#141824] border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm tracking-wide transition mt-2"
              >
                প্রোডাক্ট পাবলিশ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[9800] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-md w-full bg-[#0e111a] border border-slate-800 rounded-2xl p-6 relative my-8">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white font-heading mb-4">প্রোডাক্ট এডিট করুন</h3>

            <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">প্রোডাক্টের নাম</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-[#141824] border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">মূল্য (টাকা)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full bg-[#141824] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Sold সংখ্যা (কাউন্ট)</label>
                  <input
                    type="number"
                    value={editingProduct.soldCount}
                    onChange={(e) => setEditingProduct({ ...editingProduct, soldCount: Number(e.target.value) })}
                    className="w-full bg-[#141824] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">স্ট্যাটাস</label>
                <select
                  value={editingProduct.status}
                  onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                  className="w-full bg-[#141824] border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="active">Active (চালু)</option>
                  <option value="maintenance">Maintenance (রক্ষণাবেক্ষণ)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">বিবরণ</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-[#141824] border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm tracking-wide transition mt-2"
              >
                আপডেট সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
