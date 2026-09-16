import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, AlertTriangle, CloudSun, ShieldAlert, Radio, Volume2, CheckCircle2, RefreshCw } from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { usePopup } from './PopupContext';

interface AnnouncementCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnnouncementCenterModal: React.FC<AnnouncementCenterModalProps> = ({ isOpen, onClose }) => {
  const { showPopup } = usePopup();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const fetchAnnouncements = async () => {
      setLoading(true);
      const settings = await mockDb.getSettings();
      
      const list = [
        {
          id: '1',
          type: 'BROADCAST',
          titleEn: '📢 Night 4 Garba Schedule Update',
          titleGu: '📢 આજનો ચોથા નોરતાનો રાસ ગરબા કાર્યક્રમ',
          msgEn: 'SVAR 2026 Night 4 is running as scheduled. Gates open at 6:00 PM. Special performance by Kirtidan Gadhvi.',
          msgGu: 'આજનો ગરબા મહોત્સવ સમયસર ચાલુ થશે. ગેટ એન્ટ્રી સાંજે ૬:૦૦ વાગ્યાથી ચાલુ થઈ જશે. લોકગાયક કીર્તિદાન ગઢવીની રજૂઆત રહેશે.',
          time: '15 mins ago',
          badge: 'LIVE'
        },
        {
          id: '2',
          type: 'WEATHER',
          titleEn: '☀️ Clear Sky & Weather Report',
          titleGu: '☀️ હવામાન અહેવાલ અને આગાહી',
          msgEn: 'Venue temperature: 27°C, Humidity: 45%. Clear skies expected throughout the night. Zero rain probability.',
          msgGu: 'રાજકોટ ગ્રાઉન્ડ તાપમાન ૨૭°C. હવામાન ચોખ્ખું રહેશે. વરસાદની કોઈ શક્યતા નથી.',
          time: '1 hour ago',
          badge: 'WEATHER'
        },
        {
          id: '3',
          type: 'SECURITY',
          titleEn: '🛡️ Anti-Fraud Gate Verification Active',
          titleGu: '🛡️ સુરક્ષા અને ડાયનેમિક ક્યુઆર ગેટ કંટ્રોલ',
          msgEn: 'All entry gates are equipped with instant Aadhaar + Dynamic Motion QR scanners. Screenshots are strictly blocked.',
          msgGu: 'તમામ એન્ટ્રી ગેટ્સ પર આધાર લાઈવ સ્કેનર સક્રિય છે. સ્ક્રીનશોટ પાસ ગ્રાહ્ય રહેશે નહીં.',
          time: '3 hours ago',
          badge: 'SECURITY'
        }
      ];

      if (settings.lastAnnouncement) {
        list.unshift({
          id: '0',
          type: 'IMPORTANT',
          titleEn: '🚨 Admin Flash Update',
          titleGu: '🚨 એડમિન લાઈવ સુચના',
          msgEn: settings.lastAnnouncement,
          msgGu: settings.lastAnnouncementGu || settings.lastAnnouncement,
          time: 'Just now',
          badge: 'FLASH'
        });
      }

      setAnnouncements(list);
      setLoading(false);
    };

    fetchAnnouncements();
  }, [isOpen]);

  const handleTestBroadcast = () => {
    showPopup({
      titleEn: '🚨 Live Emergency Broadcast Triggered',
      titleGu: '🚨 લાઈવ ઈમરજન્સી સુચના એનાઉન્સમેન્ટ',
      messageEn: 'Weather is clear. Venue gates open at 6:00 PM. Enjoy SVAR 2026 Night 4!',
      messageGu: 'હવામાન એકદમ ચોખ્ખું છે. ગેટ એન્ટ્રી ૬:૦૦ વાગ્યાથી ચાલુ થઈ ગઈ છે.',
      type: 'warning'
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="bg-[#18263C] text-white p-5 flex items-center justify-between border-b-4 border-amber-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow">
                <Radio size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-lg font-serif">Live Announcement & Alert Center</h3>
                <p className="text-xs text-slate-300">Ground Updates, Weather & Emergency Alerts</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-slate-50">
            {loading ? (
              <div className="text-center py-10 space-y-2 text-slate-500">
                <RefreshCw size={24} className="animate-spin mx-auto text-[#731515]" />
                <p className="text-xs">Fetching live broadcast feed...</p>
              </div>
            ) : (
              announcements.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      {item.badge}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{item.titleGu}</h4>
                    <p className="text-xs font-semibold text-slate-700">{item.titleEn}</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
                    {item.msgGu}
                  </p>
                  <p className="text-[11px] text-slate-500 italic">
                    {item.msgEn}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
            <button
              onClick={handleTestBroadcast}
              className="w-full bg-[#731515] hover:bg-[#8E2121] text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow"
            >
              <Volume2 size={16} /> Test Live Emergency Alert Flash
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
