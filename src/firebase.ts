import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";

// User's Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkBlhVLF-esWThIhpp4WYOi0Wu8fMTVxs",
  authDomain: "mpxshop-99571.firebaseapp.com",
  projectId: "mpxshop-99571",
  storageBucket: "mpxshop-99571.firebasestorage.app",
  messagingSenderId: "872279804889",
  appId: "1:872279804889:web:f578ae491f2d846167a7c8",
  measurementId: "G-6HHLN9KRYL"
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  soldCount: number;
  duration: string;
  badge?: string;
  description: string;
  image: string;
  status: 'active' | 'maintenance';
}

export interface Order {
  id: string;
  productName: string;
  amount: number;
  paymentMethod: 'bKash' | 'Nagad';
  senderNumber: string;
  trxId: string;
  customerContact: string; // WhatsApp or Telegram username
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  userEmail?: string;
  userId?: string;
}

export interface ShopSettings {
  bkashNumber: string;
  nagadNumber: string;
  whatsappNumber: string;
  telegramUsername: string;
  popupNoticeTitle: string;
  popupNoticeMessage: string;
  showPopup: boolean;
}

export const DEFAULT_SETTINGS: ShopSettings = {
  bkashNumber: "017XXXXXXXX (Send Money)",
  nagadNumber: "019XXXXXXXX (Send Money)",
  whatsappNumber: "+8801700000000",
  telegramUsername: "@mpx_support",
  popupNoticeTitle: "🔥 MPX SHOP এ স্বাগতম!",
  popupNoticeMessage: "সব ধরনের প্রিমিয়াম গেমিং প্যানেল, বাইপাস ও টপআপ সবচেয়ে কম দামে এবং ইনস্ট্যান্ট বিকাশ/নগদে পাওয়া যাচ্ছে। যেকোনো প্রয়োজনে সরাসরি হোয়াটসঅ্যাপ বা টেলিগ্রামে মেসেজ দিন।",
  showPopup: true
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "FREE FIRE - VIP MOD MENU",
    category: "FREE FIRE",
    price: 1200,
    oldPrice: 1500,
    soldCount: 385,
    duration: "30 Days",
    badge: "🔥 TOP SELLER",
    description: "Aimbot 100%, Auto Headshot, ESP Wallhack, Location Hack এবং Anti-Ban v4 সিকিউরিটি সহ সম্পূর্ণ সেফ মেনু।",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    status: "active"
  },
  {
    id: "prod_2",
    name: "FREE FIRE - EXTERNAL SAFE",
    category: "FREE FIRE",
    price: 850,
    oldPrice: 1100,
    soldCount: 240,
    duration: "30 Days",
    badge: "🛡️ ULTRA SAFE",
    description: "গেম ফাইলে কোনো পরিবর্তন না করে সরাসরি স্ক্রিন ওভারলে টেকনোলজিতে চলে। মেইন আইডির জন্য ১০০% টেস্টেড ও নিরাপদ।",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
    status: "active"
  },
  {
    id: "prod_3",
    name: "FREE FIRE - EMULATOR BYPASS",
    category: "FREE FIRE",
    price: 1350,
    oldPrice: 1700,
    soldCount: 195,
    duration: "30 Days",
    badge: "⚡ NO MATCHING",
    description: "পিসিতে মোবাইল প্লেয়ারদের সাথে লোবি ম্যাচিং করায়। ব্লুস্ট্যাক্স ও এমএসআই-এর সর্বশেষ ভার্সনে সম্পূর্ণ কার্যকরী।",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80",
    status: "active"
  },
  {
    id: "prod_4",
    name: "FREE FIRE - UID ANTI-BLACKLIST",
    category: "FREE FIRE",
    price: 1400,
    oldPrice: 1800,
    soldCount: 160,
    duration: "30 Days",
    badge: "👑 VIP SHIELD",
    description: "ব্ল্যাকলিস্ট এবং যেকোনো টাইপের টেম্পোরারি ফ্লাগ প্রতিরোধ করে। ডিভাইস HWID ও ম্যাক অ্যাড্রেস প্রটেকশন সহ।",
    image: "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=600&q=80",
    status: "active"
  },
  {
    id: "prod_5",
    name: "FREE FIRE - IOS CERTIFIED MOD",
    category: "FREE FIRE",
    price: 2200,
    oldPrice: 2600,
    soldCount: 95,
    duration: "30 Days",
    badge: "🍎 NO JAILBREAK",
    description: "iPhone এবং iPad ব্যবহারকারীদের জন্য কোনো জেলব্রেক ছাড়াই ইন্সটলযোগ্য সরাসরি সার্টিফিকেট ভার্সন।",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80",
    status: "active"
  }
];

// ImgBB API Upload Function
export async function uploadToImgBB(file: File): Promise<string> {
  const IMGBB_API_KEY = "de969340a591ad8856bb48efe4a3d4d8";
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("ImgBB আপলোড ব্যর্থ হয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন।");
  }

  const data = await response.json();
  if (data && data.data && data.data.url) {
    return data.data.url;
  }
  throw new Error("ইমেজ লিংক পাওয়া যায়নি।");
}
