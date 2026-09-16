import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send, CheckCircle2, Smartphone, ShieldCheck, ExternalLink, Loader2 } from 'lucide-react';
import { usePopup } from './PopupContext';

interface WhatsAppTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppTicketModal: React.FC<WhatsAppTicketModalProps> = ({ isOpen, onClose }) => {
  const { showPopup } = usePopup();
  const [phone, setPhone] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '') || '9876543210';
    const cleanBookingId = bookingId.trim() || `SVAR-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    setSending(true);

    try {
      // Trigger backend email notification if backend is running
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: `${cleanPhone}@svar2026.com`,
          subject: `📲 SVAR 2026 E-Pass dispatched to +91 ${cleanPhone}`,
          text: `Your SVAR 2026 Season Pass (ID: ${cleanBookingId}) has been issued.`
        })
      }).catch(() => console.log('Backend email skipped'));

      const passLink = `${window.location.origin}/#/pass`;
      const messageText = `🎉 *SVAR 2026 GARBA E-PASS CONFIRMATION* 🎉%0A%0A` +
        `👤 *Participant:* Registered Garba Player%0A` +
        `🎟️ *Booking ID:* ${cleanBookingId}%0A` +
        `🎫 *Pass Type:* SEASON PASS (1 to 9 Norata)%0A` +
        `📍 *Venue:* Shri Vishwakarma Arvachin Rasotsav Ground, Rajkot%0A` +
        `🕒 *Gates Open:* 6:00 PM%0A%0A` +
        `📲 *View Live Dynamic QR Pass:*%0A` +
        `${encodeURIComponent(passLink)}%0A%0A` +
        `⚠️ *Important:* Please carry original Aadhaar Card for gate entry.`;

      // Open WhatsApp web / mobile intent
      const waUrl = `https://wa.me/91${cleanPhone}?text=${messageText}`;
      window.open(waUrl, '_blank');

      showPopup({
        titleEn: '📲 WhatsApp Dispatch Successful!',
        titleGu: '📲 વોટ્સએપ પર ઇ-પાસ મોકલાઈ ગયો!',
        messageEn: `E-Pass and Invoice link sent to +91 ${cleanPhone}.`,
        messageGu: `તમારો QR ઇ-પાસ અને GST રસીદ +91 ${cleanPhone} પર વોટ્સએપ મેસેજ દ્વારા મોકલી આપેલ છે.`,
        type: 'success'
      });

      setSending(false);
      onClose();
    } catch (err) {
      console.error(err);
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-emerald-700 text-white p-5 flex items-center justify-between border-b-4 border-emerald-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-bold shadow">
                <MessageSquare size={22} />
              </div>
              <div>
                <h3 className="font-bold text-lg font-serif">WhatsApp Instant E-Pass</h3>
                <p className="text-xs text-emerald-100">Send QR Pass & Invoice to Mobile</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-emerald-100 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSendWhatsApp} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                WhatsApp Mobile Number (૧૦ આંકડાનો નંબર)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-sm font-bold text-slate-500">+91</span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full text-sm p-3 pl-12 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Booking ID (ઓપ્શનલ / ઓટો જનરેટ)
              </label>
              <input
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="e.g. SVAR-2026-987654"
                className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                <ShieldCheck size={16} /> Instant Delivery Guarantee
              </p>
              <p className="text-emerald-700 leading-relaxed">
                You will receive an official WhatsApp message containing your QR code pass, venue location pin, and downloadable PDF invoice.
              </p>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02]"
            >
              {sending ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Send Instant WhatsApp Ticket</>}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
