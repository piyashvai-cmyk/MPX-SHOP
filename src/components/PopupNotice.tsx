import React from 'react';
import { BellRing, X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface PopupNoticeProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  telegramLink?: string;
  whatsappLink?: string;
}

export const PopupNotice: React.FC<PopupNoticeProps> = ({
  isOpen,
  title,
  message,
  onClose,
  telegramLink,
  whatsappLink
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-[#0e111a] border border-orange-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden glow-orange">
        {/* Background glow circle */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-inner">
            <BellRing className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> জরুরি নোটিশ
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-1 font-heading">
              {title || "MPX SHOP এ স্বাগতম!"}
            </h3>
          </div>
        </div>

        {/* Message Content */}
        <div className="bg-[#141824] border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-slate-300 text-sm leading-relaxed mb-6 whitespace-pre-line">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            <span>বুঝেছি, শপে প্রবেশ করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <i className="fa-brands fa-whatsapp text-lg"></i>
              <span>হোয়াটসঅ্যাপ</span>
            </a>
          )}

          {telegramLink && (
            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <i className="fa-brands fa-telegram text-lg"></i>
              <span>টেলিগ্রাম</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
