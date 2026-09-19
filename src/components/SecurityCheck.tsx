import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CheckCircle2, RefreshCw } from 'lucide-react';

interface SecurityCheckProps {
  onVerified: () => void;
}

export const SecurityCheck: React.FC<SecurityCheckProps> = ({ onVerified }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [rayId, setRayId] = useState('');

  useEffect(() => {
    // Generate simulated Ray ID
    const randomHex = Math.random().toString(16).substring(2, 12) + Math.random().toString(16).substring(2, 8);
    setRayId(randomHex);
  }, []);

  const handleVerify = () => {
    if (isLoading || isDone) return;
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsDone(true);
      setIsChecked(true);

      setTimeout(() => {
        sessionStorage.setItem('mpx_robot_verified', 'true');
        onVerified();
      }, 700);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#07080c] flex flex-col items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
      <div className="w-full max-w-md bg-[#0f111a] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600"></div>

        {/* Site Badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-black text-xl tracking-wider font-heading">
            M
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-heading tracking-wide">mpx-shop.vercel.app</h1>
            <p className="text-xs text-slate-400">সিকিউরিটি ও ক্লাউড প্রটেকশন চেক</p>
          </div>
        </div>

        <h2 className="text-base font-semibold text-slate-200 mb-2">
          আপনার ব্রাউজার যাচাই করা হচ্ছে...
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          বট এবং ক্ষতিকর অ্যাক্টিভিটি প্রতিরোধ করতে অনুগ্রহ করে নিচে ক্লিক করে নিশ্চিত করুন যে আপনি একজন মানুষ।
        </p>

        {/* Turnstile Style Box */}
        <div 
          onClick={handleVerify}
          className="w-full bg-[#151926] hover:bg-[#1a1f30] border border-slate-700/60 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all duration-300 hover:border-orange-500/40 shadow-inner group"
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${
              isDone 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : isLoading 
                  ? 'border-orange-500 bg-orange-500/10' 
                  : 'border-slate-500 bg-slate-900 group-hover:border-orange-400'
            }`}>
              {isLoading ? (
                <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
              ) : isDone ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : null}
            </div>
            <span className="text-sm font-medium text-slate-200 select-none">
              {isLoading ? 'যাচাই করা হচ্ছে...' : isDone ? 'সফলভাবে যাচাই সম্পন্ন!' : 'I am not a robot (আমি রোবট নই)'}
            </span>
          </div>

          <div className="flex flex-col items-center pl-3 border-l border-slate-700/60 text-slate-400">
            <ShieldCheck className="w-6 h-6 text-orange-400/90" />
            <span className="text-[10px] tracking-wider text-slate-400 font-mono mt-0.5">MPX SHIELD</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Ray ID: <span className="text-slate-400">{rayId}</span></span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Lock className="w-3 h-3" /> সুরক্ষিত এনক্রিপশন
          </span>
        </div>
      </div>
    </div>
  );
};
