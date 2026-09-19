import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { X, Mail, Lock, LogIn, UserPlus, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onSuccess(result.user.email || 'User');
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('ডোমেইন অনুমোদিত নয়। ফায়ারবেস অথেনটিকেশন সেটিংসে গিয়ে Authorized Domain যুক্ত করুন।');
      } else {
        setError('গুগল লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('ইমেইল ও পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    if (tab === 'signup' && password !== confirmPassword) {
      setError('উভয় পাসওয়ার্ড একই হতে হবে!');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        const res = await signInWithEmailAndPassword(auth, email, password);
        onSuccess(res.user.email || email);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        onSuccess(res.user.email || email);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('ভুল ইমেইল অথবা পাসওয়ার্ড!');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('এই ইমেইলটি দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে। লগইন করুন।');
      } else if (err.code === 'auth/weak-password') {
        setError('পাসওয়ার্ডটি অন্তত ৬ অক্ষরের হতে হবে।');
      } else {
        setError('একটি সমস্যা হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0e111a] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 font-black text-2xl mx-auto mb-3 font-heading">
            M
          </div>
          <h2 className="text-xl font-bold text-white font-heading">MPX SHOP অ্যাকাউন্টে প্রবেশ</h2>
          <p className="text-xs text-slate-400 mt-1">অর্ডার ট্র্যাক ও দ্রুত কেনাকাটার জন্য লগইন করুন</p>
        </div>

        {/* Google Continue Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 transition-all duration-200 shadow-md active:scale-98 disabled:opacity-60 mb-5"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">অথবা ইমেইল দিয়ে</span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#151926] p-1 rounded-xl mb-4 border border-slate-800">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              tab === 'login' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            লগইন (Sign In)
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              tab === 'signup' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            রেজিস্টার (Sign Up)
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">ইমেইল অ্যাড্রেস</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full bg-[#151926] border border-slate-700/60 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">পাসওয়ার্ড</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#151926] border border-slate-700/60 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>

          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">পাসওয়ার্ড নিশ্চিত করুন</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#151926] border border-slate-700/60 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-60 mt-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : tab === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>লগইন করুন</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>অ্যাকাউন্ট তৈরি করুন</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
