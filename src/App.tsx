import React, { useState, useEffect } from 'react';
import { 
  db, 
  auth, 
  Product, 
  ShopSettings, 
  DEFAULT_SETTINGS, 
  INITIAL_PRODUCTS 
} from './firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { SecurityCheck } from './components/SecurityCheck';
import { PopupNotice } from './components/PopupNotice';
import { AuthModal } from './components/AuthModal';
import { InstantCheckoutModal } from './components/InstantCheckoutModal';
import { AdminPanel } from './components/AdminPanel';

import { 
  ShoppingBag, 
  ShieldCheck, 
  Flame, 
  Zap, 
  Download, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  CreditCard, 
  HelpCircle,
  ExternalLink,
  Lock,
  ChevronDown
} from 'lucide-react';

export default function App() {
  // 1. Robot Security Check ("I AM NOT ROBOT")
  const [isRobotVerified, setIsRobotVerified] = useState<boolean>(() => {
    return sessionStorage.getItem('mpx_robot_verified') === 'true';
  });

  // 2. Admin View Routing
  // Supports http://yourdomain.vercel.app/admin4209 or ?page=admin4209 or hash #admin4209
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path.includes('admin4209') || search.includes('admin4209') || hash.includes('admin4209');
  });

  // 3. User Authentication
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 4. Products & Settings State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 5. Modals & Checkout
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // 6. PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  // 7. Live Activity Feed
  const [liveToast, setLiveToast] = useState<{ name: string; product: string } | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Listen to popstate & hash for admin4209
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      setIsAdminView(path.includes('admin4209') || search.includes('admin4209') || hash.includes('admin4209'));
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // PWA beforeinstallprompt handler
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Firestore Products & Settings Listeners
  useEffect(() => {
    try {
      const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = [];
          snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Product));
          setProducts(list);
        } else {
          // If Firestore is empty, auto-seed with initial products
          INITIAL_PRODUCTS.forEach(async (p) => {
            await setDoc(doc(db, 'products', p.id), p);
          });
          setProducts(INITIAL_PRODUCTS);
        }
      }, () => {
        setProducts(INITIAL_PRODUCTS);
      });

      const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
        if (docSnap.exists()) {
          const s = docSnap.data() as ShopSettings;
          setSettings(s);
          if (s.showPopup && !sessionStorage.getItem('mpx_popup_shown')) {
            setIsPopupOpen(true);
            sessionStorage.setItem('mpx_popup_shown', 'true');
          }
        } else {
          setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS);
          setSettings(DEFAULT_SETTINGS);
          setIsPopupOpen(true);
        }
      }, () => {
        setSettings(DEFAULT_SETTINGS);
      });

      return () => {
        unsubProducts();
        unsubSettings();
      };
    } catch (err) {
      console.warn('Firestore load', err);
    }
  }, []);

  // Live order simulation notification
  useEffect(() => {
    const buyers = ["তানভীর", "আরিফুল", "সাকিব", "মেহেদী", "রাকিব", "সোহেল", "রিমন", "আকাশ", "নাঈম", "ফাহিম"];
    const productNames = ["VIP MOD MENU", "EXTERNAL SAFE", "EMULATOR BYPASS", "UID ANTI-BLACKLIST"];

    const interval = setInterval(() => {
      const b = buyers[Math.floor(Math.random() * buyers.length)];
      const p = productNames[Math.floor(Math.random() * productNames.length)];
      setLiveToast({ name: b, product: p });

      setTimeout(() => {
        setLiveToast(null);
      }, 4500);
    }, 18000);

    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallHelp(true);
    }
  };

  const openInstantCheckout = (p: Product) => {
    setSelectedProduct(p);
    setIsCheckoutOpen(true);
  };

  const getWhatsAppChatUrl = (p?: Product) => {
    const num = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const text = p 
      ? `হ্যালো MPX SHOP, আমি "${p.name}" (${p.price} ৳) পণ্যটি নিতে চাই। বিস্তারিত জানাবেন?`
      : `হ্যালো MPX SHOP, আপনাদের প্রোডাক্ট সম্পর্কে জানতে চাই।`;
    return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  };

  const getTelegramChatUrl = () => {
    const handle = settings.telegramUsername.replace('@', '');
    return `https://t.me/${handle}`;
  };

  // --------------------------------------------------------------------------
  // 1. If not robot verified, show security screen
  // --------------------------------------------------------------------------
  if (!isRobotVerified) {
    return <SecurityCheck onVerified={() => setIsRobotVerified(true)} />;
  }

  // --------------------------------------------------------------------------
  // 2. If admin4209 requested, show Admin Panel
  // --------------------------------------------------------------------------
  if (isAdminView) {
    return (
      <AdminPanel 
        onBackToShop={() => {
          window.history.pushState({}, '', '/');
          setIsAdminView(false);
        }} 
      />
    );
  }

  // Filter products
  const categories = ['ALL', 'FREE FIRE', 'MOD MENU', 'BYPASS', 'IOS'];
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || 
      p.category.toUpperCase().includes(selectedCategory) ||
      p.name.toUpperCase().includes(selectedCategory);
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#08090e] text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white font-sans relative">
      
      {/* -------------------------------------------------- */}
      {/* Pop-up Notice (Admin controlled) */}
      {/* -------------------------------------------------- */}
      <PopupNotice
        isOpen={isPopupOpen}
        title={settings.popupNoticeTitle}
        message={settings.popupNoticeMessage}
        onClose={() => setIsPopupOpen(false)}
        telegramLink={getTelegramChatUrl()}
        whatsappLink={getWhatsAppChatUrl()}
      />

      {/* -------------------------------------------------- */}
      {/* Auth Modal */}
      {/* -------------------------------------------------- */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(email) => {
          // Success toast
        }}
      />

      {/* -------------------------------------------------- */}
      {/* Instant bKash/Nagad Checkout Modal */}
      {/* -------------------------------------------------- */}
      <InstantCheckoutModal
        isOpen={isCheckoutOpen}
        product={selectedProduct}
        settings={settings}
        onClose={() => {
          setIsCheckoutOpen(false);
          setSelectedProduct(null);
        }}
      />

      {/* -------------------------------------------------- */}
      {/* PWA Install Guide Modal */}
      {/* -------------------------------------------------- */}
      {showInstallHelp && (
        <div className="fixed inset-0 z-[9700] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#0f121d] border border-orange-500/30 rounded-3xl p-6 relative glow-orange">
            <button
              onClick={() => setShowInstallHelp(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-3">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white font-heading">মোবাইলে অ্যাপস ইনস্টল করার নিয়ম</h3>
              <div className="text-xs text-slate-300 space-y-2.5 text-left my-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p>১. আপনার Chrome বা Safari ব্রাউজারের ওপরে ডানদিকের <strong>থ্রি ডট (⋮)</strong> মেনুতে চাপ দিন।</p>
                <p>২. তালিকায় থাকা <strong>"Install app"</strong> অথবা <strong>"Add to Home screen"</strong> এ চাপুন।</p>
                <p>৩. এরপর <strong>"Install"</strong> চাপলেই সরাসরি মোবাইল স্ক্রিনে অ্যাপটির শর্টকাট আইকন চলে আসবে।</p>
              </div>
              <button
                onClick={() => setShowInstallHelp(false)}
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow transition"
              >
                ঠিক আছে, বুঝেছি
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* Live Activity Floating Pill */}
      {/* -------------------------------------------------- */}
      {liveToast && (
        <div className="fixed bottom-5 left-5 z-50 animate-in slide-in-from-left duration-300">
          <div className="bg-[#0f121d]/95 backdrop-blur-md border border-orange-500/30 rounded-2xl p-3 shadow-2xl flex items-center gap-3 pr-4 glow-orange-sm">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="text-xs">
              <p className="text-slate-300">
                <strong className="text-white">{liveToast.name}</strong> এইমাত্র অর্ডার করেছেন
              </p>
              <p className="text-orange-400 font-semibold font-mono text-[11px]">
                {liveToast.product}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* Top Banner & Announcement Marquee */}
      {/* -------------------------------------------------- */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white text-[11px] sm:text-xs font-semibold py-1.5 px-4 overflow-hidden shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>🔥 MPX SHOP: ইনস্ট্যান্ট বিকাশ ও নগদে সেরা রেটে গেমিং প্যানেল কিনুন! ডেলিভারি ৫-১০ মিনিট।</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[11px] flex-shrink-0">
            <span>📞 হেল্পলাইন: {settings.whatsappNumber}</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* Header / Navbar */}
      {/* -------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-[#0a0b12]/95 backdrop-blur-lg border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <img 
                src="https://i.ibb.co.com/ZpX14z3Y" 
                alt="MPX SHOP" 
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-orange-500/40 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform"
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80";
                }}
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0a0b12] rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight">
                  MPX <span className="text-orange-500">SHOP</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  OFFICIAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider font-mono">PREMIUM GAMING STORE</p>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Install Shortcut Button (PWA) */}
            <button
              onClick={handleInstallApp}
              className="py-2 px-3 sm:px-3.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="মোবাইলে বা পিসিতে অ্যাপস আকারে শর্টকাট ইনস্টল করুন"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>

            {/* Telegram / WhatsApp Direct Header Buttons */}
            <a
              href={getWhatsAppChatUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold items-center gap-1.5 transition"
            >
              <i className="fa-brands fa-whatsapp text-sm"></i>
              <span>WhatsApp</span>
            </a>

            <a
              href={getTelegramChatUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold items-center gap-1.5 transition"
            >
              <i className="fa-brands fa-telegram text-sm"></i>
              <span>Telegram</span>
            </a>

            {/* User Login/Profile */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-[#141824] border border-slate-800 py-1.5 px-3 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                  {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-medium text-slate-200 hidden lg:inline max-w-[120px] truncate">
                  {currentUser.email}
                </span>
                <button
                  onClick={() => signOut(auth)}
                  className="text-slate-400 hover:text-rose-400 ml-1 p-1 transition"
                  title="লগআউট"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs tracking-wide shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>লগইন করুন</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* -------------------------------------------------- */}
      {/* Hero Section */}
      {/* -------------------------------------------------- */}
      <section className="relative pt-8 sm:pt-14 pb-12 px-4 sm:px-8 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold mb-5 glow-orange-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>বাংলাদেশি গেমারদের ১ নম্বর বিশ্বস্ত শপ</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-heading leading-tight mb-4">
            বেস্ট গেমিং প্যানেল ও বাইপাস <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
              ইনস্ট্যান্ট বিকাশ ও নগদে কিনুন
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            কোনো কার্ডের ঝামেলা ছাড়াই সরাসরি পার্সোনাল বিকাশ ও নগদ সেন্ড মানি করে ৫ মিনিটে লাইসেন্স পেয়ে যান। থাকছে ২৪/৭ ডেডিকেটেড সাপোর্ট।
          </p>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="bg-[#0f121d]/80 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight">১০০% সিকিউর</p>
                <p className="text-[10px] text-slate-400">অ্যান্টি-ব্যান v4</p>
              </div>
            </div>

            <div className="bg-[#0f121d]/80 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight">ইনস্ট্যান্ট ডেলিভারি</p>
                <p className="text-[10px] text-slate-400">৫ থেকে ১০ মিনিট</p>
              </div>
            </div>

            <div className="bg-[#0f121d]/80 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-center gap-2.5">
              <CreditCard className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight">বিকাশ ও নগদ</p>
                <p className="text-[10px] text-slate-400">সহজ সেন্ড মানি</p>
              </div>
            </div>

            <div className="bg-[#0f121d]/80 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-center gap-2.5">
              <Clock className="w-5 h-5 text-sky-400 flex-shrink-0" />
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight">২৪/৭ এক্টিভ</p>
                <p className="text-[10px] text-slate-400">টেলিগ্রাম ও ডব্লিউএ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* Search & Category Filter Section */}
      {/* -------------------------------------------------- */}
      <section className="px-4 sm:px-8 py-4 sticky top-[69px] z-30 bg-[#08090e]/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-2 px-3.5 rounded-xl font-bold text-xs tracking-wider transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-[#11131c] text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পণ্য বা প্যানেল খুঁজুন..."
              className="w-full bg-[#11131c] border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition"
            />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* Products Grid */}
      {/* -------------------------------------------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-heading flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              <span>উপলব্ধ প্রোডাক্টসমূহ</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">পছন্দের পণ্যটি বেছে নিয়ে ইনস্ট্যান্ট বিকাশ/নগদে অর্ডার করুন</p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-[#11131c] border border-slate-800 px-3 py-1.5 rounded-xl">
            {filteredProducts.length} টি আইটেম
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-[#0f111a] border border-slate-800 rounded-3xl p-12 text-center text-slate-400 my-8">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold">কোনো প্রোডাক্ট খুঁজে পাওয়া যায়নি!</p>
            <p className="text-xs text-slate-500 mt-1">ভিন্ন কীওয়ার্ড দিয়ে খুঁজুন বা ক্যাটাগরি 'ALL' সিলেক্ট করুন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-[#0e111a] border border-slate-800/90 rounded-3xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-orange-500/10 flex flex-col group"
              >
                {/* Product Image & Badges */}
                <div className="h-48 relative overflow-hidden bg-slate-900">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e111a] via-transparent to-black/40"></div>

                  {/* Category Tag */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-black/75 backdrop-blur-sm text-orange-400 border border-orange-500/30">
                    {product.category}
                  </span>

                  {/* Badge */}
                  {product.badge && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-black tracking-wide bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md">
                      {product.badge}
                    </span>
                  )}

                  {/* Sold count badge (Requested by user) */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0e111a]/90 backdrop-blur-sm text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span>{product.soldCount}+ Sold</span>
                  </div>

                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800/80 text-slate-300">
                    {product.duration}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white font-heading group-hover:text-orange-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Price Block */}
                    <div className="flex items-baseline gap-2 mt-4 pt-4 border-t border-slate-800/80">
                      <span className="text-2xl font-black text-orange-400 font-heading">
                        {product.price} ৳
                      </span>
                      {product.oldPrice && (
                        <span className="text-xs text-slate-500 line-through">
                          {product.oldPrice} ৳
                        </span>
                      )}
                      <span className="text-[10px] text-emerald-400 font-bold ml-auto bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        ইনস্ট্যান্ট এক্সেস
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: 2 Channels (Instant + WhatsApp/Telegram) */}
                  <div className="mt-5 space-y-2">
                    {/* 1. Instant bKash/Nagad Button */}
                    <button
                      onClick={() => openInstantCheckout(product)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs tracking-wide shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-98"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>ইনস্ট্যান্ট কিনুন (বিকাশ / নগদ)</span>
                    </button>

                    {/* 2. Direct Social Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={getWhatsAppChatUrl(product)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <i className="fa-brands fa-whatsapp text-sm"></i>
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={getTelegramChatUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <i className="fa-brands fa-telegram text-sm"></i>
                        <span>Telegram</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* -------------------------------------------------- */}
      {/* Instructions / How to Buy Section */}
      {/* -------------------------------------------------- */}
      <section className="bg-[#0b0d15] border-t border-slate-800/80 px-4 sm:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-heading">কীভাবে অর্ডার করবেন? (৩টি সহজ ধাপ)</h3>
            <p className="text-xs text-slate-400 mt-1">খুব সহজেই ৫ মিনিটে আপনার কাঙ্ক্ষিত পণ্যটি বুঝে নিন</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-[#111420] border border-slate-800 rounded-3xl p-6 relative">
              <span className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-4 text-sm font-mono">1</span>
              <h4 className="font-bold text-white text-base mb-2">পণ্য সিলেক্ট করুন</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                পছন্দের প্রোডাক্টের নিচে "ইনস্ট্যান্ট কিনুন" চাপুন। বিকাশ বা নগদ সিলেক্ট করে দেওয়া নাম্বারটি কপি করুন।
              </p>
            </div>

            <div className="bg-[#111420] border border-slate-800 rounded-3xl p-6 relative">
              <span className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-4 text-sm font-mono">2</span>
              <h4 className="font-bold text-white text-base mb-2">সেন্ড মানি ও স্ক্রিনশট</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                বিকাশ/নগদ অ্যাপ থেকে টাকা পাঠিয়ে ট্রানজেকশন আইডি ও স্ক্রিনশটটি আপলোড করুন। TrxID না থাকলে প্রেরক নাম্বার দিন।
              </p>
            </div>

            <div className="bg-[#111420] border border-slate-800 rounded-3xl p-6 relative">
              <span className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-4 text-sm font-mono">3</span>
              <h4 className="font-bold text-white text-base mb-2">ইনস্ট্যান্ট ডেলিভারি</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                আপনার দেওয়া টেলিগ্রাম বা হোয়াটসঅ্যাপ আইডিতে ৫ থেকে ১৫ মিনিটের মধ্যে পণ্যের কি ও এক্সেস ফাইল পাঠিয়ে দেওয়া হবে।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- */}
      {/* Footer */}
      {/* -------------------------------------------------- */}
      <footer className="bg-[#07080c] border-t border-slate-800/80 px-4 sm:px-8 py-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img 
              src="https://i.ibb.co.com/ZpX14z3Y" 
              alt="MPX SHOP" 
              className="w-8 h-8 rounded-lg object-cover"
              onError={(e: any) => { e.target.style.display = 'none'; }}
            />
            <div>
              <span className="font-bold text-white text-sm font-heading">MPX SHOP</span>
              <p className="text-[11px]">© 2026 MPX SHOP Corporation. সর্বস্বত্ব সংরক্ষিত।</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <a href={getWhatsAppChatUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition flex items-center gap-1.5">
              <i className="fa-brands fa-whatsapp text-emerald-400"></i>
              <span>হোয়াটসঅ্যাপ</span>
            </a>
            <a href={getTelegramChatUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition flex items-center gap-1.5">
              <i className="fa-brands fa-telegram text-sky-400"></i>
              <span>টেলিগ্রাম</span>
            </a>
            
            {/* Hidden Admin Access (Requested: /admin4209) */}
            <a
              href="/admin4209"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/admin4209');
                setIsAdminView(true);
              }}
              className="text-slate-500 hover:text-orange-400 transition flex items-center gap-1 font-mono text-[11px]"
              title="Admin 4209 Portal"
            >
              <Lock className="w-3 h-3" />
              <span>Admin 4209</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
