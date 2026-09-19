import React, { useState } from 'react';
import { Product, ShopSettings, uploadToImgBB, db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { 
  X, 
  Copy, 
  Check, 
  UploadCloud, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Hash, 
  MessageSquare, 
  Image as ImageIcon,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface InstantCheckoutModalProps {
  isOpen: boolean;
  product: Product | null;
  settings: ShopSettings;
  onClose: () => void;
}

export const InstantCheckoutModal: React.FC<InstantCheckoutModalProps> = ({
  isOpen,
  product,
  settings,
  onClose
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [copied, setCopied] = useState(false);
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<{ id: string } | null>(null);

  if (!isOpen || !product) return null;

  const activeNumber = paymentMethod === 'bKash' ? settings.bkashNumber : settings.nagadNumber;

  const handleCopy = () => {
    // Extract only digits/chars for clean copying
    const numOnly = activeNumber.replace(/\(.*?\)/g, '').trim();
    navigator.clipboard.writeText(numOnly);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError('ছবির সাইজ সর্বোচ্চ ১০ MB হতে পারবে!');
        return;
      }
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Verification rule: "ট্রানজেকশন দিতে না পারলে যে নাম্বার থেকে টাকা পাঠাইতে সেটা অবশ্যই দিতে হবে"
    if (!trxId && !senderNumber) {
      setError('ট্রানজেকশন আইডি (TrxID) অথবা যে নাম্বার থেকে টাকা পাঠিয়েছেন তা অবশ্যই প্রদান করতে হবে!');
      return;
    }

    if (!customerContact) {
      setError('আপনার সাথে যোগাযোগের জন্য একটি হোয়াটসঅ্যাপ নাম্বার বা টেলিগ্রাম আইডি দিন!');
      return;
    }

    if (!screenshotFile) {
      setError('পেমেন্টের স্পষ্ট একটি স্ক্রিনশট সিলেক্ট করুন!');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload screenshot to ImgBB via User's API Key
      const uploadedImageUrl = await uploadToImgBB(screenshotFile);

      // 2. Save order to Firebase Cloud Firestore
      const currentUser = auth.currentUser;
      const orderRef = await addDoc(collection(db, 'orders'), {
        productName: product.name,
        productId: product.id,
        amount: product.price,
        paymentMethod: paymentMethod,
        senderNumber: senderNumber.trim() || 'Not Provided',
        trxId: trxId.trim() || 'Not Provided',
        customerContact: customerContact.trim(),
        screenshotUrl: uploadedImageUrl,
        status: 'pending',
        createdAt: serverTimestamp(),
        userId: currentUser?.uid || 'guest',
        userEmail: currentUser?.email || 'guest'
      });

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setOrderSuccess({ id: orderRef.id });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'অর্ডার সাবমিট করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSenderNumber('');
    setTrxId('');
    setCustomerContact('');
    setScreenshotFile(null);
    setScreenshotPreview('');
    setError('');
    setOrderSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9600] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#0e111a] border border-orange-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl relative my-8 glow-orange">
        <button 
          onClick={handleReset}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {orderSuccess ? (
          /* Order Success Screen */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 glow-emerald">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-white font-heading">অর্ডার সফলভাবে গৃহীত হয়েছে!</h2>
            <p className="text-sm text-slate-300 mt-2">
              আপনার পেমেন্ট স্ক্রিনশট ও তথ্য সফলভাবে জমা হয়েছে। এডমিন ভেরিফাই করে ৫ থেকে ১৫ মিনিটের মধ্যে আপনার সাথে যোগাযোগ করবে।
            </p>

            <div className="bg-[#141824] border border-slate-800 rounded-xl p-4 my-5 text-left text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>অর্ডার আইডি:</span>
                <span className="text-orange-400 font-bold">{orderSuccess.id}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>পণ্য:</span>
                <span className="text-white font-semibold">{product.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>মূল্য:</span>
                <span className="text-emerald-400 font-bold">{product.price} ৳</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>পেমেন্ট মাধ্যম:</span>
                <span className="text-white">{paymentMethod}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`হ্যালো MPX SHOP, আমি অর্ডার করেছি। অর্ডার আইডি: ${orderSuccess.id} (${product.name})`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
              >
                <i className="fa-brands fa-whatsapp text-lg"></i>
                <span>হোয়াটসঅ্যাপে দ্রুত কনফার্ম করুন</span>
              </a>
              <button
                onClick={handleReset}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        ) : (
          /* Instant Checkout Form */
          <div>
            {/* Header */}
            <div className="mb-5">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30 inline-flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3" /> ইনস্ট্যান্ট পেমেন্ট গেটওয়ে
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-heading">{product.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-extrabold text-orange-400 font-heading">{product.price} ৳</span>
                {product.oldPrice && (
                  <span className="text-sm text-slate-400 line-through">{product.oldPrice} ৳</span>
                )}
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {product.duration}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('bKash')}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2.5 transition-all duration-200 ${
                  paymentMethod === 'bKash'
                    ? 'bg-[#e2136e]/15 border-[#e2136e] text-white shadow-lg shadow-[#e2136e]/20'
                    : 'bg-[#141824] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full border-2 border-current flex items-center justify-center">
                  {paymentMethod === 'bKash' && <span className="w-1.5 h-1.5 bg-[#e2136e] rounded-full"></span>}
                </span>
                <span className="font-bold text-sm">bKash (বিকাশ)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Nagad')}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2.5 transition-all duration-200 ${
                  paymentMethod === 'Nagad'
                    ? 'bg-[#f7941d]/15 border-[#f7941d] text-white shadow-lg shadow-[#f7941d]/20'
                    : 'bg-[#141824] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full border-2 border-current flex items-center justify-center">
                  {paymentMethod === 'Nagad' && <span className="w-1.5 h-1.5 bg-[#f7941d] rounded-full"></span>}
                </span>
                <span className="font-bold text-sm">Nagad (নগদ)</span>
              </button>
            </div>

            {/* Number Box with Instruction (Requested by User) */}
            <div className="bg-[#141824] border border-amber-500/30 rounded-2xl p-4 mb-5 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  {paymentMethod} নাম্বার (Personal)
                </span>
                <span className="text-[11px] text-slate-400">টাকা পাঠানোর পরিমাণ: <strong className="text-white">{product.price} ৳</strong></span>
              </div>

              <div className="flex items-center justify-between bg-black/40 border border-slate-800 rounded-xl px-3.5 py-2.5">
                <span className="font-mono text-base font-bold text-white tracking-wider">{activeNumber}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>কপি হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি করুন</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-amber-300/90 font-medium mt-2.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                <span>নাম্বারটি কপি করে সেন্ড মানি করবেন</span>
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitOrder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  যে নাম্বার থেকে টাকা পাঠিয়েছেন (Sender Number)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full bg-[#141824] border border-slate-700/70 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-orange-500 transition font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">* TrxID না থাকলে এই নাম্বারটি অবশ্যই দিতে হবে।</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ট্রানজেকশন আইডি (TrxID)
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="যেমন: BLH78X9A2"
                    className="w-full bg-[#141824] border border-slate-700/70 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-orange-500 transition font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  আপনার সাথে যোগাযোগ করার টেলিগ্রাম ইউজারনেম বা হোয়াটসঅ্যাপ নাম্বার <span className="text-orange-400">*</span>
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    placeholder="@username অথবা 01XXXXXXXXX"
                    className="w-full bg-[#141824] border border-slate-700/70 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              {/* Payment Screenshot Upload (ImgBB) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  পেমেন্টের স্ক্রিনশট আপলোড করুন <span className="text-orange-400">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-2xl bg-[#141824] cursor-pointer transition group">
                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-orange-400 transition" />
                    <span className="text-xs text-slate-300 font-medium mt-1">
                      {screenshotFile ? screenshotFile.name : 'ছবি সিলেক্ট করতে ক্লিক করুন'}
                    </span>
                    <span className="text-[10px] text-slate-400">PNG, JPG, JPEG (Max 10MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {screenshotPreview && (
                    <div className="w-20 h-20 rounded-xl border border-slate-700 overflow-hidden bg-black flex-shrink-0 relative group">
                      <img src={screenshotPreview} alt="Screenshot" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <ImageIcon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm tracking-wide shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-60 mt-4"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>ImgBB-তে আপলোড ও অর্ডার কনফার্ম হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>অর্ডার সম্পন্ন করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
