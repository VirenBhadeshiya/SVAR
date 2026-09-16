import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, Utensils, Wifi, Car, Shield, ShieldCheck, 
  Sparkles, Loader2, Send, Heart, Award, Search, Siren, FileText, Camera
} from 'lucide-react';
import { mockDb } from '../services/mockDb';
import { usePopup } from '../components/PopupContext';
import { ParkingBookingModal } from '../components/ParkingBookingModal';
import { LostAndFoundModal } from '../components/LostAndFoundModal';
import { SOSEmergencyModal } from '../components/SOSEmergencyModal';
import { AIPhotoFinderModal } from '../components/AIPhotoFinderModal';
import { GSTInvoiceModal } from '../components/GSTInvoiceModal';

export const Services: React.FC = () => {
  const { showPopup } = usePopup();
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interactive Modals State
  const [showParkingModal, setShowParkingModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showGstModal, setShowGstModal] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);
    try {
      await mockDb.saveFeedback({
        name: feedbackName || 'Anonymous',
        suggestion: feedbackText
      });

      showPopup({
        titleEn: '❤️ Thank You for Your Feedback!',
        titleGu: '❤️ તમારા પ્રતિભાવ બદલ ખૂબ ખૂબ આભાર!',
        messageEn: 'Your suggestions help us make SVAR Garba better every year.',
        messageGu: 'તમારા મૂલ્યવાન સૂચનો SVAR ગરબા મહોત્સવને દર વર્ષે વધુ શ્રેષ્ઠ બનાવવામાં મદદ કરે છે.',
        type: 'success'
      });

      setFeedbackName('');
      setFeedbackText('');
    } catch (err) {
      console.error("Feedback submission error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-10 px-4 max-w-7xl mx-auto space-y-12 font-sans">

      {/* 1. Complimentary Community Access Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 rounded-2xl border-2 border-slate-200 hover:border-[#731515] p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-5 max-w-4xl mx-auto"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#FDF2F2] text-[#731515] flex items-center justify-center shrink-0 border border-red-200 shadow-sm">
          <CheckCircle size={28} />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-serif font-bold text-slate-900">
            Complimentary Community Access
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Honoring our deep-rooted heritage, we proudly extend complimentary premium spectator passes exclusively for our esteemed Gajjar Suthar community members.
          </p>
        </div>
      </motion.div>

      {/* 2. Arena Infrastructure (1L, 1.4L, 1500+, LED) */}
      <section className="space-y-6">
        <div className="border-b pb-3 border-slate-300">
          <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <Award className="text-[#731515]" size={26} />
            <span>Grand Arena Specifications (ગ્રાઉન્ડ ટેકનિકલ સુવિધાઓ)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 2.1 */}
          <div className="bg-white/95 rounded-2xl border-2 border-slate-200 hover:border-[#731515] p-6 shadow-md hover:shadow-xl transition-all duration-300 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FDF2F2] text-[#731515] font-serif font-bold text-lg flex items-center justify-center shrink-0 border border-red-200 shadow-sm">
              1L
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                1,00,000 Watt Acoustic Engineering
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Immerse yourself in a state-of-the-art 1,00,000-Watt line array sound system, precision-engineered to deliver a thunderous, crystal-clear traditional audio experience.
              </p>
            </div>
          </div>

          {/* Card 2.2 */}
          <div className="bg-white/95 rounded-2xl border-2 border-slate-200 hover:border-[#731515] p-6 shadow-md hover:shadow-xl transition-all duration-300 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FDF2F2] text-[#731515] font-serif font-bold text-base flex items-center justify-center shrink-0 border border-red-200 shadow-sm">
              1.4L
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                1,40,000 Sq. Ft. Grand Arena
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dance freely under the stars in our expansive 1,40,000 square foot premium ground, masterfully leveled and designed to ensure maximum spatial comfort and grandeur.
              </p>
            </div>
          </div>

          {/* Card 2.3 */}
          <div className="bg-white/95 rounded-2xl border-2 border-slate-200 hover:border-[#731515] p-6 shadow-md hover:shadow-xl transition-all duration-300 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FDF2F2] text-[#731515] font-serif font-bold text-xs flex items-center justify-center shrink-0 border border-red-200 shadow-sm">
              1500+
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                Massive Performer Capacity
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our sweeping central Garba arena is expertly orchestrated to comfortably accommodate over 1,500 concurrent performers without ever compromising on elegance or safety.
              </p>
            </div>
          </div>

          {/* Card 2.4 */}
          <div className="bg-white/95 rounded-2xl border-2 border-slate-200 hover:border-[#731515] p-6 shadow-md hover:shadow-xl transition-all duration-300 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FDF2F2] text-[#731515] font-serif font-bold text-sm flex items-center justify-center shrink-0 border border-red-200 shadow-sm">
              LED
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                Cinematic LED Displays
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Witness every vibrant moment of the celebration through strategically placed, colossal high-definition LED screens, guaranteeing perfect visibility from absolutely any vantage point.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Hospitality & Convenience Services (Gourmet, Wi-Fi, Valet, Security) */}
      <section className="space-y-6">
        <div className="border-b pb-3 border-slate-300">
          <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="text-[#731515]" size={26} />
            <span>Hospitality & Convenience (મહેમાનગતિ અને સુવિધાઓ)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 3.1 */}
          <div className="bg-white/95 rounded-2xl border-2 border-slate-200 hover:border-[#731515] p-6 shadow-md hover:shadow-xl transition-all duration-300 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FDF2F2] text-[#731515] flex items-center justify-center shrink-0 border border-red-200 shadow-sm">
              <Utensils size={26} />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                Gourmet Culinary Experience
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Indulge in an exquisite selection of premium vegetarian cuisine at our grand food pavilion, meticulously designed for unparalleled hygiene and a delightful dining experience.
              </p>
            </div>
          </div>

          {/* Card 3.2 */}
          <div className="bg-white/95 rounded-2xl border-2 border-slate-200 hover:border-[#731515] p-6 shadow-md hover:shadow-xl transition-all duration-300 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FDF2F2] text-[#731515] flex items-center justify-center shrink-0 border border-red-200 shadow-sm">
              <Wifi size={26} />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                Venue-Wide High-Speed Connectivity
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stay effortlessly connected and share your magical Navratri moments instantly with our complimentary, uninterrupted high-speed Wi-Fi network.
              </p>
            </div>
          </div>

          {/* Card 3.3 */}
          <div className="bg-white/95 rounded-2xl border-2 border-slate-200 hover:border-[#731515] p-6 shadow-md hover:shadow-xl transition-all duration-300 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FDF2F2] text-[#731515] flex items-center justify-center shrink-0 border border-red-200 shadow-sm">
              <Car size={26} />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                Executive Valet & Parking Infrastructure
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Experience seamless arrivals with our comprehensive parking management, featuring organized zones for over 2,000 vehicles and an exclusive VIP valet service.
              </p>
            </div>
          </div>

          {/* Card 3.4 */}
          <div className="bg-white/95 rounded-2xl border-2 border-slate-200 hover:border-[#731515] p-6 shadow-md hover:shadow-xl transition-all duration-300 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FDF2F2] text-[#731515] flex items-center justify-center shrink-0 border border-red-200 shadow-sm">
              <Shield size={26} />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                Uncompromising Security Protocol
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your absolute safety is our priority. The venue is meticulously fortified with an elite bouncer team and 360-degree night-vision CCTV surveillance for complete peace of mind.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Help us improve SVAR Form Section (Exact Match to Screenshot 2) */}
      <section className="pt-4">
        <div className="bg-[#1e293b] text-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-700/60 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Header & Protection Info */}
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                Help us improve SVAR
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Your feedback is invaluable to us. Whether it's a suggestion for a new feature or a compliment for our team, we'd love to hear from you.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <div className="w-12 h-12 rounded-full bg-[#152e42] text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Secure & Anonymous</h4>
                  <p className="text-xs text-slate-400">Your data is protected by SVAR Digital Fortress</p>
                </div>
              </div>
            </div>

            {/* Right Form */}
            <div className="lg:col-span-7">
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                    placeholder="Your Name (Optional)"
                    className="w-full bg-[#0f172a]/70 text-white text-sm p-3.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <textarea
                    required
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Your Suggestions or Feedback..."
                    className="w-full bg-[#0f172a]/70 text-white text-sm p-3.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 placeholder:text-slate-400"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#731515] hover:bg-[#8E2121] text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <span>SEND FEEDBACK</span>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default Services;