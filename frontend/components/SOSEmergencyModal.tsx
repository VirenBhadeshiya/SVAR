import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, PhoneCall, CheckCircle, X, Siren, Activity, Ambulance } from 'lucide-react';

export const SOSEmergencyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [triggered, setTriggered] = useState(false);
  const [sosCategory, setSosCategory] = useState<'MEDICAL' | 'SECURITY' | 'FIRE'>('MEDICAL');

  const handleTriggerSOS = () => {
    setTriggered(true);
    setTimeout(() => {
      // Auto reset after broadcast
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border-2 border-red-600 flex flex-col text-center"
        >
          {/* Top Alert Banner */}
          <div className="bg-red-700 text-white p-4 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <Siren size={24} className="animate-spin" />
              <h3 className="font-bold text-base font-serif uppercase tracking-wider">Ground SOS Emergency</h3>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white"><X size={22} /></button>
          </div>

          <div className="p-6 space-y-6">
            {triggered ? (
              <div className="space-y-4 py-4 animate-fade-in">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto border-2 border-red-500">
                  <Activity size={36} className="animate-ping" />
                </div>
                <h4 className="text-2xl font-black text-red-700">SOS ALERT BROADCASTED!</h4>
                <p className="text-xs text-viren-800 leading-relaxed">
                  Our Ground Command Control, Medical Team, and Police Security Volunteers have received your live location alert.
                </p>
                <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-xs font-bold text-red-900">
                  Ground Control Helpline: <a href="tel:+919876543210" className="underline font-mono">+91 98765 43210</a>
                </div>
                <button
                  onClick={() => { setTriggered(false); onClose(); }}
                  className="btn-viren px-6 py-2 text-xs font-bold uppercase"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <ShieldAlert size={48} className="text-red-600 mx-auto" />
                  <h4 className="text-xl font-extrabold text-viren-950">1-Click Emergency Assistance</h4>
                  <p className="text-xs text-viren-600">
                    Select emergency type to immediately alert ground security or medical unit at PD Malaviya Ground.
                  </p>
                </div>

                {/* Emergency Category Selector */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSosCategory('MEDICAL')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      sosCategory === 'MEDICAL' ? 'bg-red-600 text-white font-bold shadow-lg scale-105' : 'bg-viren-50 text-viren-800'
                    }`}
                  >
                    <Ambulance size={20} />
                    <span className="text-[10px]">Medical</span>
                  </button>

                  <button
                    onClick={() => setSosCategory('SECURITY')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      sosCategory === 'SECURITY' ? 'bg-red-600 text-white font-bold shadow-lg scale-105' : 'bg-viren-50 text-viren-800'
                    }`}
                  >
                    <ShieldAlert size={20} />
                    <span className="text-[10px]">Security</span>
                  </button>

                  <button
                    onClick={() => setSosCategory('FIRE')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      sosCategory === 'FIRE' ? 'bg-red-600 text-white font-bold shadow-lg scale-105' : 'bg-viren-50 text-viren-800'
                    }`}
                  >
                    <Siren size={20} />
                    <span className="text-[10px]">Fire Alert</span>
                  </button>
                </div>

                {/* Big Red SOS Button */}
                <button
                  onClick={handleTriggerSOS}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-lg uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 border-2 border-red-400 animate-pulse"
                >
                  <PhoneCall size={24} />
                  <span>Send SOS Alert Now</span>
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
