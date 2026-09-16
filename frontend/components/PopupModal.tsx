import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Bell, X, Info, Sparkles } from 'lucide-react';
import { usePopup } from './PopupContext';

export const PopupModal: React.FC = () => {
  const { popup, isOpen, hidePopup } = usePopup();

  if (!isOpen || !popup) return null;

  // Theme configurations for white background card with navy blue theme text & buttons
  const theme = {
    error: {
      accentBorder: 'border-l-4 border-l-red-600',
      badgeBg: 'bg-red-100 text-red-800 border-red-200',
      icon: <AlertTriangle className="w-7 h-7 text-red-600 animate-bounce" />,
      titleColor: 'text-red-700',
      boxBg: 'bg-red-50/60 border-red-200 text-red-950',
    },
    warning: {
      accentBorder: 'border-l-4 border-l-amber-600',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: <AlertTriangle className="w-7 h-7 text-amber-600 animate-bounce" />,
      titleColor: 'text-amber-700',
      boxBg: 'bg-amber-50/60 border-amber-200 text-amber-950',
    },
    success: {
      accentBorder: 'border-l-4 border-l-emerald-600',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: <CheckCircle2 className="w-7 h-7 text-emerald-600 animate-pulse" />,
      titleColor: 'text-emerald-700',
      boxBg: 'bg-emerald-50/60 border-emerald-200 text-emerald-950',
    },
    info: {
      accentBorder: 'border-l-4 border-l-[#20324C]',
      badgeBg: 'bg-blue-100 text-[#20324C] border-blue-200',
      icon: <Bell className="w-7 h-7 text-[#20324C] animate-pulse" />,
      titleColor: 'text-[#20324C]',
      boxBg: 'bg-slate-50 border-slate-200 text-slate-900',
    },
  }[popup.type];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative bg-white text-viren-950 border border-slate-200 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden my-auto ${theme.accentBorder}`}
        >
          {/* Header Bar - Navy Blue Website Theme */}
          <div className="p-5 flex items-center justify-between bg-[#20324C] text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                {theme.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg sm:text-xl text-white tracking-wide flex items-center gap-2">
                  {popup.titleEn}
                </h3>
                {popup.titleGu && popup.titleGu !== popup.titleEn && (
                  <p className="text-xs sm:text-sm text-blue-200 font-medium font-sans">
                    {popup.titleGu}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={hidePopup}
              className="p-1.5 rounded-lg bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content - Clean White Card */}
          <div className="p-6 space-y-4 bg-white">
            {/* English Section */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#20324C]">
                <Info size={14} className="text-[#20324C]" />
                <span>English Notice</span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-normal">
                {popup.messageEn}
              </p>
            </div>

            {/* Gujarati Section */}
            <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#20324C]">
                <Sparkles size={14} className="text-amber-600" />
                <span>ગુજરાતી વિગત / Gujarati Notice</span>
              </div>
              <p className="text-sm text-[#20324C] leading-relaxed font-medium font-sans">
                {popup.messageGu || popup.messageEn}
              </p>
            </div>

            {/* Optional Transaction Details Grid */}
            {popup.details && Object.keys(popup.details).length > 0 && (
              <div className="bg-slate-100 rounded-lg p-4 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#20324C] border-b border-slate-300 pb-1.5">
                  Summary Details / વિગત
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(popup.details).map(([key, val]) => (
                    <div key={key} className="flex flex-col">
                      <span className="text-slate-500 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-bold text-[#20324C]">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Button - Website Theme Navy Blue */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button
              onClick={hidePopup}
              className="w-full sm:w-auto px-7 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all transform active:scale-95 flex items-center justify-center gap-2 bg-[#20324C] hover:bg-[#152338] text-white shadow-md border border-[#20324C]"
            >
              <span>Got it / સમજાઈ ગયું</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
